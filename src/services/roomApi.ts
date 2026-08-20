/**
 * API Wrappers for LDR Room & Game Functions
 * Uses Supabase REST API via the api service
 */

import { DareCard } from '../constants/cards';
import * as apiService from './api';
import { supabase } from './supabase';

export interface VideoReactionEvent {
    emoji: string;
    senderName?: string;
    senderId?: string;
    timestamp: number;
}

export interface ChatMessage {
    id: number;
    room_code: string;
    sender_user_id: string;
    sender: string;
    text: string;
    created_at: string;
}

export interface RoomData {
    code: string;
    host_user_id: string;
    host_name: string;
    guest_user_id?: string;
    guest_name?: string;
    current_card?: DareCard | null;
    host_score: number;
    guest_score: number;
    room_type: 'video' | 'normal';
    current_turn_user_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Per-room interval handles and callbacks — keyed by room code
const roomSubscribers = new Map<string, ReturnType<typeof setInterval>>();
const chatSubscribers = new Map<string, ReturnType<typeof setInterval>>();
const roomCallbacks = new Map<string, Array<(data: RoomData) => void>>();
const chatCallbacks = new Map<string, Array<(messages: ChatMessage[]) => void>>();

// ===== ROOM MANAGEMENT =====

/**
 * Create a new LDR room
 * @returns room code (6 characters)
 */
export const createLdrRoomV2 = async (hostUserId: string, hostName: string, roomType: 'video' | 'normal' = 'video'): Promise<string> => {
    const roomData = await apiService.createRoom(hostUserId, hostName, roomType);
    if (!roomData?.code) {
        throw new Error('Room creation failed — no code returned from server');
    }
    return roomData.code;
};

/**
 * Join an existing LDR room
 */
export const joinLdrRoomV2 = async (
    roomCode: string,
    guestUserId: string,
    guestName: string
): Promise<void> => {
    try {
        await apiService.joinRoom(roomCode, guestUserId, guestName);
    } catch (error: any) {
        console.warn('Failed to join room:', error?.message);
        throw error; // Propagate the specific error message
    }
};

/**
 * Get current room data
 */
export const getRoomDataV2 = async (roomCode: string): Promise<RoomData | null> => {
    try {
        const roomData = await apiService.getRoomData(roomCode);
        return roomData ?? null;
    } catch (error: any) {
        console.warn('Failed to get room data:', error?.message);
        return null;
    }
};

/**
 * Sync a drawn card to the room
 */
export const syncDrawnCardV2 = async (roomCode: string, card: DareCard) => {
    await apiService.syncCard(roomCode, card);
};

/**
 * Update room score and rotate turn
 */
export const updateRoomScoreV2 = async (roomCode: string, hostScore: number, guestScore: number, nextTurnUserId?: string) => {
    await apiService.updateRoomScores(roomCode, hostScore, guestScore, nextTurnUserId);
};

/**
 * Clear the current card from room
 */
export const clearRoomCardV2 = async (roomCode: string) => {
    await apiService.syncCard(roomCode, null);
};

/**
 * Delete a room and its messages
 */
export const deleteRoomV2 = async (roomCode: string) => {
    try {
        await apiService.deleteRoomV2(roomCode);
    } catch (error: any) {
        console.warn('Failed to delete room:', error?.message);
    }

    // Bug Fix: Clean up per-room subscriptions using Maps
    const roomSub = roomSubscribers.get(roomCode);
    if (roomSub) {
        clearInterval(roomSub);
        roomSubscribers.delete(roomCode);
        roomCallbacks.delete(roomCode);
    }
    const chatSub = chatSubscribers.get(roomCode);
    if (chatSub) {
        clearInterval(chatSub);
        chatSubscribers.delete(roomCode);
        chatCallbacks.delete(roomCode);
    }
};

// ===== CHAT MANAGEMENT =====

/**
 * Send a chat message in a room
 */
export const sendChatMessageV2 = async (
    roomCode: string,
    senderUserId: string,
    sender: string,
    text: string
) => {
    try {
        await apiService.sendMessage(roomCode, senderUserId, sender, text);
    } catch (error: any) {
        console.warn('Failed to send chat message:', error?.message);
    }
};

/**
 * Get chat messages for a room
 */
export const getChatMessagesV2 = async (
    roomCode: string,
    limit = 50,
    offset = 0
): Promise<ChatMessage[]> => {
    try {
        const response = await apiService.getMessages(roomCode, limit, offset);
        // response can be an array directly or undefined
        return Array.isArray(response) ? response : [];
    } catch (error: any) {
        console.warn('Failed to fetch chat messages:', error?.message);
        return [];
    }
};

// ===== POLLING-BASED SUBSCRIPTIONS =====
// Since we don't have WebSocket support yet, we use polling to simulate real-time updates

const POLL_INTERVAL_MS = 2500; // Optimized: Poll every 2.5s instead of 1s to save battery/network

/**
 * Subscribe to room updates (polls every 2.5 seconds)
 * Returns an unsubscribe function
 */
export const subscribeToRoomV2 = (
    roomCode: string,
    callback: (data: RoomData) => void
): (() => void) => {
    if (!roomCallbacks.has(roomCode)) {
        roomCallbacks.set(roomCode, []);
    }
    roomCallbacks.get(roomCode)!.push(callback);

    // Initial fetch
    getRoomDataV2(roomCode).then(data => {
        if (data) callback(data);
    }).catch(() => { /* initial fetch failed, polling will retry */ });

    // Poll periodically
    if (!roomSubscribers.has(roomCode)) {
        const intervalId = setInterval(async () => {
            try {
                const data = await getRoomDataV2(roomCode);
                if (data) {
                    const cbs = roomCallbacks.get(roomCode) || [];
                    cbs.forEach(cb => cb(data));
                }
            } catch (e) {
                // Silently retry on next tick
            }
        }, POLL_INTERVAL_MS);
        roomSubscribers.set(roomCode, intervalId);
    }

    // Return unsubscribe function
    return () => {
        const cbs = roomCallbacks.get(roomCode) || [];
        const index = cbs.indexOf(callback);
        if (index > -1) cbs.splice(index, 1);
        
        if (cbs.length === 0) {
            const id = roomSubscribers.get(roomCode);
            if (id) {
                clearInterval(id);
                roomSubscribers.delete(roomCode);
            }
            roomCallbacks.delete(roomCode);
        }
    };
};

/**
 * Subscribe to chat messages (polls every 2.5 seconds)
 * Returns an unsubscribe function
 */
export const subscribeToChatV2 = (
    roomCode: string,
    callback: (messages: ChatMessage[]) => void
): (() => void) => {
    if (!chatCallbacks.has(roomCode)) {
        chatCallbacks.set(roomCode, []);
    }
    chatCallbacks.get(roomCode)!.push(callback);

    // Initial fetch
    getChatMessagesV2(roomCode).then(messages => {
        callback(messages);
    }).catch(() => { /* initial fetch failed, polling will retry */ });

    // Poll periodically
    if (!chatSubscribers.has(roomCode)) {
        const intervalId = setInterval(async () => {
            try {
                const messages = await getChatMessagesV2(roomCode);
                const cbs = chatCallbacks.get(roomCode) || [];
                cbs.forEach(cb => cb(messages));
            } catch (e) {
                // Silently retry on next tick
            }
        }, POLL_INTERVAL_MS);
        chatSubscribers.set(roomCode, intervalId);
    }

    // Return unsubscribe function
    return () => {
        const cbs = chatCallbacks.get(roomCode) || [];
        const index = cbs.indexOf(callback);
        if (index > -1) cbs.splice(index, 1);

        if (cbs.length === 0) {
            const id = chatSubscribers.get(roomCode);
            if (id) {
                clearInterval(id);
                chatSubscribers.delete(roomCode);
            }
            chatCallbacks.delete(roomCode);
        }
    };
};

// ===== GAME HISTORY & SCORES =====

/**
 * Add a history entry for a completed dare
 */
export const addGameHistoryV2 = async (
    userId: string,
    card: DareCard,
    winner: 'partner1' | 'partner2'
) => {
    await apiService.addHistoryEntry(userId, card, winner);
};

/**
 * Get game history
 */
export const getGameHistoryV2 = async (userId: string, limit = 100, offset = 0) => {
    return await apiService.getHistory(userId, limit, offset);
};

/**
 * Add points to a partner's score
 */
export const addPointsV2 = async (
    userId: string,
    winner: 'partner1' | 'partner2',
    points: number
) => {
    await apiService.addPoints(userId, winner, points);
};

/**
 * Get current scores
 */
export const getScoresV2 = async (userId: string) => {
    return await apiService.getScores(userId);
};

/**
 * Get game statistics
 */
export const getGameStatsV2 = async (userId: string) => {
    return await apiService.getGameStats(userId);
};

// ===== VIDEO CALL REALTIME REACTIONS =====

const reactionChannels = new Map<string, any>();

/**
 * Subscribe to real-time emoji reactions in an LDR room
 */
export const subscribeToReactionsV2 = (
    roomCode: string,
    onReaction: (event: VideoReactionEvent) => void
) => {
    const code = roomCode.trim().toUpperCase();
    const channelName = `reactions_${code}`;

    if (reactionChannels.has(code)) {
        try {
            supabase.removeChannel(reactionChannels.get(code));
        } catch { }
        reactionChannels.delete(code);
    }

    const channel = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
    });

    channel
        .on('broadcast', { event: 'reaction' }, ({ payload }: { payload: VideoReactionEvent }) => {
            if (payload && payload.emoji) {
                onReaction(payload);
            }
        })
        .subscribe();

    reactionChannels.set(code, channel);

    return () => {
        try {
            supabase.removeChannel(channel);
        } catch { }
        reactionChannels.delete(code);
    };
};

