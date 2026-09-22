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

/**
 * Normalizes and formats technical or raw Supabase errors into human-friendly messages.
 */
export const formatAuthError = (error: any, fallbackMessage: string = 'An error occurred'): string => {
    if (!error) return fallbackMessage;
    const raw = (typeof error === 'string' ? error : error.message || '').trim();
    if (!raw) return fallbackMessage;

    if (/network request failed/i.test(raw) || /failed to fetch/i.test(raw) || /networkerror/i.test(raw)) {
        return 'Unable to reach the server. Please check your internet connection.';
    }
    if (/email rate limit/i.test(raw) || /rate limit/i.test(raw) || /too many requests/i.test(raw) || /security purposes/i.test(raw)) {
        return 'Too many attempts. Please wait a moment before trying again.';
    }
    if (/user already registered/i.test(raw) || /already exists/i.test(raw)) {
        return 'An account with this email already exists. Please log in instead.';
    }
    if (/password should be at least/i.test(raw) || /password.*short/i.test(raw)) {
        return 'Password must be at least 6 characters.';
    }
    if (/email not confirmed/i.test(raw)) {
        return 'Your email has not been verified yet. Please check your inbox for the verification code.';
    }
    if (/invalid login credentials/i.test(raw) || /invalid_credentials/i.test(raw)) {
        return 'Incorrect email or password. Please try again.';
    }
    if (/token has expired/i.test(raw) || /otp.*expired/i.test(raw) || /invalid.*token/i.test(raw) || /invalid.*otp/i.test(raw) || /email link is invalid/i.test(raw)) {
        return 'The verification code is invalid or has expired. Please request a new code.';
    }
    if (/signup is disabled/i.test(raw)) {
        return 'Email signup is currently disabled.';
    }
    return raw;
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const signupV2 = async (email: string, password: string, fullName?: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
        throw new Error('Please enter a valid email address.');
    }

    const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
            data: fullName?.trim() ? { name: fullName.trim(), full_name: fullName.trim() } : undefined,
        },
    });
    if (error) {
        throw new Error(formatAuthError(error, 'Signup failed. Please try again.'));
    }
    if (!data.user) throw new Error('Registration could not be completed. Please try again.');

    // If email confirmations are enabled and email is already registered, Supabase returns identities: []
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error('An account with this email already exists. Please log in instead.');
    }

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
        throw new Error(formatAuthError(error, 'Login failed. Please check your credentials.'));
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
        throw new Error(formatAuthError(error, 'Failed to send password reset email.'));
    }
};

/**
 * Verifies the recovery OTP and updates the user's password.
 */
export const verifyPasswordResetOtp = async (email: string, token: string, newPassword: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
        throw new Error('Please enter a valid email address.');
    }
    const cleanToken = token.trim();
    if (!cleanToken || cleanToken.length < 6 || cleanToken.length > 8) {
        throw new Error('Please enter the verification code.');
    }
    if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters.');
    }

    // 1. Verify recovery OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanToken,
        type: 'recovery',
    });
    if (verifyError) {
        throw new Error(formatAuthError(verifyError, 'Invalid or expired OTP code.'));
    }

    // 2. Set the new password for the authenticated recovery session
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
    });
    if (updateError) {
        throw new Error(formatAuthError(updateError, 'Failed to update password. Please try again.'));
    }

    // 3. Clear the temporary recovery session so the user logs in with new credentials
    await supabase.auth.signOut().catch(() => {});
    return true;
};

/**
 * Sends a one-time passcode (OTP) for passwordless login.
 */
export const sendLoginOtp = async (email: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
        throw new Error('Please enter a valid email address.');
    }

    const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
            shouldCreateUser: true,
        },
    });
    if (error) {
        throw new Error(formatAuthError(error, 'Failed to send login code.'));
    }
};

/**
 * Verifies a login OTP code.
 */
