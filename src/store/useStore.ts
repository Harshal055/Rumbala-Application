import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DareCard, CARDS } from '../constants/cards';
import { 
    getUserCards, addUserCards, getProfile, updateProfile, 
    addPoints as apiAddPoints, getScores as apiGetScores, 
    claimWeeklyFreeCards, getHistory as apiGetHistory, 
    addHistoryEntry as apiAddHistoryEntry, syncCardCount, ensureProfileExists 
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

    // Game Mode & Vibe
    mode: 'local' | 'ldr' | null;
    setMode: (mode: 'local' | 'ldr') => void;
    selectedVibe: string | null;
    setSelectedVibe: (vibe: string | null) => void;

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
    setIsPro: (isPro: boolean) => void;

    // Cards State \u2014 count-based
    cardCount: number;
    setCardCount: (count: number) => void;
    cards: DareCard[];
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

export const useStore = create<ApplicationState>((set, get) => ({
    hasHydrated: false,
    isAuthChecked: false,
    setHasHydrated: (state) => set({ hasHydrated: state }),

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
        }
    },
    isHost: false,
    setIsHost: (isHost) => set({ isHost }),

    isPro: false,
    setIsPro: (isPro) => {
        set({ isPro });
        AsyncStorage.setItem('@Rumbala_is_pro', isPro ? 'true' : 'false');
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
    fetchCards: async () => {
        try {
            const api = await import('../services/api');
            const data = await api.getCmsCards(); // I need to add this to api.ts
            if (data) set({ cards: data });
        } catch (e) { console.warn('Card fetch failed', e); }
    },

    drawCard: (vibeFilter?: string | null) => {
        const { cardCount, isPro, cards, mode } = get();
        if (!isPro && cardCount <= 0) return null;

        let pool = (cards && cards.length > 0) ? cards : CARDS; 
        
        // 🔒 Mode & Vibe Enforcement
        if (vibeFilter === 'ldr') {
            // Specifically requested LDR cards
            pool = pool.filter(c => c.type === 'ldr');
        } else if (mode === 'ldr') {
            // In LDR mode, only show LDR cards, but respect vibe (fun/romantic/spicy)
            pool = pool.filter(c => c.type === 'ldr');
            if (vibeFilter && vibeFilter !== 'all') {
                pool = pool.filter(c => c.vibe === vibeFilter);
            }
        } else {
            // In Together mode, exclude LDR cards unless specifically filtered (handled above)
            pool = pool.filter(c => c.type !== 'ldr');
            if (vibeFilter && vibeFilter !== 'all') {
                pool = pool.filter(c => (get().roomId ? c.vibe : c.type) === vibeFilter);
            }
        }

        if (pool.length === 0) return null;

        const drawn = pool[Math.floor(Math.random() * pool.length)];

        if (!isPro) {
            const newCount = cardCount - 1;
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
                if (Object.keys(updates).length > 0) {
                    await updateProfile(userId, updates);
                }
                if (profile.partner1) set({ partner1: profile.partner1 });
                if (profile.partner2) set({ partner2: profile.partner2 });
                if (profile.card_count !== undefined) {
                    set({ cardCount: profile.card_count });
                    await AsyncStorage.setItem('@Rumbala_card_count', String(profile.card_count));
                }
                if (profile.is_pro !== undefined) {
                    set({ isPro: profile.is_pro });
                    await AsyncStorage.setItem('@Rumbala_is_pro', profile.is_pro ? 'true' : 'false');
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
                }));
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
        const updatedHistory = [entry, ...get().history];
        set({ history: updatedHistory });
        AsyncStorage.setItem('@Rumbala_history', JSON.stringify(updatedHistory));
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
            // 1. Profile Listener (Self)
            profileChannel = supabase
                .channel(`profile-${userId}`)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, (payload) => {
                    const data = payload.new as any;
                    if (data.card_count !== undefined) {
                        set({ cardCount: data.card_count });
                        AsyncStorage.setItem('@Rumbala_card_count', String(data.card_count));
                    }
                    if (data.is_pro !== undefined) {
                        set({ isPro: data.is_pro });
                        AsyncStorage.setItem('@Rumbala_is_pro', data.is_pro ? 'true' : 'false');
                    }
                    if (data.partner1) set({ partner1: data.partner1 });
                    if (data.partner2) set({ partner2: data.partner2 });
                })
                .subscribe();

            // 2. Scores Listener (Self)
            scoreChannel = supabase
                .channel(`scores-${userId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'game_scores', filter: `user_id=eq.${userId}` }, (payload) => {
                    const data = payload.new as any;
                    if (data) {
                        set({ scores: { partner1: data.partner1 || 0, partner2: data.partner2 || 0 } });
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
                    set(state => ({ history: [entry, ...state.history].slice(0, 100) }));
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
                    console.log('🔄 Room Realtime Update:', payload.new);
                    // This updates the local view of the room (used in LDR screen)
                    // We don't store the full Room object in useStore yet, 
                    // but we can trigger a re-fetch or update specific fields if needed.
                })
                .subscribe();

            // 2. Chat Message Listener
            chatChannel = supabase
                .channel(`chat-${roomCode}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_code=eq.${roomCode}` }, (payload) => {
                    console.log('💬 New Chat Message:', payload.new);
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
            const namesJson = await AsyncStorage.getItem('@Rumbala_names');
            const modeStr = await AsyncStorage.getItem('@Rumbala_mode') as 'local' | 'ldr' | null;
            const vibeStr = await AsyncStorage.getItem('@Rumbala_vibe');
            const cardCountStr = await AsyncStorage.getItem('@Rumbala_card_count');
            const lastClaim = await AsyncStorage.getItem('@Rumbala_last_claim');
            const scoresJson = await AsyncStorage.getItem('@Rumbala_scores');
            const historyJson = await AsyncStorage.getItem('@Rumbala_history');
            const lastPaywallShownStr = await AsyncStorage.getItem('@Rumbala_last_paywall_shown');
            const roomIdStr = await AsyncStorage.getItem('@Rumbala_room_id');

            const { supabase } = await import('../services/supabase');
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                const uid = session.user.id;
                const email = session.user.email || null;
                set({ userId: uid, userEmail: email, isAuthenticated: true, isAuthChecked: true });
                AsyncStorage.setItem('@Rumbala_userId', uid);
                if (email) AsyncStorage.setItem('@Rumbala_userEmail', email);
                AsyncStorage.setItem('@Rumbala_auth', 'true');
                await get().syncWithSupabase();
                get().setupRealtimeListeners();
            } else {
                set({ isAuthChecked: true, isAuthenticated: false, userId: null, userEmail: null });
                AsyncStorage.setItem('@Rumbala_auth', 'false');
            }

            if (namesJson) {
                try {
                    const { partner1, partner2 } = JSON.parse(namesJson);
                    set({ partner1, partner2 });
                } catch (e) {
                    console.warn('Failed to parse stored names', e);
                }
            }

            const isProStr = await AsyncStorage.getItem('@Rumbala_is_pro');
            if (isProStr === 'true') set({ isPro: true });
            if (modeStr) set({ mode: modeStr });
            if (vibeStr) set({ selectedVibe: vibeStr });
            if (cardCountStr) set({ cardCount: parseInt(cardCountStr, 10) || 0 });
            if (lastClaim) set({ lastFreeClaimDate: lastClaim });
            if (scoresJson) set({ scores: JSON.parse(scoresJson) });
            if (historyJson) set({ history: JSON.parse(historyJson) });
            if (lastPaywallShownStr) set({ lastPaywallShown: lastPaywallShownStr });
            if (roomIdStr) set({ roomId: roomIdStr });

            const streakStr = await AsyncStorage.getItem('@Rumbala_streak_count');
            const lastActiveStr = await AsyncStorage.getItem('@Rumbala_last_active');
            const milestonesJson = await AsyncStorage.getItem('@Rumbala_milestones');
            const dailyAnswer = await AsyncStorage.getItem('@Rumbala_daily_answer');

            if (streakStr) set({ streak: parseInt(streakStr, 10) });
            if (lastActiveStr) set({ lastActiveDate: lastActiveStr });
            if (milestonesJson) set({ milestones: JSON.parse(milestonesJson) });
            if (dailyAnswer) {
                const { date, response } = JSON.parse(dailyAnswer);
                if (date === new Date().toISOString().split('T')[0]) {
                    set(state => ({ dailyQuestion: { ...state.dailyQuestion, myResponse: response } }));
                }
            }

            const onboardingSeen = await AsyncStorage.getItem('@Rumbala_onboarding_seen');
            if (onboardingSeen === 'true') set({ hasSeenOnboarding: true });

            const subscriptionSeen = await AsyncStorage.getItem('@Rumbala_subscription_seen');
            if (subscriptionSeen === 'true') set({ hasSeenSubscription: true });

            const notificationsEnabled = await AsyncStorage.getItem('@Rumbala_notifications_enabled');
            if (notificationsEnabled === 'true') set({ notificationsEnabled: true });

        } catch (e) {
            console.error('Failed to hydrate state', e);
        } finally {
            set({ hasHydrated: true });
        }
    }
}));
