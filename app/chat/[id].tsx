import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, StatusBar, Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { subscribeToChatV2, sendChatMessageV2, ChatMessage } from '../../src/services/roomApi';

export default function ChatScreen() {
    const { id, name } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { userId, partner1 } = useStore(useShallow(state => ({
        userId: state.userId,
        partner1: state.partner1
    })));

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const chatScrollRef = useRef<ScrollView>(null);

    // If 'id' is a room code, we can subscribe. 
    // For now, let's assume it's a room code for the demo.
    useEffect(() => {
        if (id && typeof id === 'string') {
            const unsubChat = subscribeToChatV2(id, (msgs) => {
                setChatMessages(msgs);
                setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
            });
            return () => unsubChat();
        }
    }, [id]);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !id || !userId) return;
        try {
            await sendChatMessageV2(id as string, userId, partner1 || 'Me', chatInput.trim());
            setChatInput('');
        } catch { }
    };

    return (
        <SafeAreaView style={c.chatContainer} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" />
            
            {/* Custom Header */}
            <View style={c.chatHeader}>
                <TouchableOpacity onPress={() => router.back()} style={c.headerBtn}>
                    <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
                </TouchableOpacity>
                <View style={c.headerUser}>
                    <View style={c.avatarWrap}>
                        <View style={c.avatarPlaceholder}>
                            <Text style={c.avatarInitial}>{(name as string || 'P')[0]}</Text>
                        </View>
                        <View style={c.statusDot} />
                    </View>
                    <View>
                        <Text style={c.headerNameText}>{name || 'Partner'}</Text>
                        <Text style={c.headerStatusText}>Online</Text>
                    </View>
                </View>
                <View style={c.headerActions}>
                    <TouchableOpacity style={c.headerBtn}><Ionicons name="call-outline" size={24} color="#5F6F81" /></TouchableOpacity>
                    <TouchableOpacity style={c.headerBtn}><Ionicons name="ellipsis-vertical" size={22} color="#5F6F81" /></TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                ref={chatScrollRef}
                style={c.messageList}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
            >
                <View style={c.dateWrapper}>
                    <View style={c.dateLine} />
                    <Text style={c.dateLabel}>TODAY</Text>
                    <View style={c.dateLine} />
                </View>

                {chatMessages.length === 0 ? (
                    <View style={c.emptyChat}>
                        <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ccc" />
                        <Text style={c.emptyText}>No messages yet. Say hi!</Text>
                    </View>
                ) : (
                    chatMessages.map((m) => {
                        const isMe = m.sender_user_id === userId;
                        const isSystem = m.sender?.includes('System');
                        return (
                            <View key={m.id} style={[
                                c.msgWrap, 
                                isMe ? c.msgMe : c.msgPartner,
                                isSystem && c.msgSystem
                            ]}>
                                {!isMe && !isSystem && (
                                    <View style={c.msgAvatarMini}>
                                        <View style={[c.avatarPlaceholder, { width: 24, height: 24, borderRadius: 12 }]} >
                                            <Text style={[c.avatarInitial, { fontSize: 10 }]}>{m.sender[0]}</Text>
                                        </View>
                                    </View>
                                )}
                                <View style={c.msgBody}>
                                    <View style={[
                                        c.bubble, 
                                        isMe ? c.bubbleMe : c.bubblePartner,
                                        isSystem && c.bubbleSystem
                                    ]}>
                                        <Text style={[
                                            c.msgText, 
                                            isMe ? c.textMe : c.textPartner,
                                            isSystem && c.textSystem
                                        ]}>
                                            {m.text}
                                        </Text>
                                    </View>
                                    <View style={c.timeRow}>
                                        <Text style={c.timeText}>
                                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                        {isMe && <Ionicons name="checkmark-done" size={14} color="#FF6B35" style={{ marginLeft: 4 }} />}
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                style={c.floatingInputArea}
            >
                <View style={[c.inputWrapper, { marginBottom: Math.max(insets.bottom, 12) }]}>
                    <TouchableOpacity style={c.inputIcon}><Ionicons name="happy-outline" size={24} color="#A1B0C1" /></TouchableOpacity>
                    <TextInput
                        style={c.input}
                        placeholder="Write a message..."
                        placeholderTextColor="#A1B0C1"
                        value={chatInput}
                        onChangeText={setChatInput}
                        multiline
                    />
                    <TouchableOpacity style={c.inputIcon}><Ionicons name="attach-outline" size={24} color="#A1B0C1" /></TouchableOpacity>
                    <TouchableOpacity style={c.inputIcon}><Ionicons name="camera-outline" size={24} color="#A1B0C1" /></TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={c.sendBtn} 
                        onPress={handleSendMessage}
                        disabled={!chatInput.trim()}
                    >
                        <LinearGradient colors={['#FF6B35', '#F5511E']} style={c.sendBtnG}>
                            <Ionicons name="send" size={18} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const c = StyleSheet.create({
    chatContainer: { flex: 1, backgroundColor: '#F8F9FA' },
    chatHeader: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        paddingHorizontal: 16, paddingVertical: 14, 
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
        elevation: 0, shadowColor: 'rgba(0,0,0,0.03)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3
    },
    headerBtn: { padding: 4 },
    headerUser: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 8 },
    avatarWrap: { position: 'relative', marginRight: 10 },
    avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFEFEA', justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { fontSize: 16, fontWeight: '700', color: '#FF6B35' },
    statusDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#fff' },
    headerNameText: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
    headerStatusText: { fontSize: 12, color: '#FF6B35', fontWeight: '600' },
    headerActions: { flexDirection: 'row', gap: 12 },

    messageList: { flex: 1 },
    dateWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 20, gap: 10 },
    dateLine: { height: 1, flex: 1, backgroundColor: '#EEE' },
    dateLabel: { fontSize: 11, fontWeight: '700', color: '#BBB', backgroundColor: '#F8F9FA', paddingHorizontal: 12, borderRadius: 10 },

    msgWrap: { flexDirection: 'row', marginBottom: 20, maxWidth: '85%' },
    msgMe: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    msgPartner: { alignSelf: 'flex-start' },
    msgSystem: { alignSelf: 'center', maxWidth: '90%', marginBottom: 10, flexDirection: 'column' },
    msgAvatarMini: { marginRight: 8, alignSelf: 'flex-end' },
    
    msgBody: { maxWidth: '100%' },
    bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, elevation: 0, shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    bubbleMe: { backgroundColor: '#FF6B35', borderBottomRightRadius: 2 },
    bubblePartner: { backgroundColor: '#fff', borderBottomLeftRadius: 2 },
    bubbleSystem: { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12, paddingVertical: 6, shadowOpacity: 0 },
    
    msgText: { fontSize: 15, lineHeight: 21 },
    textMe: { color: '#fff' },
    textPartner: { color: '#1a1a1a' },
    textSystem: { color: '#666', fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
    
    timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: 4 },
    timeText: { fontSize: 10, color: '#BBB', fontWeight: '500' },

    emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
    emptyText: { color: '#999', marginTop: 12, fontSize: 14 },

    floatingInputArea: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center', 
        backgroundColor: '#F3F5F7', borderRadius: 30, paddingHorizontal: 12, paddingVertical: 6
    },
    input: { flex: 1, maxHeight: 100, paddingHorizontal: 12, fontSize: 15, color: '#1a1a1a' },
    inputIcon: { padding: 8 },
    sendBtn: { marginLeft: 8, transform: [{ scale: 1.05 }] },
    sendBtnG: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 0, shadowColor: 'rgba(255, 107, 53, 0.3)', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
});