export const verifyLoginOtp = async (email: string, token: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
        throw new Error('Please enter a valid email address.');
    }
    const cleanToken = token.trim();
    if (!cleanToken || cleanToken.length < 6) {
        throw new Error('Please enter the verification code.');
    }

    const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanToken,
        type: 'email',
    });
    if (error) {
        throw new Error(formatAuthError(error, 'Invalid or expired code.'));
    }
    if (!data.user) {
        throw new Error('Authentication failed.');
    }

    await setTokens(data.session?.access_token || '', data.session?.refresh_token || '');
    await postAuthSync(data.user.id, data.user.email);
    return { user: data.user, access_token: data.session?.access_token };
};

/**
 * Verifies the confirmation OTP sent to a newly registered email (6 or 8 digits).
 */
export const verifySignupOtp = async (email: string, token: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
        throw new Error('Please enter a valid email address.');
    }
    const cleanToken = token.trim();
    if (!cleanToken || cleanToken.length < 6 || cleanToken.length > 8) {
        throw new Error('Please enter a valid verification code.');
    }

    const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanToken,
        type: 'signup',
    });

    if (error) {
        // Fallback check with 'email' type if project configured differently
        const fallback = await supabase.auth.verifyOtp({
            email: normalizedEmail,
            token: cleanToken,
            type: 'email',
        });
        if (fallback.error) {
            throw new Error(formatAuthError(fallback.error || error, 'Invalid or expired verification code.'));
        }
        if (!fallback.data.user || !fallback.data.session) {
            throw new Error('Verification completed but could not establish session. Please log in.');
        }
        await setTokens(fallback.data.session.access_token, fallback.data.session.refresh_token);
        await postAuthSync(fallback.data.user.id, fallback.data.user.email || undefined);
        return { user: fallback.data.user, session: fallback.data.session };
    }

    if (!data.user || !data.session) {
        throw new Error('Verification completed but could not establish session. Please log in.');
    }

    await setTokens(data.session.access_token, data.session.refresh_token);
    await postAuthSync(data.user.id, data.user.email || undefined);
    return { user: data.user, session: data.session };
};

/**
 * Resends the confirmation OTP for a newly registered email.
 */
