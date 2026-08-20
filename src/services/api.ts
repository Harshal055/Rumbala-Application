/**
 * API Service — Direct Supabase Client
 *
 * All data operations call Supabase directly.
 * No intermediate Express/Node.js backend required.
 * Auth sessions are managed automatically by the Supabase client.
 *
 * NOTE: Supabase project must have "Confirm email" DISABLED in
 *       Authentication → Settings so signup auto-confirms users.
 */

import { supabase } from './supabase';

const normalizeEmail = (email: string) =>
    email
        .replace(/["'\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, '')
        .trim()
        .toLowerCase();

const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─── Token shims (no-ops: Supabase manages sessions internally) ───────────────
export const setTokens = (_access: string, _refresh: string) => {};
export const getAccessToken = () => null;
export const getRefreshToken = () => null;
export const clearTokens = () => {};

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const signupV2 = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
        throw new Error('Please enter a valid email address.');
    }

    const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
    });
    if (error) {
        const raw = error.message || 'Signup failed';
        if (/email rate limit exceeded/i.test(raw)) {
            throw new Error('Too many signup attempts. Please wait a few minutes and try again.');
        }
        if (/signup is disabled/i.test(raw)) {
            throw new Error('Email signup is disabled in Supabase Auth settings.');
        }
        throw new Error(raw);
    }
    if (!data.user) throw new Error('Registration could not be completed. Please try again.');

    if (data.session) {
        await postAuthSync(data.user.id, data.user.email || undefined);
    }

    const needsEmailConfirmation = !data.session;

    return {
        user_id: data.user.id,
        email: data.user.email,
        session: data.session
            ? {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
            }
            : null,
        needs_email_confirmation: needsEmailConfirmation,
        message: needsEmailConfirmation
            ? 'Account created. Please verify your email, then log in.'
            : 'User created successfully',
    };
};

export const loginV2 = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
        throw new Error('Please enter a valid email address.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
    });
    if (error) {
        const raw = error.message || 'Login failed';
        if (/email rate limit exceeded/i.test(raw)) {
            throw new Error('Too many auth requests. Please wait a few minutes and try again.');
        }
        if (/email not confirmed/i.test(raw)) {
            throw new Error('Please verify your email first, then try logging in.');
        }
        if (/invalid login credentials/i.test(raw)) {
            throw new Error('Invalid email or password.');
        }
        throw new Error(raw);
    }

    if (!data?.user || !data?.session) {
        throw new Error('Session could not be established. Please try again.');
    }

    // Call Centralized Sync
    await postAuthSync(data.user.id, data.user.email || undefined);

    return {
        user_id: data.user.id,
        email: data.user.email,
        session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
        },
    };
};

/**
 * Centralized Synchronization after Login/Signup
 * @param userId 
 */
export const postAuthSync = async (userId: string, email?: string) => {
    try {
        const { useStore } = await import('../store/useStore');
        const { initRevenueCat, getCustomerInfo, getProEntitlementDetails } = await import('./revenueCatService');
        
        const store = useStore.getState();
        
        // 1. Update store state
        store.login(userId, email);

        // 2. Initialize RevenueCat
        await initRevenueCat(userId);

        // 3. Verify Pro Status from both RevenueCat & Supabase
        try {
            const ci = await getCustomerInfo();
            const rcPro = getProEntitlementDetails(ci);
            if (rcPro.isPro) {
                store.setIsPro(true, rcPro.expiresAt);
                syncProStatusToBackend(userId, true, rcPro.expiresAt).catch(() => {});
            }
        } catch (_) {}

        // 4. Load backend data (which syncs Supabase profile and respects admin/promo pro status)
        await store.syncWithSupabase();
        await store.loadCardsFromSupabase(userId);
        await store.loadScoresFromSupabase(userId);
        
        console.log('✅ Post-Auth Sync Complete for user:', userId);
    } catch (e) {
        console.error('❌ Post-Auth Sync Failed:', e);
    }
};

export const logoutV2 = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
};

