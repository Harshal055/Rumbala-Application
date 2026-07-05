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
        const { initRevenueCat, getCustomerInfo, checkProEntitlement } = await import('./revenueCatService');
        
        const store = useStore.getState();
        
        // 1. Update store state
        store.login(userId, email);

        // 2. Initialize RevenueCat
        await initRevenueCat(userId);

        // 3. Verify Pro Status and Sync Data
        try {
            const ci = await getCustomerInfo();
            const isReallyPro = checkProEntitlement(ci);
            store.setIsPro(isReallyPro);
        } catch (_) {}

        // 4. Load backend data
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
    updates: { partner1?: string; partner2?: string; card_count?: number },
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
    // Call the exact RPC to safely bypass triggers
    const { data, error: updateError } = await supabase.rpc('add_purchased_cards', {
        p_user_id: userId,
        p_count: count
    });
    
    if (updateError) throw new Error(updateError.message);

    // Record purchase if sku provided
    if (sku) {
        await recordPurchase(userId, sku, count);
    }

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

export const recordPurchase = async (userId: string, sku: string, cardCount: number) => {
    const { data, error } = await supabase
        .from('purchases')
        .insert({
            user_id: userId,
            sku,
            card_count: cardCount,
            amount_paise: 0, // Store handles payment
            metadata: {
                source: 'revenuecat',
                granted_at: new Date().toISOString(),
            },
        })
        .select()
        .single();
    if (error) console.error('Purchase recording error:', error);
    return data;
};

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
    console.log('--- BLIND JOIN ATTEMPT:', roomCode, 'for user:', guestUserId);
    
    // Validate UUID to prevent PostgREST filter injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(guestUserId)) {
        throw new Error('Invalid user ID format');
    }
    
    // We attempt an update directly. We check:
    // 1. code matches
    // 2. is_active is true
    // 3. guest_user_id is either NULL or the same guest (re-join)
    const { data, error, count } = await supabase
        .from('rooms')
        .update({ guest_user_id: guestUserId, guest_name: guestName })
        .eq('code', roomCode)
        .eq('is_active', true)
        .or(`guest_user_id.is.null,guest_user_id.eq.${guestUserId}`)
        .select()
        .maybeSingle();

    if (error) {
        console.error('SUPABASE BLIND JOIN ERROR:', error);
        throw new Error(`Join failure: ${error.message}`);
    }

    // If update affected NO rows, we need to know WHY.
    if (!data) {
        console.warn('BLIND JOIN FAILED: No record updated. Checking why...');
        
        // Final fallback: Is the room already full or non-existent?
        const { data: check } = await supabase
            .from('rooms')
            .select('guest_user_id, is_active')
            .eq('code', roomCode)
            .maybeSingle();
            
        if (!check) throw new Error(`Room "${roomCode}" not found. (Is RLS enabled on Supabase?)`);
        if (!check.is_active) throw new Error('Meeting has ended.');
        if (check.guest_user_id && check.guest_user_id !== guestUserId) throw new Error('Room is full.');
        
        console.warn('POSSIBLE RLS BLOCK on join return, but room should exist.');
        return { code: roomCode, guest_user_id: guestUserId };
    }

    console.log('--- BLIND JOIN SUCCESS:', data.code);
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

export const addPoints = async (
    userId: string,
    winner: 'partner1' | 'partner2' | 'both',
    points: number,
) => {
    const { data: current, error: fetchError } = await supabase
        .from('game_scores')
        .select('partner1, partner2')
        .eq('user_id', userId)
        .maybeSingle();

    if (fetchError && fetchError.code === 'PGRST116') {
        // Row does not exist yet — create it
        const { data, error } = await supabase
            .from('game_scores')
            .insert({
                user_id: userId,
                partner1: winner === 'partner1' || winner === 'both' ? points : 0,
                partner2: winner === 'partner2' || winner === 'both' ? points : 0,
            })
            .select()
            .maybeSingle();
        if (error) throw new Error(error.message);
        return data;
    }
    if (fetchError) throw new Error(fetchError.message);

    const updates = {
        partner1:
            winner === 'partner1' || winner === 'both'
                ? (current?.partner1 ?? 0) + points
                : current?.partner1 ?? 0,
        partner2:
            winner === 'partner2' || winner === 'both'
                ? (current?.partner2 ?? 0) + points
                : current?.partner2 ?? 0,
    };
    const { data, error } = await supabase
        .from('game_scores')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
};

export const getScores = async (userId: string) => {
    if (!userId) throw new Error('User ID is required for getScores');
    const { data, error } = await supabase
        .from('game_scores')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
};

export const getGameStats = async (userId: string) => {
    const [scoresResult, historyResult, profileResult] = await Promise.all([
        supabase
            .from('game_scores')
            .select('partner1, partner2')
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

    const scores = scoresResult.data || { partner1: 0, partner2: 0 };
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

export const adminGrantPro = async (userId: string, isPro: boolean) => {
    const { error } = await supabase
        .from('profiles')
        .update({ is_pro: isPro })
        .eq('id', userId);
    if (error) throw new Error(error.message);
};

export const adminGetUserStats = async (userId: string) => {
    // Get relationship scores and history count
    const { data: scores } = await supabase.from('game_scores').select('*').eq('user_id', userId).single();
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

// ─── PUBLIC CMS (Dares) ─────────────────────────────────────────────────────

export const getCmsCards = async () => {
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('is_active', true);
    if (error) throw new Error(error.message);
    return data;
};