export const resendSignupOtp = async (email: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
        throw new Error('Please enter a valid email address.');
    }

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
    });
    if (error) {
        throw new Error(formatAuthError(error, 'Failed to resend confirmation code.'));
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
    updates: { partner1?: string; partner2?: string; partner_email?: string; card_count?: number; vibe?: string; streak_count?: number; last_active?: string | null },
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

        // Persist to the profiles table so the answers are first-class,
        // queryable per-user data (admin panel / analytics), not just auth
        // metadata. These columns are added in
        // 20260822000000_add_onboarding_columns.sql and are NOT guarded by the
        // restrict_sensitive_profile_updates trigger, so the client may write
        // them under the profiles_update_own RLS policy.
        const profileUpdates: Record<string, any> = {};
        if (prefs.gender) profileUpdates.gender = prefs.gender;
        if (prefs.relationship_status) profileUpdates.relationship_status = prefs.relationship_status;
        if (prefs.app_purpose) profileUpdates.app_purpose = prefs.app_purpose;
        if (prefs.vibe) profileUpdates.vibe = prefs.vibe;

        if (userId && Object.keys(profileUpdates).length > 0) {
            await supabase.from('profiles').update(profileUpdates).eq('id', userId);
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

// Spend one card server-side (SECURITY DEFINER RPC). Direct client writes to
// card_count are blocked by the anti-cheat trigger, so this is the only path
// that actually persists a spend. Returns the new balance.
export const spendCard = async (userId: string): Promise<number> => {
    const { data, error } = await supabase.rpc('spend_card', { p_user_id: userId });
    if (error) throw new Error(error.message);
    return typeof data === 'number' ? data : Number(data);
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
    // Goes through the admin RPC (is_admin() checked server-side); a direct
    // update would be blocked by the profile anti-cheat trigger.
    const { error } = await supabase.rpc('admin_set_cards', { p_user_id: userId, p_count: count });
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

    // Redemption is fully server-side (SECURITY DEFINER redeem_promo_code RPC):
    // validates the code, enforces one-per-user via promo_redemptions, grants Pro
    // and/or cards atomically, and bumps used_count. Promo codes are no longer
    // client-readable, and the profile writes are done inside the RPC (the
    // anti-cheat trigger blocks direct client writes to is_pro / card_count).
    const { data, error } = await supabase.rpc('redeem_promo_code', { p_code: code });
    if (error) throw new Error(error.message);

    const r: any = data || {};
    return {
        success: Boolean(r.success),
        message: r.message || (r.success ? 'Promo code applied!' : 'Unable to redeem this code.'),
        grantProDays: r.grantProDays ?? 0,
        bonusCards: r.bonusCards ?? 0,
        expiresAt: r.expiresAt ?? null,
        isLifetime: Boolean(r.isLifetime),
        newCardCount: r.newCardCount,
    };
};

export const adminGrantPro = async (userId: string, isPro: boolean, expiresAt?: string | null) => {
    const proExpiresAt = isPro ? (expiresAt !== undefined ? expiresAt : null) : null;

    // Goes through the admin RPC (is_admin() checked server-side); a direct
    // profile update would be blocked by the anti-cheat trigger.
    const { error } = await supabase.rpc('admin_set_pro', {
        p_user_id: userId,
        p_is_pro: isPro,
        p_expires_at: proExpiresAt,
    });
    if (error) throw new Error(error.message);

    // Broadcast live event to the user's active device immediately
    try {
        const channel = supabase.channel(`user-updates:${userId}`);
        await channel.send({
            type: 'broadcast',
            event: 'user_updated',
            payload: {
                is_pro: isPro,
                pro_expires_at: proExpiresAt,
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

// Server-side tailored deck: filters/orders the active cards by the logged-in
// user's onboarding answers (profiles.app_purpose / relationship_status) via the
// get_tailored_cards RPC (20260822010000). Requires an authenticated session.
// Pass maxIntensity: 3 to disable the intensity cap when the user explicitly
// selects a vibe.
export const getTailoredCards = async (opts?: {
    limit?: number;
    vibe?: string | null;
    maxIntensity?: number | null;
}) => {
    const { data, error } = await supabase.rpc('get_tailored_cards', {
        p_limit: opts?.limit ?? 200,
        p_vibe_override: opts?.vibe ?? null,
        p_max_intensity: opts?.maxIntensity ?? null,
    });
    if (error) throw new Error(error.message);
    return data;
};

// ─── AI DARES ─────────────────────────────────────────────────────────────────
// Dares are generated + saved server-side by the groq-ai-dare Edge Function.
// These helpers read the user's own AI dares and let them rate one.

export const getMyAiDares = async (userId: string, limit = 50) => {
    if (!userId) throw new Error('User ID is required for getMyAiDares');
    const { data, error } = await supabase
        .from('ai_dares')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw new Error(error.message);
    return data;
};

export const rateAiDare = async (dareId: string, rating: -1 | 0 | 1) => {
    if (!dareId) throw new Error('dareId is required to rate a dare');
    // RLS restricts this update to the dare's owner.
    const { error } = await supabase
        .from('ai_dares')
        .update({ rating })
        .eq('id', dareId);
    if (error) throw new Error(error.message);
    return { success: true };
};

// ─── FAVORITE DARES ───────────────────────────────────────────────────────────

export const saveFavoriteDare = async (
    userId: string,
    dare: { text: string; type?: string; vibe?: string; intensity?: number; source?: string },
) => {
    if (!userId) throw new Error('You must be logged in to save a favorite.');
    if (!dare?.text) throw new Error('Nothing to save.');
    const { data, error } = await supabase
        .from('favorite_dares')
        .insert({
            user_id: userId,
            text: dare.text,
            type: dare.type ?? null,
            vibe: dare.vibe ?? null,
            intensity: dare.intensity ?? null,
            source: dare.source ?? 'ai',
        })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const getFavoriteDares = async (userId: string, limit = 100) => {
    if (!userId) throw new Error('User ID is required for getFavoriteDares');
    const { data, error } = await supabase
        .from('favorite_dares')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw new Error(error.message);
    return data;
};

export const removeFavoriteDare = async (favoriteId: string) => {
    if (!favoriteId) throw new Error('favoriteId is required');
    const { error } = await supabase.from('favorite_dares').delete().eq('id', favoriteId);
    if (error) throw new Error(error.message);
    return { success: true };
};