/**
 * Broadcast an emoji reaction to the room
 */
export const sendReactionV2 = async (
    roomCode: string,
    emoji: string,
    senderName?: string,
    senderId?: string
) => {
    const code = roomCode.trim().toUpperCase();
    const channelName = `reactions_${code}`;

    let channel = reactionChannels.get(code);
    if (!channel) {
        channel = supabase.channel(channelName);
        channel.subscribe();
        reactionChannels.set(code, channel);
    }

    try {
        await channel.send({
            type: 'broadcast',
            event: 'reaction',
            payload: {
                emoji,
                senderName,
                senderId,
                timestamp: Date.now(),
            },
        });
    } catch (e) {
        console.warn('Failed to broadcast reaction:', e);
    }
};

// ===== NUDGE PARTNER =====

/**
 * Sends a push "nudge" to the other member of the room.
 * Looks up the partner's Expo push token via a secure RPC (caller must be a
 * room member), then delivers through Expo's push service.
 * Throws a user-friendly Error if the partner can't be reached.
 */
export const sendNudgeV2 = async (roomCode: string, fromName?: string): Promise<void> => {
    const code = roomCode.trim().toUpperCase();

    const { data, error } = await supabase.rpc('get_room_partner_push_token', {
        p_room_code: code,
    });
    if (error) throw new Error(error.message || 'Could not reach your partner right now.');

    const row = Array.isArray(data) ? data[0] : data;
    const token: string | undefined = row?.partner_token;
    const partnerName: string = row?.partner_name || 'your partner';

    if (!token) {
        throw new Error(`${partnerName} hasn't enabled notifications yet, so they can't be nudged.`);
    }

    const sender = fromName || 'Your love';
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            to: token,
            sound: 'default',
            title: 'Rumbala 💌',
            body: `Your love is waiting for you in LDR Mode! 💌`,
            data: { screen: 'ldr', roomCode: code, type: 'nudge', from: sender },
            channelId: 'default',
            priority: 'high',
        }),
    });

    if (!response.ok) {
        throw new Error('The nudge could not be delivered. Please try again in a moment.');
    }
};