export const refreshAccessToken = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw new Error(error.message);
    return { access_token: data.session?.access_token };
};

export const resetPasswordV2 = async (email: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
        throw new Error('Please enter a valid email address.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
    if (error) {
        throw new Error(error.message || 'Failed to send password reset email.');
    }
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export const getProfile = async (userId: string) => {
    if (!userId) throw new Error('User ID is required for getProfile');
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // maybeSingle returns null instead of error if not found
    if (error) throw new Error(error.message);
    return data;
};

export const ensureProfileExists = async (userId: string, email?: string) => {
    const profile = await getProfile(userId);
    if (!profile) {
        const { data, error } = await supabase
            .from('profiles')
            .upsert({ 
                id: userId, 
                email: email || '',
                card_count: 5 // starting cards
            })
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
    return profile;
};

export const updateProfile = async (
    userId: string,
    updates: { partner1?: string; partner2?: string; card_count?: number; vibe?: string },
) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const syncOnboardingPreferencesToSupabase = async (
    userId: string,
    prefs: { gender?: string | null; relationship_status?: string | null; app_purpose?: string | null; vibe?: string | null }
) => {
    try {
        const metadataUpdates: Record<string, any> = {};
        if (prefs.gender) metadataUpdates.gender = prefs.gender;
        if (prefs.relationship_status) metadataUpdates.relationship_status = prefs.relationship_status;
        if (prefs.app_purpose) metadataUpdates.app_purpose = prefs.app_purpose;
        if (prefs.vibe) metadataUpdates.vibe = prefs.vibe;

        if (Object.keys(metadataUpdates).length > 0) {
            await supabase.auth.updateUser({ data: metadataUpdates });
        }

        if (prefs.vibe && userId) {
            await supabase.from('profiles').update({ vibe: prefs.vibe }).eq('id', userId);
        }
    } catch (e) {
        console.warn('Failed to sync onboarding preferences to Supabase:', e);
    }
};

export const syncCardCount = async (userId: string, count: number) => {
    const { error } = await supabase
        .from('profiles')
        .update({ card_count: count })
        .eq('id', userId);
    if (error) throw new Error(error.message);
};

// ─── CARDS ────────────────────────────────────────────────────────────────────

export const getUserCards = async (userId: string) => {
    if (!userId) throw new Error('User ID is required for getUserCards');
    const { data, error } = await supabase
        .from('profiles')
        .select('card_count')
        .eq('id', userId)
        .single();
    if (error) throw new Error(error.message);
    return { user_id: userId, card_count: data.card_count ?? 0 };
};

export const addUserCards = async (userId: string, count: number, sku?: string) => {
    // Card grant + purchase record happen atomically inside the RPC (both
    // require SECURITY DEFINER since `purchases` has no client INSERT
    // policy — see 20260712000200_fix_purchase_recording.sql). The old code
    // path called a separate client-side recordPurchase() insert here, which
    // RLS silently rejected on every purchase.
    const { data, error: updateError } = await supabase.rpc('add_purchased_cards', {
        p_user_id: userId,
        p_count: count,
        p_sku: sku ?? null,
    });

    if (updateError) throw new Error(updateError.message);

    return data;
};

export const claimWeeklyFreeCards = async (userId: string) => {
    const { data, error } = await supabase.rpc('claim_weekly_cards', {
        p_user_id: userId
    });
    
    if (error) throw new Error(error.message);
    if (data && !data.success) {
        throw new Error(data.message || 'Unable to claim free cards.');
    }
    return data;
};

// ─── PURCHASES ────────────────────────────────────────────────────────────────

export const getPurchaseHistory = async (userId: string, limit = 50, offset = 0) => {
    const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return data;
};

// ─── ROOMS ────────────────────────────────────────────────────────────────────

export const createRoom = async (hostUserId: string, hostName: string, roomType: 'video' | 'normal' = 'video') => {
    // Simple alphanumeric code generation (avoiding ambiguous O/0 and I/1 if possible)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, I, 1
    let roomCode = '';
    for (let i = 0; i < 6; i++) roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    
    console.log('--- ATTEMPTING ROOM CREATE:', roomCode, 'for host:', hostUserId);
    
    const { data, error } = await supabase
        .from('rooms')
        .insert({
            code: roomCode,
            host_user_id: hostUserId,
            host_name: hostName,
            room_type: roomType,
            current_turn_user_id: hostUserId, 
            current_card: null,
            host_score: 0,
            guest_score: 0,
            is_active: true,
        })
        .select()
        .maybeSingle();

    if (error) {
        console.error('SUPABASE CREATE ERROR:', error.code, error.message, error.details);
        throw new Error(`DB Error: ${error.message} (Is RLS enabled without an INSERT policy?)`);
    }
    
    if (!data) {
        console.error('CREATE FAILED: No data returned. RLS IS LIKELY BLOCKING SELECT AFTER INSERT.');
        // We still return a valid object to avoid a full crash, but we warn heavily
        return { code: roomCode, host_user_id: hostUserId, is_active: true }; 
    }

    console.log('--- ROOM CREATED SUCCESS:', data.code);
    return data;
};

export const joinRoom = async (roomCode: string, guestUserId: string, guestName: string) => {
    roomCode = roomCode.replace(/\s+/g, '').toUpperCase();
    console.log('--- JOIN ATTEMPT:', roomCode, 'for user:', guestUserId);

    // Validate UUID to prevent PostgREST filter injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(guestUserId)) {
        throw new Error('Invalid user ID format');
    }

    // Joining goes through the join_room_by_code RPC (SECURITY DEFINER), not a
    // direct client UPDATE. The old direct-UPDATE approach relied on a broad
    // RLS policy that allowed updating ANY open room regardless of whether the
    // caller actually supplied its code — effectively letting anyone hijack a
    // random active room. The RPC enforces the code match, active status, and
    // guest-slot checks server-side; base-table RLS is back to host/guest-only.
    // 1. Try atomic RPC first
    const { data, error } = await supabase.rpc('join_room_by_code', {
        p_code: roomCode,
        p_guest_user_id: guestUserId,
        p_guest_name: guestName,
    });

    if (!error && data) {
        console.log('--- JOIN SUCCESS (RPC):', data?.code);
        return data;
    }

    // 2. If RPC is missing from cache (PGRST202), fallback to direct room update
    if (error && (error.code === 'PGRST202' || error.message?.includes('schema cache') || error.message?.includes('not found'))) {
        console.warn('RPC not found, falling back to direct table update...');
        const { data: updatedRoom, error: updateErr } = await supabase
            .from('rooms')
            .update({
                guest_user_id: guestUserId,
                guest_name: guestName,
            })
            .eq('code', roomCode)
            .select()
            .single();

        if (updateErr) {
            console.error('SUPABASE FALLBACK JOIN ERROR:', updateErr);
            throw new Error(updateErr.message || 'Room not found or could not join.');
        }

        console.log('--- JOIN SUCCESS (Direct Fallback):', updatedRoom?.code);
        return updatedRoom;
    }

    if (error) {
        console.error('SUPABASE JOIN ERROR:', error);
        throw new Error(error.message || 'Join failure');
    }

    return data;
};

export const getRoomData = async (roomCode: string) => {
    roomCode = roomCode.replace(/\s+/g, '').toUpperCase();
    const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode)
        .order('created_at', { ascending: false }) // Take most recent if multiple (safety measure)
        .limit(1)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
};

export const syncCard = async (roomCode: string, card: any) => {
    roomCode = roomCode.replace(/\s+/g, '').toUpperCase();
    const { data, error } = await supabase
        .from('rooms')
        .update({ current_card: card })
        .eq('code', roomCode)
        .select()
        .maybeSingle(); // safer than single()
    if (error) throw new Error(error.message);
    return data;
};

export const updateRoomScores = async (roomCode: string, hostScore: number, guestScore: number, nextTurnUserId?: string) => {
    roomCode = roomCode.replace(/\s+/g, '').toUpperCase();
    const { data, error } = await supabase
        .from('rooms')
        .update({ host_score: hostScore, guest_score: guestScore, current_turn_user_id: nextTurnUserId })
        .eq('code', roomCode)
        .select()
        .maybeSingle(); // safer than single()
    if (error) throw new Error(error.message);
    return data;
};

export const deleteRoomV2 = async (roomCode: string) => {
    roomCode = roomCode.replace(/\s+/g, '').toUpperCase();
    const { error } = await supabase.from('rooms').delete().eq('code', roomCode);
    if (error) throw new Error(error.message);
    return { success: true };
};

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

export const sendMessage = async (
    roomCode: string,
    senderUserId: string,
    sender: string,
    text: string,
) => {
    roomCode = roomCode.replace(/\s+/g, '').toUpperCase();
    const { data, error } = await supabase
        .from('room_messages')
        .insert({ room_code: roomCode, sender_user_id: senderUserId, sender, text })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const getMessages = async (roomCode: string, limit = 50, offset = 0) => {
    roomCode = roomCode.replace(/\s+/g, '').toUpperCase();
    const { data, error } = await supabase
        .from('room_messages')
        .select('*')
        .eq('room_code', roomCode)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return data;
};

// ─── GAME SCORES ──────────────────────────────────────────────────────────────

// Note: the `game_scores` table stores these as partner1_score / partner2_score
// (renamed in 20260712000100_rename_game_scores_columns.sql to avoid colliding
// with the unrelated `profiles.partner1` / `partner2` name columns). The API
// surface below still speaks partner1/partner2 so the rest of the app (store,
// UI) doesn't need to change.

export const addPoints = async (
    userId: string,
    winner: 'partner1' | 'partner2' | 'both',
    points: number,
) => {
    const { data: current, error: fetchError } = await supabase
        .from('game_scores')
        .select('partner1_score, partner2_score')
        .eq('user_id', userId)
        .maybeSingle();

    if (fetchError && fetchError.code === 'PGRST116') {
        // Row does not exist yet — create it
        const { data, error } = await supabase
            .from('game_scores')
            .insert({
                user_id: userId,
                partner1_score: winner === 'partner1' || winner === 'both' ? points : 0,
                partner2_score: winner === 'partner2' || winner === 'both' ? points : 0,
            })
            .select()
            .maybeSingle();
        if (error) throw new Error(error.message);
        return data ? { partner1: data.partner1_score, partner2: data.partner2_score } : data;
    }
    if (fetchError) throw new Error(fetchError.message);

    const updates = {
        partner1_score:
            winner === 'partner1' || winner === 'both'
                ? (current?.partner1_score ?? 0) + points
                : current?.partner1_score ?? 0,
        partner2_score:
            winner === 'partner2' || winner === 'both'
                ? (current?.partner2_score ?? 0) + points
                : current?.partner2_score ?? 0,
    };
    const { data, error } = await supabase
        .from('game_scores')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? { partner1: data.partner1_score, partner2: data.partner2_score } : data;
};

export const getScores = async (userId: string) => {
    if (!userId) throw new Error('User ID is required for getScores');
    const { data, error } = await supabase
        .from('game_scores')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return data;
    return { ...data, partner1: data.partner1_score, partner2: data.partner2_score };
};

export const getGameStats = async (userId: string) => {
    const [scoresResult, historyResult, profileResult] = await Promise.all([
        supabase
            .from('game_scores')
            .select('partner1_score, partner2_score')
            .eq('user_id', userId)
            .maybeSingle(),
        supabase
            .from('game_history')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
        supabase
            .from('profiles')
            .select('card_count')
            .eq('id', userId)
            .maybeSingle(),
    ]);

    const scoresRow = scoresResult.data || { partner1_score: 0, partner2_score: 0 };
    const scores = { partner1: scoresRow.partner1_score, partner2: scoresRow.partner2_score };
    const historyCount = historyResult.count || 0;
    const cardCount = profileResult.data?.card_count || 0;

    return {
        scores,
        totalGamesPlayed: historyCount,
        availableCards: cardCount,
        totalPoints: scores.partner1 + scores.partner2,
    };
};

// ─── GAME HISTORY ─────────────────────────────────────────────────────────────

export const addHistoryEntry = async (userId: string, card: any, winner: string) => {
    const { data, error } = await supabase
        .from('game_history')
        .insert({ user_id: userId, card, winner })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const getHistory = async (userId: string, limit = 100, offset = 0) => {
    if (!userId) throw new Error('User ID is required for getHistory');
    const { data, error } = await supabase
        .from('game_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return data;
};

export const deleteHistoryEntry = async (userId: string, historyId: string) => {
    const { error } = await supabase
        .from('game_history')
        .delete()
        .eq('id', historyId)
        .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return { success: true };
};

export const clearHistory = async (userId: string) => {
    const { error } = await supabase.from('game_history').delete().eq('user_id', userId);
    if (error) throw new Error(error.message);
    return { success: true };
};

// ─── DAILY QUESTIONS ──────────────────────────────────────────────────────────

export const saveDailyResponse = async (userId: string, questionId: number, response: string) => {
    const { data, error } = await supabase
        .from('daily_responses')
        .upsert({ user_id: userId, question_id: questionId, response })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const getDailyResponses = async (questionId: number, userIds: string[]) => {
    const { data, error } = await supabase
        .from('daily_responses')
        .select('*')
        .eq('question_id', questionId)
        .in('user_id', userIds);
    if (error) throw new Error(error.message);
    return data;
};

// ─── FEEDBACK ───────────────────────────────────────────────────────────────

export const sendFeedback = async (userId: string | null, email: string | null, message: string, rating: number) => {
    const { error } = await supabase
        .from('feedback')
        .insert({ user_id: userId || null, user_email: email, message, rating });
    if (error) throw new Error(error.message);
};

export const sendBugReport = async (userId: string | null, email: string, message: string, deviceInfo: any) => {
    const { error } = await supabase
        .from('bug_reports')
        .insert({ user_id: userId || null, user_email: email, message, device_info: deviceInfo });
    if (error) throw new Error(error.message);
};

export const getFeedbacks = async () => {
    const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
};

// ─── ADMIN STATS ────────────────────────────────────────────────────────────

export const getAdminStats = async () => {
    const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
    
    const { count: proCount, error: proError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_pro', true);

    const { count: roomsCount, error: roomsError } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true });

    if (userError || proError || roomsError) {
        throw new Error('Failed to fetch admin stats');
    }

    return {
        totalUsers: userCount || 0,
        proUsers: proCount || 0,
        totalRooms: roomsCount || 0
    };
};

// ─── ADMIN USER MANAGEMENT ──────────────────────────────────────────────────

export const adminSearchUsers = async (query: string) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
    let builder = supabase.from('profiles').select('*');
    if (isUuid) {
        builder = builder.eq('id', query);
    } else {
        builder = builder.ilike('email', `%${query}%`);
    }
    const { data, error } = await builder.limit(20);
    if (error) throw new Error(error.message);
    return data;
};

export const adminUpdateUserCards = async (userId: string, count: number) => {
    const { error } = await supabase
        .from('profiles')
        .update({ card_count: count, last_card_update: new Date().toISOString() })
        .eq('id', userId);
    if (error) throw new Error(error.message);
};

export interface ProStatusResult {
    isActive: boolean;
    isExpired: boolean;
    remainingDays: number | null;
    formattedExpiry: string | null;
}

export const checkProStatus = (
    isPro?: boolean | null,
    expiresAt?: string | null,
): ProStatusResult => {
    // Unified formula: Lifetime Pro (flag + no expiry) OR valid future expiry date
    if (isPro && !expiresAt) {
        return { isActive: true, isExpired: false, remainingDays: null, formattedExpiry: 'Lifetime' };
    }
    if (expiresAt) {
        const expTime = new Date(expiresAt).getTime();
        if (!isNaN(expTime) && expTime > Date.now()) {
            const remainingMs = expTime - Date.now();
            const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
            const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let label = '';
            if (remainingDays >= 1) {
                label = `${remainingDays}d ${remainingHours}h`;
            } else {
                const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                label = `${remainingHours}h ${remainingMins}m`;
            }
            return {
                isActive: true,
                isExpired: false,
                remainingDays,
                formattedExpiry: `Expires in ${label}`,
            };
        }
        // Expiry is in the past
        return {
            isActive: false,
            isExpired: true,
            remainingDays: 0,
            formattedExpiry: `Expired on ${new Date(expiresAt).toLocaleDateString()}`,
        };
    }
    // No flag and no expiry = free user
    return { isActive: false, isExpired: false, remainingDays: null, formattedExpiry: null };
};

export const syncProStatusToBackend = async (userId: string, isPro: boolean, expiresAt?: string | null) => {
    // 🔒 SECURITY UPDATE: We no longer trust the client to update Pro status in the database.
    // The RevenueCat webhook handles this securely on the backend via the Edge Function.
    // The client will automatically receive the updated status via Realtime WebSockets.
    if (__DEV__) {
        console.log('Skipping client-side Pro sync. Waiting for RevenueCat webhook...');
    }
};

export interface PromoRedemptionResult {
    success: boolean;
    message: string;
    grantProDays?: number;
    bonusCards?: number;
    expiresAt?: string | null;
    isLifetime?: boolean;
    newCardCount?: number;
}

export const redeemPromoCode = async (userId: string, rawCode: string): Promise<PromoRedemptionResult> => {
    if (!userId) throw new Error('You must be logged in to redeem a promo code.');
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) throw new Error('Please enter a valid promo code.');

    // 1. Fetch promo code from DB
    const { data: promo, error } = await supabase
        .from('promo_codes')
        .select('*')
        .ilike('code', code)
        .single();

    if (error || !promo) {
        return { success: false, message: 'Invalid promo code. Please check and try again.' };
    }

    if (!promo.is_active) {
        return { success: false, message: 'This promo code is no longer active.' };
    }

    if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
        return { success: false, message: 'This promo code has expired.' };
    }

    if (promo.max_uses && promo.used_count >= promo.max_uses) {
        return { success: false, message: 'This promo code has reached its maximum redemptions limit.' };
    }

    // 2. Fetch user profile
    const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id, is_pro, pro_expires_at, card_count')
        .eq('id', userId)
        .single();

    if (pErr || !profile) {
        throw new Error('User profile not found. Please try again.');
    }

    const grantProDays = promo.grant_pro_days || 0;
    const bonusCards = promo.bonus_cards || 0;
    let newExpiry: string | null = profile.pro_expires_at || null;
    let isLifetime = false;

    const profileUpdates: any = {
        updated_at: new Date().toISOString(),
    };

    if (grantProDays > 0) {
        if (grantProDays >= 9999) {
            // Lifetime
            isLifetime = true;
            newExpiry = null;
            profileUpdates.is_pro = true;
            profileUpdates.pro_expires_at = null;
        } else if (profile.is_pro && !profile.pro_expires_at) {
            // User already has Lifetime Pro — don't downgrade to timed access
            // Just skip the Pro grant, but still award bonus cards below
        } else {
            // Extend or set
            let baseTime = Date.now();
            if (profile.is_pro && profile.pro_expires_at) {
                const currentExp = new Date(profile.pro_expires_at).getTime();
                if (currentExp > baseTime) {
                    baseTime = currentExp;
                }
            }
            const expDate = new Date(baseTime + grantProDays * 24 * 60 * 60 * 1000);
            newExpiry = expDate.toISOString();
            profileUpdates.is_pro = true;
            profileUpdates.pro_expires_at = newExpiry;
        }
    }

    let nextCardCount = profile.card_count ?? 0;
    if (bonusCards > 0) {
        nextCardCount += bonusCards;
        profileUpdates.card_count = nextCardCount;
    }

    // Update profile
    const { error: uErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

    if (uErr) throw new Error(uErr.message);

    // Increment promo code used_count
    await supabase
        .from('promo_codes')
        .update({ used_count: (promo.used_count || 0) + 1 })
        .eq('code', promo.code);

    let successMsg = '🎉 Promo code applied successfully!';
    if (isLifetime) {
        successMsg = '👑 Congratulations! You received Lifetime Rumbala Pro with Unlimited Cards!';
    } else if (grantProDays > 0 && bonusCards > 0) {
        successMsg = `🎉 You unlocked ${grantProDays} Days of Rumbala Pro (Unlimited Cards) + ${bonusCards} Bonus Cards!`;
    } else if (grantProDays > 0) {
        successMsg = `🎉 You unlocked ${grantProDays} Days of Rumbala Pro with Unlimited Cards!`;
    } else if (bonusCards > 0) {
        successMsg = `🎁 You received ${bonusCards} Bonus Dare Cards!`;
    }

    return {
        success: true,
        message: successMsg,
        grantProDays,
        bonusCards,
        expiresAt: newExpiry,
        isLifetime,
        newCardCount: nextCardCount,
    };
};

export const adminGrantPro = async (userId: string, isPro: boolean, expiresAt?: string | null) => {
    const payload: { is_pro: boolean; pro_expires_at?: string | null; updated_at: string } = {
        is_pro: isPro,
        pro_expires_at: isPro ? (expiresAt !== undefined ? expiresAt : null) : null,
        updated_at: new Date().toISOString(),
    };

    // First attempt update with pro_expires_at
    let { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);

    // Fallback if pro_expires_at column hasn't been migrated yet
    if (error && error.message.includes('pro_expires_at')) {
        const fallback = await supabase
            .from('profiles')
            .update({ is_pro: isPro, updated_at: new Date().toISOString() })
            .eq('id', userId);
        error = fallback.error;
    }

    if (error) throw new Error(error.message);

    // Broadcast live event to the user's active device immediately
    try {
        const channel = supabase.channel(`user-updates:${userId}`);
        await channel.send({
            type: 'broadcast',
            event: 'user_updated',
            payload: {
                is_pro: isPro,
                pro_expires_at: payload.pro_expires_at,
            },
        });
        supabase.removeChannel(channel);
    } catch (_) {
        // Broadcast best-effort
    }
};

export const adminGetUserStats = async (userId: string) => {
    // Get relationship scores and history count
    const { data: scoresRow } = await supabase.from('game_scores').select('*').eq('user_id', userId).single();
    const scores = scoresRow
        ? { ...scoresRow, partner1: scoresRow.partner1_score, partner2: scoresRow.partner2_score }
        : scoresRow;
    const { count: historyCount } = await supabase.from('game_history').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    return { scores, historyCount: historyCount || 0 };
};

// ─── ADMIN REVENUE & ANALYTICS ──────────────────────────────────────────────

export const adminGetRevenueStats = async () => {
    const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    
    const totalRevenue = data.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const skuCounts: Record<string, number> = {};
    data.forEach(p => {
        skuCounts[p.sku] = (skuCounts[p.sku] || 0) + 1;
    });

    return { totalRevenue, purchaseCount: data.length, skuCounts, recentPurchases: data.slice(0, 10) };
};

// ─── ADMIN GAMEPLAY & LDR ───────────────────────────────────────────────────

export const adminGetGameplayStats = async () => {
    const { data: history, error } = await supabase
        .from('game_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
    if (error) throw new Error(error.message);

    // Count popularity
    const popularity: Record<string, number> = {};
    history.forEach(h => {
        const text = h.card?.text || 'Unknown';
        popularity[text] = (popularity[text] || 0) + 1;
    });

    return { recentHistory: history, popularity };
};

export const adminGetActiveRooms = async (activeOnly = true) => {
    let builder = supabase.from('rooms').select('*').order('updated_at', { ascending: false });
    if (activeOnly) builder = builder.eq('is_active', true);
    const { data, error } = await builder.limit(50);
    if (error) throw new Error(error.message);
    return data;
};

export const adminCloseRoom = async (roomCode: string) => {
    const { error } = await supabase
        .from('rooms')
        .update({ is_active: false })
        .eq('code', roomCode);
    if (error) throw new Error(error.message);
};

// ─── ADMIN CMS (CARDS) ──────────────────────────────────────────────────────

export const adminGetCards = async () => {
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
};

export const adminUpsertCard = async (card: any) => {
    const { data, error } = await supabase
        .from('cards')
        .upsert(card)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const adminDeleteCard = async (id: string) => {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

// ─── ADMIN SUPPORT ──────────────────────────────────────────────────────────

export const adminGetBugReports = async () => {
    const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
};

export const adminUpdateBugStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('bug_reports').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
};

// ─── ADMIN CRASH REPORTS ────────────────────────────────────────────────────

export const adminGetCrashReports = async (limit = 50) => {
    const { data, error } = await supabase
        .from('crash_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw new Error(error.message);
    return data;
};

export const adminUpdateCrashStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('crash_reports').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
};

// ─── REMOTE CONFIGS & KILL SWITCHES ─────────────────────────────────────────

export interface AppRemoteConfigs {
    feature_flags?: {
        video_calls?: boolean;
        spicy_category?: boolean;
        shop_enabled?: boolean;
        room_creation?: boolean;
        promo_codes?: boolean;
        ai_moderation?: boolean;
        daily_rewards?: boolean;
        secret_cards?: boolean;
    };
    maintenance_mode?: {
        enabled?: boolean;
        message?: string;
    };
    min_app_version?: {
        android?: number;
        ios?: number;
        enforce?: boolean;
        title?: string;
        message?: string;
        whats_new?: string[];
    };
    latest_app_version?: {
        android?: number;
        ios?: number;
        title?: string;
        message?: string;
        whats_new?: string[];
    };
    // In-app update system. Compared against the device's native build number
    // (Android versionCode / iOS build). Controlled live from the Admin Portal.
    app_update?: {
        enabled?: boolean;        // master switch for the whole update system
        latest_android?: number;  // newest versionCode available on the Play Store
        latest_ios?: number;      // newest build available on the App Store
        min_android?: number;     // builds below this are force-updated (blocked)
        min_ios?: number;
        message?: string;         // shown for optional (soft) updates
        force_message?: string;   // shown for mandatory (force) updates
        android_url?: string;     // Play Store listing (falls back to package id)
        ios_url?: string;         // App Store listing
    };
    [key: string]: any;
}

export const getAppRemoteConfigs = async (): Promise<AppRemoteConfigs> => {
    try {
        const { data, error } = await supabase
            .from('app_remote_configs')
            .select('*');

        if (error) {
            console.warn('[RemoteConfig] Fetch error:', error.message);
            return {};
        }

        const configs: AppRemoteConfigs = {};
        if (data) {
            data.forEach((item) => {
                configs[item.key] = item.value;
            });
        }
        return configs;
    } catch (e: any) {
        console.warn('[RemoteConfig] Unexpected error:', e.message);
        return {};
    }
};

export const subscribeToRemoteConfigs = (onUpdate: (configs: AppRemoteConfigs) => void) => {
    const channel = supabase
        .channel('rumbala_remote_configs_live')
        .on(
            'broadcast',
            { event: 'config_updated' },
            (payload) => {
                if (payload?.payload) {
                    onUpdate(payload.payload as AppRemoteConfigs);
                }
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'app_remote_configs' },
            async () => {
                const updated = await getAppRemoteConfigs();
                onUpdate(updated);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

export const broadcastRemoteConfigUpdate = async (configs: AppRemoteConfigs) => {
    try {
        const channel = supabase.channel('rumbala_remote_configs_live');
        await channel.send({
            type: 'broadcast',
            event: 'config_updated',
            payload: configs,
        });
    } catch (e: any) {
        console.warn('[RemoteConfig Broadcast Error]:', e);
    }
};

// ─── PUBLIC CMS (Dares) ─────────────────────────────────────────────────────

export const getCmsCards = async () => {
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('is_active', true);
    if (error) throw new Error(error.message);
    return data;
};




