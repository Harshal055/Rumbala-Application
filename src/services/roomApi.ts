/**
 * API Wrappers for LDR Room & Game Functions
 * Uses Supabase REST API via the api service
 */

import { DareCard } from '../constants/cards';
import * as apiService from './api';

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

// Per-room interval handles — keyed by room code to prevent ghost polling
const roomSubscribers = new Map<string, ReturnType<typeof setInterval>>();
const chatSubscribers = new Map<string, ReturnType<typeof setInterval>>();

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
    }
    const chatSub = chatSubscribers.get(roomCode);
    if (chatSub) {
        clearInterval(chatSub);
        chatSubscribers.delete(roomCode);
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
    // Bug Fix: Clear any existing subscriber for THIS room only (not all rooms)
    const existing = roomSubscribers.get(roomCode);
    if (existing) {
        clearInterval(existing);
        roomSubscribers.delete(roomCode);
    }

    // Initial fetch
    getRoomDataV2(roomCode).then(data => {
        if (data) callback(data);
    }).catch(() => { /* initial fetch failed, polling will retry */ });

    // Poll periodically — each tick is wrapped in try/catch so transient
    // network errors don't kill the subscription
    const intervalId = setInterval(async () => {
        try {
            const data = await getRoomDataV2(roomCode);
            if (data) callback(data);
        } catch (e) {
            // Silently retry on next tick
        }
    }, POLL_INTERVAL_MS);

    roomSubscribers.set(roomCode, intervalId);

    // Return unsubscribe function that cleans up ONLY this room's interval
    return () => {
        const id = roomSubscribers.get(roomCode);
        if (id) {
            clearInterval(id);
            roomSubscribers.delete(roomCode);
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
    // Bug Fix: Clear any existing subscriber for THIS room only
    const existing = chatSubscribers.get(roomCode);
    if (existing) {
        clearInterval(existing);
        chatSubscribers.delete(roomCode);
    }

    // Initial fetch
    getChatMessagesV2(roomCode).then(messages => {
        callback(messages);
    }).catch(() => { /* initial fetch failed, polling will retry */ });

    // Poll periodically
    const intervalId = setInterval(async () => {
        try {
            const messages = await getChatMessagesV2(roomCode);
            callback(messages);
        } catch (e) {
            // Silently retry on next tick
        }
    }, POLL_INTERVAL_MS);

    chatSubscribers.set(roomCode, intervalId);

    // Return unsubscribe function that cleans up ONLY this room's interval
    return () => {
        const id = chatSubscribers.get(roomCode);
        if (id) {
            clearInterval(id);
            chatSubscribers.delete(roomCode);
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

