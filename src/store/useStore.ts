import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DareCard, CARDS } from '../constants/cards';
import {
    getUserCards, addUserCards, getProfile, updateProfile,
    addPoints as apiAddPoints, getScores as apiGetScores,
    claimWeeklyFreeCards, getHistory as apiGetHistory,
    addHistoryEntry as apiAddHistoryEntry, syncCardCount, ensureProfileExists,
    getAppRemoteConfigs, subscribeToRemoteConfigs, AppRemoteConfigs,
    syncOnboardingPreferencesToSupabase
} from '../services/api';

export interface HistoryEntry {
    id: string;
    date: string;
    card: DareCard;
    winner: string; // 'partner1' | 'partner2' | 'both'
    proofUri?: string; // Optional image proof URI
}

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertConfig {
    visible: boolean;
    title: string;
    message: string;
    buttons?: AlertButton[];
    onClose?: () => void;
}

// Types for the global state
interface ApplicationState {
    hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;

    // Player info
    partner1: string | null;
    partner2: string | null;
    setPartners: (p1: string, p2: string) => void;
    setPartner1: (p1: string) => void;
    setPartner2: (p2: string) => void;

    // Onboarding Survey / Profiling
    gender: 'male' | 'female' | 'non-binary' | 'other' | 'prefer_not_to_say' | string | null;
    relationshipStatus: 'single' | 'dating' | 'married' | 'ldr' | 'complicated' | string | null;
    appPurpose: 'spice' | 'fun' | 'deep' | 'ldr' | 'fantasies' | string | null;
    setGender: (gender: string | null) => void;
    setRelationshipStatus: (status: string | null) => void;
    setAppPurpose: (purpose: string | null) => void;
    setOnboardingPreferences: (prefs: { gender?: string | null; relationshipStatus?: string | null; appPurpose?: string | null }) => void;

    // Game Mode, Vibe & Intensity
    mode: 'local' | 'ldr' | null;
    setMode: (mode: 'local' | 'ldr') => void;
    selectedVibe: string | null;
    setSelectedVibe: (vibe: string | null) => void;
    selectedIntensity: number;
    setSelectedIntensity: (intensity: number) => void;

    // Auth State
    isAuthenticated: boolean;
    isAuthChecked: boolean;
    userId: string | null;
    userEmail: string | null;
    login: (userId?: string, email?: string) => void;
    logout: () => void;
    setUserId: (id: string | null) => void;
    setUserEmail: (email: string | null) => void;

    // LDR Room State
    roomId: string | null;
    setRoomId: (id: string | null) => void;
    isHost: boolean;
    setIsHost: (isHost: boolean) => void;

    // Premium State
    isPro: boolean;
    proExpiresAt: string | null;
    setIsPro: (isPro: boolean, expiresAt?: string | null) => void;
    setProExpiresAt: (expiresAt: string | null) => void;
    redeemPromoCode: (code: string) => Promise<any>;

    // Cards State — count-based
    cardCount: number;
    setCardCount: (count: number) => void;
    cards: DareCard[];
    activeCustomCard: DareCard | null;
    setActiveCustomCard: (card: DareCard | null) => void;
    fetchCards: () => Promise<void>;
    drawCard: (vibeFilter?: string | null) => DareCard | null;
    addCards: (count: number) => void;
    loadCardsFromSupabase: (userId: string) => Promise<void>;
    syncScoresToSupabase: (userId: string) => Promise<void>;
    loadScoresFromSupabase: (userId: string) => Promise<void>;
    syncWithSupabase: () => Promise<void>;

    // Retention Features
    streak: number;
    lastActiveDate: string | null;
    anniversaryDate: string | null;
    updateStreak: () => void;

    // Daily Question
    dailyQuestion: {
        id: number;
        text: string;
        myResponse: string | null;
        partnerResponse: string | null;
    };
    answerDailyQuestion: (response: string) => Promise<void>;
    refreshDailyResponses: () => Promise<void>;

    // Milestones
    milestones: string[];
    checkMilestones: () => void;

    // Weekly Free Cards Logic
    lastFreeClaimDate: string | null;
    claimWeeklyFree: () => Promise<boolean>;

    // History & Scores
    scores: { partner1: number; partner2: number };
    history: HistoryEntry[];
    addPoint: (to: 'partner1' | 'partner2' | 'both') => void;
    addHistoryEntry: (entry: HistoryEntry) => void;

    // App initialization from AsyncStorage
    hydrate: () => Promise<void>;

    // User Experience State
    hasSeenOnboarding: boolean;
    setHasSeenOnboarding: (seen: boolean) => void;
    hasSeenSubscription: boolean;
    setHasSeenSubscription: (seen: boolean) => void;
    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => void;

    // Paywall tracking
    lastPaywallShown: string | null; // ISO string
    setLastPaywallShown: (date: string) => void;

    // Global Alert
    alertConfig: AlertConfig;
    showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
    hideAlert: () => void;

    // Remote Configs & Feature Switches
    remoteConfigs: AppRemoteConfigs;
    fetchRemoteConfigs: () => Promise<void>;
    setRemoteConfigs: (configs: AppRemoteConfigs) => void;

    // Realtime Sync
    setupRealtimeListeners: () => void;
    cleanupRealtimeListeners: () => void;
    setupRoomListeners: (roomCode: string) => void;
    cleanupRoomListeners: () => void;
}

