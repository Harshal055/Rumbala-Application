import React from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, Image, StatusBar, Platform, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';

import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';

const { width } = Dimensions.get('window');

const BG_COLORS = ['#EEF2FF', '#E0E7FF', '#C7D2FE'];

export default function ChatsScreen() {
    const router = useRouter();
    const { roomId, partner1, partner2, dailyQuestion } = useStore(useShallow(state => ({
        roomId: state.roomId,
        partner1: state.partner1,
        partner2: state.partner2,
        dailyQuestion: state.dailyQuestion
    })));

    const partnerName = partner2 || partner1 || 'Partner';
    const hasAnswered = !!dailyQuestion.myResponse;
    const partnerAnswered = !!dailyQuestion.partnerResponse;

    const renderHeader = () => (
        <View style={{ marginBottom: 10 }}>
            {/* Daily Question Billboard */}
            <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                <TouchableOpacity 
                    style={[styles.billboard, glassStyles.container]} 
                    activeOpacity={0.9}
                    onPress={() => router.push('/(tabs)/daily')}
                >
                    <LinearGradient 
                        colors={['#FF6B35', '#FF1493']} 
                        style={StyleSheet.absoluteFill} 
                        start={{ x: 0, y: 0 }} 
                        end={{ x: 1, y: 1 }} 
                    />
                    <View style={styles.billboardContent}>
                        <View style={styles.billboardIcon}>
                            <Ionicons name="chatbubbles" size={24} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.billboardTitle}>DAILY QUESTION</Text>
                            <Text style={styles.billboardText} numberOfLines={1}>{dailyQuestion.text}</Text>
                            <Text style={styles.billboardStatus}>
                                {hasAnswered 
                                    ? (partnerAnswered ? "Both answered! 💏" : "Waiting for partner... ⏳") 
                                    : "Tap to answer today's question 💌"}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Section Label */}
            <Text style={styles.sectionLabel}>Messages</Text>
        </View>
    );

    const renderPartnerChat = () => {
        if (!roomId) return null;
        return (
            <Animated.View entering={FadeInRight.delay(200).duration(500)}>
                <TouchableOpacity 
                    style={[styles.chatItem, styles.partnerItem, glassStyles.container]} 
                    activeOpacity={0.7}
                    onPress={() => router.push(`/chat/${roomId}?name=${encodeURIComponent(partnerName)}`)}
                >
                    <View style={styles.avatarContainer}>
                        <LinearGradient colors={['#FF6B35', '#FF1493']} style={styles.avatarGradient}>
                            <Text style={styles.avatarInitial}>{partnerName[0]}</Text>
                        </LinearGradient>
                        <View style={styles.onlineDot} />
                    </View>
                    <View style={styles.chatInfo}>
                        <View style={styles.chatHeader}>
                            <Text style={styles.chatName}>{partnerName} 💏</Text>
                            <Text style={styles.chatTime}>Just now</Text>
                        </View>
                        <View style={styles.chatFooter}>
                            <Text style={[styles.chatMessage, { color: '#FF6B35', fontWeight: '700' }]} numberOfLines={1}>
                                {partnerAnswered ? "Answered the daily question!" : "Online and ready to play"}
                            </Text>
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>1</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const MOCK_DATA = roomId ? [] : [
        { id: '1', name: 'Sofia Benítez', message: 'Absolutely! I\'ve been practicing...', time: '10:45 AM', online: true, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100' },
        { id: '2', name: 'Design Squad 🎨', message: 'Marcus: The new mockups are...', time: '9:12 AM', online: false, image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=100' },
    ];

    interface ChatItemData {
        id: string;
        name: string;
        message: string;
        time: string;
        online: boolean;
        image: string;
    }

    const renderItem = ({ item, index }: { item: ChatItemData, index: number }) => (
        <Animated.View 
            entering={FadeInRight.delay(300 + index * 100).duration(500)}
            renderToHardwareTextureAndroid={true}
        >
            <TouchableOpacity 
                style={[styles.chatItem, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.3)' }]} 
                activeOpacity={0.7}
                onPress={() => router.push(`/chat/${item.id}?name=${encodeURIComponent(item.name)}`)}
            >
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: item.image }} style={styles.avatar} />
                    {item.online && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatName}>{item.name}</Text>
                        <Text style={styles.chatTime}>{item.time}</Text>
                    </View>
                    <View style={styles.chatFooter}>
                        <Text style={styles.chatMessage} numberOfLines={1}>{item.message}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />
                
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, glassStyles.header]}>
                    <TouchableOpacity style={[styles.menuBtn, glassStyles.container, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                        <Ionicons name="menu-outline" size={24} color="#FF6B35" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { fontFamily: 'Pacifico_400Regular' }]}>Rumbala</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={[styles.headerIconBtn, glassStyles.container]}>
                            <Ionicons name="notifications-outline" size={20} color="#5F6F81" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerIconBtn}>
                            <View style={styles.avatarMini}>
                               <Image source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100' }} style={styles.avatarMiniImg} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Chat List */}
                <FlatList
                    data={MOCK_DATA}
                    ListHeaderComponent={() => (
                        <>
                            {renderHeader()}
                            {renderPartnerChat()}
                        </>
                    )}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={8}
                    maxToRenderPerBatch={5}
                    windowSize={5}
                    removeClippedSubviews={Platform.OS === 'android'}
                />

                {/* FAB */}
                <TouchableOpacity 
                    style={styles.fab} 
                    activeOpacity={0.9}
                    onPress={() => router.push('/chat/new?name=New%20Conversation')}
                >
                    <LinearGradient colors={['#FF6B35', '#F5511E']} style={styles.fabGradient}>
                        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12
    },
    menuBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 24, color: '#1a1a1a' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    avatarMini: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: '#FF6B35' },
    avatarMiniImg: { width: '100%', height: '100%' },

    listContent: { paddingBottom: 120, paddingHorizontal: 16, paddingTop: 10 },
    
    // Billboard
    billboard: {
        borderRadius: 24, padding: 20, marginBottom: 20, overflow: 'hidden',
        minHeight: 110, justifyContent: 'center'
    },
    billboardContent: { flexDirection: 'row', alignItems: 'center', gap: 16, zIndex: 1 },
    billboardIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    billboardTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5, marginBottom: 4 },
    billboardText: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
    billboardStatus: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
    
    sectionLabel: { fontSize: 14, fontWeight: '800', color: '#1a1a1a', opacity: 0.4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },

    chatItem: {
        flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14,
        alignItems: 'center', borderRadius: 20, marginBottom: 12
    },
    partnerItem: {
        borderWidth: 2, borderColor: 'rgba(255, 107, 53, 0.3)', backgroundColor: 'rgba(255, 107, 53, 0.05)'
    },
    avatarContainer: { position: 'relative' },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.05)' },
    avatarGradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { color: '#fff', fontSize: 22, fontWeight: '900' },
    onlineDot: { 
        position: 'absolute', bottom: 2, right: 2, 
        width: 14, height: 14, borderRadius: 7, 
        backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#fff' 
    },
    chatInfo: { flex: 1, marginLeft: 15 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    chatName: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
    chatTime: { fontSize: 12, color: '#888', fontWeight: '600' },
    chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chatMessage: { fontSize: 14, color: '#666', flex: 1, marginRight: 10, fontWeight: '500' },
    unreadBadge: { 
        backgroundColor: '#FF6B35', minWidth: 20, height: 20, 
        borderRadius: 10, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 6
    },
    unreadText: { color: '#fff', fontSize: 11, fontWeight: '900' },

    fab: { 
        position: 'absolute', bottom: 30, right: 30,
        elevation: 0, shadowColor: 'rgba(255, 107, 53, 0.4)', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10
    },
    fabGradient: { 
        width: 60, height: 60, borderRadius: 30, 
        alignItems: 'center', justifyContent: 'center',
    },
});