// 🌐 Global channel storage to manage cleanups across re-opens/logouts
let profileChannel: any = null;
let scoreChannel: any = null;
let historyChannel: any = null;
let dailyChannel: any = null;
let roomChannel: any = null;
let chatChannel: any = null;
let configUnsubscribe: (() => void) | null = null;

export const useStore = create<ApplicationState>((set, get) => ({
    hasHydrated: false,
    isAuthChecked: false,
    setHasHydrated: (state) => set({ hasHydrated: state }),

    // Remote Configs & Feature Switches
    remoteConfigs: {
        feature_flags: {
            video_calls: true,
            spicy_category: true,
            shop_enabled: true,
            room_creation: true,
            promo_codes: true,
            ai_moderation: true,
            daily_rewards: true,
            secret_cards: true,
        },
        maintenance_mode: {
            enabled: false,
            message: 'Rumbala is currently under brief scheduled maintenance. We will be right back!'
        },
        app_update: {
            enabled: false,
            latest_android: 7,
            latest_ios: 7,
            min_android: 0,
            min_ios: 0,
            message: 'A new version of Rumbala is here — with fresh dares and improvements. Update now to keep the sparks flying! ✨',
            force_message: 'Please update Rumbala to the latest version to continue. This update is required to keep playing. 💕',
            android_url: '',
            ios_url: '',
        }
    },
    fetchRemoteConfigs: async () => {
        try {
            const configs = await getAppRemoteConfigs();
            if (configs && Object.keys(configs).length > 0) {
                set(state => ({
                    remoteConfigs: {
                        ...state.remoteConfigs,
                        ...configs,
                        feature_flags: {
                            ...state.remoteConfigs.feature_flags,
                            ...(configs.feature_flags || {}),
                        },
                        maintenance_mode: {
                            ...state.remoteConfigs.maintenance_mode,
                            ...(configs.maintenance_mode || {}),
                        },
                        app_update: {
                            ...state.remoteConfigs.app_update,
                            ...(configs.app_update || {}),
                        }
                    }
                }));
            }
        } catch (e) {
            console.warn('Error fetching remote configs', e);
        }
    },
    setRemoteConfigs: (configs) => set({ remoteConfigs: configs }),

    partner1: null,
    partner2: null,
    setPartners: (p1, p2) => {
        set({ partner1: p1, partner2: p2 });
        AsyncStorage.setItem('@Rumbala_names', JSON.stringify({ partner1: p1, partner2: p2 }));
        const userId = get().userId;
        if (userId) updateProfile(userId, { partner1: p1, partner2: p2 }).catch(console.warn);
    },
    setPartner1: (p1) => {
        const { partner2 } = get();
        set({ partner1: p1 });
        AsyncStorage.setItem('@Rumbala_names', JSON.stringify({ partner1: p1, partner2 }));
        const userId = get().userId;
        if (userId) updateProfile(userId, { partner1: p1 }).catch(console.warn);
    },
    setPartner2: (p2) => {
        const { partner1 } = get();
        set({ partner2: p2 });
        AsyncStorage.setItem('@Rumbala_names', JSON.stringify({ partner1, partner2: p2 }));
        const userId = get().userId;
        if (userId) updateProfile(userId, { partner2: p2 }).catch(console.warn);
    },

    mode: null,
    setMode: (mode) => {
        set({ mode });
        AsyncStorage.setItem('@Rumbala_mode', mode);
    },

    selectedVibe: null,
    setSelectedVibe: (vibe) => {
        set({ selectedVibe: vibe });
        AsyncStorage.setItem('@Rumbala_vibe', vibe || '');
    },

    selectedIntensity: 2,
    setSelectedIntensity: (intensity) => {
        set({ selectedIntensity: intensity });
        AsyncStorage.setItem('@Rumbala_intensity', String(intensity));
    },

    isAuthenticated: false,
    userId: null,
    userEmail: null,
    login: (userId, email) => {
        set({ isAuthenticated: true, userId, userEmail: email });
        if (userId) {
            AsyncStorage.setItem('@Rumbala_userId', userId);
            get().syncWithSupabase();
            get().setupRealtimeListeners();
        }
        if (email) AsyncStorage.setItem('@Rumbala_userEmail', email);
        AsyncStorage.setItem('@Rumbala_auth', 'true');
    },
    logout: () => {
        get().cleanupRealtimeListeners();
        set({ isAuthenticated: false, userId: null, userEmail: null, cardCount: 0 });
        AsyncStorage.setItem('@Rumbala_auth', 'false');
        AsyncStorage.setItem('@Rumbala_userId', '');
        AsyncStorage.setItem('@Rumbala_userEmail', '');
        import('../services/api').then(api => api.logoutV2()).catch(console.warn);
    },
    setUserId: (id) => {
        set({ userId: id, isAuthenticated: !!id });
        if (id) {
            AsyncStorage.setItem('@Rumbala_userId', id);
            AsyncStorage.setItem('@Rumbala_auth', 'true');
        } else {
            AsyncStorage.setItem('@Rumbala_userId', '');
            AsyncStorage.setItem('@Rumbala_auth', 'false');
        }
    },
    setUserEmail: (email) => {
        set({ userEmail: email });
        if (email) AsyncStorage.setItem('@Rumbala_userEmail', email);
        else AsyncStorage.setItem('@Rumbala_userEmail', '');
    },

    hasSeenOnboarding: false,
    setHasSeenOnboarding: (seen) => {
        set({ hasSeenOnboarding: seen });
        AsyncStorage.setItem('@Rumbala_onboarding_seen', seen ? 'true' : 'false');
    },

    gender: null,
    relationshipStatus: null,
    appPurpose: null,
    setGender: (gender) => {
        set({ gender });
        if (gender) AsyncStorage.setItem('@Rumbala_gender', gender);
        else AsyncStorage.removeItem('@Rumbala_gender');
    },
    setRelationshipStatus: (relationshipStatus) => {
        set({ relationshipStatus });
        if (relationshipStatus) AsyncStorage.setItem('@Rumbala_relationship_status', relationshipStatus);
        else AsyncStorage.removeItem('@Rumbala_relationship_status');
    },
    setAppPurpose: (appPurpose) => {
        set({ appPurpose });
        if (appPurpose) AsyncStorage.setItem('@Rumbala_app_purpose', appPurpose);
        else AsyncStorage.removeItem('@Rumbala_app_purpose');
    },
    setOnboardingPreferences: ({ gender, relationshipStatus, appPurpose }) => {
        set({
            ...(gender !== undefined && { gender }),
            ...(relationshipStatus !== undefined && { relationshipStatus }),
            ...(appPurpose !== undefined && { appPurpose }),
        });
        if (gender) AsyncStorage.setItem('@Rumbala_gender', gender);
        if (relationshipStatus) AsyncStorage.setItem('@Rumbala_relationship_status', relationshipStatus);
        if (appPurpose) AsyncStorage.setItem('@Rumbala_app_purpose', appPurpose);

        const uid = get().userId;
        if (uid) {
            syncOnboardingPreferencesToSupabase(uid, {
                gender: gender || get().gender,
                relationship_status: relationshipStatus || get().relationshipStatus,
                app_purpose: appPurpose || get().appPurpose,
                vibe: get().selectedVibe,
            }).catch(() => {});
        }
    },

    hasSeenSubscription: false,
    setHasSeenSubscription: (seen) => {
        set({ hasSeenSubscription: seen });
        AsyncStorage.setItem('@Rumbala_subscription_seen', seen ? 'true' : 'false');
    },

    notificationsEnabled: false,
    setNotificationsEnabled: (enabled) => {
        set({ notificationsEnabled: enabled });
        AsyncStorage.setItem('@Rumbala_notifications_enabled', enabled ? 'true' : 'false');
    },

    roomId: null,
    setRoomId: (roomId) => {
        const previousRoomId = get().roomId;
        if (previousRoomId && previousRoomId !== roomId) {
            get().cleanupRoomListeners();
        }
        set({ roomId });
        if (roomId) {
            AsyncStorage.setItem('@Rumbala_room_id', roomId);
            get().setupRoomListeners(roomId);
        } else {
            AsyncStorage.setItem('@Rumbala_room_id', '');
            // Bug fix: setMode('ldr') is only ever called when creating/joining
            // a room, and was never being reset — so once a user entered LDR
            // mode once, it stuck forever (persisted to AsyncStorage too),
            // silently restricting every future Home-tab drawCard() to the
            // 6-card LDR-only pool. Leaving a room (roomId -> null) is the one
            // choke point all 5 exit paths (leave, timeout, invalid room,
            // verification error, error fallback) already go through.
            if (previousRoomId && get().mode === 'ldr') {
                get().setMode('local');
            }
        }
    },
    isHost: false,
    setIsHost: (isHost) => set({ isHost }),

    isPro: false,
    proExpiresAt: null,
    setIsPro: (isPro, expiresAt) => {
        let exp = expiresAt !== undefined ? expiresAt : get().proExpiresAt;
        // When explicitly revoking Pro, also clear any future expiry so it can't keep Pro alive
        if (!isPro && expiresAt === undefined) {
            exp = null;
        }
        // If explicitly enabling Pro without a new expiration date, but old stored expiration date is in the past, clear it so it doesn't block Pro
        if (isPro && exp && new Date(exp).getTime() <= Date.now()) {
            exp = null;
        }

        // Unified formula: Lifetime Pro (flag + no expiry) OR valid future expiry date
        const isActive = Boolean((isPro && !exp) || (exp && new Date(exp).getTime() > Date.now()));
        set({ isPro: isActive, proExpiresAt: exp });
        AsyncStorage.setItem('@Rumbala_is_pro', isActive ? 'true' : 'false');
        if (exp) {
            AsyncStorage.setItem('@Rumbala_pro_expires_at', exp);
        } else {
            AsyncStorage.removeItem('@Rumbala_pro_expires_at');
        }
    },
    setProExpiresAt: (expiresAt) => {
        const { isPro } = get();
        // Unified formula: Lifetime Pro (flag + no expiry) OR valid future expiry date
        const isActive = Boolean((isPro && !expiresAt) || (expiresAt && new Date(expiresAt).getTime() > Date.now()));
        set({ isPro: isActive, proExpiresAt: expiresAt });
        AsyncStorage.setItem('@Rumbala_is_pro', isActive ? 'true' : 'false');
        if (expiresAt) {
            AsyncStorage.setItem('@Rumbala_pro_expires_at', expiresAt);
        } else {
            AsyncStorage.removeItem('@Rumbala_pro_expires_at');
        }
    },

    // ── Retention Logic ──
    streak: 0,
    lastActiveDate: null,
    anniversaryDate: null,
    updateStreak: () => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const { lastActiveDate, streak } = get();

        if (lastActiveDate === todayStr) return; // already active today

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActiveDate === yesterdayStr) {
            set({ streak: streak + 1, lastActiveDate: todayStr });
        } else {
            set({ streak: 1, lastActiveDate: todayStr });
        }
        AsyncStorage.setItem('@Rumbala_streak_count', String(get().streak));
        AsyncStorage.setItem('@Rumbala_last_active', todayStr);
        get().checkMilestones();
    },

    dailyQuestion: {
        id: new Date().getDate(), // Simple rotation
        text: "What's one thing about us that you're most grateful for today?",
        myResponse: null,
        partnerResponse: null,
    },
    answerDailyQuestion: async (response) => {
        const { dailyQuestion, userId } = get();
        if (!dailyQuestion) return;
        set({ dailyQuestion: { ...dailyQuestion, myResponse: response } });
        get().updateStreak();

        // Sync to cloud
        if (userId) {
            import('../services/api').then(api => {
                api.saveDailyResponse(userId, dailyQuestion.id, response).catch(console.warn);
            });
        }
    },

    refreshDailyResponses: async () => {
        const { userId, dailyQuestion, mode } = get();
        if (!userId || !dailyQuestion) return;

        try {
            const api = await import('../services/api');

            // In LDR mode, we should fetch both responses.
            const responses = await api.getDailyResponses(dailyQuestion.id, [userId]);

            if (responses && responses.length > 0) {
                const myResp = responses.find((r: any) => r.user_id === userId);
                if (myResp) {
                    set(state => ({
                        dailyQuestion: { ...state.dailyQuestion, myResponse: myResp.response }
                    }));
                }
            }

            const { roomId } = get();
            if (roomId) {
                const roomData = await import('../services/roomApi').then(rapi => rapi.getRoomDataV2(roomId));
                if (roomData) {
                    const partnerId = get().isHost ? roomData.guest_user_id : roomData.host_user_id;
                    if (partnerId) {
                        const allResponses = await api.getDailyResponses(dailyQuestion.id, [userId, partnerId]);
                        const partResp = allResponses.find((r: any) => r.user_id === partnerId);
                        if (partResp) {
                            set(state => ({
                                dailyQuestion: { ...state.dailyQuestion, partnerResponse: partResp.response }
                            }));
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to refresh daily responses:', e);
        }
    },

    milestones: [],
    checkMilestones: () => {
        const { streak, history, milestones } = get();
        const newMilestones = [...milestones];

        if (streak >= 7 && !milestones.includes('7_day_streak')) {
            newMilestones.push('7_day_streak');
            get().showAlert('🔥 7 Day Streak!', 'You two are on fire! 7 days of love and laughter.');
        }
        if (history.length >= 1 && !milestones.includes('first_dare')) {
            newMilestones.push('first_dare');
            get().showAlert('🏆 First Step!', "You've completed your very first dare. Here's to many more!");
        }

        if (newMilestones.length !== milestones.length) {
            set({ milestones: newMilestones });
            AsyncStorage.setItem('@Rumbala_milestones', JSON.stringify(newMilestones));
        }
    },

    // ─── Count-based card system ───
    cardCount: 2,
    setCardCount: (count) => {
        set({ cardCount: count });
        AsyncStorage.setItem('@Rumbala_card_count', String(count));
    },

    cards: [],
    activeCustomCard: null,
    setActiveCustomCard: (card) => set({ activeCustomCard: card }),
    fetchCards: async () => {
        try {
            const api = await import('../services/api');
            const data = await api.getCmsCards(); // I need to add this to api.ts
            if (data) set({ cards: data });
        } catch (e) { console.warn('Card fetch failed', e); }
    },

    drawCard: (vibeFilter?: string | null) => {
        const { cardCount, isPro, cards, mode } = get();
        // If not Pro and out of cards, block draw
        if (!isPro && cardCount <= 0) return null;

        const fullDeck = (cards && cards.length > 0) ? cards : CARDS;
        let pool = fullDeck;

        // 🔒 Mode & Vibe Enforcement
        if (vibeFilter === 'ldr') {
            // Specifically requested LDR cards
            pool = pool.filter(c => c.type === 'ldr');
        } else if (mode === 'ldr') {
            // In LDR mode, only show LDR cards, but respect vibe (fun/romantic/spicy)
            pool = pool.filter(c => c.type === 'ldr');
            if (vibeFilter && vibeFilter !== 'all') {
                const subPool = pool.filter(c => c.vibe === vibeFilter || c.type === vibeFilter);
                if (subPool.length > 0) pool = subPool;
            }
        } else {
            // In Together mode, exclude LDR cards unless specifically filtered
            pool = pool.filter(c => c.type !== 'ldr');
            if (vibeFilter && vibeFilter !== 'all') {
                const subPool = pool.filter(c => c.type === vibeFilter || c.vibe === vibeFilter);
                if (subPool.length > 0) pool = subPool;
            }
        }

        // Apply Intensity Filter ONLY for Spicy category on Home page if matching cards exist
        if (mode !== 'ldr' && vibeFilter === 'spicy') {
            const currentIntensity = get().selectedIntensity;
            const intensityPool = pool.filter(c => (c.intensity ?? 1) === currentIntensity);
            if (intensityPool.length > 0) {
                pool = intensityPool;
            }
        }

        // Graceful fallback if filter exhausted so users (especially Pro) never get blocked
        if (pool.length === 0) {
            pool = fullDeck.filter(c => mode === 'ldr' ? c.type === 'ldr' : c.type !== 'ldr');
            if (pool.length === 0) pool = CARDS;
        }

        const drawn = pool[Math.floor(Math.random() * pool.length)];

        // Only decrement cards for FREE non-Pro users! Pro users have UNLIMITED cards.
        if (!isPro) {
            const newCount = Math.max(0, cardCount - 1);
            get().setCardCount(newCount);
            const { userId, isAuthenticated } = get();
            if (userId && isAuthenticated) {
                syncCardCount(userId, newCount).catch(console.warn);
            }
        }
        return drawn;
    },

    addCards: (count) => {
        const newCount = get().cardCount + count;
        get().setCardCount(newCount);
    },

    redeemPromoCode: async (code: string) => {
        const { userId } = get();
        if (!userId) throw new Error('Please log in or create an account to redeem promo codes.');
        try {
            const api = await import('../services/api');
            const result = await api.redeemPromoCode(userId, code);
            if (result.success) {
                if (result.grantProDays !== undefined && result.grantProDays > 0) {
                    get().setIsPro(true, result.expiresAt || null);
                } else if (result.isLifetime) {
                    get().setIsPro(true, null);
                }
                if (result.newCardCount !== undefined) {
                    get().setCardCount(result.newCardCount);
                }
            }
            return result;
        } catch (e: any) {
            return { success: false, message: e?.message || 'Something went wrong. Please try again.' };
        }
    },

    loadCardsFromSupabase: async (userId: string) => {
        try {
            const cardsData = await getUserCards(userId);
            const cardCount = cardsData.card_count || 0;
            set({ cardCount });
            await AsyncStorage.setItem('@Rumbala_card_count', String(cardCount));
        } catch (error: any) {
            console.warn('Error in loadCardsFromSupabase:', error);
            if (error.message?.includes('not found')) {
                const FREE_CARDS = 5;
                try {
                    await addUserCards(userId, FREE_CARDS);
                    set({ cardCount: FREE_CARDS });
                    await AsyncStorage.setItem('@Rumbala_card_count', String(FREE_CARDS));
                } catch (addError) {
                    console.error('Failed to initialize cards:', addError);
                }
            }
        }
    },

    syncScoresToSupabase: async (userId: string) => {
        try {
            const { scores } = get();
            const partner1Points = scores.partner1;
            const partner2Points = scores.partner2;
            if (partner1Points > 0) await apiAddPoints(userId, 'partner1', partner1Points);
            if (partner2Points > 0) await apiAddPoints(userId, 'partner2', partner2Points);
        } catch (error) {
            console.warn('Error syncing scores to Supabase:', error);
        }
    },

    loadScoresFromSupabase: async (userId: string) => {
        try {
            const scoresData = await apiGetScores(userId);
            set({ scores: { partner1: scoresData.partner1 || 0, partner2: scoresData.partner2 || 0 } });
            await AsyncStorage.setItem('@Rumbala_scores', JSON.stringify({
                partner1: scoresData.partner1 || 0,
                partner2: scoresData.partner2 || 0
            }));
        } catch (error) {
            console.warn('Error loading scores from Supabase:', error);
        }
    },

    syncWithSupabase: async () => {
        const userId = get().userId;
        if (!userId) return;
        try {
            const profile = await ensureProfileExists(userId);
            if (profile) {
                const { partner1: localP1, partner2: localP2 } = get();
                const updates: any = {};
                if (!profile.partner1 && localP1) updates.partner1 = localP1;
                if (!profile.partner2 && localP2) updates.partner2 = localP2;
                if (get().selectedVibe && profile.vibe !== get().selectedVibe) {
                    updates.vibe = get().selectedVibe;
                }
                if (Object.keys(updates).length > 0) {
                    await updateProfile(userId, updates);
                }
                if (profile.vibe && !get().selectedVibe) {
                    set({ selectedVibe: profile.vibe });
                    await AsyncStorage.setItem('@Rumbala_vibe', profile.vibe);
                }
                if (profile.partner1) set({ partner1: profile.partner1 });
                if (profile.partner2) set({ partner2: profile.partner2 });

                // Sync onboarding questionnaire preferences to Supabase
                syncOnboardingPreferencesToSupabase(userId, {
                    gender: get().gender,
                    relationship_status: get().relationshipStatus,
                    app_purpose: get().appPurpose,
                    vibe: get().selectedVibe,
                }).catch(() => {});
                if (profile.card_count !== undefined) {
                    set({ cardCount: profile.card_count });
                    await AsyncStorage.setItem('@Rumbala_card_count', String(profile.card_count));
                }
                if (profile.is_pro !== undefined || profile.pro_expires_at !== undefined) {
                    const exp = profile.pro_expires_at || null;
                    // Unified formula: Lifetime Pro (flag + no expiry) OR valid future expiry date
                    const isRemoteActive = Boolean((profile.is_pro && !exp) || (exp && new Date(exp).getTime() > Date.now()));
                    // Always apply remote state — the database is the source of truth
                    set({ isPro: isRemoteActive, proExpiresAt: exp });
                    await AsyncStorage.setItem('@Rumbala_is_pro', isRemoteActive ? 'true' : 'false');
                    if (exp) {
                        await AsyncStorage.setItem('@Rumbala_pro_expires_at', exp);
                    } else {
                        await AsyncStorage.removeItem('@Rumbala_pro_expires_at');
                    }
                }
                if (profile.last_weekly_claim_at) set({ lastFreeClaimDate: profile.last_weekly_claim_at });
            }
            await get().loadScoresFromSupabase(userId);
            const backendHistory = await apiGetHistory(userId, 50);
            if (backendHistory && backendHistory.length > 0) {
                const mappedHistory = backendHistory.map((bh: any) => ({
                    id: bh.id,
                    date: bh.created_at,
                    card: bh.card,
                    winner: bh.winner,
                    proofUri: bh.proof_uri
                })).slice(0, 50);
                set({ history: mappedHistory });
                await AsyncStorage.setItem('@Rumbala_history', JSON.stringify(mappedHistory));
            }
            await get().refreshDailyResponses();
        } catch (e) {
            console.warn('Silent sync error:', e);
        }
    },

    lastFreeClaimDate: null,
    claimWeeklyFree: async () => {
        const now = new Date();
        const lastClaim = get().lastFreeClaimDate;
        const userId = get().userId;
        if (lastClaim) {
            const lastDate = new Date(lastClaim);
            const diffTime = Math.abs(now.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 7) return false;
        }
        if (userId) {
            try {
                const data = await claimWeeklyFreeCards(userId);
                if (data && data.success) {
                    set({ lastFreeClaimDate: data.last_weekly_claim_at, cardCount: data.card_count });
                    await AsyncStorage.setItem('@Rumbala_last_claim', data.last_weekly_claim_at);
                    await AsyncStorage.setItem('@Rumbala_card_count', String(data.card_count));
                    return true;
                }
            } catch (e) {
                console.warn('Failed to claim weekly cards:', e);
                return false;
            }
        }
        const isoDate = now.toISOString();
        set({ lastFreeClaimDate: isoDate });
        await AsyncStorage.setItem('@Rumbala_last_claim', isoDate);
        return true;
    },

    scores: { partner1: 0, partner2: 0 },
    history: [],
    addPoint: (to) => {
        const currentScores = get().scores;
        const newScores = { ...currentScores };
        if (to === 'both') {
            newScores.partner1 += 1;
            newScores.partner2 += 1;
        } else {
            newScores[to] += 1;
        }
        set({ scores: newScores });
        AsyncStorage.setItem('@Rumbala_scores', JSON.stringify(newScores));
        const { userId, isAuthenticated } = get();
        if (userId && isAuthenticated) {
            apiAddPoints(userId, to, 1).catch(console.warn);
        }
    },

    addHistoryEntry: (entry) => {
        const updatedHistory = [entry, ...get().history].slice(0, 50);
        set({ history: updatedHistory });
        AsyncStorage.setItem('@Rumbala_history', JSON.stringify(updatedHistory)).catch(console.warn);
        const userId = get().userId;
        if (userId) {
            apiAddHistoryEntry(userId, entry.card, entry.winner).catch(console.warn);
        }
    },

    lastPaywallShown: null,
    setLastPaywallShown: (date) => {
        set({ lastPaywallShown: date });
        AsyncStorage.setItem('@Rumbala_last_paywall_shown', date);
    },

    alertConfig: {
        visible: false,
        title: '',
        message: '',
    },
    showAlert: (title, message, buttons) => {
        set({
            alertConfig: {
                visible: true,
                title,
                message,
                buttons,
            }
        });
    },
    hideAlert: () => {
        set({
            alertConfig: {
                ...get().alertConfig,
                visible: false,
            }
        });
    },

    // ─── Realtime Sync ───
    setupRealtimeListeners: () => {
        const { userId, isAuthenticated } = get();
        if (!userId || !isAuthenticated) return;

        // Cleanup existing if any (prevent duplicates)
        get().cleanupRealtimeListeners();

        import('../services/supabase').then(({ supabase }) => {
            // 1. Profile Listener (Self) - Dual layer Broadcast + Postgres Realtime
            const handleProfileUpdate = (data: any) => {
                if (!data) return;
                const prevPro = get().isPro;
                const prevCardCount = get().cardCount;

                if (data.card_count !== undefined) {
                    const newCount = Number(data.card_count) || 0;
                    set({ cardCount: newCount });
                    AsyncStorage.setItem('@Rumbala_card_count', String(newCount));
                    if (newCount > prevCardCount && prevCardCount > 0) {
                        get().showAlert('🎁 Bonus Cards Received!', `You received +${newCount - prevCardCount} dare cards from Rumbala Admin!`);
                    }
                }

                if (data.is_pro !== undefined || data.pro_expires_at !== undefined) {
                    const exp = data.pro_expires_at !== undefined ? data.pro_expires_at : get().proExpiresAt;
                    const isProRaw = data.is_pro !== undefined ? Boolean(data.is_pro) : get().isPro;
                    // Unified formula: Lifetime Pro (flag + no expiry) OR valid future expiry date
                    const isActive = Boolean((isProRaw && !exp) || (exp && new Date(exp).getTime() > Date.now()));
                    set({ isPro: isActive, proExpiresAt: exp });
                    AsyncStorage.setItem('@Rumbala_is_pro', isActive ? 'true' : 'false');
                    if (exp) {
                        AsyncStorage.setItem('@Rumbala_pro_expires_at', exp);
                    } else {
                        AsyncStorage.removeItem('@Rumbala_pro_expires_at');
                    }
                    if (isActive && !prevPro) {
                        get().showAlert('🎉 Pro Activated!', 'Your Rumbala Pro Membership is now active! All dares and premium features are unlocked.');
                    }
                }

                if (data.partner1) set({ partner1: data.partner1 });
                if (data.partner2) set({ partner2: data.partner2 });
            };

            profileChannel = supabase
                .channel(`profile-${userId}`)
                .on('broadcast', { event: 'user_updated' }, (payload) => {
                    handleProfileUpdate(payload?.payload);
                })
                .on('broadcast', { event: 'pro_status_changed' }, (payload) => {
                    handleProfileUpdate(payload?.payload);
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, (payload) => {
                    handleProfileUpdate(payload.new);
                })
                .subscribe();

            // 2. Scores Listener (Self)
            scoreChannel = supabase
                .channel(`scores-${userId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'game_scores', filter: `user_id=eq.${userId}` }, (payload) => {
                    const data = payload.new as any;
                    if (data) {
                        // Columns are partner1_score/partner2_score (see
                        // 20260712000100_rename_game_scores_columns.sql) — this
                        // listener reads the raw DB row, unlike api.ts's
                        // getScores()/addPoints() which translate at the boundary.
                        set({ scores: { partner1: data.partner1_score || 0, partner2: data.partner2_score || 0 } });
                    }
                })
                .subscribe();

            // 3. Game History Listener (Self)
            historyChannel = supabase
                .channel(`history-${userId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_history', filter: `user_id=eq.${userId}` }, (payload) => {
                    const entry = {
                        id: payload.new.id,
                        date: payload.new.created_at,
                        card: payload.new.card,
                        winner: payload.new.winner,
                        proofUri: payload.new.proof_uri
                    };
                    set(state => ({ history: [entry, ...state.history].slice(0, 50) }));
                })
                .subscribe();

            // 4. Daily Responses Listener (Current Question)
            const questionId = get().dailyQuestion.id;
            dailyChannel = supabase
                .channel(`daily-${questionId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_responses', filter: `question_id=eq.${questionId}` }, async (payload) => {
                    const data = payload.new as any;
                    if (!data) return;

                    if (data.user_id === userId) {
                        set(state => ({ dailyQuestion: { ...state.dailyQuestion, myResponse: data.response } }));
                    } else {
                        // If it's not me, it's likely my partner (in LDR or shared profile mode)
                        set(state => ({ dailyQuestion: { ...state.dailyQuestion, partnerResponse: data.response } }));
                    }
                })
                .subscribe();
        });
    },

    cleanupRealtimeListeners: () => {
        get().cleanupRoomListeners(); // Also cleanup room if active
        if (configUnsubscribe) {
            configUnsubscribe();
            configUnsubscribe = null;
        }
        import('../services/supabase').then(({ supabase }) => {
            if (profileChannel) supabase.removeChannel(profileChannel);
            if (scoreChannel) supabase.removeChannel(scoreChannel);
            if (historyChannel) supabase.removeChannel(historyChannel);
            if (dailyChannel) supabase.removeChannel(dailyChannel);

            profileChannel = null;
            scoreChannel = null;
            historyChannel = null;
            dailyChannel = null;
        });
    },

    setupRoomListeners: (roomCode: string) => {
        if (!roomCode) return;
        get().cleanupRoomListeners();

        import('../services/supabase').then(({ supabase }) => {
            // 1. Room Data Listener (Current Card, Scores, Turn)
            roomChannel = supabase
                .channel(`room-${roomCode}`)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` }, (payload) => {
                    if (__DEV__) console.log('🔄 Room Realtime Update:', payload.new);
                    // This updates the local view of the room (used in LDR screen)
                    // We don't store the full Room object in useStore yet, 
                    // but we can trigger a re-fetch or update specific fields if needed.
                })
                .subscribe();

            // 2. Chat Message Listener
            chatChannel = supabase
                .channel(`chat-${roomCode}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_code=eq.${roomCode}` }, (payload) => {
                    if (__DEV__) console.log('💬 New Chat Message:', payload.new);
                    // Could maintain a local chat buffer here if needed
                })
                .subscribe();
        });
    },

    cleanupRoomListeners: () => {
        import('../services/supabase').then(({ supabase }) => {
            if (roomChannel) supabase.removeChannel(roomChannel);
            if (chatChannel) supabase.removeChannel(chatChannel);
            roomChannel = null;
            chatChannel = null;
        });
    },

    hydrate: async () => {
        try {
            // Batch read all local keys at once for ultra-fast instant startup (<10ms)
            const keys = [
                '@Rumbala_names', '@Rumbala_mode', '@Rumbala_vibe',
                '@Rumbala_card_count', '@Rumbala_last_claim', '@Rumbala_scores',
                '@Rumbala_history', '@Rumbala_last_paywall_shown', '@Rumbala_room_id',
                '@Rumbala_is_pro', '@Rumbala_pro_expires_at', '@Rumbala_streak_count', '@Rumbala_last_active',
                '@Rumbala_milestones', '@Rumbala_daily_answer', '@Rumbala_onboarding_seen',
                '@Rumbala_subscription_seen', '@Rumbala_notifications_enabled',
                '@Rumbala_auth', '@Rumbala_userId', '@Rumbala_userEmail',
                '@Rumbala_gender', '@Rumbala_relationship_status', '@Rumbala_app_purpose',
            ];
            const results = await AsyncStorage.multiGet(keys);
            const cache: Record<string, string | null> = {};
            for (const [key, value] of results) {
                cache[key] = value;
            }

            // 1. Instantly restore all UI state from local cache
            const namesJson = cache['@Rumbala_names'];
            if (namesJson) {
                try {
                    const { partner1, partner2 } = JSON.parse(namesJson);
                    set({ partner1, partner2 });
                } catch (e) {}
            }

            if (cache['@Rumbala_gender']) set({ gender: cache['@Rumbala_gender'] });
            if (cache['@Rumbala_relationship_status']) set({ relationshipStatus: cache['@Rumbala_relationship_status'] });
            if (cache['@Rumbala_app_purpose']) set({ appPurpose: cache['@Rumbala_app_purpose'] });

            const proExp = cache['@Rumbala_pro_expires_at'];
            const isProCached = cache['@Rumbala_is_pro'] === 'true';
            const isProActive = Boolean(isProCached && (!proExp || new Date(proExp).getTime() > Date.now()));
            set({ isPro: isProActive, proExpiresAt: proExp || null });
            if (cache['@Rumbala_mode']) set({ mode: cache['@Rumbala_mode'] as 'local' | 'ldr' });
            if (cache['@Rumbala_vibe']) set({ selectedVibe: cache['@Rumbala_vibe'] });
            if (cache['@Rumbala_card_count']) set({ cardCount: parseInt(cache['@Rumbala_card_count']!, 10) || 0 });
            if (cache['@Rumbala_last_claim']) set({ lastFreeClaimDate: cache['@Rumbala_last_claim'] });
            if (cache['@Rumbala_scores']) {
                try { set({ scores: JSON.parse(cache['@Rumbala_scores']!) }); } catch {}
            }
            if (cache['@Rumbala_history']) {
                try { set({ history: JSON.parse(cache['@Rumbala_history']!).slice(0, 50) }); } catch {}
            }
            if (cache['@Rumbala_last_paywall_shown']) set({ lastPaywallShown: cache['@Rumbala_last_paywall_shown'] });
            if (cache['@Rumbala_room_id']) set({ roomId: cache['@Rumbala_room_id'] });
            if (cache['@Rumbala_streak_count']) set({ streak: parseInt(cache['@Rumbala_streak_count']!, 10) || 0 });
            if (cache['@Rumbala_last_active']) set({ lastActiveDate: cache['@Rumbala_last_active'] });
            if (cache['@Rumbala_milestones']) {
                try { set({ milestones: JSON.parse(cache['@Rumbala_milestones']!) }); } catch {}
            }
            if (cache['@Rumbala_daily_answer']) {
                try {
                    const { date, response } = JSON.parse(cache['@Rumbala_daily_answer']!);
                    if (date === new Date().toISOString().split('T')[0]) {
                        set(state => ({ dailyQuestion: { ...state.dailyQuestion, myResponse: response } }));
                    }
                } catch {}
            }

            if (cache['@Rumbala_onboarding_seen'] === 'true') set({ hasSeenOnboarding: true });
            if (cache['@Rumbala_subscription_seen'] === 'true') set({ hasSeenSubscription: true });
            if (cache['@Rumbala_notifications_enabled'] === 'true') set({ notificationsEnabled: true });

            // Restore cached auth credentials immediately so user doesn't see a loading spinner
            const isCachedAuth = cache['@Rumbala_auth'] === 'true';
            const cachedUid = cache['@Rumbala_userId'] || null;
            const cachedEmail = cache['@Rumbala_userEmail'] || null;

            set({
                userId: cachedUid,
                userEmail: cachedEmail,
                isAuthenticated: isCachedAuth,
                isAuthChecked: true,
                hasHydrated: true,
            });

            // 2. Run remote network checks in parallel background (non-blocking)
            (async () => {
                try {
                    const { supabase } = await import('../services/supabase');
                    const { data: { session } } = await supabase.auth.getSession();

                    if (session?.user?.user_metadata) {
                        const meta = session.user.user_metadata;
                        const currentGender = get().gender;
                        const currentRel = get().relationshipStatus;
                        const currentPurpose = get().appPurpose;
                        
                        if (!currentGender && meta.gender) {
                            set({ gender: meta.gender });
                            AsyncStorage.setItem('@Rumbala_gender', meta.gender);
                        }
                        if (!currentRel && meta.relationship_status) {
                            set({ relationshipStatus: meta.relationship_status });
                            AsyncStorage.setItem('@Rumbala_relationship_status', meta.relationship_status);
                        }
                        if (!currentPurpose && meta.app_purpose) {
                            set({ appPurpose: meta.app_purpose });
                            AsyncStorage.setItem('@Rumbala_app_purpose', meta.app_purpose);
                        }
                    }

                    // Background remote config fetch & subscribe
                    get().fetchRemoteConfigs().catch(() => {});
                    if (!configUnsubscribe) {
                        configUnsubscribe = subscribeToRemoteConfigs((updated) => {
                            get().setRemoteConfigs(updated);
                        });
                    }

                    if (session?.user) {
                        const uid = session.user.id;
                        const email = session.user.email || null;
                        set({ userId: uid, userEmail: email, isAuthenticated: true, isAuthChecked: true });
                        AsyncStorage.setItem('@Rumbala_userId', uid).catch(() => {});
                        if (email) AsyncStorage.setItem('@Rumbala_userEmail', email).catch(() => {});
                        AsyncStorage.setItem('@Rumbala_auth', 'true').catch(() => {});
                        get().syncWithSupabase().catch(() => {});
                        get().setupRealtimeListeners();
                    } else if (!isCachedAuth) {
                        set({ isAuthChecked: true, isAuthenticated: false, userId: null, userEmail: null });
                        AsyncStorage.setItem('@Rumbala_auth', 'false').catch(() => {});
                    }
                } catch (e) {
                    if (__DEV__) console.warn('[Hydrate Background Sync] Error:', e);
                }
            })();

        } catch (e) {
            console.error('Failed to hydrate state', e);
            set({ hasHydrated: true, isAuthChecked: true });
        }
    }
}));
