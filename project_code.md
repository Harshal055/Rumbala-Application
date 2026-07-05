# Rumbala Project Code


## D:\Rumbala\app\(tabs)\chats.tsx
``tsx

import React from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, Image, StatusBar, Platform
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
``


## D:\Rumbala\app\(tabs)\daily.tsx
``tsx

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, KeyboardAvoidingView, Platform, StatusBar, useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, interpolate, Extrapolate } from 'react-native-reanimated';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';


const BG_COLORS = ['#FFF8F1', '#FFE4E1', '#FFF0F5']; // Warm and romantic daily base

export default function DailyRetentionScreen() {
    const { 
        streak, 
        dailyQuestion, 
        answerDailyQuestion, 
        refreshDailyResponses,
        milestones,
        partner1, partner2, isPro, cardCount
    } = useStore(useShallow(state => ({
        streak: state.streak,
        dailyQuestion: state.dailyQuestion,
        answerDailyQuestion: state.answerDailyQuestion,
        refreshDailyResponses: state.refreshDailyResponses,
        milestones: state.milestones,
        partner1: state.partner1,
        partner2: state.partner2,
        isPro: state.isPro,
        cardCount: state.cardCount
    })));

    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { width } = useWindowDimensions();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!!dailyQuestion.myResponse && !dailyQuestion.partnerResponse) {
            refreshDailyResponses(); 
            interval = setInterval(() => {
                refreshDailyResponses();
            }, 10000); 
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [dailyQuestion.myResponse, dailyQuestion.partnerResponse]);

    // Animations
    const fireScale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.4);

    useEffect(() => {
        fireScale.value = withRepeat(
            withSequence(
                withTiming(1.15, { duration: 800 }),
                withTiming(1, { duration: 800 })
            ), -1, true
        );
        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.8, { duration: 1500 }),
                withTiming(0.4, { duration: 1500 })
            ), -1, true
        );
    }, []);

    const fireStyle = useAnimatedStyle(() => ({
        transform: [{ scale: fireScale.value }]
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value
    }));

    const handleSubmit = async () => {
        if (!answer.trim()) return;
        setIsSubmitting(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await answerDailyQuestion(answer.trim());
        setIsSubmitting(false);
    };

    const hasAnswered = !!dailyQuestion.myResponse;

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />

                {/* ── Header ── */}
                <Animated.View 
                    entering={FadeInDown.delay(100).duration(600)} 
                    renderToHardwareTextureAndroid={true}
                    style={[styles.header, glassStyles.header]}
                >
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>Hey 👋</Text>
                        <Text style={styles.headerName}>
                            {(partner1 && partner2) ? `${partner1} & ${partner2}` : (partner1 || partner2 || 'Duo')}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity 
                            style={[styles.cardPill, isPro && styles.proCardPill, !isPro && glassStyles.container]} 
                            activeOpacity={0.8} 
                            onPress={() => useStore.getState().hydrate()}
                        >
                            <Ionicons name={isPro ? "diamond" : "albums-outline"} size={14} color={isPro ? "#FF66B2" : "#1a1a1a"} />
                            <Text style={[styles.cardPillText, isPro && styles.proCardPillText]}>
                                {isPro ? 'Pro Active' : cardCount}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
                
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* ── Streak Header ── */}
                    <Animated.View 
                        entering={FadeInDown.delay(200).duration(800)} 
                        renderToHardwareTextureAndroid={true}
                        style={styles.streakContainer}
                    >
                        <View style={[styles.streakCard, glassStyles.container]}>
                            <LinearGradient colors={['#FF6B35', '#FF1493']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                            <Animated.View style={[styles.streakGlow, glowStyle]} />
                            <Animated.View style={[styles.fireIcon, fireStyle]}>
                                <Ionicons name="flame" size={64} color="#FFE0B2" />
                            </Animated.View>
                            <View style={styles.streakInfo}>
                                <Text style={styles.streakTitle}>LOVE STREAK</Text>
                                <Text style={styles.streakCount}>{streak}</Text>
                                <Text style={styles.streakSub}>{streak > 0 ? "You're on fire! Keep it up." : "Start your streak today!"}</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* ── Daily Question ── */}
                    <View style={styles.section}>
                        <Animated.View 
                            entering={FadeInDown.delay(300).duration(600)} 
                            renderToHardwareTextureAndroid={true}
                            style={styles.sectionHeader}
                        >
                            <View style={[styles.sectionIcon, glassStyles.container]}>
                                <Ionicons name="chatbubbles" size={18} color="#FF1493" />
                            </View>
                            <Text style={styles.sectionTitle}>Daily Couple Question</Text>
                        </Animated.View>

                        <Animated.View 
                            entering={FadeInUp.delay(400).duration(600)} 
                            renderToHardwareTextureAndroid={true}
                            style={[styles.questionCard, glassStyles.container, hasAnswered && styles.questionCardAnswered]}
                        >
                            <Text style={styles.questionText}>{dailyQuestion.text}</Text>
                            
                            {!hasAnswered ? (
                                <View style={styles.inputArea}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Type your deepest thoughts..."
                                        multiline
                                        value={answer}
                                        onChangeText={setAnswer}
                                        placeholderTextColor="#A0A0A0"
                                    />
                                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.8}>
                                        <LinearGradient colors={['#FF6B35', '#FF1493']} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                            <Text style={styles.submitText}>{isSubmitting ? 'Sending...' : 'Submit Answer'}</Text>
                                            <Ionicons name="heart" size={16} color="#fff" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.responsesArea}>
                                    <ResponseBubble 
                                        name={partner1} 
                                        text={dailyQuestion.myResponse} 
                                        isMe 
                                        color="#FF6B35" 
                                    />
                                    <ResponseBubble 
                                        name={partner2} 
                                        text={dailyQuestion.partnerResponse} 
                                        isMe={false} 
                                        color="#8B5CF6" 
                                        waiting={!dailyQuestion.partnerResponse}
                                    />
                                </View>
                            )}
                        </Animated.View>
                    </View>

                    {/* ── Milestones ── */}
                    <View style={styles.section}>
                        <Animated.View 
                            entering={FadeInDown.delay(500).duration(600)} 
                            renderToHardwareTextureAndroid={true}
                            style={styles.sectionHeader}
                        >
                            <View style={[styles.sectionIcon, glassStyles.container]}>
                                <Ionicons name="ribbon" size={18} color="#FF6F43" />
                            </View>
                            <Text style={styles.sectionTitle}>Relationship Milestones</Text>
                        </Animated.View>

                        <View style={styles.milestoneGrid}>
                            <MilestoneCard 
                                title="First Spark" 
                                sub="Started Rumbala" 
                                icon="heart" 
                                unlocked 
                                color="#FF6B35" 
                                delay={700}
                                width={width}
                            />
                            <MilestoneCard 
                                title="First Dare" 
                                sub="1 Dare Done" 
                                icon="trophy" 
                                unlocked={milestones.includes('first_dare')} 
                                color="#FF9800" 
                                delay={800}
                                width={width}
                            />
                            <MilestoneCard 
                                title="On Fire" 
                                sub="7 Day Streak" 
                                icon="flame" 
                                unlocked={milestones.includes('7_day_streak')} 
                                color="#EF4444" 
                                delay={900}
                                width={width}
                            />
                            <MilestoneCard 
                                title="Eternal Love" 
                                sub="100 Days" 
                                icon="infinite" 
                                unlocked={milestones.includes('100_days')} 
                                color="#8B5CF6" 
                                delay={1000}
                                width={width}
                            />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

function ResponseBubble({ name, text, isMe, color, waiting }: { name: string | null, text: string | null, isMe: boolean, color: string, waiting?: boolean }) {
    return (
        <View style={[styles.responseRow, !isMe && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.avatar, { backgroundColor: color }]}>
                <Text style={styles.avatarText}>{name?.charAt(0) || (isMe ? 'Y' : 'P')}</Text>
            </View>
            <View style={[styles.responseBubble, glassStyles.container, !isMe && styles.partnerBubble]}>
                <Text style={styles.responseTime}>{waiting ? 'Awaiting...' : 'Today'}</Text>
                <Text style={[styles.responseText, waiting && styles.responseTextItalic]}>
                    {waiting ? `Waiting for ${name || 'partner'}...` : text}
                </Text>
            </View>
        </View>
    );
}

function MilestoneCard({ title, sub, icon, unlocked, color, delay, width }: { title: string, sub: string, icon: any, unlocked: boolean, color: string, delay: number, width: number }) {
    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(600)}>
            <TouchableOpacity 
                style={[styles.milestoneCard, glassStyles.container, !unlocked && styles.milestoneCardLocked, { width: (width - 56) / 2 }]}
                activeOpacity={0.7}
            >
                <View style={[styles.milestoneIconWrap, { backgroundColor: unlocked ? `${color}15` : 'rgba(0,0,0,0.05)' }]}>
                    <Ionicons name={icon} size={28} color={unlocked ? color : '#AAA'} />
                </View>
                <Text style={[styles.milestoneTitle, !unlocked && styles.milestoneTextLocked]}>{title}</Text>
                <Text style={styles.milestoneSub}>{sub}</Text>
                {!unlocked && (
                    <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={10} color="#fff" />
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    
    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
    },
    headerLeft: {},
    greeting: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 2 },
    headerName: {
        fontFamily: 'Pacifico_400Regular', fontSize: 24, color: '#1a1a1a', paddingRight: 10,
    },
    cardPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    },
    proCardPill: { backgroundColor: '#1A111B', borderWidth: 1.5, borderColor: '#FF66B2' },
    cardPillText: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
    proCardPillText: { color: '#FF66B2' },

    scroll: { paddingBottom: 120 },
    section: { paddingHorizontal: 20, marginBottom: 28 },
    
    // Streak
    streakContainer: { paddingHorizontal: 20, marginTop: 16, marginBottom: 32 },
    streakCard: { 
        borderRadius: 32, overflow: 'hidden', padding: 24, 
        flexDirection: 'row', alignItems: 'center', gap: 20,
    },
    streakGlow: {
        position: 'absolute', top: -50, right: -50, width: 200, height: 200,
        borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.2)',
    },
    fireIcon: { 
        width: 100, height: 100, borderRadius: 50, 
        backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' 
    },
    streakInfo: { flex: 1 },
    streakTitle: { fontSize: 13, fontWeight: '900', color: '#fff', opacity: 0.8, letterSpacing: 1.5 },
    streakCount: { fontSize: 56, fontWeight: '900', color: '#fff', marginVertical: -4 },
    streakSub: { fontSize: 13, color: '#fff', opacity: 1, fontWeight: '700' },

    // Sections
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    sectionIcon: { 
        width: 32, height: 32, borderRadius: 10, 
        justifyContent: 'center', alignItems: 'center',
    },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },

    // Question
    questionCard: { 
        padding: 24, borderRadius: 28,
    },
    questionCardAnswered: { borderLeftWidth: 8, borderLeftColor: '#FF6B35' },
    questionText: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: 28, lineHeight: 30 },
    inputArea: { width: '100%' },
    input: { 
        backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 20, padding: 20, fontSize: 16, 
        minHeight: 120, textAlignVertical: 'top', color: '#1a1a1a', 
        borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.05)', marginBottom: 20 
    },
    submitBtn: { borderRadius: 18, overflow: 'hidden' },
    submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 18 },
    submitText: { color: '#fff', fontSize: 17, fontWeight: '800' },

    // Responses
    responsesArea: { gap: 16 },
    responseRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-end' },
    avatar: { 
        width: 36, height: 36, borderRadius: 18, 
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { color: '#fff', fontWeight: '900', fontSize: 16 },
    responseBubble: { flex: 1, borderRadius: 20, borderBottomLeftRadius: 4, padding: 16 },
    partnerBubble: { borderBottomLeftRadius: 20, borderBottomRightRadius: 4 },
    responseTime: { fontSize: 10, fontWeight: '700', color: '#999', marginBottom: 4, textTransform: 'uppercase' },
    responseText: { fontSize: 16, color: '#333', lineHeight: 22, fontWeight: '500' },
    responseTextItalic: { color: '#AAA', fontStyle: 'italic' },

    // Milestones
    milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
    milestoneCard: { 
        padding: 20, borderRadius: 24,
    },
    milestoneCardLocked: { opacity: 0.6 },
    milestoneIconWrap: { 
        width: 56, height: 56, borderRadius: 18, 
        justifyContent: 'center', alignItems: 'center', marginBottom: 14 
    },
    milestoneTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
    milestoneTextLocked: { color: '#888' },
    milestoneSub: { fontSize: 12, color: '#999', fontWeight: '600' },
    lockBadge: { 
        position: 'absolute', top: 16, right: 16, 
        width: 20, height: 20, borderRadius: 10, 
        backgroundColor: '#CCC', justifyContent: 'center', alignItems: 'center' 
    },
});
``


## D:\Rumbala\app\(tabs)\history.tsx
``tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, StatusBar, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles } from '../../src/constants/glass';


const BG_COLORS = ['#FDFCFB', '#E6E6FA', '#F0F8FF'];

const getRelativeTime = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return 'Unknown'; }
};

export default function HistoryScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const { history } = useStore(useShallow(state => ({
        history: state.history,
    })));

    const handleBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/pro');
    };

    const getCardIcon = (type: string) => {
        switch (type) {
            case 'fun': return '🎈';
            case 'romantic': return '💖';
            case 'spicy': return '🌶️';
            case 'ldr': return '✈️';
            default: return '✨';
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />
                
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, glassStyles.header]}>
                    <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Our History</Text>
                    <View style={{ width: 40 }} />
                </Animated.View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>
                    {history.length > 0 ? (
                        history.map((entry, idx) => (
                            <Animated.View 
                                key={entry.id || idx} 
                                entering={FadeInDown.delay(idx * 50).duration(500)}
                                style={[styles.historyCard, glassStyles.container]}
                            >
                                <View style={styles.cardTop}>
                                    <View style={[styles.typeIcon, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                                        <Text style={{ fontSize: 24 }}>{getCardIcon(entry.card.type)}</Text>
                                    </View>
                                    <View style={styles.cardMeta}>
                                        <Text style={styles.cardType}>{entry.card.type.toUpperCase()}</Text>
                                        <Text style={styles.cardDate}>{getRelativeTime(entry.date)}</Text>
                                    </View>
                                </View>
                                
                                <Text style={styles.cardText}>"{entry.card.text}"</Text>
                                
                                {entry.proofUri && (
                                    <View style={styles.proofContainer}>
                                        <Image source={{ uri: entry.proofUri }} style={styles.proofImage} resizeMode="cover" />
                                    </View>
                                )}
                                
                                <View style={styles.cardFooter}>
                                    <View style={styles.pointBadge}>
                                        <Ionicons name="star" size={14} color="#FFD700" />
                                        <Text style={styles.pointText}>+1 Point</Text>
                                    </View>
                                    <Text style={styles.winnerTag}>Completed by {entry.winner === 'both' ? 'both' : 'one of you'}</Text>
                                </View>
                            </Animated.View>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="journal-outline" size={64} color="rgba(0,0,0,0.1)" />
                            <Text style={styles.emptyTitle}>Your story starts here</Text>
                            <Text style={styles.emptySubtitle}>Complete dares and capture memories to see them in your history!</Text>
                            <TouchableOpacity style={styles.drawBtn} onPress={() => router.push('/(tabs)')}>
                                <LinearGradient colors={['#FF6B35', '#FF9800']} style={styles.drawBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                    <Text style={styles.drawBtnText}>Draw first card</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16,
    },
    headerTitle: { fontSize: 24, fontFamily: 'Pacifico_400Regular', color: '#1a1a1a' },
    headerBtn: { padding: 8 },

    historyCard: {
        padding: 20, borderRadius: 24, marginBottom: 16,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
    typeIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    cardMeta: { flex: 1 },
    cardType: { fontSize: 11, fontWeight: '900', color: '#FF6B35', letterSpacing: 1 },
    cardDate: { fontSize: 13, color: '#666', fontWeight: '600' },
    cardText: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', lineHeight: 24, marginBottom: 14 },
    proofContainer: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
    proofImage: { width: '100%', height: '100%' },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },
    pointBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    pointText: { fontSize: 12, fontWeight: '800', color: '#B8860B' },
    winnerTag: { fontSize: 12, color: '#888', fontWeight: '600' },

    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginTop: 20, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20, marginBottom: 30 },
    drawBtn: { width: '100%', maxWidth: 220, borderRadius: 16, overflow: 'hidden' },
    drawBtnGrad: { paddingVertical: 16, alignItems: 'center' },
    drawBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
``


## D:\Rumbala\app\(tabs)\index.tsx
``tsx

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
    Modal, StatusBar, Platform, useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue, useAnimatedStyle, withRepeat, withSequence,
    withTiming, withDelay, withSpring, Easing, FadeInDown
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { useFocusEffect } from 'expo-router';
import Card from '../../src/components/Card';
import { DareCard, CARDS } from '../../src/constants/cards';
import CameraModal from '../../src/components/CameraModal';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { typography } from '../../src/constants/typography';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PaywallModal from '../../src/components/PaywallModal';
import { getOfferings, purchasePackage } from '../../src/services/revenueCatService';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';


const BG_COLORS = ['#FFFAF0', '#FFE4E1', '#E6E6FA']; // Soft, elegant base for glass

const VIBES = [
    { key: 'all', label: 'All', color: '#FF6B35', premium: false },
    { key: 'fun', label: 'Fun', color: '#FF9800', premium: false },
    { key: 'romantic', label: 'Romantic', color: '#FF1493', premium: true },
    { key: 'spicy', label: 'Spicy', color: '#EF4444', premium: true },
    { key: 'ldr', label: 'LDR', color: '#8B5CF6', premium: true },
] as const;

export default function TabHomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const {
        partner1, partner2, cardCount,
        lastFreeClaimDate, claimWeeklyFree, hydrate,
        selectedVibe, setSelectedVibe, scores, addPoint, addHistoryEntry,
        isPro, lastPaywallShown, setLastPaywallShown, showAlert,
        drawCard, updateStreak, syncWithSupabase,
        hasHydrated
    } = useStore(useShallow((state: any) => ({
        partner1: state.partner1,
        partner2: state.partner2,
        cardCount: state.cardCount,
        lastFreeClaimDate: state.lastFreeClaimDate,
        claimWeeklyFree: state.claimWeeklyFree,
        hydrate: state.hydrate,
        selectedVibe: state.selectedVibe,
        setSelectedVibe: state.setSelectedVibe,
        scores: state.scores,
        addPoint: state.addPoint,
        addHistoryEntry: state.addHistoryEntry,
        isPro: state.isPro,
        lastPaywallShown: state.lastPaywallShown,
        setLastPaywallShown: state.setLastPaywallShown,
        showAlert: state.showAlert,
        drawCard: state.drawCard,
        updateStreak: state.updateStreak,
        syncWithSupabase: state.syncWithSupabase,
        hasHydrated: state.hasHydrated,
    })));

    const [currentCard, setCurrentCard] = useState<DareCard | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [cardsPlayed, setCardsPlayed] = useState(0);
    const [showCamera, setShowCamera] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [hintRevealed, setHintRevealed] = useState(false);
    const confettiRef = useRef<LottieView>(null);

    // Animations
    const pulseScale = useSharedValue(1);
    const pointsY = useSharedValue(20);
    const pointsO = useSharedValue(0);
    const glowO = useSharedValue(0.3);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    useEffect(() => {
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.06, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
            ), -1, true
        );
        glowO.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ), -1, true
        );

        /*
        if (!isPro) {
            const now = new Date();
            if (!lastPaywallShown) {
                setShowPaywall(true);
                setLastPaywallShown(now.toISOString());
            } else {
                const lastDate = new Date(lastPaywallShown);
                const diff = now.getTime() - lastDate.getTime();
                const hours = diff / (1000 * 60 * 60);
                if (hours >= 24) {
                    setShowPaywall(true);
                    setLastPaywallShown(now.toISOString());
                }
            }
        }
        */
    }, []);
    
    useFocusEffect(
        React.useCallback(() => {
            useStore.getState().syncWithSupabase();
        }, [])
    );

    // Prevent header flicker by waiting for stored names to hydrate
    if (!hasHydrated) {
        return null;
    }

    const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));
    const glowStyle = useAnimatedStyle(() => ({ opacity: glowO.value }));
    const pointsStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: pointsY.value }],
        opacity: pointsO.value,
        position: 'absolute' as const, top: '38%', alignSelf: 'center' as const, zIndex: 100
    }));

    const handleDrawCard = async () => {
        const currentStore = useStore.getState();
        if (!currentStore.isPro && currentStore.cardCount <= 0 && currentStore.isAuthenticated) {
            await currentStore.syncWithSupabase();
        }

        if (cardsPlayed > 0 && cardsPlayed % 5 === 0) {
            showAlert('Having Fun?', 'Share your rumble vibe with friends!', [
                { text: 'Keep Playing', style: 'cancel' },
                { text: 'Share', onPress: () => router.push('/(tabs)/history') }
            ]);
        }
        if (!isPro && cardCount <= 0) {
            showAlert('Out of Dares!', 'You\'ve played all your current cards. Head to the shop to reload your deck and keep the fun going.', [
                { text: 'Go to Shop', onPress: () => router.push('/(tabs)/shop') },
                { text: 'Not right now', style: 'cancel' }
            ]);
            return;
        }
        const drawn = useStore.getState().drawCard(selectedVibe);
        if (!drawn) {
            showAlert('Out of Dares!', 'You\'ve played all your current cards. Head to the shop to reload your deck and keep the fun going.', [
                { text: 'Go to Shop', onPress: () => router.push('/(tabs)/shop') },
                { text: 'Not right now', style: 'cancel' }
            ]);
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrentCard(drawn);
        setIsFlipped(false);
        setCardsPlayed(p => p + 1);
        setHintRevealed(false);
        useStore.getState().updateStreak();
    };

    const handleAction = (action: 'done' | 'skip' | 'proof') => {
        if (!currentCard) return;
        if (action === 'done') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowConfetti(true);
            pointsY.value = 20; pointsO.value = 1;
            pointsY.value = withTiming(-80, { duration: 1000, easing: Easing.out(Easing.ease) });
            pointsO.value = withTiming(0, { duration: 1000, easing: Easing.in(Easing.ease) });
            setTimeout(() => setShowConfetti(false), 3000);
            addPoint('both');
            addHistoryEntry({ id: Date.now().toString(), date: new Date().toISOString(), card: currentCard, winner: 'both' });
            setCurrentCard(null);
        } else if (action === 'skip') {
            const performSkip = () => {
                useStore.getState().drawCard();
                setCurrentCard(null);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            };
            showAlert('Why skip?', 'Skipping costs 1 random card from your deck.', [
                { text: 'Too spicy 🥵', onPress: performSkip },
                { text: 'Not in the mood 😴', onPress: performSkip },
                { text: 'Maybe later ⏳', onPress: performSkip },
                { text: 'Cancel', style: 'cancel' }
            ]);
        } else if (action === 'proof') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowCamera(true);
        }
    };

    const handlePaywallSubscribe = async (pkg: any) => {
        try {
            const result = await purchasePackage(pkg);
            if (result.success) {
                useStore.getState().setIsPro(true);
                setShowPaywall(false);
                showAlert('🎉 Welcome to Pro!', 'You now have unlimited access.');
            }
        } catch (e) {
            console.warn('Purchase failed from popup', e);
        }
    };

    const handlePhotoTaken = (uri: string) => {
        if (!currentCard) return;
        addPoint('both');
        addHistoryEntry({ id: Date.now().toString(), date: new Date().toISOString(), card: currentCard, winner: 'both', proofUri: uri });
        setCurrentCard(null);
        showAlert('Proof Saved!', 'Check it in History! 📸');
    };

    const activeVibeKey = selectedVibe || 'all';

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
                <StatusBar barStyle="dark-content" />

                {/* ── Header ── */}
                <Animated.View 
                    entering={FadeInDown.delay(100).duration(600)} 
                    renderToHardwareTextureAndroid={true}
                    style={[styles.header, glassStyles.header]}
                >
                    <View style={styles.headerLeft}>
                        <Text style={styles.greeting}>Hey 👋</Text>
                        <Text style={styles.headerName} numberOfLines={1}>
                            {(partner1 && partner2) ? `${partner1} & ${partner2}` : (partner1 || partner2 || 'Couple')}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity 
                            style={[styles.cardPill, isPro && styles.proCardPill, !isPro && glassStyles.container]} 
                            activeOpacity={0.8} 
                            onPress={() => router.push('/(tabs)/shop')}
                        >
                            <Ionicons name={isPro ? "diamond" : "albums-outline"} size={14} color={isPro ? "#FF66B2" : "#1a1a1a"} />
                            <Text style={[styles.cardPillText, isPro && styles.proCardPillText]}>
                                {isPro ? 'Pro Active' : cardCount}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* ── Play Area ── */}
                <View style={styles.playArea}>
                    {currentCard ? (
                        <View style={styles.cardWrapper}>
                            <Card card={currentCard} isFlipped={isFlipped} onFlip={() => setIsFlipped(prev => !prev)} />
                            {isFlipped && (
                            <Animated.View 
                                entering={FadeInDown.delay(300).duration(400)} 
                                renderToHardwareTextureAndroid={Platform.OS === 'android'}
                                style={styles.actionRow}
                            >
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('skip')} activeOpacity={0.8}>
                                        <LinearGradient colors={['#FFD93D', '#FF9800']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                            <Ionicons name="play-skip-forward" size={18} color="#1a1a1a" />
                                            <Text style={styles.actionTextDark}>Skip</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('done')} activeOpacity={0.8}>
                                        <LinearGradient colors={['#10B981', '#059669']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                            <Text style={styles.actionTextLight}>Done</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                        </View>
                    ) : (
                        <Animated.View style={[styles.circleWrap, pulseStyle]}>
                            <TouchableOpacity onPress={handleDrawCard} activeOpacity={0.85}>
                                {/* Glow ring */}
                                <Animated.View style={[styles.glowRing, glowStyle]} />
                                <View style={[styles.drawCircle, glassStyles.container, { borderRadius: 140 }]}>
                                    <View style={styles.drawInner}>
                                        <Ionicons name="heart" size={48} color="#FF6B35" />
                                        <Text style={styles.drawLabel}>Draw Card</Text>
                                        <Text style={styles.drawSub}>Tap to play</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </View>

                {/* ── Floating Points ── */}
                <Animated.View style={pointsStyle} pointerEvents="none">
                    <Text style={styles.pointsText}>+2 Points! 🎉</Text>
                </Animated.View>

                {/* ── Confetti ── */}
                {showConfetti && (
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        <LottieView ref={confettiRef} source={require('../../assets/confetti.json')} autoPlay loop={false} style={StyleSheet.absoluteFill} />
                    </View>
                )}

                {/* ── Bottom Section ── */}
                {!currentCard && (
                    <Animated.View 
                        entering={FadeInDown.delay(400).duration(600)} 
                        renderToHardwareTextureAndroid={Platform.OS === 'android'}
                        style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 24) }]}
                    >
                        {/* Vibe Filters */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
                            {VIBES.map(({ key, label, color, premium }) => {
                                const active = activeVibeKey === key;
                                const isLocked = premium && !isPro;
                                return (
                                    <TouchableOpacity
                                        key={key}
                                        style={[
                                            styles.pill, 
                                            glassStyles.container, 
                                            active && { ...styles.pillActive, borderColor: color }
                                        ]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            if (isLocked) {
                                                setShowPaywall(true);
                                                return;
                                            }
                                            if (key === 'ldr') {
                                                router.push('/(tabs)/ldr');
                                            } else {
                                                setSelectedVibe(key === 'all' ? null : key);
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.pillImage, { backgroundColor: color, borderRadius: 11 }]}>
                                            {isLocked && <Ionicons name="lock-closed" size={10} color="#fff" style={{ position: 'absolute', top: 6, left: 6 }} />}
                                        </View>
                                        <Text style={[styles.pillText, active && { color }]}>{label}</Text>
                                        {isLocked && <Ionicons name="diamond" size={10} color={color} style={{ marginLeft: 2 }} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </Animated.View>
                )}

                {/* ── Camera Modal ── */}
                <CameraModal visible={showCamera} onClose={() => setShowCamera(false)} onPhotoTaken={handlePhotoTaken} />
                {/* Paywall Contextual Popup */}
                <PaywallModal 
                    visible={showPaywall} 
                    onClose={() => setShowPaywall(false)}
                    onSubscribe={handlePaywallSubscribe}
                />
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },

    // ── Header ──
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
    },
    headerLeft: { flex: 1, marginRight: 15 },
    greeting: {
        fontSize: 13, color: '#888', fontWeight: '700', marginBottom: 2,
        letterSpacing: 0.5, textTransform: 'uppercase',
    },
    headerName: {
        fontFamily: 'Pacifico_400Regular', fontSize: 22, color: '#1a1a1a',
        letterSpacing: 0.5,
    },
    cardPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    },
    proCardPill: {
        backgroundColor: '#1A111B', borderWidth: 1.5, borderColor: '#FF66B2',
    },
    cardPillText: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
    proCardPillText: { color: '#FF66B2' },

    // ── Play Area ──
    playArea: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
    },
    circleWrap: { alignItems: 'center', justifyContent: 'center' },
    glowRing: {
        position: 'absolute', width: 296, height: 296, borderRadius: 148,
        backgroundColor: 'rgba(255,255,255,0.2)',
        top: -8, left: -8,
    },
    drawCircle: {
        width: 280, height: 280,
        justifyContent: 'center', alignItems: 'center',
    },
    drawInner: { alignItems: 'center' },
    drawLabel: {
        fontFamily: 'Pacifico_400Regular', fontSize: 22, color: '#FF6B35', marginTop: 12,
        paddingRight: 10,
    },
    drawSub: {
        fontSize: 12, color: 'rgba(0,0,0,0.4)', fontWeight: '600', marginTop: 4,
    },

    // ── Card ──
    cardWrapper: { alignItems: 'center' },
    actionRow: {
        flexDirection: 'row', marginTop: 24, gap: 10, justifyContent: 'center',
    },
    actionBtn: {
        borderRadius: 16, overflow: 'hidden',
        shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1, shadowRadius: 6, elevation: 0,
    },
    actionGradient: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 12, paddingHorizontal: 20,
    },
    actionTextDark: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
    actionTextLight: { fontSize: 14, fontWeight: '700', color: '#fff' },

    // ── Bottom ──
    bottomSection: {
        paddingHorizontal: 16, paddingBottom: 24,
    },
    filtersScroll: {
        paddingVertical: 6, gap: 8, flexDirection: 'row',
    },
    pill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 24,
    },
    pillActive: {
        backgroundColor: 'rgba(255,255,255,0.4)', borderColor: '#FF6B35',
        shadowColor: 'rgba(0,0,0,0.05)', shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 0,
    },
    pillImage: { width: 22, height: 22, marginRight: 2 },
    pillText: { fontSize: 13, fontWeight: '600', color: '#666' },
    pillTextActive: { color: '#FF6B35' },

    // Points
    pointsText: {
        fontFamily: 'Pacifico_400Regular', fontSize: 28, color: '#FFD700',
        paddingRight: 10,
        textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },

    // Modal
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    modalCard: {
        borderRadius: 24, padding: 28,
        width: '100%', maxWidth: 340, alignItems: 'center',
    },
    modalIconWrap: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: 'rgba(255,107,53,0.1)', justifyContent: 'center', alignItems: 'center',
        marginBottom: 14,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
    modalSub: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20 },
    reasonBtn: {
        width: '100%', paddingVertical: 14,
        backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 14, marginBottom: 8,
        alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    },
    reasonText: { fontSize: 14, fontWeight: '600', color: '#333' },
    cancelBtn: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 20 },
    cancelText: { fontSize: 14, fontWeight: '700', color: '#888' },

    // Out of Cards Modal
    outCard: {
        borderRadius: 24, padding: 28, paddingVertical: 36,
        width: '100%', maxWidth: 320, alignItems: 'center',
    },
    outIconWrap: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: 'rgba(255,107,53,0.1)', justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
    },
    outTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 8 },
    outSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    outShopBtn: {
        width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 12,
    },
    outShopBtnGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 16,
    },
    outShopBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
``


## D:\Rumbala\app\(tabs)\ldr.tsx
``tsx

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Alert, Share, StatusBar, ScrollView,
    ActivityIndicator, useWindowDimensions
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue, useAnimatedStyle, withRepeat, withSequence,
    withTiming, Easing, FadeIn, FadeInDown, FadeInUp,
    withDelay, cancelAnimation
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import {
    createLdrRoomV2, joinLdrRoomV2, subscribeToRoomV2,
    syncDrawnCardV2, updateRoomScoreV2, clearRoomCardV2,
    RoomData, sendChatMessageV2, subscribeToChatV2, getRoomDataV2, getChatMessagesV2
} from '../../src/services/roomApi';
import { CARDS, DareCard, CardType } from '../../src/constants/cards';
import { CameraView } from 'expo-camera';
// --- Dynamic Agora Types (any for modules to avoid crashes) ---
let AgoraModule: any = null;
let UIKitModule: any = null;
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput } from 'react-native';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';
import PaywallModal from '../../src/components/PaywallModal';
import { purchasePackage } from '../../src/services/revenueCatService';

// --- Agora UIKit will be imported dynamically ---

const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || ''; 


const BG_COLORS = ['#F5F3FF', '#EDE9F8', '#FDFCFB']; // Techy romantic LDR base

// ── Timer Component ──
function DareTimer({ seconds }: { seconds: number }) {
    const [remaining, setRemaining] = useState(seconds);
    useEffect(() => {
        setRemaining(seconds);
        const interval = setInterval(() => {
            setRemaining((prev: number) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [seconds]);
    const isLow = remaining <= 10;
    return (
        <View style={[tt.wrap, isLow && tt.wrapRed, !isLow && glassStyles.container]}>
            <Ionicons name="timer-outline" size={14} color={isLow ? '#fff' : '#FF6B35'} />
            <Text style={[tt.text, isLow && tt.textWhite]}>
                {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
            </Text>
        </View>
    );
}

const tt = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    wrapRed: { backgroundColor: '#FF4444' },
    text: { fontSize: 14, fontWeight: '800', color: '#FF6B35', fontVariant: ['tabular-nums'] },
    textWhite: { color: '#fff' },
});

// ── Live Partner Avatar (Agora Remote Stream) ──
function PartnerVideoCard({ name, isLive, remoteUid, isAgoraLoaded, AgoraModule, roomId }: { name: string; isLive: boolean; remoteUid: number | null, isAgoraLoaded: boolean, AgoraModule: any, roomId: string | null }) {
    const glow = useSharedValue(0.5);
    useEffect(() => {
        glow.value = withRepeat(withSequence(
            withTiming(1, { duration: 1500 }),
            withTiming(0.5, { duration: 1500 }),
        ), -1, true);
        return () => cancelAnimation(glow);
    }, []);
    const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

    if (isLive && remoteUid) {
        return (
            <View style={[pv.card, glassStyles.container]}>
                {isAgoraLoaded && AgoraModule?.RtcSurfaceView ? (
                    <AgoraModule.RtcSurfaceView 
                        style={StyleSheet.absoluteFill} 
                        canvas={{ uid: remoteUid ?? 0, channelId: roomId?.trim().toUpperCase(), renderMode: AgoraModule.RenderModeType?.RenderModeFit ?? 1 }} 
                    />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
                )}
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.3)']} style={StyleSheet.absoluteFill} />
                <View style={[pv.nameTag, glassStyles.container]}>
                    <Text style={pv.nameText}>{name || 'Partner'}</Text>
                </View>
                <View style={pv.liveBadge}>
                    <View style={pv.liveDot} />
                    <Text style={pv.liveText}>LIVE</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[pv.card, glassStyles.container]}>
            <LinearGradient colors={['rgba(45, 27, 105, 0.4)', 'rgba(26, 16, 53, 0.4)']} style={StyleSheet.absoluteFill} />
            <View style={pv.circleL} />
            <View style={pv.circleR} />
            <View style={pv.avatarWrap}>
                <LinearGradient colors={['#FF9800', '#FF6B35']} style={pv.avatar}>
                    <Ionicons name="person" size={48} color="#fff" />
                </LinearGradient>
                {isLive && <Animated.View style={[pv.glowRing, glowStyle]} />}
            </View>
            <View style={[pv.nameTag, glassStyles.container]}>
                <Text style={pv.nameText}>{name || 'Partner'}</Text>
            </View>
            {isLive && (
                <View style={pv.liveBadge}>
                    <View style={pv.liveDot} />
                    <Text style={pv.liveText}>WAITING FOR VIDEO...</Text>
                </View>
            )}
            <TouchableOpacity style={[pv.micBtn, glassStyles.container]}>
                <Ionicons name="mic-outline" size={18} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const pv = StyleSheet.create({
    card: { width: '100%', height: 200, borderRadius: 22, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    circleL: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,107,53,0.08)', top: -60, left: -60 },
    circleR: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,152,0,0.06)', bottom: -40, right: -30 },
    avatarWrap: { alignItems: 'center', justifyContent: 'center' },
    avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
    glowRing: { position: 'absolute', width: 106, height: 106, borderRadius: 53, borderWidth: 3, borderColor: '#FF6B35', top: -8, left: -8 },
    nameTag: { position: 'absolute', top: 12, left: 14, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
    nameText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    liveBadge: { position: 'absolute', bottom: 12, left: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FF4444', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
    liveText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    micBtn: { position: 'absolute', bottom: 12, right: 14, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});

// ── Pulse Ring Component ──
function PulseRing() {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.2);
    useEffect(() => {
        scale.value = withRepeat(withTiming(1.5, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
        opacity.value = withRepeat(withSequence(withTiming(0.4, { duration: 1000 }), withTiming(0, { duration: 1000 })), -1, false);
        return () => {
            cancelAnimation(scale);
            cancelAnimation(opacity);
        };
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));
    return <Animated.View style={[styles.pulseRing, animatedStyle]} />;
}

// ── Agora Utility ──
// Agora requires numeric UIDs (32-bit int). Supabase gives UUID strings.
const getNumericUid = (uuid?: string): number => {
    if (!uuid) return 0;
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
        const char = uuid.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Force to 32-bit signed integer
    }
    return Math.abs(hash);
};

// ── You (Self) Video Card ──
function SelfVideoCard({ name, isCameraOn, isAgoraLoaded, AgoraModule, engine, localUid, isJoined, hasLocalVideoFrame }: { name: string; isCameraOn: boolean; isAgoraLoaded: boolean; AgoraModule: any; engine: any; localUid: number | null; isJoined: boolean; hasLocalVideoFrame: boolean }) {
    if (!isCameraOn) {
        return (
            <View style={[sv.card, glassStyles.container]}>
                <LinearGradient colors={['rgba(255, 236, 210, 0.4)', 'rgba(252, 182, 159, 0.4)']} style={StyleSheet.absoluteFill} />
                <View style={sv.iconWrap}>
                    <Ionicons name="videocam-off" size={36} color="rgba(255,107,53,0.3)" />
                </View>
                <View style={[sv.nameTag, glassStyles.container]}>
                    <Text style={sv.nameText}>You (Camera Off)</Text>
                </View>
            </View>
        );
    }

    const canShowAgoraPreview = isJoined && hasLocalVideoFrame && isAgoraLoaded && AgoraModule?.RtcSurfaceView && engine?.current && typeof localUid === 'number';

    return (
        <View style={[sv.card, glassStyles.container]}>
            {canShowAgoraPreview ? (
                <AgoraModule.RtcSurfaceView
                    style={StyleSheet.absoluteFill}
                    canvas={{
                        uid: localUid ?? 0,
                        renderMode: AgoraModule.RenderModeType?.RenderModeFit ?? 1,
                        mirrorMode: AgoraModule.VideoMirrorModeType?.VideoMirrorModeEnabled ?? 1,
                    }}
                    zOrderMediaOverlay={true}
                />
            ) : (
                <CameraView style={StyleSheet.absoluteFill} facing="front" />
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.3)']} style={StyleSheet.absoluteFill} />
            <View style={[sv.nameTag, glassStyles.container]}>
                <Text style={sv.nameText}>You</Text>
            </View>
        </View>
    );
}

const sv = StyleSheet.create({
    card: { width: '100%', height: 160, borderRadius: 22, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    iconWrap: { opacity: 0.7 },
    nameTag: { position: 'absolute', top: 10, left: 12, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    nameText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

export default function LdrScreen() {
    const insets = useSafeAreaInsets();
    const {
        partner1, partner2, setPartner1, setPartner2,
        roomId, setRoomId, setIsHost, isHost,
        cardCount, setCardCount, addHistoryEntry, addPoint, userId, isPro, showAlert, setMode
    } = useStore(useShallow(state => ({
        partner1: state.partner1,
        partner2: state.partner2,
        setPartner1: state.setPartner1,
        setPartner2: state.setPartner2,
        roomId: state.roomId,
        setRoomId: state.setRoomId,
        setIsHost: state.setIsHost,
        isHost: state.isHost,
        cardCount: state.cardCount,
        setCardCount: state.setCardCount,
        addHistoryEntry: state.addHistoryEntry,
        addPoint: state.addPoint,
        userId: state.userId,
        isPro: state.isPro,
        showAlert: state.showAlert,
        setMode: state.setMode
    })));

    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const [joinCode, setJoinCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [isValidatingRoom, setIsValidatingRoom] = useState(false);
    const [isRoomValidated, setIsRoomValidated] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [tab, setTab] = useState<'create' | 'join'>('create');
    const [messages, setMessages] = useState<any[]>([]);
    const [roomType, setRoomType] = useState<'video' | 'normal'>('video');
    const [selectedLdrVibe, setSelectedLdrVibe] = useState<CardType | 'all'>('all');
    const [showPaywall, setShowPaywall] = useState(false);

    const activeCard: DareCard | null = roomData?.current_card ?? null;
    const partnerConnected = !!roomData?.guest_user_id;

    const engine = useRef<any>(null);
    const [localUid, setLocalUid] = useState<number | null>(null);
    const [hasLocalVideoFrame, setHasLocalVideoFrame] = useState(false);
    const [remoteUid, setRemoteUid] = useState<number | null>(null);
    const [useCustomUI, setUseCustomUI] = useState(true); 
    const [isJoined, setIsJoined] = useState(false);
    const [isAgoraLoaded, setIsAgoraLoaded] = useState(false);
    const isAgoraInitializing = useRef(false);

    // Dynamic Module Loader
    useEffect(() => {
        (async () => {
            try {
                AgoraModule = await import('react-native-agora');
                UIKitModule = await import('agora-rn-uikit');
                setIsAgoraLoaded(true);
            } catch (e) {
                console.error('Failed to load Agora Dynamic Modules:', e);
            }
        })();
    }, []);

    // 🛡️ Session Activity Validation (Self-Cleaning)
    useEffect(() => {
        if (!roomId) {
            setIsRoomValidated(false);
            setIsValidatingRoom(false);
            return;
        }

        if (isRoomValidated) {
            setIsValidatingRoom(false);
            return;
        }

        setIsValidatingRoom(true);
        setIsRoomValidated(false);

        const timeoutId = setTimeout(() => {
            console.warn('--- ROOM VALIDATION TIMEOUT: clearing stale roomId');
            setRoomId(null);
            setRoomData(null);
            setIsWaiting(false);
            setIsRoomValidated(false);
            setIsValidatingRoom(false);
            leaveAgora();
        }, 6000);

        (async () => {
            try {
                const { getRoomDataV2 } = await import('../../src/services/roomApi');
                const data = await getRoomDataV2(roomId);
                if (!data || !data.is_active) {
                    console.log('--- INVALID OR INACTIVE ROOM DETECTED. EJECTING...');
                    setRoomId(null);
                    setRoomData(null);
                    setIsWaiting(false);
                    setIsRoomValidated(false);
                    leaveAgora();
                } else {
                    setRoomData(data);
                    setRoomType(data.room_type || 'video');
                    if (data.guest_user_id) setIsWaiting(false);
                    else if (isHost) setIsWaiting(true);
                    setIsRoomValidated(true);
                }
            } catch (e) {
                console.warn('Session verification failed:', e);
                setRoomId(null); // Clear on any error to be safe
                setIsRoomValidated(false);
                leaveAgora();
            } finally {
                clearTimeout(timeoutId);
                setIsValidatingRoom(false);
            }
        })();

        return () => clearTimeout(timeoutId);
    }, [roomId, isHost, isRoomValidated]);

    // Sync partner display names from room data to local store to avoid mismatches
    useEffect(() => {
        if (!roomData || !userId) return;

        const selfIsHost = roomData.host_user_id === userId;
        const myName = selfIsHost ? roomData.host_name : roomData.guest_name;
        const partnerName = selfIsHost ? roomData.guest_name : roomData.host_name;

        if (myName && myName !== partner1) setPartner1(myName);
        if (partnerName && partnerName !== partner2) setPartner2(partnerName);
    }, [roomData?.host_name, roomData?.guest_name, roomData?.host_user_id, roomData?.guest_user_id, userId, partner1, partner2, setPartner1, setPartner2]);

    useEffect(() => {
        if (!roomId || !isRoomValidated) return;

        const unsubRoom = subscribeToRoomV2(roomId, (data: RoomData) => {
            setRoomData(data);
            setRoomType(data.room_type || 'video');
            if (data.guest_user_id) {
                setIsWaiting(false);
            }
        });
        const unsubChat = subscribeToChatV2(roomId, (msgs: any[]) => {
            setMessages(msgs);
        });

        return () => {
            unsubRoom();
            unsubChat();
        };
    }, [roomId, isRoomValidated]);

    const ensureMediaPermissions = async () => {
        const { Camera } = await import('expo-camera');

        let camStatus = (await Camera.getCameraPermissionsAsync()).status;
        if (camStatus !== 'granted') {
            camStatus = (await Camera.requestCameraPermissionsAsync()).status;
        }

        let micStatus = (await Camera.getMicrophonePermissionsAsync()).status;
        if (micStatus !== 'granted') {
            micStatus = (await Camera.requestMicrophonePermissionsAsync()).status;
        }

        const ok = camStatus === 'granted' && micStatus === 'granted';
        if (!ok) {
            showAlert('Permissions Required', 'Camera and Microphone access are needed for video calls.');
        }
        return ok;
    };

    // Retry Agora init when modules finish loading after validation is done
    useEffect(() => {
        const effectiveRoomType = roomData?.room_type || roomType;
        if (!roomId || !isRoomValidated || effectiveRoomType !== 'video') {
            if (engine.current) leaveAgora();
            return;
        }
        if (!isAgoraLoaded) return;

        let cancelled = false;
        (async () => {
            const hasPermission = await ensureMediaPermissions();
            if (!hasPermission || cancelled) return;
            await initAgora();
        })();

        return () => {
            cancelled = true;
        };
    }, [roomId, roomData?.room_type, roomType, isRoomValidated, isAgoraLoaded]);

    useEffect(() => {
        return () => {
            leaveAgora();
        };
    }, []);

    const initAgora = async () => {
        if (engine.current || isAgoraInitializing.current) return;

        if (AGORA_APP_ID === 'YOUR_AGORA_APP_ID' || !AGORA_APP_ID) {
            console.warn('--- AGORA: APP ID not set. Check your .env file.');
            showAlert('Config Error', 'Agora App ID is missing. Check your .env setup.');
            return;
        }
        
        // Safety check for caching issues
        console.log(`--- AGORA: Using App ID (last 6): ...${AGORA_APP_ID.slice(-6)}`);
        
        if (!isAgoraLoaded || !AgoraModule) return;
        const roomCode = roomId?.trim().toUpperCase();
        if (!roomCode) {
            console.warn('--- AGORA: Missing room code, skipping channel join.');
            return;
        }
        try {
            isAgoraInitializing.current = true;
            const numericUid = getNumericUid(userId || undefined);
            setLocalUid(numericUid);
            console.log(`--- AGORA: INITIALIZING FOR USER: ${numericUid} (from ${userId})`);

            engine.current = AgoraModule.createAgoraRtcEngine();
            engine.current.initialize({ appId: AGORA_APP_ID });
            
            engine.current.registerEventHandler({
                onJoinChannelSuccess: (connection: any, elapsed: number) => {
                    console.log('--- AGORA: SUCCESSFULLY JOINED CHANNEL:', connection.channelId, 'UID:', connection.localUid);
                    setIsJoined(true);
                    if (typeof connection?.localUid === 'number') setLocalUid(connection.localUid);
                },
                onUserJoined: (connection: any, uid: number, elapsed: number) => {
                    console.log('--- AGORA: REMOTE USER JOINED:', uid);
                    setRemoteUid(uid);
                },
                onUserOffline: (connection: any, uid: number, reason: number) => {
                    console.log('--- AGORA: USER OFFLINE:', uid);
                    setRemoteUid(null);
                },
                onFirstLocalVideoFrame: () => {
                    setHasLocalVideoFrame(true);
                },
                onFirstLocalVideoFramePublished: () => {
                    setHasLocalVideoFrame(true);
                },
                onError: (err: number, msg: string) => {
                    console.error('--- AGORA ERROR:', err, msg);
                    // Show a helpful alert for common failures
                    if (err === 101) showAlert('Agora Error', 'Invalid App ID. Please check your .env file.');
                    else if (err === 110) showAlert('Agora Error', 'Token required but not provided. Check Agora Console settings.');
                    else showAlert('Video Error', `Connection failed: ${msg} (Code: ${err})`);
                }
            });

            engine.current.enableVideo();
            engine.current.enableAudio(); 
            engine.current.enableLocalAudio(true);
            engine.current.enableLocalVideo(true);
            engine.current.setClientRole(AgoraModule.ClientRoleType.ClientRoleBroadcaster);
            if (engine.current.setDefaultAudioRouteToSpeakerphone) {
                engine.current.setDefaultAudioRouteToSpeakerphone(true);
            }
            if (engine.current.muteAllRemoteAudioStreams) engine.current.muteAllRemoteAudioStreams(false);
            if (engine.current.muteAllRemoteVideoStreams) engine.current.muteAllRemoteVideoStreams(false);
            engine.current.setVideoEncoderConfiguration({
                dimensions: { width: 640, height: 360 },
                frameRate: 15,
                bitrate: 600,
                orientationMode: AgoraModule.OrientationMode.OrientationModeAdaptive,
            });
            engine.current.startPreview();
            engine.current.adjustPlaybackSignalVolume(100);
            
            const channelId = roomCode;
            console.log(`--- AGORA: JOINING CHANNEL: "${channelId}" as UID: ${numericUid}`);
            
            engine.current.joinChannel('', channelId, numericUid, {
                channelProfile: AgoraModule.ChannelProfileType.ChannelProfileCommunication,
                clientRoleType: AgoraModule.ClientRoleType.ClientRoleBroadcaster,
                publishMicrophoneTrack: true,
                publishCameraTrack: isCameraOn,
                autoSubscribeAudio: true,
                autoSubscribeVideo: true,
            });
        } catch (e) {
            console.error('Failed to init Agora:', e);
            showAlert('Video Error', 'Failed to initialize video call. Please try reconnecting.');
        } finally {
            isAgoraInitializing.current = false;
        }
    };

    const leaveAgora = () => {
        if (engine.current) {
            engine.current.leaveChannel();
            engine.current.release();
            engine.current = null;
            setIsJoined(false);
            setRemoteUid(null);
            setHasLocalVideoFrame(false);
            setLocalUid(null);
        }
    };

    useEffect(() => {
        if (engine.current && isJoined) {
            engine.current.muteLocalAudioStream(isMuted);
        }
    }, [isMuted, isJoined]);

    useEffect(() => {
        if (engine.current && isJoined) {
            engine.current.enableLocalVideo(isCameraOn);
            engine.current.muteLocalVideoStream(!isCameraOn);
            if (!isCameraOn) setHasLocalVideoFrame(false);
        }
    }, [isCameraOn, isJoined]);

    const handleCreateRoom = async () => {
        if (!userId) { showAlert('Login Required', 'Please log in first to create a room.'); return; }
        if (!isPro && roomType === 'video') {
            setShowPaywall(true); 
            return; 
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            const code = await createLdrRoomV2(userId, partner1 || 'Player 1', roomType);
            setGeneratedCode(code);
            setIsWaiting(true);
            setRoomId(code);
            setIsHost(true);
            setMode('ldr');
            setIsRoomValidated(true);
            setIsValidatingRoom(false);
        } catch (e: any) {
            showAlert('Error', e.message || 'Failed to create room. Please try again.');
        } finally { setLoading(false); }
    };

    const handleJoinRoom = async (codeOverride?: string) => {
        if (!userId) { showAlert('Login Required', 'Please log in first to join a room.'); return; }
        const code = (codeOverride ?? joinCode).replace(/\s+/g, '').toUpperCase();
        if (code.length !== 6) { showAlert('Invalid Code', 'Room codes must be exactly 6 characters.'); return; }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            await joinLdrRoomV2(code, userId, partner1 || 'Guest');
            setRoomId(code); 
            setIsHost(false); 
            setMode('ldr');
            setIsRoomValidated(true);
            setIsValidatingRoom(false);
            setJoinCode('');
        } catch (e: any) {
            console.error('JOIN ERROR:', e);
            const msg = e.message || '';

            showAlert('Join Failed', `${msg}\n\nCheck your internet connection and room code.`);
        } finally { setLoading(false); }
    };

    const handleManualSync = async () => {
        if (!roomId) return;
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const [latestRoom, latestMessages] = await Promise.all([
                getRoomDataV2(roomId),
                getChatMessagesV2(roomId),
            ]);
            if (latestRoom) {
                setRoomData(latestRoom);
            }
            if (latestMessages) {
                setMessages(latestMessages);
            }
        } catch {
            showAlert('Sync Failed', 'Could not refresh room state. Please try again.');
        }
    };

    const handleDrawDare = async () => {
        if (!roomId || !userId || !roomData) return;
        if (roomData.current_turn_user_id !== userId) {
            showAlert('Not Your Turn', `Please wait for ${partner2 || 'partner'} to finish their dare.`);
            return;
        }
        if (!isPro && cardCount <= 0) { showAlert('No Cards', 'Buy more cards from the Shop to continue!'); return; }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const card = useStore.getState().drawCard(selectedLdrVibe === 'all' ? 'ldr' : selectedLdrVibe);
        if (!card) {
            showAlert('Wait!', 'Could not draw a card. Make sure you have enough cards in your inventory!');
            return;
        }
        try {
            await syncDrawnCardV2(roomId, card);
            if (!isPro) setCardCount(cardCount - 1);
            if (roomData) setRoomData({ ...roomData, current_card: card });
        } catch (e: any) { showAlert('Error', e.message || 'Failed to drawing dare.'); }
    };

    const handleDone = async () => {
        if (!roomId || !activeCard || !userId || !roomData) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowConfetti(true);
        try {
            const actingAsHost = roomData.host_user_id === userId;
            const h = (roomData.host_score ?? 0) + (actingAsHost ? 1 : 0);
            const g = (roomData.guest_score ?? 0) + (!actingAsHost ? 1 : 0);
            const nextTurnId = actingAsHost ? roomData.guest_user_id : roomData.host_user_id;
            if (nextTurnId) { await updateRoomScoreV2(roomId, h, g, nextTurnId); }
            else { await updateRoomScoreV2(roomId, h, g); }
            await clearRoomCardV2(roomId);
            if (roomData) setRoomData({ ...roomData, current_card: null, host_score: h, guest_score: g, current_turn_user_id: nextTurnId || roomData.current_turn_user_id });
            addPoint('both');
            addHistoryEntry({ id: Date.now().toString(), date: new Date().toISOString(), card: activeCard, winner: 'both' });
        } catch {
            showAlert('Update Failed', 'Could not sync score update. Please try again.');
        }
        setTimeout(() => setShowConfetti(false), 3000);
    };

    const handleSkip = async () => {
        if (!roomId || !userId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try { 
            useStore.getState().drawCard();
            await clearRoomCardV2(roomId); 
            if (roomData) setRoomData({ ...roomData, current_card: null });
        } catch (e) { console.warn('Failed to skip dare:', e); }
    };

    const sendReaction = async (emoji: string) => {
        if (!roomId || !userId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try { await sendChatMessageV2(roomId, userId, partner1 || 'Partner', `REACTION:${emoji}`); } catch {}
    };

    const leaveRoom = (skipConfirm: boolean = false) => {
        const performLeave = async () => {
            setLoading(true);
            try {
                // Try to mark as inactive in DB if host
                if (isHost && roomId) {
                    const { supabase } = await import('../../src/services/supabase');
                    await supabase.from('rooms').update({ is_active: false }).eq('code', roomId);
                }
                setRoomId(null); 
                setRoomData(null); 
                setGeneratedCode(null); 
                setIsWaiting(false);
                setIsRoomValidated(false);
                setIsValidatingRoom(false);
                leaveAgora();
            } catch (e) {
                setRoomId(null); // Fallback: clear local state regardless
                setIsRoomValidated(false);
                setIsValidatingRoom(false);
            } finally { setLoading(false); }
        };

        if (skipConfirm) {
            performLeave();
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showAlert('Leave Session', 'Are you sure you want to end this LDR session?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: performLeave },
        ]);
    };

    const handlePaywallSubscribe = async (pkg: any) => {
        try {
            const result = await purchasePackage(pkg);
            if (result.success) {
                useStore.getState().setIsPro(true);
                setShowPaywall(false);
                showAlert('🎉 Welcome to Pro!', 'You now have unlimited access.');
            }
        } catch (e) {
            console.warn('Purchase failed from popup', e);
        }
    };

    const shareCode = async () => {
        if (generatedCode) {
            try { await Share.share({ message: `Join me on Rumbala! Code: ${generatedCode}` }); } catch {}
        }
    };

    if (roomId && isValidatingRoom && !isRoomValidated) {
        return (
            <AnimatedBackground colors={BG_COLORS}>
                <SafeAreaView edges={['top']} style={styles.setupRoot}>
                    <StatusBar barStyle="dark-content" />
                    <View style={[styles.reconnectCard, glassStyles.container]}>
                        <ActivityIndicator size="large" color="#FF6B35" />
                        <Text style={styles.reconnectTitle}>Reconnecting...</Text>
                        <Text style={styles.reconnectSub}>Verifying your last LDR session before joining video.</Text>
                        <TouchableOpacity style={styles.reconnectBtn} onPress={() => leaveRoom(true)}>
                            <Text style={styles.reconnectBtnText}>Skip & go to lobby</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </AnimatedBackground>
        );
    }

    if (!roomId) {
        return (
            <AnimatedBackground colors={BG_COLORS}>
                <SafeAreaView style={styles.setupRoot} edges={['top']}>
                    <StatusBar barStyle="dark-content" />
                    <Animated.View entering={FadeInDown.duration(500)} style={[styles.navBar, glassStyles.header]}>
                        <View style={{ width: 40 }} />
                        <Text style={styles.navTitle}>LDR Mode</Text>
                        <View style={{ width: 40 }} />
                    </Animated.View>
                    <ScrollView contentContainerStyle={styles.setupScroll} showsVerticalScrollIndicator={false}>
                        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.setupHeader}>
                            <View style={styles.setupIconWrap}>
                                <LinearGradient colors={['#2D1B69', '#FF6B35']} style={styles.setupIcon}>
                                    <Ionicons name="heart" size={28} color="#fff" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.setupSubtitle}>Play dares with your partner in real-time, no matter the distance 💕</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[styles.tabRow, glassStyles.container]}>
                            <TouchableOpacity style={[styles.tab, tab === 'create' && styles.tabActive]} onPress={() => setTab('create')}>
                                <Ionicons name="add-circle-outline" size={16} color={tab === 'create' ? '#fff' : '#666'} />
                                <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>Create Room</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tab, tab === 'join' && styles.tabActive]} onPress={() => setTab('join')}>
                                <Ionicons name="enter-outline" size={16} color={tab === 'join' ? '#fff' : '#666'} />
                                <Text style={[styles.tabText, tab === 'join' && styles.tabTextActive]}>Join Room</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {tab === 'create' ? (
                            <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={[styles.card, glassStyles.container]}>
                                <View style={styles.cardBadge}>
                                    <Text style={styles.cardBadgeText}>HOST A SESSION</Text>
                                </View>
                                <Text style={styles.cardHeading}>Start your journey</Text>
                                <Text style={styles.cardDesc}>Choose your connection type and invite your partner to play together in real-time.</Text>
                                
                                <View style={styles.modeGrid}>
                                    <TouchableOpacity 
                                        activeOpacity={0.7}
                                        style={[styles.modeTile, roomType === 'video' && styles.modeTileActive]} 
                                        onPress={() => { 
                                            if (!isPro) {
                                                setShowPaywall(true);
                                                return;
                                            }
                                            setRoomType('video'); 
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
                                        }}
                                    >
                                        <View style={[styles.modeIconBase, roomType === 'video' ? styles.modeIconActive : styles.modeIconInactive]}>
                                            <Ionicons name="videocam" size={24} color={roomType === 'video' ? '#fff' : '#2D1B69'} />
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Text style={[styles.modeTileTitle, roomType === 'video' && styles.modeTileTitleActive]}>Video Call</Text>
                                            {!isPro && <Ionicons name="diamond" size={12} color="#FF6B35" />}
                                        </View>
                                        <Text style={styles.modeTileSub}>{isPro ? 'Face-to-face dares' : 'Premium Feature'}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        activeOpacity={0.7}
                                        style={[styles.modeTile, roomType === 'normal' && styles.modeTileActive]} 
                                        onPress={() => { setRoomType('normal'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                    >
                                        <View style={[styles.modeIconBase, roomType === 'normal' ? styles.modeIconActive : styles.modeIconInactive]}>
                                            <Ionicons name="chatbubbles" size={24} color={roomType === 'normal' ? '#fff' : '#2D1B69'} />
                                        </View>
                                        <Text style={[styles.modeTileTitle, roomType === 'normal' && styles.modeTileTitleActive]}>Text Mode</Text>
                                        <Text style={styles.modeTileSub}>Sync via reactions</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.spacer} />

                                <TouchableOpacity onPress={handleCreateRoom} disabled={loading} activeOpacity={0.85} style={styles.primaryBtnWrap}>
                                    <LinearGradient colors={['#2D1B69', '#5B3FCF']} style={styles.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="sparkles" size={20} color="#fff" />
                                                <Text style={styles.primaryBtnText}>Initialize Room</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        ) : (
                            <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={[styles.card, glassStyles.container]}>
                                <View style={[styles.cardBadge, { backgroundColor: 'rgba(255,107,53,0.1)' }]}>
                                    <Text style={[styles.cardBadgeText, { color: '#FF6B35' }]}>GUEST JOIN</Text>
                                </View>
                                <Text style={styles.cardHeading}>Connect to Partner</Text>
                                <Text style={styles.cardDesc}>Enter the unique code shared by your partner to start your synchronized session.</Text>
                                
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.codeInput}
                                        placeholder="CODE"
                                        placeholderTextColor="rgba(45,27,105,0.2)"
                                        value={joinCode}
                                        onChangeText={t => setJoinCode(t.toUpperCase())}
                                        maxLength={6}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                    />
                                    <View style={styles.inputBgGlow} />
                                </View>

                                <TouchableOpacity onPress={() => handleJoinRoom()} disabled={loading} activeOpacity={0.85} style={styles.primaryBtnWrap}>
                                    <LinearGradient colors={['#FF9800', '#FF6B35']} style={styles.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="enter" size={20} color="#fff" />
                                                <Text style={styles.primaryBtnText}>Join Session</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </ScrollView>
                </SafeAreaView>
                <PaywallModal 
                    visible={showPaywall} 
                    onClose={() => setShowPaywall(false)}
                    onSubscribe={handlePaywallSubscribe}
                />
            </AnimatedBackground>
        );
    }

    if (isWaiting && isHost && !partnerConnected) {
        return (
            <View style={styles.waitRoot}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={['#1a1035', '#2D1B69', '#4A2C8A']} style={StyleSheet.absoluteFill} />
                <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                    <View style={styles.navBar}>
                            <TouchableOpacity onPress={() => leaveRoom()} style={styles.backBtn}>
                            <Ionicons name="close-outline" size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={[styles.navTitle, { color: '#fff' }]}>LDR Session</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <Animated.View entering={FadeIn.duration(600)} style={styles.waitContent}>
                        <View style={styles.pulseContainer}>
                            <View style={[styles.waitIconWrap, { backgroundColor: 'rgba(255,107,53,0.3)' }]}>
                                <Ionicons name="heart" size={48} color="#FF6B35" />
                            </View>
                            <PulseRing />
                        </View>
                        
                        <Text style={styles.waitTitle}>Waiting for connection...</Text>
                        <Text style={styles.waitSubtitle}>Your partner needs this code to join your synchronized world</Text>
                        
                        <View style={styles.codeContainer}>
                            {(generatedCode || '').split('').map((ch: string, i: number) => (
                                <View key={i} style={[styles.codeChar, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                                    <Text style={styles.codeCharText}>{ch}</Text>
                                </View>
                            ))}
                        </View>
                        
                        <TouchableOpacity 
                            style={[styles.shareBtnV2, glassStyles.container, { backgroundColor: 'rgba(255,107,53,0.1)' }]} 
                            onPress={shareCode}
                            activeOpacity={0.7}
                        >
                            <LinearGradient colors={['#FF9800', '#FF6B35']} style={styles.sideGlow} start={{x:0,y:0}} end={{x:1,y:0}} />
                            <Ionicons name="share-social" size={20} color="#FF6B35" />
                            <Text style={styles.shareBtnText}>Share Invitation Code</Text>
                        </TouchableOpacity>

                        <View style={styles.statusIndicator}>
                           <ActivityIndicator color="rgba(255,255,255,0.4)" />
                        </View>

                        <TouchableOpacity style={styles.cancelLink} onPress={() => leaveRoom()}>
                            <Text style={styles.cancelLinkText}>Cancel & Exit Session</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <View style={styles.sessionRoot}>
                <StatusBar barStyle="dark-content" />
                <SafeAreaView edges={['top']}>
                    <Animated.View entering={FadeInDown.duration(500)} style={[styles.navBar, glassStyles.header]}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => leaveRoom()}>
                            <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
                        </TouchableOpacity>
                        <Text style={styles.navTitle}>LDR Mode</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setUseCustomUI(!useCustomUI);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            style={styles.uiToggle}
                        >
                            <Ionicons name={useCustomUI ? "sparkles-outline" : "videocam-outline"} size={22} color={useCustomUI ? "#FF6B35" : "#666"} />
                        </TouchableOpacity>
                    </Animated.View>
                </SafeAreaView>

                {showConfetti && (
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        <LottieView source={require('../../assets/confetti.json')} autoPlay loop={false} style={StyleSheet.absoluteFill} />
                    </View>
                )}

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={[styles.sessionScroll, { paddingTop: 10, paddingBottom: insets.bottom + 16 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {roomData?.room_type === 'video' && (
                        <Animated.View entering={FadeInDown.duration(400)} style={styles.videoSection}>
                            {useCustomUI ? (
                                <View style={styles.videoContainer}>
                                    <PartnerVideoCard 
                                        name={partner2 || 'Partner'} 
                                        isLive={partnerConnected} 
                                        remoteUid={remoteUid} 
                                        isAgoraLoaded={isAgoraLoaded}
                                        AgoraModule={AgoraModule}
                                        roomId={roomId}
                                    />
                                    <SelfVideoCard 
                                        name={partner1 || 'You'} 
                                        isCameraOn={isCameraOn} 
                                        isAgoraLoaded={isAgoraLoaded}
                                        AgoraModule={AgoraModule}
                                        engine={engine}
                                        localUid={localUid}
                                        isJoined={isJoined}
                                        hasLocalVideoFrame={hasLocalVideoFrame}
                                    />
                                </View>
                            ) : (
                                <View style={styles.uikitWrapper}>
                                {isAgoraLoaded && UIKitModule?.default ? (
                                    <UIKitModule.default 
                                        connectionData={{
                                            appId: AGORA_APP_ID,
                                            channel: roomId || 'test',
                                        }}
                                        styleProps={{
                                            UIKitContainer: { height: 400, borderRadius: 20, overflow: 'hidden' },
                                        }}
                                    />
                                ) : (
                                    <View style={[styles.uikitWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                                        <Text style={{ color: '#666' }}>Loading Video Engine...</Text>
                                    </View>
                                )}
                                </View>
                            )}
                        </Animated.View>
                    )}

                    {activeCard ? (
                        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={[styles.dareCard, glassStyles.container, { borderColor: 'rgba(255,107,53,0.3)' }]}>
                            <View style={styles.dareCardHeader}>
                                <View style={styles.dareActiveLabel}>
                                    <View style={styles.dareActiveDot} />
                                    <Text style={styles.dareActiveText}>ACTIVE DARE</Text>
                                </View>
                                <DareTimer seconds={activeCard.timer ?? 45} />
                            </View>
                            <Text style={styles.dareTitle}>"{activeCard.text}"</Text>
                            <Text style={styles.dareDesc}>Complete the dare and tap Done when finished!</Text>
                            <View style={styles.dareActions}>
                                <TouchableOpacity style={[styles.skipBtn, glassStyles.container]} onPress={handleSkip}>
                                    <Ionicons name="play-skip-forward" size={14} color="#FF9800" />
                                    <Text style={styles.skipBtnText}>Skip</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
                                    <LinearGradient colors={['#10B981', '#059669']} style={styles.doneBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                        <Text style={styles.doneBtnText}>Done!</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    ) : (
                        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={[styles.drawPromptCard, glassStyles.container]}>
                            <View style={[styles.turnBar, roomData?.current_turn_user_id === userId ? styles.turnBarActive : styles.turnBarWait]}>
                                <Ionicons name={roomData?.current_turn_user_id === userId ? "flash" : "time-outline"} size={16} color="#fff" />
                                <Text style={styles.turnBarText}>
                                    {roomData?.current_turn_user_id === userId ? 'IT IS YOUR TURN!' : `WAITING FOR ${partner2?.toUpperCase() || 'PARTNER'}...`}
                                </Text>
                            </View>
                            <Text style={styles.drawPromptTitle}>Ready to Play?</Text>
                            <Text style={styles.drawPromptSub}>
                                {roomData?.current_turn_user_id === userId ? 'Draw a dare to start your turn!' : `${partner2 || 'Partner'} is currently picking their dare...`}
                            </Text>
                            {roomData?.current_turn_user_id === userId && (
                                <TouchableOpacity style={styles.drawBtnWrap} onPress={handleDrawDare} activeOpacity={0.85}>
                                    <LinearGradient colors={['#FF9800', '#FF6B35']} style={styles.drawBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                        <Ionicons name="shuffle" size={20} color="#fff" />
                                        <Text style={styles.drawBtnText}>Draw a Dare</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </Animated.View>
                    )}


                    {roomData && (
                        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={[styles.scoreRow, glassStyles.container]}>
                            <View style={styles.scoreItem}>
                                <Text style={styles.scoreName}>{partner1 || 'You'}</Text>
                                <Text style={styles.scoreValue}>{roomData.host_user_id === userId ? (roomData.host_score ?? 0) : (roomData.guest_score ?? 0)}</Text>
                            </View>
                            <View style={styles.scoreVs}><Text style={styles.scoreVsText}>pts</Text></View>
                            <View style={styles.scoreItem}>
                                <Text style={styles.scoreName}>{partner2 || 'Partner'}</Text>
                                <Text style={styles.scoreValue}>{roomData.host_user_id === userId ? (roomData.guest_score ?? 0) : (roomData.host_score ?? 0)}</Text>
                            </View>
                        </Animated.View>
                    )}

                    <Animated.View entering={FadeInUp.delay(350).duration(400)} style={styles.bottomControls}>
                        <View style={[styles.reactionPicker, glassStyles.container]}>
                            {(['❤️', '🔥', '😘', '✨', '🥰'] as const).map(e => (
                                <TouchableOpacity key={e} onPress={() => sendReaction(e)} style={[styles.reactionBtn, glassStyles.container]}>
                                    <Text style={{ fontSize: 24 }}>{e}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.syncBtn} activeOpacity={0.85} onPress={handleManualSync}>
                            <LinearGradient colors={['#FF9800', '#FF6B35']} style={styles.syncBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Ionicons name="sync" size={18} color="#fff" />
                                <Text style={styles.syncBtnText}>Sync Reactions</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.controlBtns}>
                            <TouchableOpacity style={[styles.controlBtn, glassStyles.container]} onPress={() => router.push(`/chat/${roomId}?name=${encodeURIComponent(partner2 || 'Partner')}`)}>
                                <Ionicons name="chatbubbles-outline" size={22} color="#666" />
                                {messages.length > 0 && <View style={styles.chatBadge} />}
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.controlBtn, glassStyles.container]} onPress={() => setIsMuted(!isMuted)}>
                                <Ionicons name={isMuted ? 'mic-off-outline' : 'mic-outline'} size={22} color={isMuted ? '#FF4444' : '#666'} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.controlBtn, glassStyles.container]} onPress={() => setIsCameraOn(!isCameraOn)}>
                                <Ionicons name={isCameraOn ? 'videocam-outline' : 'videocam-off-outline'} size={22} color={isCameraOn ? '#666' : '#999'} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.endCallBtn} onPress={() => leaveRoom(true)}>
                                <Ionicons name="call" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </View>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    setupRoot: { flex: 1, backgroundColor: 'transparent' },
    reconnectCard: { marginTop: 80, marginHorizontal: 20, padding: 24, borderRadius: 20, alignItems: 'center', gap: 12 },
    reconnectTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
    reconnectSub: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18 },
    reconnectBtn: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(255,107,53,0.12)' },
    reconnectBtnText: { color: '#FF6B35', fontWeight: '700' },
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    navTitle: { fontFamily: 'Pacifico_400Regular', fontSize: 20, color: '#1a1a1a' },
    setupScroll: { paddingHorizontal: 20, paddingBottom: 40 },
    setupHeader: { alignItems: 'center', paddingTop: 20, paddingBottom: 28 },
    setupIconWrap: { marginBottom: 14 },
    setupIcon: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    setupSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
    tabRow: { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 20, gap: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 13 },
    tabActive: { backgroundColor: '#2D1B69' },
    tabText: { fontSize: 13, fontWeight: '700', color: '#666' },
    tabTextActive: { color: '#fff' },
    card: { borderRadius: 24, padding: 24 },
    cardHeading: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 8 },
    cardDesc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 20 },
    featureList: { gap: 10, marginBottom: 24 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35' },
    featureText: { fontSize: 14, color: '#444', fontWeight: '600' },
    primaryBtnWrap: { borderRadius: 14, overflow: 'hidden' },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    codeInput: { backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 14, borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 20, paddingVertical: 16, fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: 8, color: '#2D1B69', marginBottom: 20 },

    waitRoot: { flex: 1 },
    waitContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    pulseContainer: { marginBottom: 32, alignItems: 'center', justifyContent: 'center' },
    waitIconWrap: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    pulseRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: 'rgba(255,107,53,0.2)', zIndex: 1 },
    waitTitle: { fontFamily: 'Pacifico_400Regular', fontSize: 32, color: '#fff', marginBottom: 12, textAlign: 'center' },
    waitSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 40, textAlign: 'center', lineHeight: 20 },
    codeContainer: { flexDirection: 'row', gap: 10, marginBottom: 48 },
    codeChar: { width: 48, height: 60, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    codeCharText: { fontSize: 28, fontWeight: '900', color: '#fff' },
    shareBtnV2: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, paddingHorizontal: 28, paddingVertical: 18, marginBottom: 24, overflow: 'hidden' },
    sideGlow: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, opacity: 0.8 },
    shareBtnText: { color: '#FF6B35', fontSize: 16, fontWeight: '800' },
    statusIndicator: { height: 60, justifyContent: 'center' },
    cancelLink: { marginTop: 32, padding: 10 },
    cancelLinkText: { color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },

    sessionRoot: { flex: 1, backgroundColor: 'transparent' },
    sessionScroll: { paddingHorizontal: 16, gap: 12 },
    uiToggle: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    videoSection: { width: '100%', marginBottom: 8 },
    videoContainer: { gap: 12 },
    cardBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(45,27,105,0.08)', marginBottom: 16 },
    cardBadgeText: { fontSize: 10, fontWeight: '900', color: '#2D1B69', letterSpacing: 1 },
    modeGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    modeTile: { flex: 1, padding: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center' },
    modeTileActive: { backgroundColor: 'rgba(45,27,105,0.05)', borderColor: 'rgba(45,27,105,0.2)' },
    modeIconBase: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    modeIconActive: { backgroundColor: '#2D1B69' },
    modeIconInactive: { backgroundColor: 'rgba(45,27,105,0.08)' },
    modeTileTitle: { fontSize: 14, fontWeight: '800', color: '#2D1B69', marginBottom: 2 },
    modeTileTitleActive: { color: '#2D1B69' },
    modeTileSub: { fontSize: 10, color: '#666', fontWeight: '500' },
    spacer: { height: 4 },
    inputWrapper: { position: 'relative', marginBottom: 24, padding: 4 },
    inputBgGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28, backgroundColor: 'rgba(255,107,53,0.05)', zIndex: -1 },
    uikitWrapper: {
        height: 400,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 12,
    },
    dareCard: { borderRadius: 22, padding: 20 },
    dareCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    dareActiveLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dareActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35' },
    dareActiveText: { fontSize: 11, fontWeight: '900', color: '#FF6B35', letterSpacing: 1 },
    dareTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 8, fontStyle: 'italic' },
    dareDesc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 18 },
    dareActions: { flexDirection: 'row', gap: 10 },
    skipBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 12 },
    skipBtnText: { fontSize: 14, fontWeight: '700', color: '#FF9800' },
    doneBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
    doneBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
    doneBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

    drawPromptCard: { borderRadius: 22, padding: 24, alignItems: 'center' },
    drawPromptTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 8 },
    drawPromptSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    drawBtnWrap: { width: '100%', borderRadius: 14, overflow: 'hidden' },
    drawBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    drawBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    scoreRow: { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    scoreItem: { alignItems: 'center', gap: 4 },
    scoreName: { fontSize: 12, fontWeight: '700', color: '#888' },
    scoreValue: { fontSize: 28, fontWeight: '900', color: '#1a1a1a' },
    scoreVs: { alignItems: 'center' },
    scoreVsText: { fontSize: 12, color: '#bbb', fontWeight: '600' },

    bottomControls: { gap: 12 },
    syncBtn: { borderRadius: 16, overflow: 'hidden' },
    syncBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18 },
    syncBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    controlBtns: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
    controlBtn: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
    endCallBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FF4444', justifyContent: 'center', alignItems: 'center' },

    reactionsOverlay: { position: 'absolute', bottom: 300, left: 0, right: 0, height: 100, pointerEvents: 'none' },
    reactionBubble: { position: 'absolute', bottom: 0 },
    reactionPicker: { flexDirection: 'row', justifyContent: 'center', gap: 10, padding: 12, borderRadius: 24, marginBottom: 8 },
    reactionBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

    modeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    modeBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', gap: 8 },
    modeBtnActive: { backgroundColor: '#2D1B69' },
    modeBtnText: { fontSize: 14, fontWeight: '700', color: '#2D1B69' },
    modeBtnTextActive: { color: '#fff' },

    turnBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, borderRadius: 12, marginBottom: 16 },
    turnBarActive: { backgroundColor: '#FF6B35' },
    turnBarWait: { backgroundColor: '#A8A8C0' },
    turnBarText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

    vibeFiltersScroll: { paddingVertical: 10, gap: 8, marginTop: 10 },
    vibePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', borderWidth: 1, borderColor: 'transparent' },
    vibePillActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
    vibePillText: { fontSize: 10, fontWeight: '800', color: '#666' },
    vibePillTextActive: { color: '#fff' },

    chatBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B35', borderWidth: 1.5, borderColor: '#fff' },
});
``


## D:\Rumbala\app\(tabs)\pro.tsx
``tsx

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, useWindowDimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';



const BG_COLORS = ['#FDFCFB', '#FFE4E1', '#E6E6FA']; // Soft, premium profile base

const getRelativeTime = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return 'Unknown';
    }
};

export default function CoupleProfileScreen() {
    const router = useRouter();
    const { partner1, partner2, scores, history, isPro, userId, loadScoresFromSupabase } = useStore(useShallow(state => ({
        partner1: state.partner1,
        partner2: state.partner2,
        scores: state.scores,
        history: state.history,
        isPro: state.isPro,
        userId: state.userId,
        loadScoresFromSupabase: state.loadScoresFromSupabase,
    })));

    useEffect(() => {
        if (userId) {
            loadScoresFromSupabase(userId).catch(() => {});
        }
    }, [userId, loadScoresFromSupabase]);

    const { width } = useWindowDimensions();
    const isCompact = width < 370;
    const memoryCardWidth = isCompact ? width - 40 : (width - 52) / 2;

    const profileInsights = useMemo(() => {
        const p1Wins = scores.partner1 || 0;
        const p2Wins = scores.partner2 || 0;
        const totalPoints = p1Wins + p2Wins;
        const oldestHistory = history.length > 0 ? history[history.length - 1] : null;
        const togetherSince = oldestHistory
            ? new Date(oldestHistory.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : 'Recently';

        const typeCount = history.reduce<Record<string, number>>((acc, entry) => {
            const cardType = entry.card?.type || 'fun';
            acc[cardType] = (acc[cardType] || 0) + 1;
            return acc;
        }, {});
        const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        const vibeLabelMap: Record<string, string> = {
            fun: 'Fun',
            romantic: 'Romantic',
            spicy: 'Spicy',
            ldr: 'LDR',
        };

        const winDelta = Math.abs(p1Wins - p2Wins);
        const balanceLabel = winDelta <= 2 ? 'Perfectly Balanced' : p1Wins > p2Wins ? `${partner1 || 'You'} leading` : `${partner2 || 'Partner'} leading`;

        return {
            totalPoints,
            togetherSince,
            topVibe: topType ? vibeLabelMap[topType] : 'Not enough data',
            memories: history.length,
            balanceLabel,
            p1Wins,
            p2Wins,
        };
    }, [history, scores.partner1, scores.partner2, partner1, partner2]);

    const statCards = [
        {
            id: 'points',
            label: 'RUMBLE POINTS',
            value: profileInsights.totalPoints.toLocaleString(),
            icon: 'diamond' as const,
            helper: profileInsights.totalPoints > 0 ? '✨ Keep shining!' : '🎁 Start playing!',
        },
        {
            id: 'memories',
            label: 'MEMORIES',
            value: String(profileInsights.memories),
            icon: 'images' as const,
            helper: profileInsights.memories > 0 ? '📸 Captured moments' : 'Capture your first memory',
        },
    ];

    const detailChips = [
        { id: 'since', icon: 'calendar-outline' as const, label: 'Together Since', value: profileInsights.togetherSince },
        { id: 'vibe', icon: 'heart-outline' as const, label: 'Most Played Vibe', value: profileInsights.topVibe },
        { id: 'balance', icon: 'stats-chart-outline' as const, label: 'Win Balance', value: profileInsights.balanceLabel },
        { id: 'tier', icon: 'diamond-outline' as const, label: 'Plan', value: isPro ? 'Pro Couple' : 'Free Couple' },
    ];

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)');
        }
    };

    const getCardIcon = (type: string) => {
        switch (type) {
            case 'fun': return '🎈';
            case 'romantic': return '💖';
            case 'spicy': return '🌶️';
            case 'ldr': return '✈️';
            default: return '✨';
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />
                
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, glassStyles.header]}>
                    <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Couple Profile</Text>
                    <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerBtn}>
                        <Ionicons name="settings-sharp" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                </Animated.View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Profile Section */}
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarWrapper}>
                                <View style={[styles.avatarCircle, { backgroundColor: '#FF6B35', zIndex: 2 }]}>
                                    <Text style={styles.avatarInitial}>{partner1?.[0]?.toUpperCase() || 'P'}</Text>
                                </View>
                                <View style={[styles.avatarCircle, styles.avatarOverlap, { backgroundColor: '#2D1B69', zIndex: 1 }]}>
                                    <Text style={styles.avatarInitial}>{partner2?.[0]?.toUpperCase() || 'P'}</Text>
                                </View>
                            </View>
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="heart" size={16} color="#fff" />
                            </View>
                        </View>
                        <View style={styles.nameSection}>
                            <Text style={styles.coupleName}>{partner1 || 'Partner 1'}</Text>
                            <Ionicons name="heart" size={20} color="#FF6B35" style={{ marginHorizontal: 8 }} />
                            <Text style={styles.coupleName}>{partner2 || 'Partner 2'}</Text>
                        </View>
                        <View style={styles.sinceRow}>
                            <Ionicons name="calendar-outline" size={16} color="#FF6F43" />
                            <Text style={styles.sinceText}>TOGETHER SINCE {profileInsights.togetherSince.toUpperCase()}</Text>
                        </View>
                    </Animated.View>

                    {/* Stats Row */}
                    <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.statsRow}>
                        {statCards.map((card) => (
                            <View key={card.id} style={[styles.statCard, glassStyles.container]}>
                                <View style={styles.statHeader}>
                                    <Text style={styles.statLabel}>{card.label}</Text>
                                    <View style={styles.statIconBox}>
                                        <Ionicons name={card.icon} size={20} color="#FF6B35" />
                                    </View>
                                </View>
                                <Text style={styles.statValue}>{card.value}</Text>
                                <Text style={styles.statTrend}>{card.helper}</Text>
                            </View>
                        ))}
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(280).duration(500)} style={[styles.detailCard, glassStyles.container]}>
                        <Text style={styles.detailTitle}>Relationship Details</Text>
                        <View style={styles.detailGrid}>
                            {detailChips.map((item) => (
                                <View key={item.id} style={styles.detailChip}>
                                    <View style={styles.detailChipIcon}>
                                        <Ionicons name={item.icon} size={16} color="#FF6B35" />
                                    </View>
                                    <View style={styles.detailChipTextWrap}>
                                        <Text style={styles.detailChipLabel}>{item.label}</Text>
                                        <Text style={styles.detailChipValue} numberOfLines={1}>{item.value}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </Animated.View>

                    {/* Memories Section */}
                    <View style={styles.memoriesHeader}>
                        <Text style={styles.sectionTitle}>Our Memories</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                            <Text style={styles.seeAll}>See All <Ionicons name="chevron-forward" size={12} /></Text>
                        </TouchableOpacity>
                    </View>

                    <Animated.View entering={FadeInUp.delay(400).duration(600)} style={[styles.grid, isCompact && styles.gridCompact]}>
                        {history.length > 0 ? (
                            history.slice(0, 4).map((entry, idx) => (
                                <TouchableOpacity key={entry.id} style={[styles.memoryItem, glassStyles.container, { width: memoryCardWidth }]}> 
                                    {entry.proofUri ? (
                                        <Image source={{ uri: entry.proofUri }} style={StyleSheet.absoluteFill} />
                                    ) : (
                                        <View style={styles.placeholderPlant}>
                                            <Text style={{ fontSize: 40 }}>{getCardIcon(entry.card.type)}</Text>
                                        </View>
                                    )}
                                    <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']} style={styles.memoryOverlay} />
                                    <View style={styles.memoryContent}>
                                        <Text style={styles.memoryTitle} numberOfLines={1}>{entry.card.text}</Text>
                                        <Text style={styles.memoryDate}>{getRelativeTime(entry.date)}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyMemories}>
                                <Ionicons name="images-outline" size={48} color="rgba(0,0,0,0.1)" />
                                <Text style={styles.emptyText}>No memories yet. Draw a card and finish a dare to see it here!</Text>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16,
    },
    headerTitle: { fontSize: 24, fontFamily: 'Pacifico_400Regular', color: '#1a1a1a', paddingRight: 10 },
    headerBtn: { padding: 8 },

    profileSection: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
    avatarContainer: { position: 'relative', marginBottom: 20, alignSelf: 'center' },
    avatarWrapper: { flexDirection: 'row', alignItems: 'center' },
    avatarCircle: {
        width: 100, height: 100, borderRadius: 50,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 4, borderColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
    },
    avatarOverlap: { marginLeft: -40 },
    avatarInitial: { color: '#fff', fontSize: 36, fontWeight: '900' },
    nameSection: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    verifiedBadge: {
        position: 'absolute', bottom: -5, right: 10,
        backgroundColor: '#FF6B35', width: 32, height: 32,
        borderRadius: 16, borderWidth: 3, borderColor: '#fff',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
        zIndex: 10,
    },
    coupleName: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.5 },
    sinceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    sinceText: { fontSize: 13, fontWeight: '700', color: '#667085', letterSpacing: 0.5 },

    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginBottom: 20 },
    statCard: {
        flex: 1, padding: 20, borderRadius: 24,
    },
    statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    statLabel: { fontSize: 12, fontWeight: '800', color: '#444', letterSpacing: 0.5, lineHeight: 16, flexShrink: 1 },
    statIconBox: { width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 32, fontWeight: '900', color: '#1a1a1a', marginTop: 15 },
    statTrend: { fontSize: 12, fontWeight: '700', color: '#10B981', marginTop: 8, lineHeight: 16 },

    detailCard: {
        borderRadius: 24,
        marginHorizontal: 20,
        padding: 18,
        marginBottom: 24,
    },
    detailTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'space-between',
    },
    detailChip: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    detailChipIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,107,53,0.1)',
        marginRight: 10,
    },
    detailChipTextWrap: {
        flex: 1,
        minWidth: 0,
    },
    detailChipLabel: {
        fontSize: 11,
        color: '#888',
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    detailChipValue: {
        fontSize: 13,
        color: '#1a1a1a',
        fontWeight: '800',
        marginTop: 2,
    },

    memoriesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
    sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.5 },
    seeAll: { fontSize: 14, fontWeight: '700', color: '#FF6B35' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
    gridCompact: { flexDirection: 'column' },
    memoryItem: {
        height: 220,
        borderRadius: 24, overflow: 'hidden',
    },
    memoryOverlay: { ...StyleSheet.absoluteFillObject },
    memoryContent: { position: 'absolute', bottom: 15, left: 15, right: 15 },
    memoryTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 2 },
    memoryDate: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },

    placeholderPlant: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
    emptyMemories: { width: '100%', paddingVertical: 40, alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20, paddingHorizontal: 40 },
});
``


## D:\Rumbala\app\(tabs)\settings.tsx
``tsx

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Modal, FlatList, useWindowDimensions, StatusBar,
    ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore, HistoryEntry } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeInDown
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/services/supabase';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';
import { sendFeedback, sendBugReport } from '../../src/services/api';
import { getPurchaseHistory, PurchaseHistoryRecord } from '../../src/services/revenueCatService';

const BG_COLORS = ['#F5F0F0', '#EED9C4', '#D4E2D4'];

export default function SettingsScreen() {
    const router = useRouter();
    const { partner1, partner2, setPartner1, setPartner2, scores, cardCount, logout, history, selectedVibe, isPro, showAlert, userEmail, userId } = useStore(useShallow(state => ({
        partner1: state.partner1,
        partner2: state.partner2,
        setPartner1: state.setPartner1,
        setPartner2: state.setPartner2,
        scores: state.scores,
        cardCount: state.cardCount,
        logout: state.logout,
        history: state.history,
        selectedVibe: state.selectedVibe,
        isPro: state.isPro,
        showAlert: state.showAlert,
        userEmail: state.userEmail,
        userId: state.userId
    })));
    const { width } = useWindowDimensions();

    const wins = scores?.partner1 || 0;
    const partnerWins = scores?.partner2 || 0;
    const totalGames = wins + partnerWins;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const displayPartner1 = partner1?.trim() || 'You';
    const displayPartner2 = partner2?.trim() || 'Partner';

    const [showEditModal, setShowEditModal] = useState(false);
    const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
    const [editPartner1, setEditPartner1] = useState(partner1 || '');
    const [editPartner2, setEditPartner2] = useState(partner2 || '');

    const [memberSince, setMemberSince] = useState<string | null>(null);

    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [loadingFeedback, setLoadingFeedback] = useState(false);

    const [showBugModal, setShowBugModal] = useState(false);
    const [bugMessage, setBugMessage] = useState('');
    const [loadingBug, setLoadingBug] = useState(false);
    const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryRecord[]>([]);
    const [loadingPurchaseHistory, setLoadingPurchaseHistory] = useState(false);

    useEffect(() => {
        const fetchUserInfo = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                if (data.user.created_at) {
                    const date = new Date(data.user.created_at);
                    setMemberSince(date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
                }
            }
        };
        fetchUserInfo();
    }, []);

    useEffect(() => {
        if (!showPurchaseHistory) return;
        let isCancelled = false;

        const loadPurchaseHistory = async () => {
            setLoadingPurchaseHistory(true);
            const records = await getPurchaseHistory();
            if (!isCancelled) {
                setPurchaseHistory(records);
                setLoadingPurchaseHistory(false);
            }
        };

        loadPurchaseHistory();

        return () => {
            isCancelled = true;
        };
    }, [showPurchaseHistory]);

    const handleSaveProfile = () => {
        if (!editPartner1.trim()) {
            showAlert('Error', 'Please enter your name to update your profile.');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPartner1(editPartner1.trim());
        setPartner2(editPartner2.trim());
        setShowEditModal(false);
        showAlert('Success', 'Profile updated! 💖');
    };

    const handleLogout = () => {
        showAlert('Logout', 'Are you sure you want to log out of your account?', [
            { text: 'Logout', style: 'destructive', onPress: confirmLogout },
            { text: 'Cancel', style: 'cancel' }
        ]);
    };

    const confirmLogout = async () => {
        try {
            logout();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/login');
        } catch {
            showAlert('Error', 'Failed to logout. Please try again.');
        }
    };

    const handleSendFeedback = async () => {
        if (!feedbackMessage.trim()) {
            showAlert('Error', 'Please enter a message before sending.');
            return;
        }
        setLoadingFeedback(true);
        try {
            await sendFeedback(userId, userEmail, feedbackMessage.trim(), feedbackRating);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowFeedbackModal(false);
            setFeedbackMessage('');
            setFeedbackRating(5);
            showAlert('Thank You!', 'Your feedback helps us make Rumbala better for everyone. 💖');
        } catch (e) {
            showAlert('Error', 'Failed to send feedback. Please check your connection.');
        } finally {
            setLoadingFeedback(false);
        }
    };

    const handleSendBugReport = async () => {
        if (!bugMessage.trim()) {
            showAlert('Error', 'Please describe the bug first.');
            return;
        }
        setLoadingBug(true);
        try {
            const deviceInfo = {
                platform: 'app',
                width,
                vibe: selectedVibe,
                timestamp: new Date().toISOString()
            };
            await sendBugReport(userId, userEmail || 'anonymous', bugMessage.trim(), deviceInfo);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowBugModal(false);
            setBugMessage('');
            showAlert('Report Sent', 'Our tech team will look into this immediately. 🛠️');
        } catch (e) {
            showAlert('Error', 'Failed to send report. Please try again.');
        } finally {
            setLoadingBug(false);
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Nav */}
                    <View style={styles.navBar}>
                        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, glassStyles.container]}>
                            <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
                        </TouchableOpacity>
                        <Text style={styles.navTitle}>Settings</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* ─── Profile Hero Card ─── */}
                    <Animated.View entering={FadeInDown.duration(500)} style={[styles.profileCard, glassStyles.container]}>
                        <LinearGradient
                            colors={['rgba(255, 107, 53, 0.8)', 'rgba(255, 140, 0, 0.6)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.profileGradient}
                        >
                            <TouchableOpacity
                                style={[styles.editProfileBtn, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setEditPartner1(partner1 || '');
                                    setEditPartner2(partner2 || '');
                                    setShowEditModal(true);
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="create-outline" size={18} color="#fff" />
                            </TouchableOpacity>

                            <View style={styles.avatarRing}>
                                <LinearGradient
                                    colors={['#FFB6C1', '#FFC0CB']}
                                    style={styles.avatarInner}
                                >
                                    <Text style={styles.avatarEmoji}>💕</Text>
                                </LinearGradient>
                            </View>

                            <Text style={styles.coupleLabel}>Your Couple</Text>
                            <Text style={styles.coupleNames}>{partner1} & {partner2}</Text>

                            {selectedVibe && (
                                <View style={[styles.vibeBadge, glassStyles.container]}>
                                    <Text style={styles.vibeEmoji}>
                                        {selectedVibe === 'fun' ? '✨' : selectedVibe === 'romantic' ? '❤️' : '🔥'}
                                    </Text>
                                    <Text style={styles.vibeName}>
                                        {selectedVibe.charAt(0).toUpperCase() + selectedVibe.slice(1)} Vibe
                                    </Text>
                                </View>
                            )}

                            <View style={[styles.profileStatsRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                                <View style={styles.profileStatItem}>
                                    <Text style={styles.profileStatValue}>{totalGames}</Text>
                                    <Text style={styles.profileStatLabel}>Games</Text>
                                </View>
                                <View style={styles.profileStatDivider} />
                                <View style={styles.profileStatItem}>
                                    <Text style={styles.profileStatValue}>{winRate}%</Text>
                                    <Text style={styles.profileStatLabel}>Win Rate</Text>
                                </View>
                                <View style={styles.profileStatDivider} />
                                <View style={styles.profileStatItem}>
                                    <Text style={styles.profileStatValue}>{wins}</Text>
                                    <Text style={styles.profileStatLabel}>{displayPartner1.split(' ')[0]}</Text>
                                </View>
                                <View style={styles.profileStatDivider} />
                                <View style={styles.profileStatItem}>
                                    <Text style={styles.profileStatValue}>{partnerWins}</Text>
                                    <Text style={styles.profileStatLabel}>{displayPartner2.split(' ')[0]}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* ─── Account Info Section ─── */}
                    <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
                        <Text style={styles.sectionLabel}>ACCOUNT INFO</Text>
                        <View style={[styles.card, glassStyles.container]}>
                            <TouchableOpacity
                                style={styles.infoRow}
                                onPress={() => {
                                    if (userEmail) { showAlert('Your Email', userEmail); }
                                }}
                                activeOpacity={0.6}
                            >
                                <View style={[styles.settingIcon, glassStyles.container, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                                    <Ionicons name="mail-outline" size={22} color="#6366F1" />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Email</Text>
                                    <Text style={styles.settingSubtitle}>{userEmail || 'Loading...'}</Text>
                                </View>
                                <Ionicons name="copy-outline" size={16} color="#aaa" />
                            </TouchableOpacity>

                            <View style={styles.rowDivider} />

                            <View style={styles.infoRow}>
                                <View style={[styles.settingIcon, glassStyles.container, { backgroundColor: isPro ? 'rgba(255, 107, 53, 0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                    <Ionicons name={isPro ? 'diamond' : 'person-outline'} size={22} color={isPro ? '#FF6B35' : '#888'} />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Plan</Text>
                                    <Text style={[styles.settingSubtitle, isPro && { color: '#FF6B35', fontWeight: '800' }]}>
                                        {isPro ? '⭐ Pro Member' : 'Free Account'}
                                    </Text>
                                </View>
                                {isPro && (
                                    <View style={styles.proBadge}>
                                        <Text style={styles.proBadgeText}>PRO</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.rowDivider} />

                            <View style={styles.infoRow}>
                                <View style={[styles.settingIcon, glassStyles.container, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                    <Ionicons name="calendar-outline" size={22} color="#10B981" />
                                </View>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Member Since</Text>
                                    <Text style={styles.settingSubtitle}>{memberSince || 'Loading...'}</Text>
                                </View>
                            </View>

                            {userEmail?.toLowerCase() === 'adminhr@andx.com' && (
                                <>
                                    <View style={styles.rowDivider} />
                                    <TouchableOpacity 
                                        style={styles.infoRow}
                                        onPress={() => router.push('/admin')}
                                    >
                                        <View style={[styles.settingIcon, glassStyles.container, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                                            <Ionicons name="shield-checkmark-outline" size={22} color="#FF6B35" />
                                        </View>
                                        <View style={styles.settingInfo}>
                                            <Text style={[styles.settingTitle, { color: '#FF6B35' }]}>Admin Portal</Text>
                                            <Text style={styles.settingSubtitle}>Manage app & view feedback</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color="#FF6B35" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </Animated.View>

                    {/* ─── Profile Section ─── */}
                    <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
                        <Text style={styles.sectionLabel}>PROFILE</Text>
                        <View style={[styles.card, glassStyles.container]}>
                            <SettingItem
                                icon="people-outline" iconColor="#FF6B35" title="Edit Partner Names" subtitle="Update your couple names"
                                onPress={() => { setEditPartner1(partner1 || ''); setEditPartner2(partner2 || ''); setShowEditModal(true); }}
                            />
                            <View style={styles.rowDivider} />
                            <SettingItem
                                icon="heart-circle-outline" iconColor="#FF9800" title="Change Vibe" subtitle={selectedVibe ? `Currently: ${selectedVibe}` : 'Set your vibe'}
                                onPress={() => showAlert('Coming Soon', 'Vibe settings coming soon!')}
                            />
                        </View>
                    </Animated.View>

                    {/* ─── Account Section ─── */}
                    <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.section}>
                        <Text style={styles.sectionLabel}>ACCOUNT</Text>
                        <View style={[styles.card, glassStyles.container]}>
                            <SettingItem
                                icon="calendar-outline" iconColor="#FF9800" title="Game History" subtitle="View your memory lane"
                                onPress={() => router.push('/(tabs)/history')}
                            />
                            <View style={styles.rowDivider} />
                            <SettingItem
                                icon="receipt-outline" iconColor="#7C3AED" title="Purchase History" subtitle="View your card packs"
                                onPress={() => setShowPurchaseHistory(true)}
                            />
                            <View style={styles.rowDivider} />
                            <SettingItem
                                icon="chatbubble-ellipses-outline" iconColor="#10B981" title="Give Feedback" subtitle="Tell us what you think"
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setShowFeedbackModal(true);
                                }}
                            />
                            <View style={styles.rowDivider} />
                            <SettingItem
                                icon="bug-outline" iconColor="#EF4444" title="Report a Bug" subtitle="Something not working right?"
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setShowBugModal(true);
                                }}
                            />
                        </View>
                    </Animated.View>

                    {/* ─── Logout ─── */}
                    <Animated.View entering={FadeInDown.delay(300).duration(500)}>
                        <TouchableOpacity style={[styles.logoutBtn, glassStyles.container, { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={handleLogout} activeOpacity={0.8}>
                            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Edit Profile Modal */}
                <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
                    <TouchableWithoutFeedback onPress={() => { setShowEditModal(false); Keyboard.dismiss(); }}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <KeyboardAvoidingView 
                                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                                    style={{ width: '100%' }}
                                >
                            <Animated.View entering={FadeInDown} style={styles.modalSheet}>
                                <View style={styles.modalHandle} />
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Edit Profile</Text>
                                    <TouchableOpacity onPress={() => setShowEditModal(false)} style={[styles.modalCloseBtn, glassStyles.container]}>
                                        <Ionicons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.modalBody}>
                                    <Text style={styles.inputLabel}>Your Name</Text>
                                    <TextInput
                                        style={[styles.textInput, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.03)' }]} value={editPartner1} onChangeText={setEditPartner1}
                                        placeholder="Enter your name" placeholderTextColor="#999"
                                    />
                                    <Text style={[styles.inputLabel, { marginTop: 20 }]}>Partner's Name</Text>
                                    <TextInput
                                        style={[styles.textInput, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.03)' }]} value={editPartner2} onChangeText={setEditPartner2}
                                        placeholder="Enter partner's name" placeholderTextColor="#999"
                                    />
                                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} activeOpacity={0.8}>
                                        <LinearGradient colors={['#FF6B35', '#FF9800']} style={styles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                            <Text style={styles.saveBtnText}>Save Changes</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </ScrollView>
                            </Animated.View>
                        </KeyboardAvoidingView>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                <Modal visible={showPurchaseHistory} animationType="slide" transparent onRequestClose={() => setShowPurchaseHistory(false)}>
                    <TouchableWithoutFeedback onPress={() => setShowPurchaseHistory(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <Animated.View entering={FadeInDown} style={styles.modalSheet}>
                            <View style={styles.modalHandle} />
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Purchase History</Text>
                                <TouchableOpacity onPress={() => setShowPurchaseHistory(false)} style={[styles.modalCloseBtn, glassStyles.container]}>
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>
                            {loadingPurchaseHistory ? (
                                <View style={styles.purchaseEmptyWrap}>
                                    <ActivityIndicator size="small" color="#7C3AED" />
                                    <Text style={styles.purchaseSub}>Loading purchases...</Text>
                                </View>
                            ) : purchaseHistory.length === 0 ? (
                                <View style={styles.purchaseEmptyWrap}>
                                    <Ionicons name="receipt-outline" size={28} color="#bbb" />
                                    <Text style={styles.purchaseSub}>No purchases found yet.</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={purchaseHistory}
                                    keyExtractor={i => i.id}
                                    contentContainerStyle={{ padding: 20 }}
                                    renderItem={({ item }) => (
                                        <View style={[styles.purchaseItem, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]} 
                                        > 
                                            <View style={[styles.purchaseIcon, glassStyles.container, { backgroundColor: item.type === 'subscription' ? 'rgba(255, 107, 53, 0.12)' : 'rgba(124, 58, 237, 0.12)' }]} 
                                            > 
                                                <Ionicons name={item.type === 'subscription' ? 'diamond' : 'bag-check'} size={22} color={item.type === 'subscription' ? '#FF6B35' : '#7C3AED'} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.purchaseTitle} numberOfLines={1}>{item.title}</Text>
                                                <Text style={styles.purchaseSub}>{new Date(item.date).toLocaleDateString()}</Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={styles.purchasePrice}>{item.price}</Text>
                                                <Text style={styles.purchaseSub}>{item.type === 'consumable' ? `+${item.cardsAdded || 0} cards` : 'Subscription'}</Text>
                                            </View>
                                        </View>
                                    )}
                                />
                            )}
                        </Animated.View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                <Modal visible={showFeedbackModal} animationType="slide" transparent onRequestClose={() => setShowFeedbackModal(false)}>
                    <TouchableWithoutFeedback onPress={() => { setShowFeedbackModal(false); Keyboard.dismiss(); }}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <KeyboardAvoidingView 
                                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                                    style={{ width: '100%' }}
                                >
                            <Animated.View entering={FadeInDown} style={styles.modalSheet}>
                                <View style={styles.modalHandle} />
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Your Feedback</Text>
                                    <TouchableOpacity onPress={() => setShowFeedbackModal(false)} style={[styles.modalCloseBtn, glassStyles.container]}>
                                        <Ionicons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                    <Text style={styles.inputLabel}>How would you rate Rumbala?</Text>
                                    <View style={styles.ratingRow}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <TouchableOpacity key={star} onPress={() => setFeedbackRating(star)}>
                                                <Ionicons 
                                                    name={star <= feedbackRating ? "star" : "star-outline"} 
                                                    size={36} 
                                                    color={star <= feedbackRating ? "#FF9800" : "#ccc"} 
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={[styles.inputLabel, { marginTop: 24 }]}>Share your thoughts...</Text>
                                    <TextInput
                                        style={[styles.textArea, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.03)' }]} 
                                        value={feedbackMessage} 
                                        onChangeText={setFeedbackMessage}
                                        placeholder="Found a bug? Have a suggestion? We'd love to hear it!" 
                                        placeholderTextColor="#999"
                                        multiline
                                        numberOfLines={4}
                                    />
                                    <TouchableOpacity 
                                        style={[styles.saveBtn, loadingFeedback && { opacity: 0.7 }]} 
                                        onPress={handleSendFeedback} 
                                        activeOpacity={0.8}
                                        disabled={loadingFeedback}
                                    >
                                        <LinearGradient colors={['#FF6B35', '#FF9800']} style={styles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                            {loadingFeedback ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.saveBtnText}>Submit Feedback</Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </ScrollView>
                            </Animated.View>
                        </KeyboardAvoidingView>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                <Modal visible={showBugModal} animationType="slide" transparent onRequestClose={() => setShowBugModal(false)}>
                    <TouchableWithoutFeedback onPress={() => { setShowBugModal(false); Keyboard.dismiss(); }}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <KeyboardAvoidingView 
                                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                                    style={{ width: '100%' }}
                                >
                            <Animated.View entering={FadeInDown} style={styles.modalSheet}>
                                <View style={styles.modalHandle} />
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Report a Bug</Text>
                                    <TouchableOpacity onPress={() => setShowBugModal(false)} style={[styles.modalCloseBtn, glassStyles.container]}>
                                        <Ionicons name="close" size={24} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                    <Text style={styles.inputLabel}>What went wrong? 🛠️</Text>
                                    <TextInput
                                        style={[styles.textArea, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.03)' }]} 
                                        value={bugMessage} 
                                        onChangeText={setBugMessage}
                                        placeholder="Describe the issue... (e.g. App crashed when I clicked shop)" 
                                        placeholderTextColor="#999"
                                        multiline
                                        numberOfLines={6}
                                    />
                                    <TouchableOpacity 
                                        style={[styles.saveBtn, loadingBug && { opacity: 0.7 }]} 
                                        onPress={handleSendBugReport} 
                                        activeOpacity={0.8}
                                        disabled={loadingBug}
                                    >
                                        <LinearGradient colors={['#EF4444', '#B91C1C']} style={styles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                            {loadingBug ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.saveBtnText}>Send Bug Report</Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 15, fontStyle: 'italic', marginBottom: 20 }}>
                                        Technical data like device dimensions and current vibe will be included.
                                    </Text>
                                </ScrollView>
                            </Animated.View>
                        </KeyboardAvoidingView>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

            </SafeAreaView>
        </AnimatedBackground>
    );
}

function SettingItem({ icon, iconColor, title, subtitle, onPress }: {
    icon: string; iconColor: string; title: string; subtitle: string; onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.settingRow} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} activeOpacity={0.6}>
            <View style={[styles.settingIcon, glassStyles.container, { backgroundColor: `${iconColor}15` }]}>
                <Ionicons name={icon as any} size={22} color={iconColor} />
            </View>
            <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingSubtitle}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },

    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginBottom: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    navTitle: { fontFamily: 'Pacifico_400Regular', fontSize: 24, color: '#1a1a1a' },

    profileCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 24, padding: 0 },
    profileGradient: { paddingTop: 28, paddingBottom: 24, paddingHorizontal: 20, alignItems: 'center' },
    editProfileBtn: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    avatarRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', padding: 3, marginBottom: 14 },
    avatarInner: { flex: 1, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    avatarEmoji: { fontSize: 36 },
    coupleLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
    coupleNames: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 12, textAlign: 'center' },
    vibeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, gap: 6, marginBottom: 20 },
    vibeEmoji: { fontSize: 13 },
    vibeName: { fontSize: 13, color: '#fff', fontWeight: '800' },
    profileStatsRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8, width: '100%', gap: 4 },
    profileStatItem: { flex: 1, alignItems: 'center' },
    profileStatValue: { fontSize: 20, fontWeight: '900', color: '#fff' },
    profileStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginTop: 2 },
    profileStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

    section: { marginBottom: 24 },
    sectionLabel: { fontSize: 12, fontWeight: '800', color: '#888', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
    card: { borderRadius: 24, overflow: 'hidden' },

    settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    settingIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    settingInfo: { flex: 1 },
    settingTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
    settingSubtitle: { fontSize: 12, color: '#666', fontWeight: '500' },
    rowDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginLeft: 72 },

    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    proBadge: { backgroundColor: '#FF6B35', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    proBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 20, paddingVertical: 16, gap: 10, borderWidth: 1.5 },
    logoutText: { fontSize: 16, fontWeight: '800', color: '#EF4444' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalSheet: { 
        backgroundColor: '#fff', 
        borderTopLeftRadius: 32, 
        borderTopRightRadius: 32, 
        maxHeight: '90%', 
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.1)', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
    modalCloseBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    modalBody: { padding: 24 },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8, marginLeft: 4 },
    textInput: { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, fontSize: 16, color: '#1a1a1a', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.05)' },
    saveBtn: { marginTop: 28, borderRadius: 18, overflow: 'hidden' },
    saveBtnGradient: { paddingVertical: 18, alignItems: 'center' },
    saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },

    purchaseItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12 },
    purchaseIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    purchaseTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
    purchaseSub: { fontSize: 12, color: '#666', fontWeight: '500' },
    purchasePrice: { fontSize: 16, fontWeight: '800', color: '#FF6B35', marginBottom: 2 },
    purchaseEmptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 8 },

    ratingRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginVertical: 10 },
    textArea: { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, fontSize: 16, color: '#1a1a1a', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.05)', height: 120, textAlignVertical: 'top' },

    modalOverlayCen: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    logoutCard: { borderRadius: 32, padding: 32, width: '100%', maxWidth: 340, alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.95)' },
    logoutIconWrap: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    logoutTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', marginBottom: 12 },
    logoutSub: { fontSize: 16, color: '#444', textAlign: 'center', marginBottom: 32, lineHeight: 24, fontWeight: '600', paddingHorizontal: 10 },
    logoutBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
    logoutActionBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    logoutCancelBtn: { backgroundColor: 'rgba(0,0,0,0.05)' },
    logoutCancelText: { color: '#666', fontSize: 16, fontWeight: '800' },
    logoutConfirmBtn: { backgroundColor: '#EF4444' },
    logoutConfirmText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
``


## D:\Rumbala\app\(tabs)\shop.tsx
``tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, StatusBar, Alert, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { getOfferings, purchasePackage, getCustomerInfo, checkProEntitlement } from '../../src/services/revenueCatService';
import { PurchasesPackage } from 'react-native-purchases';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PaywallModal from '../../src/components/PaywallModal';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';


const BG_COLORS = ['#FFF5F5', '#FFF0F5', '#F5F5FF']; // Premium romantic base

// Helper mapping for dynamic rendering
const GET_META = (pkg: PurchasesPackage) => {
    const id = pkg.product.identifier.toLowerCase();
    const type = pkg.packageType;

    if (type === 'ANNUAL' || id.includes('year') || id.includes('annual')) {
        return {
            title: 'Annual Pro', subtitle: 'Save 40% • Best for couples',
            icon: '🚀', badge: 'BEST DEAL', badgeColor: '#10B981', iconName: 'rocket' as const,
            colors: ['rgba(255, 95, 109, 0.15)', 'rgba(255, 195, 113, 0.15)'] as const,
        };
    }
    if (type === 'MONTHLY' || id.includes('month')) {
        return {
            title: 'Monthly Pro', subtitle: 'Full access + Unlimited dares',
            icon: '✨', badge: null, badgeColor: '', iconName: 'calendar' as const,
            colors: ['rgba(71, 118, 230, 0.15)', 'rgba(142, 84, 233, 0.15)'] as const,
        };
    }
    if (id.includes('card_25')) {
        return {
            title: '25-Pack', subtitle: 'Unlimited vibes for weeks',
            icon: '👑', badge: 'LEGENDARY', badgeColor: '#F59E0B', iconName: 'trophy' as const,
            colors: ['rgba(255, 179, 0, 0.2)', 'rgba(230, 81, 0, 0.2)'] as const,
        };
    }
    if (id.includes('card_10')) {
        return {
            title: '10-Pack', subtitle: 'Save ₹11 on dares',
            icon: '💎', badge: 'POPULAR', badgeColor: '#8B5CF6', iconName: 'diamond' as const,
            colors: ['rgba(124, 77, 255, 0.2)', 'rgba(69, 39, 160, 0.2)'] as const,
        };
    }
    if (id.includes('card_5') || id.includes('5_pack')) {
        return {
            title: '5-Pack', subtitle: 'Get 5 more dares to spice up the night',
            icon: '🔥', badge: 'BEST VALUE', badgeColor: '#10B981', iconName: 'flame' as const,
            colors: ['rgba(255, 145, 66, 0.2)', 'rgba(230, 81, 0, 0.2)'] as const,
        };
    }
    if (id.includes('card_1')) {
        return {
            title: 'Single Dare', subtitle: 'Perfect for one more laugh',
            icon: '⭐', badge: null, badgeColor: '', iconName: 'star' as const,
            colors: ['rgba(255, 107, 157, 0.2)', 'rgba(233, 30, 140, 0.2)'] as const,
        };
    }
    // Default fallback for any other package discovered
    return {
        title: pkg.product.title.replace(' (Rumbala)', ''), 
        subtitle: pkg.product.description || 'Premium access',
        icon: '⭐', badge: null, badgeColor: '', iconName: 'star' as const,
        colors: ['rgba(255, 107, 157, 0.2)', 'rgba(233, 30, 140, 0.2)'] as const,
    };
};

const getNextMonday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 1 ? 7 : (8 - day) % 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function ShopScreen() {
    const { cardCount, userId, isPro, setIsPro, showAlert } = useStore(useShallow(state => ({
        cardCount: state.cardCount,
        userId: state.userId,
        isPro: state.isPro,
        setIsPro: state.setIsPro,
        showAlert: state.showAlert
    })));
    const router = useRouter();
    const [loadingSku, setLoadingSku] = useState<string | null>(null);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [offeringsLoaded, setOfferingsLoaded] = useState(false);
    const [viewMode, setViewMode] = useState<'packs' | 'pro'>('pro');
    const [showPaywall, setShowPaywall] = useState(false);

    useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        try {
            const offerings = await getOfferings();
            const offering = offerings?.current || offerings;
            if (offering?.availablePackages) {
                setPackages(offering.availablePackages);
            } else {
                setPackages([]);
            }
        } catch (e: any) {
            setPackages([]);
            showAlert('Shop Unavailable', e?.message || 'Unable to load store offerings right now.');
        } finally {
            setOfferingsLoaded(true);
        }
    };

    const findPackage = (productId: string): PurchasesPackage | undefined => {
        return packages.find(p => p.product.identifier === productId);
    };

    const handlePurchase = async (param: string | PurchasesPackage) => {
        if (loadingSku) return;
        const productId = typeof param === 'string' ? param : param.product.identifier;
        
        if (!userId) {
            showAlert('Sign In Required', 'Please sign in to buy dare cards.', [
                { text: 'Log In', onPress: () => router.push('/login') },
                { text: 'Cancel', style: 'cancel' }
            ]);
            return;
        }
        const pkg = typeof param === 'string' ? findPackage(productId) : param;
        if (!pkg) {
            showAlert('Store Not Ready', 'In-app purchases are still loading. Please wait a moment and try again.');
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            setLoadingSku(productId);
            const result = await purchasePackage(pkg);
            if (result.success) {
                const isSub = pkg.packageType !== 'CUSTOM' && pkg.packageType !== 'UNKNOWN';

                if (isSub) {
                    const info = await getCustomerInfo();
                    const hasPro = checkProEntitlement(info);
                    setIsPro(hasPro);

                    if (!hasPro) {
                        showAlert('Purchase Pending', 'Your subscription was processed, but Pro is still syncing. Please reopen the app or tap Restore Purchases.');
                        return;
                    }
                }

                const title = isSub ? 'Subscription Active! 👑' : 'Cards Added! 🎉';
                const message = isSub ? 'Welcome to Rumbala Pro! You now have unlimited access.' : `Success! We've added ${result.cardsAdded || 0} dare cards to your deck.`;
                
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showAlert(title, message, [
                    { text: 'Great!', onPress: () => router.replace('/(tabs)') }
                ]);
            } else if (result.error && result.error !== 'Purchase cancelled') {
                showAlert('Purchase Failed 😔', result.error);
            }
        } catch (e: any) {
            showAlert('Purchase Failed 😔', e?.message || 'We could not complete your purchase. Please try again.');
        } finally {
            setLoadingSku(null);
        }
    };

    const displayedPackages = (viewMode === 'pro'
        ? packages.filter(p => p.packageType !== 'CUSTOM' && p.packageType !== 'UNKNOWN')
        : packages.filter(p => p.packageType === 'CUSTOM' || p.packageType === 'UNKNOWN'));

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, glassStyles.header]}>
                        <Text style={styles.headerTitle}>Rumbala Shop</Text>
                        <Text style={styles.headerSubtitle}>Elevate your shared experiences 🔥</Text>
                    </Animated.View>

                    {/* Tab Switcher */}
                    <Animated.View entering={FadeInDown.delay(50).duration(500)} style={[styles.tabSwitcher, glassStyles.container]}>
                        <TouchableOpacity 
                            style={[styles.tabBtn, viewMode === 'pro' && styles.tabBtnActive]} 
                            onPress={() => { Haptics.selectionAsync(); setViewMode('pro'); }}
                        >
                            <Ionicons name="sparkles" size={16} color={viewMode === 'pro' ? '#fff' : '#666'} />
                            <Text style={[styles.tabBtnText, viewMode === 'pro' && styles.tabBtnTextActive]}>Monthly & Annual</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tabBtn, viewMode === 'packs' && styles.tabBtnActive]} 
                            onPress={() => { Haptics.selectionAsync(); setViewMode('packs'); }}
                        >
                            <Ionicons name="albums" size={16} color={viewMode === 'packs' ? '#fff' : '#666'} />
                            <Text style={[styles.tabBtnText, viewMode === 'packs' && styles.tabBtnTextActive]}>Dare Packs</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Your Cards Pill */}
                    <Animated.View entering={FadeInDown.delay(100).duration(500)} style={[styles.infoPill, glassStyles.container]}>
                        <View style={styles.infoPillLeft}>
                            <Ionicons name="albums" size={18} color="#FF6B35" />
                            <Text style={styles.infoPillText}>
                                {isPro ? (
                                    <Text style={[styles.infoPillBold, { color: '#10B981' }]}>UNLIMITED DARES ACTIVE ✨</Text>
                                ) : (
                                    <>You have <Text style={styles.infoPillBold}>{cardCount} cards</Text></>
                                )}
                            </Text>
                        </View>
                        <View style={styles.resetBadge}>
                            <Ionicons name="refresh-outline" size={12} color="#888" />
                            <Text style={styles.resetText}>Reset: {getNextMonday()}</Text>
                        </View>
                    </Animated.View>

                    {/* Pro Hero Card */}
                    {!isPro && viewMode === 'pro' && (
                        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.proHeroCard}>
                            <LinearGradient 
                                colors={['#1A111B', '#2A1D2D']} 
                                style={styles.proHeroGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.bestValueBadgePro}>
                                    <Text style={styles.bestValueTextPro}>👑 PREMIUM ACCESS</Text>
                                </View>
                                <View style={styles.proHeroContent}>
                                    <View style={styles.proHeroTextWrap}>
                                        <Text style={styles.proHeroTitle}>Unlock Rumbala Pro</Text>
                                        <Text style={styles.proHeroSubtitle}>Unlimited dares, cloud storage & more</Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.proHeroBtn} 
                                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPaywall(true); }}
                                    >
                                        <Text style={styles.proHeroBtnText}>See All Perks</Text>
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    )}

                    {/* Content Dynamic discovery from RevenueCat */}
                    {(packages.length === 0 || displayedPackages.length === 0) && offeringsLoaded ? (
                        <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyOfferings}>
                            <Ionicons name="cart-outline" size={64} color="#ddd" />
                            <Text style={styles.emptyTitle}>Store Configuration Needed</Text>
                            <Text style={styles.emptyText}>
                                No {viewMode === 'pro' ? 'Subscription' : 'Dare Pack'} offerings found in the shop.
                            </Text>
                            <View style={styles.helpBox}>
                                <Text style={styles.helpText}>1. Login to RevenueCat Dashboard</Text>
                                <Text style={styles.helpText}>2. Go to your 'Current' Offering</Text>
                                <Text style={styles.helpText}>3. Add your products as '{viewMode === 'pro' ? 'Monthly/Annual' : 'Custom'}' packages</Text>
                                <Text style={styles.helpText}>4. Tap 'Reload Shop' below</Text>
                            </View>
                            <TouchableOpacity style={styles.reloadBtn} onPress={loadOfferings}>
                                <Text style={styles.reloadBtnText}>Reload Shop</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <>
                            {displayedPackages.map((pkg, i) => {
                                const meta = GET_META(pkg);
                                return (
                                    <Animated.View key={pkg.product.identifier} entering={FadeInDown.delay(100 + i * 80).duration(500)} style={[styles.card, glassStyles.container]}>
                                        <LinearGradient colors={meta.colors} style={styles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                            {meta.badge && (
                                                <View style={[styles.badge, { backgroundColor: meta.badgeColor }]}>
                                                    <Text style={styles.badgeText}>{meta.badge}</Text>
                                                </View>
                                            )}
                                            <Text style={styles.watermarkSub}>{meta.icon}</Text>
                                            <View style={styles.cardContent}>
                                                <View style={styles.cardLeft}>
                                                    <View style={styles.iconCircle}>
                                                        <Ionicons name={meta.iconName} size={24} color="#FF6F43" />
                                                    </View>
                                                    <View>
                                                        <Text style={styles.cardTitle}>{meta.title}</Text>
                                                        <Text style={styles.cardSubtitle}>{meta.subtitle}</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    style={[styles.buyBtn, loadingSku === pkg.product.identifier && styles.buyBtnDisabled]}
                                                    onPress={() => handlePurchase(pkg)}
                                                    activeOpacity={0.85}
                                                    disabled={!!loadingSku}
                                                >
                                                    {loadingSku === pkg.product.identifier ? (
                                                        <ActivityIndicator size="small" color="#FF6F43" />
                                                    ) : (
                                                        <Text style={styles.buyPrice}>{pkg.product.priceString}</Text>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </LinearGradient>
                                    </Animated.View>
                                );
                            })}
                        </>
                    )}

                    {/* Footer */}
                    <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.footer}>
                        <Text style={styles.footerText}>Cards are consumed upon use. Prices from Google Play / App Store.</Text>
                        <Text style={styles.footerSecure}>🔐 Secured by Google Play & App Store</Text>
                    </Animated.View>
                </ScrollView>

                <PaywallModal 
                    visible={showPaywall}
                    onClose={() => setShowPaywall(false)}
                    onSubscribe={(pkg) => {
                        setShowPaywall(false);
                        handlePurchase(pkg);
                    }}
                />
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    scroll: { paddingTop: 20, paddingBottom: 100, paddingHorizontal: 20 },
    
    tabSwitcher: {
        flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 20, gap: 4,
    },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
    tabBtnActive: { backgroundColor: '#FF6B35' },
    tabBtnText: { fontSize: 13, fontWeight: '700', color: '#666' },
    tabBtnTextActive: { color: '#fff' },

    // Header
    header: { marginBottom: 24, paddingHorizontal: 10, paddingVertical: 16 },
    headerTitle: {
        fontFamily: 'Pacifico_400Regular', fontSize: 32, color: '#1a1a1a', marginBottom: 4,
        paddingRight: 10,
    },
    headerSubtitle: { fontSize: 14, color: '#666', fontWeight: '500', lineHeight: 20 },

    // Info pill
    infoPill: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
        marginBottom: 20,
    },
    infoPillLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
    infoPillText: { fontSize: 14, color: '#555' },
    infoPillBold: { fontWeight: '700', color: '#1a1a1a' },
    resetBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    },
    resetText: { fontSize: 10, color: '#888', fontWeight: '600' },

    // Pro Hero
    proHeroCard: { 
        borderRadius: 20, marginBottom: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#3A2D3D',
        shadowColor: 'rgba(255, 102, 178, 0.2)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 0
    },
    proHeroGradient: { padding: 24 },
    proHeroContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    proHeroTextWrap: { flex: 1, marginRight: 10 },
    proHeroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
    proHeroSubtitle: { fontSize: 13, color: '#A1B0C1', fontWeight: '500' },
    proHeroBtn: { backgroundColor: '#FF66B2', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    proHeroBtnText: { color: '#1A111B', fontSize: 13, fontWeight: '800' },
    bestValueBadgePro: {
        position: 'absolute', top: -10, left: 16, 
        backgroundColor: '#FF66B2', paddingHorizontal: 10, paddingVertical: 4, 
        borderRadius: 20, zIndex: 5
    },
    bestValueTextPro: { fontSize: 10, fontWeight: '900', color: '#1A111B' },

    // Cards
    card: {
        borderRadius: 20, marginBottom: 16, overflow: 'hidden',
    },
    cardGradient: {
        padding: 20, minHeight: 110, justifyContent: 'flex-end', overflow: 'hidden',
    },
    badge: {
        position: 'absolute', top: 12, right: 14,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    watermark: { position: 'absolute', right: 14, bottom: -5, fontSize: 80, opacity: 0.05 },
    watermarkSub: { position: 'absolute', right: 20, top: 40, fontSize: 100, opacity: 0.05 },
    cardContent: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 1,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
    packIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,107,53,0.1)', alignItems: 'center', justifyContent: 'center' },
    iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,111,67,0.1)', alignItems: 'center', justifyContent: 'center' },
    cardIcon: { fontSize: 24 },
    cardTitle: { fontSize: 19, fontWeight: '800', color: '#1a1a1a', marginBottom: 2 },
    cardSubtitle: { fontSize: 12, color: '#666', fontWeight: '500', flexShrink: 1, lineHeight: 16 },
    buyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14,
        minWidth: 80, justifyContent: 'center',
    },
    buyBtnDisabled: { opacity: 0.7 },
    buyPrice: { fontSize: 15, fontWeight: '800', color: '#FF6B35' },

    // Footer
    footer: { alignItems: 'center', marginTop: 12, paddingBottom: 20 },
    footerText: { fontSize: 11, color: '#999', textAlign: 'center', marginBottom: 6 },
    footerSecure: { fontSize: 11, color: '#888', textAlign: 'center', fontWeight: '500' },

    // Modal
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', alignItems: 'center',
    },
    successCard: {
        borderRadius: 24, paddingVertical: 32, paddingHorizontal: 40,
        alignItems: 'center', width: '80%',
    },
    successTitle: { fontSize: 22, fontWeight: '800', color: '#FF6B35', marginBottom: 4 },
    successCount: { fontSize: 16, fontWeight: '700', color: '#10B981', marginBottom: 6 },
    successSub: { fontSize: 14, color: '#666' },

    // Error Modal
    errorCard: {
        borderRadius: 24, padding: 24, paddingVertical: 32,
        width: '100%', maxWidth: 320, alignItems: 'center',
    },
    errorIconWrap: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
    },
    errorTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
    errorSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    errorBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
    errorBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center'
    },
    errorBtnCancel: { backgroundColor: 'rgba(0,0,0,0.05)' },
    errorBtnCancelText: { color: '#4B5563', fontSize: 15, fontWeight: '700' },
    errorBtnPrimary: { backgroundColor: '#FF6B35' },
    errorBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    emptyOfferings: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, opacity: 0.9 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a', marginTop: 16, marginBottom: 8 },
    emptyText: { color: '#666', fontSize: 13, textAlign: 'center', marginBottom: 24, paddingHorizontal: 40, lineHeight: 20 },
    helpBox: { backgroundColor: 'rgba(0,0,0,0.03)', padding: 16, borderRadius: 16, width: '100%', marginBottom: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
    helpText: { color: '#888', fontSize: 12, marginBottom: 6, fontWeight: '500' },
    reloadBtn: { backgroundColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
    reloadBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
``


## D:\Rumbala\app\(tabs)\_layout.tsx
``tsx

import React, { useEffect } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/useStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function TabIcon({ name, focused, color }: { name: any, focused: boolean, color: string }) {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withSpring(focused ? 1.2 : 1, {
            damping: 12,
            stiffness: 200,
        });
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Ionicons name={focused ? name : `${name}-outline`} size={22} color={color} />
        </Animated.View>
    );
}

export default function TabLayout() {
    const roomId = useStore(state => state.roomId);
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    
    // Only hide tab bar when in an active room AND on the LDR screen
    const isLdrActive = !!roomId && pathname.includes('ldr'); 
    
    const bottomInset = Math.max(insets.bottom, 8);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                // Only use the dark background for LDR tab if roomId exists
                // We'll use a transparent sceneStyle or handle it per-tab
                sceneStyle: { backgroundColor: '#F8F4F4' }, 
                tabBarStyle: isLdrActive
                    ? { display: 'none' as const, height: 0, overflow: 'hidden' as const }
                    : {
                        backgroundColor: '#FFFFFF',
                        borderTopWidth: 0,
                        height: 60 + bottomInset,
                        paddingBottom: bottomInset,
                        paddingTop: 8,
                        elevation: 0,
                        shadowColor: 'rgba(0,0,0,0.05)',
                        shadowOffset: { width: 0, height: -6 },
                        shadowOpacity: 0.05,
                        shadowRadius: 15,
                        borderTopLeftRadius: 25,
                        borderTopRightRadius: 25,
                    },
                tabBarActiveTintColor: '#FF6B35',
                tabBarInactiveTintColor: '#999999',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                    marginTop: 4,
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => <TabIcon name="home" focused={focused} color={color} />,
                }}
            />

            <Tabs.Screen
                name="daily"
                options={{
                    title: 'Daily',
                    tabBarIcon: ({ color, focused }) => <TabIcon name="flame" focused={focused} color={color} />,
                }}
            />

            <Tabs.Screen
                name="ldr"
                options={{
                    title: 'LDR',
                    tabBarIcon: ({ color, focused }) => <TabIcon name="heart" focused={focused} color={color} />,
                }}
            />
            <Tabs.Screen
                name="shop"
                options={{
                    title: 'Shop',
                    tabBarIcon: ({ color, focused }) => <TabIcon name="bag" focused={focused} color={color} />,
                }}
            />
            <Tabs.Screen
                name="pro"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => <TabIcon name="person-circle" focused={focused} color={color} />,
                }}
            />
            <Tabs.Screen
                name="chats"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

``


## D:\Rumbala\app\chat\[id].tsx
``tsx

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
``


## D:\Rumbala\app\admin.tsx
``tsx

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, FlatList, StatusBar, ActivityIndicator, Dimensions,
    Modal, Alert, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { 
    getFeedbacks, getAdminStats, adminSearchUsers, adminUpdateUserCards, 
    adminGrantPro, adminGetRevenueStats, adminGetGameplayStats,
    adminGetActiveRooms, adminCloseRoom, adminGetCards, adminUpsertCard, 
    adminDeleteCard, adminGetBugReports
} from '../src/services/api';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles } from '../src/constants/glass';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ADMIN_EMAIL = 'adminhr@andx.com';
const ADMIN_PASS = '123456';

type TabType = 'Overview' | 'Users' | 'Revenue' | 'Gameplay' | 'LDR' | 'CMS' | 'Support';

// --- Helper Components ---

function StatCard({ icon, label, value, color, delay }: any) {
    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={[styles.statCard, glassStyles.container]}>
            <View style={[styles.statIconWrap, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </Animated.View>
    );
}

function QuickAction({ icon, label, color, onPress }: any) {
    return (
        <TouchableOpacity style={[styles.quickBtn, glassStyles.container]} onPress={onPress}>
            <View style={[styles.quickIcon, {backgroundColor: `${color}15`}]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.quickLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

const getTypeColor = (type: string) => {
    switch(type) {
        case 'fun': return '#6366F1';
        case 'romantic': return '#EC4899';
        case 'spicy': return '#FF6B35';
        case 'ldr': return '#10B981';
        default: return '#64748B';
    }
};

export default function AdminScreen() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('Overview');
    const [loading, setLoading] = useState(false);

    // Data States
    const [stats, setStats] = useState<any>(null);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any>(null);
    const [gameplayData, setGameplayData] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [dbCards, setDbCards] = useState<any[]>([]);
    const [bugs, setBugs] = useState<any[]>([]);

    // Search/Edit States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedCard, setSelectedCard] = useState<any>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showCardModal, setShowCardModal] = useState(false);

    const handleLogin = () => {
        if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASS) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsLoggedIn(true);
            loadOverview();
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            alert('Invalid Admin Credentials');
        }
    };

    const loadOverview = async () => {
        setLoading(true);
        try {
            const [s, f] = await Promise.all([getAdminStats(), getFeedbacks()]);
            setStats(s);
            setFeedbacks(f);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadRevenue = async () => { setLoading(true); try { setRevenueData(await adminGetRevenueStats()); } catch(e){} finally {setLoading(false);} };
    const loadGameplay = async () => { setLoading(true); try { setGameplayData(await adminGetGameplayStats()); } catch(e){} finally {setLoading(false);} };
    const loadLDR = async () => { setLoading(true); try { setRooms(await adminGetActiveRooms()); } catch(e){} finally {setLoading(false);} };
    const loadCMS = async () => { setLoading(true); try { setDbCards(await adminGetCards()); } catch(e){} finally {setLoading(false);} };
    const loadSupport = async () => { setLoading(true); try { setBugs(await adminGetBugReports()); setFeedbacks(await getFeedbacks()); } catch(e){} finally {setLoading(false);} };

    const handleTabChange = (tab: TabType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveTab(tab);
        switch(tab) {
            case 'Overview': loadOverview(); break;
            case 'Revenue': loadRevenue(); break;
            case 'Gameplay': loadGameplay(); break;
            case 'LDR': loadLDR(); break;
            case 'CMS': loadCMS(); break;
            case 'Support': loadSupport(); break;
        }
    };

    const handleUserSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        try { setUsers(await adminSearchUsers(searchQuery)); } catch(e){}
        finally { setLoading(false); }
    };

    const handleGrantPro = async (status: boolean) => {
        try {
            await adminGrantPro(selectedUser.id, status);
            setSelectedUser({...selectedUser, is_pro: status});
            Alert.alert('Success', `Pro status ${status ? 'granted' : 'revoked'}`);
            handleUserSearch();
        } catch(e) { Alert.alert('Error', 'Failed to update Pro status'); }
    };

    const handleSaveUser = async () => {
        try {
            await adminUpdateUserCards(selectedUser.id, selectedUser.card_count);
            setShowUserModal(false);
            Alert.alert('Success', 'User cards updated');
            handleUserSearch();
        } catch(e) { Alert.alert('Error', 'Failed to update user'); }
    };

    const handleUpsertCard = async () => {
        try {
            await adminUpsertCard(selectedCard);
            setShowCardModal(false);
            loadCMS();
            Alert.alert('Success', 'Card content updated live');
        } catch(e) { Alert.alert('Error', 'Failed to save card'); }
    };

    const confirmDeleteCard = (id: string) => {
        Alert.alert('Delete Card', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                await adminDeleteCard(id);
                setShowCardModal(false);
                loadCMS();
            }}
        ]);
    };

    const confirmCloseRoom = (code: string) => {
        Alert.alert('Close Room', 'Force close this session?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Close', style: 'destructive', onPress: async () => {
                await adminCloseRoom(code);
                loadLDR();
            }}
        ]);
    };

    // --- Tab Renderers ---

    const renderOverview = () => (
        <View>
            <View style={styles.statsGrid}>
                <StatCard icon="people" label="Total Users" value={stats?.totalUsers || '0'} color="#6366F1" delay={0} />
                <StatCard icon="diamond" label="Pro Users" value={stats?.proUsers || '0'} color="#FF6B35" delay={100} />
                <StatCard icon="chatbubbles" label="Active Rooms" value={stats?.totalRooms || '0'} color="#10B981" delay={200} />
                <StatCard icon="star" label="Feedback" value={feedbacks.length} color="#F59E0B" delay={300} />
            </View>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickGrid}>
                <QuickAction icon="search" label="Find User" color="#6366F1" onPress={() => setActiveTab('Users')} />
                <QuickAction icon="add-circle" label="New Card" color="#10B981" onPress={() => { setActiveTab('CMS'); setSelectedCard({}); setShowCardModal(true); }} />
                <QuickAction icon="bug" label="Bugs" color="#EF4444" onPress={() => setActiveTab('Support')} />
                <QuickAction icon="wallet" label="Revenue" color="#F59E0B" onPress={() => setActiveTab('Revenue')} />
            </View>
            <Text style={styles.sectionTitle}>Recent Feedback</Text>
            {feedbacks.slice(0, 3).map((f) => (
                <View key={f.id} style={[styles.feedbackMini, glassStyles.container]}>
                    <Text style={styles.fbMiniEmail}>{f.user_email}</Text>
                    <Text style={styles.fbMiniMsg} numberOfLines={2}>{f.message}</Text>
                </View>
            ))}
        </View>
    );

    const renderUsers = () => (
        <View>
            <View style={styles.searchRow}>
                <TextInput 
                    style={[styles.searchInput, glassStyles.container]} 
                    placeholder="Search email or UUID..." 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleUserSearch}>
                    <Ionicons name="search" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
            {loading ? <ActivityIndicator color="#FF6B35" style={{marginTop: 20}} /> : (
                users.map(u => (
                    <TouchableOpacity key={u.id} style={[styles.userCard, glassStyles.container]} onPress={() => { setSelectedUser(u); setShowUserModal(true); }}>
                        <View style={styles.userHead}>
                            <Text style={styles.userName}>{u.display_name || 'Guest User'}</Text>
                            {u.is_pro && <View style={styles.proBadgeMini}><Text style={styles.proTextMini}>PRO</Text></View>}
                        </View>
                        <Text style={styles.userEmail}>{u.email}</Text>
                        <View style={styles.userFooter}>
                            <Text style={styles.userStat}><Ionicons name="card" size={12}/> {u.card_count}</Text>
                            <Text style={styles.userStat}><Ionicons name="calendar" size={12}/> {new Date(u.created_at).toLocaleDateString()}</Text>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </View>
    );

    const renderRevenue = () => {
        if (!revenueData) return <ActivityIndicator color="#FF6B35" />;
        return (
            <View>
                <View style={[styles.revenueHero, glassStyles.container]}>
                    <Text style={styles.revLabel}>Total Estimated Revenue</Text>
                    <Text style={styles.revAmount}>₹{revenueData.totalRevenue}</Text>
                    <Text style={styles.revSub}>{revenueData.purchaseCount} Transactions</Text>
                </View>
                <Text style={styles.sectionTitle}>Top Card Packs (SKUs)</Text>
                <View style={styles.skuGrid}>
                    {Object.entries(revenueData.skuCounts).map(([sku, count]: any) => (
                        <View key={sku} style={[styles.skuCard, glassStyles.container]}>
                            <Text style={styles.skuName}>{sku}</Text>
                            <Text style={styles.skuValue}>{count} sales</Text>
                        </View>
                    ))}
                </View>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                {revenueData.recentPurchases.map((p: any) => (
                    <View key={p.id} style={[styles.transCard, glassStyles.container]}>
                        <View>
                            <Text style={styles.transSku}>{p.sku}</Text>
                            <Text style={styles.transDate}>{new Date(p.created_at).toLocaleString()}</Text>
                        </View>
                        <Text style={styles.transAmt}>+₹{p.amount}</Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderGameplay = () => {
        if (!gameplayData) return <ActivityIndicator color="#FF6B35" />;
        return (
            <View>
                <Text style={styles.sectionTitle}>Most Popular Dares</Text>
                {Object.entries(gameplayData.popularity).sort((a:any,b:any) => b[1] - a[1]).slice(0, 5).map(([text, count]: any) => (
                    <View key={text} style={[styles.popCard, glassStyles.container]}>
                        <Text style={styles.popText} numberOfLines={1}>{text}</Text>
                        <Text style={styles.popCount}>{count} completions</Text>
                    </View>
                ))}
                <Text style={styles.sectionTitle}>Community Proof Gallery</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
                    {gameplayData.recentHistory.filter((h: any) => h.proof_uri).map((h: any) => (
                        <View key={h.id} style={styles.proofWrap}>
                            <Image source={{ uri: h.proof_uri }} style={styles.proofImg} />
                            <View style={styles.proofOverlay}>
                                <Text style={styles.proofUser}>{h.winner}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderLDR = () => (
        <View>
            <Text style={styles.sectionTitle}>Active Dual Rooms</Text>
            {rooms.map(r => (
                <View key={r.code} style={[styles.roomCard, glassStyles.container]}>
                    <View style={styles.roomInfo}>
                        <Text style={styles.roomCode}>{r.code}</Text>
                        <Text style={styles.roomUsers}>{r.host_name} & {r.guest_name || '???'}</Text>
                        <Text style={styles.roomDate}>Active: {new Date(r.updated_at).toLocaleTimeString()}</Text>
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => confirmCloseRoom(r.code)}>
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );

    const renderCMS = () => (
        <View>
            <TouchableOpacity style={styles.addNewBtn} onPress={() => { setSelectedCard({}); setShowCardModal(true); }}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.addGrad} start={{x:0, y:0}} end={{x:1, y:1}}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addText}>Add New Card</Text>
                </LinearGradient>
            </TouchableOpacity>
            {dbCards.map(c => (
                <TouchableOpacity key={c.id} style={[styles.cardListItem, glassStyles.container]} onPress={() => { setSelectedCard(c); setShowCardModal(true); }}>
                    <View style={[styles.typePill, {backgroundColor: getTypeColor(c.type)}]}>
                        <Text style={styles.pillText}>{c.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.cardListText} numberOfLines={2}>{c.text}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderSupport = () => (
        <View>
            <Text style={styles.sectionTitle}>Bug Reports</Text>
            {bugs.map(b => (
                <View key={b.id} style={[styles.bugCard, glassStyles.container]}>
                    <View style={styles.bugHead}>
                        <Text style={styles.bugStatus}>{b.status.toUpperCase()}</Text>
                        <Text style={styles.bugDate}>{new Date(b.created_at).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.bugMsg}>{b.message}</Text>
                    <Text style={styles.bugUser}>{b.user_email || 'Anonymous'}</Text>
                </View>
            ))}
            <Text style={[styles.sectionTitle, {marginTop: 20}]}>User Feedback</Text>
            {feedbacks.map(f => (
                <View key={f.id} style={[styles.fbDetailCard, glassStyles.container]}>
                    <View style={styles.fbHead}>
                        <Text style={styles.fbEmailText}>{f.user_email}</Text>
                        <Text style={styles.fbRatingText}>⭐ {f.rating}/5</Text>
                    </View>
                    <Text style={styles.fbMsgText}>{f.message}</Text>
                </View>
            ))}
        </View>
    );

    // --- Main Layout ---

    if (!isLoggedIn) {
        return (
            <AnimatedBackground colors={['#0F172A', '#1E293B', '#334155']}>
                <SafeAreaView style={styles.loginContainer}>
                    <Animated.View entering={FadeInDown.duration(600)} style={[styles.loginCard, glassStyles.container]}>
                        <View style={styles.loginIconWrap}><Ionicons name="shield-checkmark" size={40} color="#FF6B35" /></View>
                        <Text style={styles.loginTitle}>Admin Portal</Text>
                        <View style={styles.inputGroup}>
                            <TextInput style={[styles.input, glassStyles.container]} value={email} onChangeText={setEmail} placeholder="Admin Email" placeholderTextColor="#64748B" autoCapitalize="none" />
                        </View>
                        <View style={styles.inputGroup}>
                            <TextInput style={[styles.input, glassStyles.container]} value={password} onChangeText={setPassword} placeholder="••••••" placeholderTextColor="#64748B" secureTextEntry />
                        </View>
                        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                            <LinearGradient colors={['#FF6B35', '#F5511E']} style={styles.loginGradient}><Text style={styles.loginBtnText}>Unlock Dashboard</Text></LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </SafeAreaView>
            </AnimatedBackground>
        );
    }

    return (
        <AnimatedBackground colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}>
            <SafeAreaView style={styles.container}>
                <View style={[styles.header, glassStyles.header]}>
                    <View>
                        <Text style={styles.headerSubtitle}>Admin Portal</Text>
                        <Text style={styles.headerTitle}>{activeTab}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsLoggedIn(false)} style={[styles.logoutBtn, glassStyles.container]}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                <View style={styles.mainContent}>
                    {/* Sidebar */}
                    <View style={styles.sidebar}>
                        {(['Overview', 'Users', 'Revenue', 'Gameplay', 'LDR', 'CMS', 'Support'] as TabType[]).map(tab => (
                            <TouchableOpacity key={tab} style={[styles.tabItem, activeTab === tab && styles.tabItemActive]} onPress={() => handleTabChange(tab)}>
                                <Ionicons name={tab === 'Overview' ? 'grid' : tab === 'Users' ? 'people' : tab === 'Revenue' ? 'card' : tab === 'Gameplay' ? 'play' : tab === 'LDR' ? 'heart' : tab === 'CMS' ? 'document-text' : 'help-buoy'} size={20} color={activeTab === tab ? '#FF6B35' : '#64748B'} />
                                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <ScrollView style={styles.contentArea} contentContainerStyle={styles.scrollContent}>
                        {activeTab === 'Overview' && renderOverview()}
                        {activeTab === 'Users' && renderUsers()}
                        {activeTab === 'Revenue' && renderRevenue()}
                        {activeTab === 'Gameplay' && renderGameplay()}
                        {activeTab === 'LDR' && renderLDR()}
                        {activeTab === 'CMS' && renderCMS()}
                        {activeTab === 'Support' && renderSupport()}
                    </ScrollView>
                </View>

                {/* Modals */}
                <Modal 
                    visible={showUserModal} 
                    transparent 
                    animationType="slide"
                    hardwareAccelerated={true}
                    statusBarTranslucent={true}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, glassStyles.container]}>
                            <Text style={styles.modalTitle}>Manage User</Text>
                            {selectedUser && (
                                <>
                                    <Text style={styles.modalLabel}>Email: {selectedUser.email}</Text>
                                    <TextInput style={[styles.modalInput, glassStyles.container]} defaultValue={String(selectedUser.card_count)} keyboardType="numeric" onChangeText={(v) => setSelectedUser({...selectedUser, card_count: parseInt(v)})} />
                                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: selectedUser.is_pro ? '#EF4444' : '#6366F1'}]} onPress={() => handleGrantPro(!selectedUser.is_pro)}>
                                        <Text style={styles.actionBtnText}>{selectedUser.is_pro ? 'Revoke PRO' : 'Grant PRO'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveUser}><Text style={styles.saveActionText}>Save Changes</Text></TouchableOpacity>
                                </>
                            )}
                            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowUserModal(false)}><Text style={styles.closeModalText}>Cancel</Text></TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal 
                    visible={showCardModal} 
                    transparent 
                    animationType="slide"
                    hardwareAccelerated={true}
                    statusBarTranslucent={true}
                >
                    <View style={styles.modalOverlay}>
                        <ScrollView style={[styles.modalContent, glassStyles.container]}>
                            <Text style={styles.modalTitle}>{selectedCard?.id ? 'Edit Card' : 'New Card'}</Text>
                            {selectedCard && (
                                <>
                                    <TextInput style={[styles.modalInput, glassStyles.container, {height: 80}]} multiline value={selectedCard.text} onChangeText={t => setSelectedCard({...selectedCard, text: t})} />
                                    <TextInput style={[styles.modalInput, glassStyles.container, {marginTop: 10}]} value={selectedCard.type} onChangeText={t => setSelectedCard({...selectedCard, type: t})} placeholder="Type (fun/romantic/spicy/ldr)" />
                                    <TextInput style={[styles.modalInput, glassStyles.container, {marginTop: 10}]} value={selectedCard.timer ? String(selectedCard.timer) : ''} keyboardType="numeric" onChangeText={t => setSelectedCard({...selectedCard, timer: parseInt(t)})} placeholder="Timer (optional)" />
                                    <TouchableOpacity style={styles.saveActionBtn} onPress={handleUpsertCard}><Text style={styles.saveActionText}>Save Card</Text></TouchableOpacity>
                                    {selectedCard.id && (
                                        <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDeleteCard(selectedCard.id)}><Text style={styles.deleteText}>Delete Card</Text></TouchableOpacity>
                                    )}
                                </>
                            )}
                            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowCardModal(false)}><Text style={styles.closeModalText}>Cancel</Text></TouchableOpacity>
                        </ScrollView>
                    </View>
                </Modal>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loginContainer: { flex: 1, justifyContent: 'center', padding: 24 },
    loginCard: { padding: 32, borderRadius: 32, alignItems: 'center' },
    loginIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255, 107, 53, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    loginTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 24 },
    inputGroup: { width: '100%', marginBottom: 15 },
    input: { width: '100%', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, color: '#fff', fontSize: 16 },
    loginBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 12 },
    loginGradient: { paddingVertical: 18, alignItems: 'center' },
    loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
    headerSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
    logoutBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    mainContent: { flex: 1, flexDirection: 'row' },
    sidebar: { width: 70, borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.05)', alignItems: 'center', gap: 15, paddingVertical: 10 },
    tabItem: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    tabItemActive: { backgroundColor: 'rgba(255, 107, 53, 0.1)' },
    tabText: { fontSize: 9, color: '#64748B', fontWeight: '700', marginTop: 4 },
    tabTextActive: { color: '#FF6B35' },
    contentArea: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    statCard: { width: (width - 100) / 2, padding: 16, borderRadius: 20 },
    statIconWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    statLabel: { fontSize: 11, color: '#64748B', fontWeight: '700' },
    sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 16, marginTop: 10 },
    quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    quickBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 16 },
    quickIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    quickLabel: { fontSize: 10, fontWeight: '800', color: '#475569' },
    feedbackMini: { padding: 12, borderRadius: 16, marginBottom: 8 },
    fbMiniEmail: { fontSize: 11, fontWeight: '800', color: '#6366F1' },
    fbMiniMsg: { fontSize: 12, color: '#475569', marginTop: 2 },
    searchRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    searchInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, fontSize: 14 },
    searchBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center' },
    userCard: { padding: 16, borderRadius: 20, marginBottom: 10 },
    userHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    userName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    userEmail: { fontSize: 13, color: '#64748B', marginBottom: 10 },
    userFooter: { flexDirection: 'row', gap: 15 },
    userStat: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
    proBadgeMini: { backgroundColor: '#FF6B35', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    proTextMini: { color: '#fff', fontSize: 9, fontWeight: '900' },
    revenueHero: { padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 24 },
    revLabel: { fontSize: 13, color: '#64748B', fontWeight: '700', marginBottom: 8 },
    revAmount: { fontSize: 36, fontWeight: '900', color: '#1E293B' },
    revSub: { fontSize: 14, color: '#10B981', fontWeight: '700', marginTop: 4 },
    skuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    skuCard: { width: (width - 106) / 2, padding: 16, borderRadius: 16 },
    skuName: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 4 },
    skuValue: { fontSize: 16, fontWeight: '900', color: '#FF6B35' },
    transCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8 },
    transSku: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    transDate: { fontSize: 11, color: '#94A3B8' },
    transAmt: { fontSize: 15, fontWeight: '900', color: '#10B981' },
    popCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8 },
    popText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#475569', marginRight: 10 },
    popCount: { fontSize: 12, fontWeight: '800', color: '#6366F1' },
    gallery: { marginHorizontal: -16, paddingHorizontal: 16, marginBottom: 24 },
    proofWrap: { width: 120, height: 160, borderRadius: 16, marginRight: 12, overflow: 'hidden' },
    proofImg: { width: '100%', height: '100%' },
    proofOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)' },
    proofUser: { color: '#fff', fontSize: 10, fontWeight: '800' },
    roomCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8 },
    roomInfo: { flex: 1 },
    roomCode: { fontSize: 16, fontWeight: '900', color: '#FF6B35' },
    roomUsers: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 2 },
    roomDate: { fontSize: 11, color: '#94A3B8' },
    closeBtn: { padding: 4 },
    addNewBtn: { marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
    addGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
    addText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    cardListItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 8, gap: 12 },
    cardListText: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '600' },
    typePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    pillText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    bugCard: { padding: 16, borderRadius: 20, marginBottom: 10 },
    bugHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    bugStatus: { fontSize: 10, fontWeight: '900', color: '#EF4444' },
    bugDate: { fontSize: 11, color: '#94A3B8' },
    bugMsg: { fontSize: 14, color: '#1E293B', fontWeight: '700', marginBottom: 8 },
    bugUser: { fontSize: 11, color: '#64748B' },
    fbDetailCard: { padding: 16, borderRadius: 20, marginBottom: 10 },
    fbHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    fbEmailText: { fontSize: 12, fontWeight: '800', color: '#6366F1' },
    fbRatingText: { fontSize: 12, fontWeight: '800', color: '#F59E0B' },
    fbMsgText: { fontSize: 14, color: '#475569', lineHeight: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { padding: 24, borderRadius: 32, backgroundColor: '#fff' },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
    modalLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 8, marginTop: 12 },
    modalInput: { padding: 16, borderRadius: 16, fontSize: 15, color: '#1E293B', backgroundColor: 'rgba(0,0,0,0.03)' },
    actionBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 24 },
    actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    saveActionBtn: { backgroundColor: '#FF6B35', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 12 },
    saveActionText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    closeModalBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 10 },
    closeModalText: { color: '#94A3B8', fontWeight: '700' },
    deleteBtn: { marginTop: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
    deleteText: { color: '#EF4444', fontWeight: '700' }
});
``


## D:\Rumbala\app\index.tsx
``tsx

import { Redirect } from 'expo-router';
import { useStore } from '../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
    const { hasHydrated, isAuthChecked, hasSeenOnboarding, isAuthenticated, partner1 } = useStore(useShallow(state => ({
        hasHydrated: state.hasHydrated,
        isAuthChecked: state.isAuthChecked,
        hasSeenOnboarding: state.hasSeenOnboarding,
        isAuthenticated: state.isAuthenticated,
        partner1: state.partner1
    })));

    const hasSeenSubscription = useStore(state => state.hasSeenSubscription);
    const isPro = useStore(state => state.isPro);

    if (!hasHydrated || !isAuthChecked) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C000B' }} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color="#FF1493" />
            </SafeAreaView>
        );
    }

    // 1. If never seen onboarding, go there first
    if (!hasSeenOnboarding) {
        return <Redirect href="/onboarding" />;
    }

    // 2. If names not entered yet, go to welcome (before login)
    if (!partner1) {
        return <Redirect href="/welcome" />;
    }

    // 3. If names done but not logged in, go to login
    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    // 4. Go straight to home; home will show the paywall popup if needed
    return <Redirect href="/(tabs)" />;
}

``


## D:\Rumbala\app\login.tsx
``tsx

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, StatusBar, Image,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useStore } from '../src/store/useStore';
import { loginV2, setTokens } from '../src/services/api';
import { initNotifications } from '../src/services/notificationService';
import { initRevenueCat, getCustomerInfo, checkProEntitlement } from '../src/services/revenueCatService';
import { supabase } from '../src/services/supabase';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../src/constants/glass';

const { width } = Dimensions.get('window');

const BG_COLORS = ['#F5FAF9', '#E0F2F1', '#B2DFDB'];

export default function LoginScreen() {
    const router = useRouter();
    const { login, showAlert } = useStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    React.useEffect(() => {
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        console.log('LoginScreen: Configuring GoogleSignin with webClientId:', webClientId);
        if (webClientId) {
            GoogleSignin.configure({
                webClientId: webClientId,
                offlineAccess: true,
                forceCodeForRefreshToken: true,
            });
        }
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            setGoogleLoading(true);
            if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
                throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env');
            }
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            await GoogleSignin.signOut().catch(() => null);
            const result = await GoogleSignin.signIn();
            
            if (result.type === 'cancelled') {
                console.log('Google Sign-In: User cancelled the flow.');
                return;
            }

            if (!result.data) {
                console.error('Google Sign-In: Result data is null but type is not cancelled', result);
                throw new Error('Google Sign-In failed: No user data received.');
            }

            const idToken = result.data.idToken;

            if (!idToken) {
                console.error('Google Sign-In: No idToken found in successful result', result);
                throw new Error('Unable to complete Google Sign-In. Error: Missing ID Token. Please try again or use email.');
            }

            const { data: sessionData, error: sessionError } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: idToken,
            });

            if (sessionError) throw new Error(sessionError.message);
            const userId = sessionData?.user?.id;
            if (!userId) throw new Error('We couldn\'t complete your social login. Please try again.');

            const { postAuthSync } = await import('../src/services/api');
            await postAuthSync(userId);

            const state = useStore.getState();
            if (state.isPro || state.hasSeenSubscription) router.replace('/(tabs)');
            else router.replace('/subscription');
        } catch (error: any) {
            if (error?.code !== statusCodes.SIGN_IN_CANCELLED) {
                showAlert('Sign-In Error', error.message || 'We couldn\'t sign you in with Google. Please try again.');
            }
        } finally { setGoogleLoading(false); }
    };

    const handleBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/onboarding');
    };

    const handleLogin = async () => {
        if (!email.trim() || !password) { 
            showAlert('Missing Information', 'Please enter both email and password.'); 
            return; 
        }
        setIsLoading(true);
        try {
            const result = await loginV2(email.trim().toLowerCase(), password);
            if (result.session?.access_token && result.session?.refresh_token) {
                setTokens(result.session.access_token, result.session.refresh_token);
            }
            // Store is already updated by postAuthSync inside loginV2
            const state = useStore.getState();
            if (state.isPro || state.hasSeenSubscription) router.replace('/(tabs)');
            else router.replace('/subscription');
        } catch (error: any) { 
            showAlert('Login Failed', error.message || 'Check your credentials and try again.'); 
        }
        finally { setIsLoading(false); }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />
                
                <Animated.View 
                    entering={FadeInDown.delay(100).duration(600)} 
                    renderToHardwareTextureAndroid={true}
                    style={[styles.header, glassStyles.header]}
                >
                    <TouchableOpacity onPress={handleBack} style={[styles.backBtn, glassStyles.container]}>
                        <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { fontFamily: 'Pacifico_400Regular' }]}>Rumbala</Text>
                    <View style={{ width: 44 }} />
                </Animated.View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView 
                        contentContainerStyle={styles.scroll} 
                        keyboardShouldPersistTaps="handled" 
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View 
                            entering={FadeInDown.delay(200).duration(800)} 
                            renderToHardwareTextureAndroid={true}
                            style={styles.logoContainer}
                        >
                            <View style={[styles.logoBox, glassStyles.container]}>
                                <LinearGradient colors={['#FF6B35', '#FF9800']} style={styles.logoGradient}>
                                    <Ionicons name="heart" size={50} color="#fff" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Log in to keep the spark alive</Text>
                        </Animated.View>

                        <Animated.View 
                            entering={FadeInUp.delay(400).duration(800)} 
                            renderToHardwareTextureAndroid={true}
                            style={[styles.card, glassStyles.container]}
                        >
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={[styles.inputRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                    <Ionicons name="mail" size={20} color="#888" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="name@example.com"
                                        placeholderTextColor="#999"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={[styles.inputRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                    <Ionicons name="lock-closed" size={20} color="#888" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#999"
                                        value={password}
                                        secureTextEntry={!showPassword}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#888" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.forgotBtn}>
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
                                <LinearGradient 
                                    colors={['#FF6B35', '#FF4D17']} 
                                    style={styles.loginBtnGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Login</Text>}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.line} />
                                <Text style={styles.dividerText}>Or continue with</Text>
                                <View style={styles.line} />
                            </View>

                            <TouchableOpacity 
                                style={[styles.socialBtnFull, glassStyles.container, googleLoading && styles.socialBtnDisabled]} 
                                onPress={handleGoogleSignIn}
                                disabled={googleLoading}
                            >
                                {googleLoading ? (
                                    <ActivityIndicator size="small" color="#FF6B35" />
                                ) : (
                                    <>
                                        <Ionicons name="logo-google" size={24} color="#4285F4" />
                                        <Text style={styles.socialBtnTextFull}>Continue with Google</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.signupLink} onPress={() => router.push('/signup')}>
                                <Text style={styles.signupText}>
                                    Don't have an account? <Text style={styles.signupBold}>Sign Up</Text>
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, color: '#1a1a1a' },
    scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60 },
    
    logoContainer: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
    logoBox: { width: 100, height: 100, borderRadius: 28, overflow: 'hidden', padding: 0 },
    logoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 32, fontFamily: 'Pacifico_400Regular', color: '#1a1a1a', marginTop: 16, marginBottom: 4 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', fontWeight: '500' },

    card: { borderRadius: 32, padding: 24, width: '100%' },
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '800', color: '#555', marginBottom: 8, marginLeft: 4 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 12 },
    input: { flex: 1, fontSize: 16, color: '#1a1a1a', fontWeight: '600' },

    forgotBtn: { alignSelf: 'flex-end', marginBottom: 28, marginRight: 4 },
    forgotText: { color: '#FF6B35', fontSize: 14, fontWeight: '800' },

    loginBtn: { width: '100%', height: 56, borderRadius: 18, overflow: 'hidden', marginBottom: 28 },
    loginBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loginBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },

    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    line: { flex: 1, height: 1.5, backgroundColor: 'rgba(0,0,0,0.05)' },
    dividerText: { fontSize: 13, color: '#999', fontWeight: '700' },

    socialBtnFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.4)', gap: 12, marginBottom: 32 },
    socialBtnDisabled: { opacity: 0.6 },
    socialBtnTextFull: { fontSize: 16, fontWeight: '800', color: '#444' },

    signupLink: { alignSelf: 'center' },
    signupText: { fontSize: 15, color: '#666', fontWeight: '500' },
    signupBold: { color: '#FF6B35', fontWeight: '900' },
});
``


## D:\Rumbala\app\onboarding.tsx
``tsx

import React, { useState, useRef } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet,
    Dimensions, ScrollView, NativeScrollEvent, NativeSyntheticEvent,
    StatusBar, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store/useStore';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../src/constants/glass';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        key: 'play',
        title: 'Play ',
        titleAccent: 'Together.',
        subtitle: 'Spice up your connection with fun, romantic challenges and games.',
        image: require('../assets/images/onboarding_couple_v2.png'),
    },
    {
        key: 'safety',
        title: 'Safe & ',
        titleAccent: 'Private.',
        subtitle: 'Your data is 100% encrypted and local to your device for total peace of mind.',
        image: null,
    },
    {
        key: 'steps',
        title: 'How to Play',
        subtitle: '3 Simple Steps to Fun',
        image: require('../assets/icon.png'),
    },
    {
        key: 'setup',
        title: 'One Last ',
        titleAccent: 'Step.',
        subtitle: 'Tell us who is playing today!',
        image: null,
    }
];

const BG_COLORS = ['#FEE2E2', '#FFEDD5', '#FEF3C7'];

export default function OnboardingScreen() {
    const router = useRouter();
    const { setHasSeenOnboarding, setPartners, partner1: storeP1, partner2: storeP2 } = useStore();
    const [name1, setName1] = useState(storeP1 || '');
    const [name2, setName2] = useState(storeP2 || '');
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    const handleFinish = () => {
        if (!name1.trim()) {
            scrollRef.current?.scrollTo({ x: 3 * width, animated: true });
            return;
        }
        setPartners(name1.trim(), name2.trim());
        setHasSeenOnboarding(true);
        router.replace('/login');
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = event.nativeEvent.contentOffset.x;
        const index = Math.round(x / width);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const nextSlide = () => {
        if (activeIndex < SLIDES.length - 1) {
            scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
        } else {
            handleFinish();
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
                <StatusBar barStyle="dark-content" />
                
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, glassStyles.header]}>
                    {activeIndex < 2 ? (
                        <>
                            <View style={styles.logoRow}>
                                <Ionicons name="heart" size={24} color="#FF6B35" />
                                <Text style={[styles.headerText, { fontFamily: 'Pacifico_400Regular' }]}>Rumbala</Text>
                            </View>
                            <TouchableOpacity style={[styles.notifBtn, glassStyles.container, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                                <Ionicons name="notifications" size={20} color="#FF6B35" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.headerCentered}>
                            <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ x: 0, animated: true })} style={[styles.backBtn, glassStyles.container]}>
                                <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
                            </TouchableOpacity>
                            <Text style={[styles.headerTitle, { fontFamily: 'Pacifico_400Regular' }]}>How to Play</Text>
                            <View style={{ width: 44 }} />
                        </View>
                    )}
                </Animated.View>

                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    style={{ flex: 1 }}
                >
                    {/* SLIDE 1: INTRO */}
                    <View style={[styles.slide, { width }]}>
                        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.textSection}>
                            <Text style={styles.title}>
                                {SLIDES[0].title}
                                <Text style={styles.titleAccent}>{SLIDES[0].titleAccent}</Text>
                            </Text>
                            <Text style={styles.subtitle}>{SLIDES[0].subtitle}</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(300)} style={styles.imageCardContainer}>
                            <View style={[styles.illustrationCard, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                                <Image source={SLIDES[0].image} style={styles.mainImage} resizeMode="contain" />
                            </View>
                        </Animated.View>

                        <View style={styles.avatarRow}>
                            <View style={[styles.avatar, glassStyles.container, { zIndex: 3, backgroundColor: '#FFD6C9' }]}><Ionicons name="person" size={20} color="#FF6B35" /></View>
                            <View style={[styles.avatar, glassStyles.container, { left: -16, zIndex: 2, backgroundColor: '#FFE4DE' }]}><Ionicons name="person" size={20} color="#FFB8A1" /></View>
                            <View style={[styles.avatarAdd, glassStyles.container, { left: -32, zIndex: 1, backgroundColor: '#FF6B35' }]}><Ionicons name="add" size={20} color="#fff" /></View>
                        </View>

                        <TouchableOpacity style={styles.primaryBtn} onPress={nextSlide} activeOpacity={0.85}>
                            <Text style={styles.primaryBtnText}>Get Started</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryBtn} onPress={handleFinish}>
                            <Text style={styles.secondaryBtnText}>I already have an account</Text>
                        </TouchableOpacity>
                    </View>

                    {/* SLIDE 2: SAFETY & PRIVACY */}
                    <View style={[styles.slide, { width }]}>
                        <Animated.View entering={FadeInDown.duration(600)} style={styles.textSection}>
                            <Text style={styles.title}>
                                {SLIDES[1].title}
                                <Text style={styles.titleAccent}>{SLIDES[1].titleAccent}</Text>
                            </Text>
                            <Text style={styles.subtitle}>{SLIDES[1].subtitle}</Text>
                        </Animated.View>

                        <View style={styles.safetyContainer}>
                            <Animated.View entering={FadeInUp.delay(100)} style={[styles.safetyCard, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                                <View style={[styles.safetyIcon, glassStyles.container, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                                    <Ionicons name="shield-checkmark" size={32} color="#FF6B35" />
                                </View>
                                <Text style={styles.safetyTitle}>End-to-End Encrypted</Text>
                                <Text style={styles.safetyDesc}>Your dares and chat messages are never readable by anyone else.</Text>
                            </Animated.View>
                            <Animated.View entering={FadeInUp.delay(200)} style={[styles.safetyCard, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                                <View style={[styles.safetyIcon, glassStyles.container, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                                    <Ionicons name="location-outline" size={32} color="#FF6B35" />
                                </View>
                                <Text style={styles.safetyTitle}>100% Private</Text>
                                <Text style={styles.safetyDesc}>No tracking, no selling your data. Just you and your partner.</Text>
                            </Animated.View>
                        </View>

                        <TouchableOpacity style={styles.primaryBtn} onPress={nextSlide} activeOpacity={0.85}>
                            <Text style={styles.primaryBtnText}>Next Step</Text>
                        </TouchableOpacity>
                    </View>

                    {/* SLIDE 3: HOW TO PLAY */}
                    <View style={[styles.slide, { width }]}>
                        <Animated.View entering={FadeInDown.duration(600)} style={[styles.phoneImageContainer, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                            <Image source={SLIDES[2].image} style={styles.stepImage} resizeMode="contain" />
                            <View style={styles.stepLabel}>
                                <Text style={styles.stepLabelText}>GETTING STARTED</Text>
                            </View>
                        </Animated.View>

                        <Text style={styles.slide3Title}>3 Simple Steps to Fun</Text>

                        <View style={styles.stepsContainer}>
                            <StepItem icon="create-outline" title="Set your names & vibe" desc="Customize your profile and pick the intensity mode for tonight." isLast={false} />
                            <StepItem icon="sync-outline" title="Connect with your partner" desc="Sync devices by scanning a QR code or entering a private session pin." isLast={false} />
                            <StepItem icon="card-outline" title="Reveal cards and complete dares" desc="Take turns revealing challenges and start the ultimate gaming experience." isLast={true} />
                        </View>

                        <View style={{ flex: 1 }} />

                        <TouchableOpacity style={styles.primaryBtn} onPress={nextSlide} activeOpacity={0.85}>
                            <View style={styles.btnContent}>
                                <Text style={styles.primaryBtnText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={24} color="#fff" style={{ marginLeft: 10 }} />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.versionText}>Rumbala INSTRUCTIONS V1.0</Text>
                    </View>

                    {/* SLIDE 4: SETUP NAMES */}
                    <View style={[styles.slide, { width }]}>
                        <Animated.View entering={FadeInDown.duration(600)} style={styles.textSection}>
                            <Text style={styles.title}>
                                One Last <Text style={styles.titleAccent}>Step.</Text>
                            </Text>
                            <Text style={styles.subtitle}>Enter your names to start Rumble!</Text>
                        </Animated.View>

                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.setupContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Your Name</Text>
                                <View style={[styles.inputRow, glassStyles.container]}>
                                    <Ionicons name="person-outline" size={18} color="#FF6B35" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Harshal"
                                        placeholderTextColor="#999"
                                        value={name1}
                                        onChangeText={setName1}
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Partner's Name</Text>
                                <View style={[styles.inputRow, glassStyles.container]}>
                                    <Ionicons name="heart-outline" size={18} color="#FF6B35" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Priya"
                                        placeholderTextColor="#999"
                                        value={name2}
                                        onChangeText={setName2}
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>
                        </KeyboardAvoidingView>

                        <View style={{ flex: 1 }} />

                        <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish} activeOpacity={0.85}>
                            <View style={styles.btnContent}>
                                <Text style={styles.primaryBtnText}>Let's Play</Text>
                                <Ionicons name="play-circle" size={24} color="#fff" style={{ marginLeft: 10 }} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Pagination Dots */}
                <View style={styles.pagination}>
                    <View style={[styles.dot, glassStyles.container, activeIndex === 0 && styles.dotActive]} />
                    <View style={[styles.dot, glassStyles.container, activeIndex === 1 && styles.dotActive]} />
                    <View style={[styles.dot, glassStyles.container, activeIndex === 2 && styles.dotActive]} />
                    <View style={[styles.dot, glassStyles.container, activeIndex === 3 && styles.dotActive]} />
                </View>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

function StepItem({ icon, title, desc, isLast }: { icon: string, title: string, desc: string, isLast: boolean }) {
    return (
        <View style={styles.stepItem}>
            <View style={[styles.iconCircle, glassStyles.container, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                <Ionicons name={icon as any} size={20} color="#FF6B35" />
            </View>
            <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitleTxt}>{title}</Text>
                <Text style={styles.stepDescTxt}>{desc}</Text>
            </View>
            {!isLast && <View style={styles.verticalLine} />}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    headerCentered: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerText: { fontSize: 24, color: '#1a1a1a' },
    headerTitle: { fontSize: 20, color: '#1a1a1a' },
    notifBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

    slide: { paddingHorizontal: 24, paddingBottom: 24 },
    textSection: { alignItems: 'center', marginTop: 20, marginBottom: 16 },
    title: { fontSize: 48, fontWeight: '900', color: '#1a1a1a', letterSpacing: -1.5, textAlign: 'center', lineHeight: 52 },
    titleAccent: { color: '#FF6B35' },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginTop: 12, fontWeight: '600' },

    imageCardContainer: { width: '100%', height: 300, justifyContent: 'center', alignItems: 'center', marginVertical: 10 },
    illustrationCard: { width: '100%', height: '100%', padding: 20, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    mainImage: { width: '100%', height: '100%', borderRadius: 24 },

    avatarRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 24 },
    avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
    avatarAdd: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },

    primaryBtn: { backgroundColor: '#FF6B35', width: '100%', paddingVertical: 18, borderRadius: 18, alignItems: 'center', shadowColor: 'rgba(255, 107, 53, 0.4)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 0 },
    btnContent: { flexDirection: 'row', alignItems: 'center' },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    secondaryBtn: { marginTop: 24, alignSelf: 'center' },
    secondaryBtnText: { color: '#666', fontSize: 16, fontWeight: '700' },

    pagination: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingBottom: 30 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.1)' },
    dotActive: { width: 32, backgroundColor: '#FF6B35' },

    safetyContainer: { flex: 1, gap: 16, marginTop: 10, marginBottom: 20 },
    safetyCard: { borderRadius: 24, padding: 24, alignItems: 'center' },
    safetyIcon: { marginBottom: 16, width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    safetyTitle: { fontSize: 19, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
    safetyDesc: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, fontWeight: '500' },

    phoneImageContainer: { width: '100%', height: 180, borderRadius: 28, overflow: 'hidden', padding: 20, marginBottom: 20 },
    stepImage: { width: '100%', height: '100%' },
    stepLabel: { position: 'absolute', bottom: 16, left: 16, backgroundColor: '#FF6B35', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    stepLabelText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    slide3Title: { fontSize: 32, fontWeight: '900', color: '#1a1a1a', marginBottom: 24, letterSpacing: -1 },
    stepsContainer: { width: '100%', gap: 24 },
    stepItem: { flexDirection: 'row', gap: 16, position: 'relative' },
    iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    stepTextContainer: { flex: 1 },
    stepTitleTxt: { fontSize: 17, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
    stepDescTxt: { fontSize: 14, color: '#666', lineHeight: 18, fontWeight: '500' },
    verticalLine: { position: 'absolute', top: 44, left: 22, bottom: -24, width: 2, backgroundColor: 'rgba(255, 107, 53, 0.2)', zIndex: 1 },
    versionText: { marginTop: 12, fontSize: 11, fontWeight: '800', color: '#bbb', textAlign: 'center' },
    setupContainer: { flex: 1, gap: 20, marginTop: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '800', color: '#1a1a1a', marginLeft: 4 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, gap: 12, backgroundColor: 'rgba(255,255,255,0.4)' },
    input: { flex: 1, height: 48, fontSize: 16, color: '#1a1a1a', fontWeight: '600' },
});
``


## D:\Rumbala\app\signup.tsx
``tsx

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../src/store/useStore';
import { signupV2 } from '../src/services/api';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../src/constants/glass';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '../src/services/supabase';
import LegalModal from '../src/components/LegalModal';

const { width } = Dimensions.get('window');

const BG_COLORS = ['#F5FAF9', '#E0F2F1', '#B2DFDB'];

export default function SignupScreen() {
    const router = useRouter();
    const { login, showAlert } = useStore();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agree, setAgree] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [legalVisible, setLegalVisible] = useState(false);
    const [legalType, setLegalType] = useState<'terms' | 'privacy'>('terms');
    const [googleLoading, setGoogleLoading] = useState(false);

    React.useEffect(() => {
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        console.log('SignupScreen: Configuring GoogleSignin with webClientId:', webClientId);
        if (webClientId) {
            GoogleSignin.configure({
                webClientId: webClientId,
                offlineAccess: true,
                forceCodeForRefreshToken: true,
            });
        }
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            setGoogleLoading(true);
            if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
                throw new Error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env');
            }
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            await GoogleSignin.signOut().catch(() => null);
            const result = await GoogleSignin.signIn();
            
            if (result.type === 'cancelled') {
                console.log('Google Sign-In: User cancelled the flow.');
                return;
            }

            if (!result.data) {
                console.error('Google Sign-In: Result data is null but type is not cancelled', result);
                throw new Error('Google Sign-In failed: No user data received.');
            }

            const idToken = result.data.idToken;

            if (!idToken) {
                console.error('Google Sign-In: No idToken found in successful result', result);
                throw new Error('Unable to complete Google Sign-In. Error: Missing ID Token. Please try again or use email.');
            }

            const { data: sessionData, error: sessionError } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: idToken,
            });

            if (sessionError) throw new Error(sessionError.message);
            const userId = sessionData?.user?.id;
            if (!userId) throw new Error('We couldn\'t complete your social login. Please try again.');

            const { postAuthSync } = await import('../src/services/api');
            await postAuthSync(userId);

            const state = useStore.getState();
            if (state.isPro || state.hasSeenSubscription) router.replace('/(tabs)');
            else router.replace('/subscription');
        } catch (error: any) {
            if (error?.code !== statusCodes.SIGN_IN_CANCELLED) {
                showAlert('Sign-In Error', error.message || 'We couldn\'t sign you in with Google. Please try again.');
            }
        } finally { setGoogleLoading(false); }
    };

    const handleBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/onboarding');
    };

    const handleSignup = async () => {
        if (!fullName.trim() || !email.trim() || !password) {
            showAlert('Missing Information', 'Please provide all required details to set up your account.');
            return;
        }
        if (!agree) {
            showAlert('Privacy & Terms', 'Please accept our Terms and Privacy Policy to proceed with registration.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await signupV2(email.trim(), password);
            if (result.needs_email_confirmation) {
                showAlert('Email Verification', result.message || 'A confirmation email has been sent to your address.');
                router.push('/login');
            } else {
                router.replace('/subscription');
            }
        } catch (error: any) {
            showAlert('Registration Error', error.message || 'We couldn\'t create your account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={{ flex: 1 }}
                >
                    <ScrollView 
                        contentContainerStyle={styles.scroll} 
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Animated.View entering={FadeInDown.duration(500)} style={[styles.topHeader, glassStyles.header]}>
                            <TouchableOpacity onPress={handleBack} style={[styles.backBtn, glassStyles.container]}>
                                <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                            </TouchableOpacity>
                            <Text style={[styles.headerTitle, { fontFamily: 'Pacifico_400Regular' }]}>Rumbala</Text>
                            <View style={{ width: 44 }} />
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.logoHeader}>
                            <View style={[styles.logoBox, glassStyles.container]}>
                                <LinearGradient colors={['#FF6B35', '#FF9800']} style={styles.logoGradient}>
                                    <Ionicons name="heart" size={32} color="#fff" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.title}>Join Rumbala</Text>
                            <Text style={styles.subtitle}>The ultimate couple's gaming experience</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={[styles.form, glassStyles.container, { padding: 24, borderRadius: 32 }]}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={[styles.inputRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                    <Ionicons name="person-outline" size={20} color="#888" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="John Doe"
                                        placeholderTextColor="#999"
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={[styles.inputRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                    <Ionicons name="mail-outline" size={20} color="#888" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="john@example.com"
                                        placeholderTextColor="#999"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={[styles.inputRow, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#888" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#999"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <View style={styles.checkboxRow}>
                                <TouchableOpacity 
                                    style={[styles.checkbox, glassStyles.container, agree && styles.checkboxActive]}
                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAgree(!agree); }}
                                    activeOpacity={0.7}
                                >
                                    {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
                                </TouchableOpacity>
                                <Text style={styles.checkboxText}>
                                    I agree to the{' '}
                                    <Text 
                                        style={styles.linkText} 
                                        onPress={() => { setLegalType('terms'); setLegalVisible(true); }}
                                    >
                                        Terms
                                    </Text>
                                    {' '}and{' '}
                                    <Text 
                                        style={styles.linkText} 
                                        onPress={() => { setLegalType('privacy'); setLegalVisible(true); }}
                                    >
                                        Privacy Policy
                                    </Text>
                                </Text>
                            </View>

                            <TouchableOpacity style={styles.primaryBtn} onPress={handleSignup} disabled={isLoading} activeOpacity={0.85}>
                                <LinearGradient 
                                    colors={['#FF6B35', '#FF4D17']} 
                                    style={styles.btnGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryBtnText}>Create Account</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.line} />
                                <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
                                <View style={styles.line} />
                            </View>

                            <TouchableOpacity 
                                style={[styles.socialBtnFull, glassStyles.container, googleLoading && styles.socialBtnDisabled]} 
                                onPress={handleGoogleSignIn}
                                disabled={googleLoading}
                            >
                                {googleLoading ? (
                                    <ActivityIndicator size="small" color="#FF6B35" />
                                ) : (
                                    <>
                                        <Ionicons name="logo-google" size={24} color="#4285F4" />
                                        <Text style={styles.socialBtnTextFull}>Continue with Google</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.footer} 
                                onPress={() => router.push('/login')}
                            >
                                <Text style={styles.footerText}>
                                    Already have an account? <Text style={styles.footerLink}>Log In</Text>
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </KeyboardAvoidingView>

                <LegalModal 
                    visible={legalVisible} 
                    type={legalType} 
                    onClose={() => setLegalVisible(false)} 
                />
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60 },
    topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, marginBottom: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, color: '#1a1a1a' },
    
    logoHeader: { alignItems: 'center', marginBottom: 28 },
    logoBox: { width: 72, height: 72, borderRadius: 20, overflow: 'hidden', padding: 0 },
    logoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontFamily: 'Pacifico_400Regular', color: '#1a1a1a', marginTop: 12, marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center', fontWeight: '500' },

    form: { width: '100%' },
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '800', color: '#555', marginBottom: 8, marginLeft: 4 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 56, gap: 10 },
    input: { flex: 1, fontSize: 16, color: '#1a1a1a', fontWeight: '600' },

    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28, paddingHorizontal: 4 },
    checkbox: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)' },
    checkboxActive: { backgroundColor: '#FF6B35', borderColor: 'transparent' },
    checkboxText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18, fontWeight: '500' },
    linkText: { color: '#FF6B35', fontWeight: '800' },

    primaryBtn: { width: '100%', height: 56, borderRadius: 18, overflow: 'hidden', marginBottom: 28 },
    btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },

    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    line: { flex: 1, height: 1.5, backgroundColor: 'rgba(0,0,0,0.05)' },
    dividerText: { fontSize: 11, fontWeight: '800', color: '#999', letterSpacing: 1 },

    socialBtnFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.4)', gap: 12, marginBottom: 28 },
    socialBtnDisabled: { opacity: 0.6 },
    socialBtnTextFull: { fontSize: 16, fontWeight: '800', color: '#444' },

    footer: { alignItems: 'center' },
    footerText: { fontSize: 15, color: '#666', fontWeight: '500' },
    footerLink: { color: '#FF6B35', fontWeight: '900' },
});
``


## D:\Rumbala\app\subscription.tsx
``tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withRepeat,
    withSequence,
    interpolate,
    Extrapolation,
    FadeInDown,
    FadeInUp
} from 'react-native-reanimated';
import { useStore } from '../src/store/useStore';
import { getOfferings, purchasePackage, restorePurchases, checkProEntitlement, getCustomerInfo } from '../src/services/revenueCatService';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles } from '../src/constants/glass';
import { resolvePlanPackages, inferPeriodLabel, PAYWALL_FEATURES } from '../src/constants/pricing';


const FALLBACK_ANNUAL = { title: 'Annual Pro', price: '₹999/year', trialText: '3 days free, then ₹999/yr' };
const FALLBACK_MONTHLY = { title: 'Monthly Pro', price: '₹99/month', trialText: '3 days free, then ₹99/mo' };
const BG_COLORS = ['#08040A', '#1C0A14', '#0D0814'];

export default function SubscriptionScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { setHasSeenSubscription, setIsPro, showAlert } = useStore();

    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const [annualPackage, setAnnualPackage] = useState<any>(null);
    const [monthlyPackage, setMonthlyPackage] = useState<any>(null);
    const [annualInfo, setAnnualInfo] = useState(FALLBACK_ANNUAL);
    const [monthlyInfo, setMonthlyInfo] = useState(FALLBACK_MONTHLY);

    const glowValue = useSharedValue(1);
    const btnScale = useSharedValue(1);

    useEffect(() => {
        glowValue.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 2000 }),
                withTiming(0.8, { duration: 2000 })
            ),
            -1,
            true
        );
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        try {
            const offerings = await getOfferings();
            const current = offerings?.current;
            const availablePackages = current?.availablePackages || [];
            const { annual, monthly } = resolvePlanPackages(availablePackages);

            if (annual) {
                setAnnualPackage(annual);
                const p = annual.product;
                setAnnualInfo({
                    title: 'Annual Pro',
                    price: p.priceString || '₹999/year',
                    trialText: p.introPrice ? `${p.introPrice.periodNumberOfUnits} days free, then ${p.priceString}` : p.priceString,
                });
            }
            if (monthly) {
                setMonthlyPackage(monthly);
                const p = monthly.product;
                setMonthlyInfo({
                    title: 'Monthly Pro',
                    price: p.priceString || '₹99/month',
                    trialText: p.introPrice ? `${p.introPrice.periodNumberOfUnits} days free, then ${p.priceString}` : p.priceString,
                });
            }
        } catch (e) {
            console.warn('Offerings load failed, using fallback prices');
        }
    };

    const headerGlowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowValue.value }],
        opacity: interpolate(glowValue.value, [0.8, 1.2], [0.3, 0.7], Extrapolation.CLAMP)
    }));

    const handleSelectPlan = (plan: 'monthly' | 'annual') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedPlan(plan);
    };

    const handleTrialPressIn = () => { btnScale.value = withSpring(0.95); };
    const handleTrialPressOut = () => { btnScale.value = withSpring(1); };

    const handleStartTrial = async () => {
        const pkg = selectedPlan === 'annual' ? annualPackage : monthlyPackage;
        if (!pkg) {
            showAlert('Store Not Ready', 'Subscription plans are still loading. Please try again in a moment.');
            return;
        }
        setIsPurchasing(true);
        try {
            const result = await purchasePackage(pkg);
            if (result.success) {
                const info = await getCustomerInfo();
                const hasPro = checkProEntitlement(info);

                if (hasPro) {
                    setIsPro(true);
                    setHasSeenSubscription(true);
                    showAlert('🎉 Welcome to Pro!', 'You now have unlimited access.', [{ text: "Let's Go!", onPress: () => router.replace('/(tabs)') }]);
                } else {
                    setIsPro(false);
                    showAlert('Purchase Pending', 'Your purchase is complete, but Pro is still syncing. Please reopen the app or tap Restore.');
                }
            } else if (result.error && result.error !== 'Purchase cancelled') {
                showAlert('Purchase Failed', result.error);
            }
        } catch (e: any) {
            showAlert('Purchase Error', e.message);
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            const info = await restorePurchases();
            if (checkProEntitlement(info)) {
                setIsPro(true); setHasSeenSubscription(true);
                showAlert('✅ Restored!', 'Your Pro subscription has been restored.', [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]);
            } else {
                showAlert('Not Found', 'No active Pro subscription found for this account.');
            }
        } catch (e: any) {
            showAlert('Restore Error', e.message);
        } finally {
            setIsRestoring(false);
        }
    };

    const handleSkip = () => {
        setHasSeenSubscription(true);
        router.replace('/(tabs)');
    };


    const annualSuffix = inferPeriodLabel(annualInfo.price, 'annual');
    const monthlySuffix = inferPeriodLabel(monthlyInfo.price, 'monthly');

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top']}>
                <StatusBar barStyle="light-content" />
                
                {/* Header (Absolute) */}
                <View style={[styles.header, { top: insets.top + 10 }]}>
                    <TouchableOpacity onPress={handleSkip} style={[styles.closeBtn, glassStyles.container]}>
                        <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    
                    {/* Hero Icon */}
                    <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.heroWrap}>
                        <Animated.View style={[styles.glowOrb, headerGlowStyle]} />
                        <LinearGradient colors={['#FF1493', '#FF6B35']} style={styles.diamondWrap} start={{x:0, y:0}} end={{x:1, y:1}}>
                            <Ionicons name="diamond" size={48} color="#fff" />
                        </LinearGradient>
                    </Animated.View>

                    {/* Titling */}
                    <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.titleWrap}>
                        <Text style={styles.title}>Unlock Premium</Text>
                        <Text style={styles.subtitle}>Get absolute unlimited access to all features, dares, and exclusive LDR video calls.</Text>
                    </Animated.View>

                    {/* 2x2 Feature Grid */}
                    <View style={styles.featureGrid}>
                        {PAYWALL_FEATURES.map((f, i) => (
                            <Animated.View key={f.id} entering={FadeInDown.delay(200 + i*50).duration(500).springify()} style={[styles.featureBox, glassStyles.container, { width: (width - 52) / 2 }]}>
                                <LinearGradient colors={['rgba(255,20,147,0.15)', 'transparent']} style={StyleSheet.absoluteFill} />
                                <View style={styles.featureIcon}>
                                    <Ionicons name={f.icon as any} size={22} color="#FF66B2" />
                                </View>
                                <Text style={styles.featureTitle}>{f.title}</Text>
                                <Text style={styles.featureDesc}>{f.desc}</Text>
                            </Animated.View>
                        ))}
                    </View>

                    {/* Plans */}
                    <Animated.View entering={FadeInUp.delay(300).duration(600).springify()} style={styles.plansWrap}>
                        {/* Annual */}
                        <TouchableOpacity style={[styles.planCard, selectedPlan === 'annual' && styles.planCardActive]} activeOpacity={0.9} onPress={() => handleSelectPlan('annual')}>
                            <View style={styles.planBg} />
                            {selectedPlan === 'annual' && <LinearGradient colors={['rgba(255,20,147,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />}
                            <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>BEST VALUE</Text>
                            </View>
                            <View style={styles.planInfo}>
                                <View style={styles.radioOut}>
                                    {selectedPlan === 'annual' && <View style={styles.radioIn} />}
                                </View>
                                <View>
                                    <Text style={styles.planName}>{annualInfo.title}</Text>
                                    <Text style={styles.planTrial}>{annualInfo.trialText}</Text>
                                </View>
                            </View>
                            <Text style={styles.planPrice}>{annualInfo.price.split('/')[0]}<Text style={styles.planPeriod}>{annualSuffix}</Text></Text>
                        </TouchableOpacity>

                        {/* Monthly */}
                        <TouchableOpacity style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]} activeOpacity={0.9} onPress={() => handleSelectPlan('monthly')}>
                            <View style={styles.planBg} />
                            {selectedPlan === 'monthly' && <LinearGradient colors={['rgba(255,20,147,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />}
                            <View style={styles.planInfo}>
                                <View style={styles.radioOut}>
                                    {selectedPlan === 'monthly' && <View style={styles.radioIn} />}
                                </View>
                                <View>
                                    <Text style={styles.planName}>{monthlyInfo.title}</Text>
                                    <Text style={styles.planTrial}>{monthlyInfo.trialText}</Text>
                                </View>
                            </View>
                            <Text style={styles.planPrice}>{monthlyInfo.price.split('/')[0]}<Text style={styles.planPeriod}>{monthlySuffix}</Text></Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Spacer for sticky footer */}
                    <View style={{ height: 120 }} />

                </ScrollView>

                {/* Sticky Footer */}
                <Animated.View entering={FadeInUp.delay(500).duration(500)} style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <LinearGradient colors={['transparent', '#08040A']} style={styles.footerGradient} />
                    
                    <View style={styles.footerContent}>
                        <TouchableOpacity 
                            onPressIn={handleTrialPressIn} onPressOut={handleTrialPressOut} onPress={handleStartTrial}
                            disabled={isPurchasing} activeOpacity={0.9}
                        >
                            <Animated.View style={[styles.ctaBtn, { transform: [{ scale: btnScale }] }]}>
                                <LinearGradient colors={['#FF1493', '#FF4D17']} style={styles.ctaGrad} start={{x:0, y:0}} end={{x:1, y:1}}>
                                    {isPurchasing ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.ctaText}>Start Free Trial</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                                        </>
                                    )}
                                </LinearGradient>
                            </Animated.View>
                        </TouchableOpacity>
                        
                        <View style={styles.footerLinks}>
                            <Text style={styles.footerLinkText}>Cancel anytime.</Text>
                            <View style={styles.dot} />
                            <TouchableOpacity onPress={handleRestore} disabled={isRestoring}>
                                <Text style={styles.restoreText}>{isRestoring ? 'Restoring...' : 'Restore Purchases'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
                
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    header: { position: 'absolute', right: 20, zIndex: 100 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    
    scroll: { paddingHorizontal: 20, paddingTop: 40 },
    
    heroWrap: { alignItems: 'center', marginBottom: 24, position: 'relative' },
    glowOrb: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: '#FF1493', top: -20 },
    diamondWrap: { width: 90, height: 90, borderRadius: 30, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '10deg' }], shadowColor: '#FF1493', shadowOffset: { width:0, height:10 }, shadowOpacity: 0.5, shadowRadius: 20 },
    
    titleWrap: { alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 36, fontFamily: 'Pacifico_400Regular', color: '#fff', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#A1B0C1', textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
    
    featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
    featureBox: { padding: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    featureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,102,178,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    featureTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 4 },
    featureDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },

    plansWrap: { gap: 12 },
    planCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'transparent', overflow: 'hidden' },
    planBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.03)' },
    planCardActive: { borderColor: '#FF1493' },
    popularBadge: { position: 'absolute', top: 0, right: 24, backgroundColor: '#FF1493', paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
    popularBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    planInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    radioOut: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    radioIn: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF1493' },
    planName: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 4 },
    planTrial: { fontSize: 12, color: '#FFB8D2', fontWeight: '600' },
    planPrice: { fontSize: 20, fontWeight: '900', color: '#fff' },
    planPeriod: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    footerGradient: { position: 'absolute', top: -40, left: 0, right: 0, bottom: 0 },
    footerContent: { paddingHorizontal: 20, paddingTop: 10 },
    ctaBtn: { shadowColor: '#FF1493', shadowOffset: { width:0, height:8 }, shadowOpacity: 0.4, shadowRadius: 16 },
    ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: 32 },
    ctaText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
    footerLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
    footerLinkText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
    restoreText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '700', textDecorationLine: 'underline' },
});
``


## D:\Rumbala\app\verify-otp.tsx
``tsx

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, StatusBar,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../src/constants/glass';

const { width } = Dimensions.get('window');

const BG_COLORS = ['#F5FAF9', '#E0F2F1', '#B2DFDB'];

export default function VerificationScreen() {
    const router = useRouter();
    const [otp, setOtp] = useState(['', '', '', '']);

    const handleBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/signup');
    };

    const handleVerify = () => {
        router.replace('/welcome');
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />
                <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, glassStyles.header]}>
                    <TouchableOpacity onPress={handleBack} style={[styles.backBtn, glassStyles.container]}>
                        <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { fontFamily: 'Pacifico_400Regular' }]}>Rumbala</Text>
                    <View style={{ width: 44 }} />
                </Animated.View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.content}>
                        <View style={[styles.iconCircle, glassStyles.container, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                            <Ionicons name="heart" size={46} color="#FF6B35" />
                            <View style={[styles.lockBadge, glassStyles.container, { backgroundColor: '#FF6B35', padding: 0 }]}>
                                <Ionicons name="lock-closed" size={12} color="#fff" />
                            </View>
                        </View>

                        <Text style={styles.title}>Verification</Text>
                        <Text style={styles.subtitle}>
                            We sent a 4-digit code to {'\n'}
                            <Text style={styles.emailHighlight}>alex@example.com</Text>. Enter it below to continue.
                        </Text>

                        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={[styles.otpCard, glassStyles.container]}>
                            <View style={styles.otpRow}>
                                {[0, 1, 2, 3].map((i) => (
                                    <View key={i} style={[styles.otpBox, glassStyles.container, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                                        <Text style={styles.otpDot}>•</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerify} activeOpacity={0.85}>
                                <LinearGradient 
                                    colors={['#FF6B35', '#FF9800']} 
                                    style={styles.btnGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <View style={styles.btnContent}>
                                        <Text style={styles.primaryBtnText}>Verify & Proceed</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={styles.resendText}>
                                Didn't receive the code? <Text style={styles.resendLink}>Resend Code</Text>
                            </Text>

                            <TouchableOpacity style={styles.footer} onPress={() => router.push('/login')}>
                                <Ionicons name="arrow-back-circle" size={20} color="#666" style={{ marginRight: 8 }} />
                                <Text style={styles.footerText}>Back to Sign In</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, color: '#1a1a1a' },
    scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60 },
    content: { alignItems: 'center', paddingTop: 20 },
    
    iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    lockBadge: { position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },

    title: { fontSize: 32, fontWeight: '900', color: '#1a1a1a', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 32, fontWeight: '500' },
    emailHighlight: { color: '#FF6B35', fontWeight: '800' },

    otpCard: { width: '100%', padding: 24, borderRadius: 32, alignItems: 'center' },
    otpRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    otpBox: { width: 60, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    otpDot: { fontSize: 24, color: '#ccc' },

    primaryBtn: { width: '100%', height: 56, borderRadius: 18, overflow: 'hidden', marginBottom: 24 },
    btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },

    resendText: { fontSize: 14, color: '#888', marginBottom: 32, fontWeight: '500' },
    resendLink: { color: '#FF6B35', fontWeight: '900', textDecorationLine: 'underline' },

    footer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    footerText: { fontSize: 15, color: '#666', fontWeight: '800' },
});
``


## D:\Rumbala\app\welcome.tsx
``tsx

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Alert, ScrollView, StyleSheet, StatusBar,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getInitialFreeCards } from '../src/constants/cards';
import { useStore } from '../src/store/useStore';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../src/constants/glass';

const { width } = Dimensions.get('window');

const BG_COLORS = ['#FF6B35', '#FF8C00', '#FFA500'];

const VIBES = [
    { key: 'fun', label: 'Fun', desc: 'Playful & light', colors: ['#FFD93D', '#FF9800'] as const, iconBg: '#FFF9E1', solidColor: '#FF9800' },
    { key: 'romantic', label: 'Romantic', desc: 'Sweet & intimate', colors: ['#FF6B35', '#FB8C00'] as const, iconBg: '#FFF0EA', solidColor: '#FF6B35' },
    { key: 'spicy', label: 'Spicy', desc: 'Bold & daring', colors: ['#F4511E', '#BF360C'] as const, iconBg: '#FFEBEA', solidColor: '#EF4444' },
] as const;

export default function WelcomeScreen() {
    const router = useRouter();
    const { setSelectedVibe, setPartners, showAlert } = useStore();
    const [partner1, setPartner1] = useState('');
    const [partner2, setPartner2] = useState('');
    const [vibe, setVibe] = useState<'fun' | 'romantic' | 'spicy'>('fun');
    const [name1Focused, setName1Focused] = useState(false);
    const [name2Focused, setName2Focused] = useState(false);

    const handleStart = async () => {
        if (!partner1.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showAlert('Missing Name', 'Please enter your name to continue!');
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        try {
            const defaultCards = getInitialFreeCards();
            await AsyncStorage.setItem('@Rumbala_owned_cards', JSON.stringify(defaultCards));
            setPartners(partner1.trim(), partner2.trim());
            await AsyncStorage.setItem('@Rumbala_mode', 'local');
            setSelectedVibe(vibe);
            router.replace('/login');
        } catch {
            showAlert('Error', 'Something went wrong while setting up your profile. Please try again.');
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="light-content" />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={styles.scroll}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Logo area */}
                        <Animated.View 
                            entering={FadeInDown.delay(100).duration(600)} 
                            renderToHardwareTextureAndroid={true}
                            style={styles.logoSection}
                        >
                            <View style={[styles.logoCircle, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Ionicons name="heart" size={24} color="#fff" />
                            </View>
                            <Text style={styles.brandName}>Rumbala</Text>
                            <Text style={styles.brandTagline}>Dare the distance with your partner ✨</Text>
                        </Animated.View>

                        {/* Main Card */}
                        <Animated.View 
                            entering={FadeInUp.delay(300).duration(800)} 
                            renderToHardwareTextureAndroid={true}
                            style={[styles.card, glassStyles.container]}
                        >
                            <Text style={styles.cardTitle}>Let's set up your game!</Text>
                            <Text style={styles.cardSubtitle}>Enter your names and pick your vibe</Text>

                            {/* Your Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Your Name</Text>
                                <View style={[styles.inputRow, glassStyles.container, name1Focused && styles.inputRowFocused]}>
                                    <Ionicons name="person-outline" size={18} color={name1Focused ? '#FF6B35' : '#888'} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Harshal"
                                        placeholderTextColor="#999"
                                        value={partner1}
                                        onChangeText={setPartner1}
                                        autoCorrect={false}
                                        onFocus={() => setName1Focused(true)}
                                        onBlur={() => setName1Focused(false)}
                                    />
                                </View>
                            </View>

                            {/* Partner Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Partner's Name</Text>
                                <View style={[styles.inputRow, glassStyles.container, name2Focused && styles.inputRowFocused]}>
                                    <Ionicons name="heart-outline" size={18} color={name2Focused ? '#FF6B35' : '#888'} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Priya"
                                        placeholderTextColor="#999"
                                        value={partner2}
                                        onChangeText={setPartner2}
                                        autoCorrect={false}
                                        onFocus={() => setName2Focused(true)}
                                        onBlur={() => setName2Focused(false)}
                                    />
                                </View>
                            </View>

                            {/* Vibe Picker */}
                            <Text style={styles.vibeTitle}>Choose Your Vibe</Text>
                            <View style={styles.vibeRow}>
                                {VIBES.map((v) => {
                                    const isSelected = vibe === v.key;
                                    return (
                                        <TouchableOpacity
                                            key={v.key}
                                            style={[styles.vibeCard, glassStyles.container, isSelected && styles.vibeCardSelected]}
                                            onPress={() => { Haptics.selectionAsync(); setVibe(v.key); }}
                                            activeOpacity={0.8}
                                        >
                                            {isSelected && (
                                                <LinearGradient
                                                    colors={[v.colors[0], v.colors[1]]}
                                                    style={StyleSheet.absoluteFill}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                />
                                            )}
                                            {!isSelected && <View style={[styles.vibeImg, { backgroundColor: v.solidColor, borderRadius: 12 }]} />}
                                            {isSelected && <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginBottom: 12 }} />}
                                            <Text style={[styles.vibeLabel, { color: isSelected ? '#fff' : '#1a1a1a' }]}>{v.label}</Text>
                                            <Text style={[styles.vibeDesc, { color: isSelected ? 'rgba(255,255,255,0.8)' : '#666' }]}>{v.desc}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Start Button */}
                            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
                                <LinearGradient colors={['#FF6B35', '#FF9800']} style={styles.startGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                    <View style={styles.btnContent}>
                                        <Text style={styles.startText}>Start Rumble!</Text>
                                        <Ionicons name="sparkles" size={18} color="#fff" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Trust line */}
                            <View style={styles.trustRow}>
                                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                                <Text style={styles.trustText}>5 FREE dare cards • Private & Encrypted</Text>
                            </View>
                        </Animated.View>

                        <View style={{ height: 60 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },
    
    logoSection: { alignItems: 'center', marginBottom: 32 },
    logoCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    brandName: { fontFamily: 'Pacifico_400Regular', fontSize: 48, color: '#fff', letterSpacing: 0.5, lineHeight: 60 },
    brandTagline: { fontSize: 15, color: 'rgba(255,255,255,0.9)', fontWeight: '700', letterSpacing: 0.2 },

    card: { borderRadius: 32, padding: 24, width: '100%', maxWidth: 420 },
    cardTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', marginBottom: 6, textAlign: 'center' },
    cardSubtitle: { fontSize: 14, color: '#666', marginBottom: 28, textAlign: 'center', fontWeight: '500' },

    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '800', color: '#555', marginBottom: 8, marginLeft: 4 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 2, gap: 10, backgroundColor: 'rgba(0,0,0,0.02)' },
    inputRowFocused: { borderColor: '#FF6B35', borderBottomWidth: 2 },
    input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1a1a1a', fontWeight: '600' },

    vibeTitle: { fontSize: 13, fontWeight: '800', color: '#555', marginBottom: 12, marginTop: 4, marginLeft: 4 },
    vibeRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    vibeCard: { flex: 1, alignItems: 'center', paddingVertical: 20, paddingHorizontal: 4, borderRadius: 22, overflow: 'hidden' },
    vibeCardSelected: { borderColor: 'transparent' },
    vibeImg: { width: 40, height: 40, marginBottom: 10 },
    vibeLabel: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
    vibeDesc: { fontSize: 10, fontWeight: '700', textAlign: 'center' },

    startBtn: { borderRadius: 20, overflow: 'hidden' },
    startGradient: { paddingVertical: 18 },
    btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    startText: { color: '#fff', fontSize: 18, fontWeight: '900' },

    trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
    trustText: { fontSize: 12, color: '#999', fontWeight: '700' },
});
``


## D:\Rumbala\app\_layout.tsx
``tsx

import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { Quicksand_300Light, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { useColorScheme } from 'react-native';
import { theme } from '../src/constants/theme';
import { useStore } from '../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import * as WebBrowser from 'expo-web-browser';
import { initRevenueCat, getCustomerInfo, checkProEntitlement } from '../src/services/revenueCatService';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomAlert from '../src/components/CustomAlert';
import { initNotifications } from '../src/services/notificationService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Required for Google OAuth redirect handling
WebBrowser.maybeCompleteAuthSession();

// Prevent auto hide of splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { hydrate } = useStore(useShallow(state => ({
        hydrate: state.hydrate,
    })));

    const [fontsLoaded, fontError] = useFonts({
        Pacifico_400Regular,
        Quicksand_300Light,
        Quicksand_400Regular,
        Quicksand_500Medium,
        Quicksand_600SemiBold,
        Quicksand_700Bold,
    });

    useEffect(() => {
        const initApp = async () => {
            // 1. Restore local state (names, auth, cardCount, etc.)
            await hydrate();

            const store = useStore.getState();
            const userId = store.userId;

            // 2. Initialize RevenueCat with the restored userId
            await initRevenueCat(userId || undefined);

            // 3. Verify real Pro status from RevenueCat (overrides AsyncStorage cache)
            if (store.isAuthenticated) {
                try {
                    const customerInfo = await getCustomerInfo();
                    const isReallyPro = checkProEntitlement(customerInfo);
                    
                    if (isReallyPro !== store.isPro) {
                        store.setIsPro(isReallyPro);
                    }
                } catch (e) {
                    // RC not reachable — keep last known state
                }

                // 4. Load card count & scores from Supabase for logged-in users
                if (userId) {
                    try {
                        await store.loadCardsFromSupabase(userId);
                        await store.loadScoresFromSupabase(userId);
                    } catch (e) {
                        // Supabase not reachable — keep cached values
                    }
                }
            }
            // 5. Initialize daily notifications
            await initNotifications();
        };

        initApp();

        // 5. Listen for Global Auth State Changes (Supabase)
        // This ensures the store stays in sync if session expires or user logs in/out
        import('../src/services/supabase').then(({ supabase }) => {
            supabase.auth.onAuthStateChange(async (event, session) => {
                const store = useStore.getState();
                
                // If we get a session, sync everything
                if (session?.user) {
                    if (store.userId !== session.user.id || !store.isAuthenticated) {
                        store.setUserId(session.user.id);
                        await store.syncWithSupabase();
                    }
                } else if (event === 'SIGNED_OUT') {
                    // Only logout if it's an explicit sign out event
                    if (store.isAuthenticated) {
                        store.logout();
                    }
                }
            });
        });
    }, []);



    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    // Always render the Stack — never return null.
    // SplashScreen covers the UI while fonts/hydration are loading.
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: isDark ? theme.colors.dark.background : theme.colors.light.background },
                        animation: 'fade',
                    }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="signup" />
                    <Stack.Screen name="welcome" />
                    <Stack.Screen name="(tabs)" />
                </Stack>
                <CustomAlert />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

``


## D:\Rumbala\src\components\AnimatedBackground.tsx
``tsx

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { Platform } from 'react-native';

interface AnimatedBackgroundProps {
    colors: string[];
    style?: any;
    intensity?: 'low' | 'medium' | 'high';
    children?: React.ReactNode;
}

export default function AnimatedBackground({
    colors,
    style,
    intensity = 'medium',
    children,
}: AnimatedBackgroundProps) {
    const animation = useSharedValue(0);

    useEffect(() => {
        animation.value = withRepeat(
            withSequence(
                withTiming(1, {
                    duration: 6000,
                    easing: Easing.inOut(Easing.ease),
                }),
                withTiming(0, {
                    duration: 6000,
                    easing: Easing.inOut(Easing.ease),
                })
            ),
            -1,
            true
        );
    }, []);

    const getFloatingElementCount = () => {
        switch (intensity) {
            case 'low':
                return 3;
            case 'high':
                return Platform.OS === 'android' ? 4 : 8;
            default:
                return Platform.OS === 'android' ? 3 : 5;
        }
    };

    const getDuration = () => {
        switch (intensity) {
            case 'low':
                return 8000;
            case 'high':
                return 4000;
            default:
                return 6000;
        }
    };

    return (
        <LinearGradient colors={colors as unknown as readonly [string, string, ...string[]]} style={[styles.container, style]}>
            {/* Animated floating orbs/circles */}
            {Array.from({ length: getFloatingElementCount() }).map((_, index) => {
                const delay = index * 1000;
                const size = 50 + (index % 3) * 40;
                const duration = getDuration();

                return (
                    <FloatingOrb
                        key={`orb-${index}`}
                        size={size}
                        duration={duration}
                        delay={delay}
                        opacity={0.1 + (index % 3) * 0.05}
                    />
                );
            })}

            {children}
        </LinearGradient>
    );
}

interface FloatingOrbProps {
    size: number;
    duration: number;
    delay: number;
    opacity: number;
}

function FloatingOrb({ size, duration, delay, opacity }: FloatingOrbProps) {
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const rotation = useSharedValue(0);

    useEffect(() => {
        const randomY = Math.random() * 200 - 100;
        const randomX = Math.random() * 150 - 75;

        setTimeout(() => {
            translateY.value = withRepeat(
                withSequence(
                    withTiming(randomY, { duration, easing: Easing.sin }),
                    withTiming(0, { duration, easing: Easing.sin })
                ),
                -1,
                true
            );

            translateX.value = withRepeat(
                withSequence(
                    withTiming(randomX, { duration: duration * 1.5, easing: Easing.sin }),
                    withTiming(0, { duration: duration * 1.5, easing: Easing.sin })
                ),
                -1,
                true
            );

            rotation.value = withRepeat(
                withTiming(360, { duration: duration * 2, easing: Easing.linear }),
                -1,
                false
            );
        }, delay);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { rotate: `${rotation.value}deg` },
        ],
    }));

    return (
        <Animated.View
            renderToHardwareTextureAndroid={true}
            style={[
                styles.orb,
                {
                    width: size,
                    height: size,
                    opacity,
                },
                animatedStyle,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    orb: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
});

``


## D:\Rumbala\src\components\CameraModal.tsx
``tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { glassStyles } from '../constants/glass';

interface CameraModalProps {
    visible: boolean;
    onClose: () => void;
    onPhotoTaken: (uri: string) => void;
}

export default function CameraModal({ visible, onClose, onPhotoTaken }: CameraModalProps) {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!visible) return null;

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Modal 
                visible={visible} 
                animationType="slide" 
                transparent={false}
                hardwareAccelerated={true}
                statusBarTranslucent={true}
            >
                <View style={[styles.permissionContainer, { backgroundColor: '#000' }]}>
                    <View style={[styles.iconWrap, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Ionicons name="camera-outline" size={48} color="#fff" />
                    </View>
                    <Text style={[styles.permissionText, { color: '#fff' }]}>We need camera access to capture your daring proofs! 📸</Text>
                    <TouchableOpacity style={styles.grantButton} onPress={requestPermission} activeOpacity={0.8}>
                        <LinearGradient colors={['#FF6B35', '#FF8C00']} style={styles.btnGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                            <Text style={styles.grantButtonText}>Enable Camera</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelBtnText}>Maybe Later</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    function toggleCameraFacing() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    const takePicture = async () => {
        if (cameraRef && !isProcessing) {
            setIsProcessing(true);
            try {
                const photo = await cameraRef.takePictureAsync({
                    quality: 0.7,
                });
                if (photo) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setPhotoUri(photo.uri);
                }
            } catch (e) {
                console.error('Failed to take picture:', e);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const confirmPhoto = () => {
        if (photoUri) {
            onPhotoTaken(photoUri);
            setPhotoUri(null);
            onClose();
        }
    };

    const retakePhoto = () => {
        setPhotoUri(null);
    };

    const handleClose = () => {
        setPhotoUri(null);
        onClose();
    };

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            transparent={false}
            hardwareAccelerated={true}
            statusBarTranslucent={true}
        >
            <View style={styles.container}>
                {photoUri ? (
                    // PREVIEW SCREEN
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: photoUri }} style={styles.previewImage} />
                        <View style={styles.previewActions}>
                            <TouchableOpacity style={[styles.retakeBtn, glassStyles.container]} onPress={retakePhoto}>
                                <Ionicons name="refresh" size={24} color="#fff" />
                                <Text style={styles.btnText}>Retake</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={confirmPhoto} activeOpacity={0.8}>
                                <LinearGradient colors={['#FF6B35', '#FF8C00']} style={styles.btnGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Ionicons name="checkmark" size={24} color="#fff" />
                                        <Text style={styles.confirmBtnText}>Submit Proof</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    // CAMERA SCREEN
                    <CameraView
                        style={styles.camera}
                        facing={facing}
                        ref={(ref) => setCameraRef(ref)}
                    >
                        <View style={styles.headerRow}>
                            <TouchableOpacity style={styles.iconBtn} onPress={handleClose}>
                                <Ionicons name="close" size={32} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn} onPress={toggleCameraFacing}>
                                <Ionicons name="camera-reverse" size={32} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footerRow}>
                            <TouchableOpacity
                                style={styles.captureBtnInner}
                                onPress={takePicture}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="#FF6B35" />
                                ) : (
                                    <View style={styles.captureCore} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </CameraView>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1, justifyContent: 'space-between' },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    iconBtn: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 30,
    },
    footerRow: {
        paddingBottom: 50,
        alignItems: 'center',
    },
    captureBtnInner: {
        width: 80,
        height: 80,
        borderWidth: 4,
        borderColor: '#fff',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 20, 147, 0.5)',
    },
    captureCore: {
        width: 60,
        height: 60,
        backgroundColor: '#fff',
        borderRadius: 30,
    },
    previewContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    previewImage: {
        flex: 1,
        resizeMode: 'cover',
    },
    previewActions: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        justifyContent: 'space-between',
        gap: 12,
    },
    retakeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        height: 60,
        borderRadius: 30,
    },
    confirmBtn: {
        flex: 1.5,
        borderRadius: 30,
        overflow: 'hidden',
    },
    btnGradient: {
        width: '100%',
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 8 },
    confirmBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    iconWrap: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    permissionText: { fontSize: 20, textAlign: 'center', marginBottom: 40, lineHeight: 30, fontWeight: '700' },
    grantButton: { width: '100%', borderRadius: 30, overflow: 'hidden', marginBottom: 15 },
    grantButtonText: { color: '#fff', fontSize: 18, fontWeight: '900' },
    cancelBtn: { padding: 15 },
    cancelBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '700' }
});

``


## D:\Rumbala\src\components\Card.tsx
``tsx

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { DareCard } from '../constants/cards';


interface CardProps {
    card: DareCard;
    isFlipped?: boolean;
    onFlip?: () => void;
}

const CARD_THEMES: Record<string, {
    gradient: readonly [string, string, string];
    icon: string;
    label: string;
    accent: string;
}> = {
    fun: { gradient: ['#FFD93D', '#FF9800', '#FFB74D'] as const, icon: '🎉', label: 'FUN', accent: '#FF9800' },
    romantic: { gradient: ['#FF6B35', '#FB8C00', '#FFA726'] as const, icon: '💕', label: 'ROMANTIC', accent: '#FF6B35' },
    spicy: { gradient: ['#F4511E', '#D84315', '#BF360C'] as const, icon: '🔥', label: 'SPICY', accent: '#F4511E' },
    ldr: { gradient: ['#FF9800', '#FF6B35', '#E65100'] as const, icon: '🌍', label: 'LDR', accent: '#FF9800' },
};

export default function Card({ card, isFlipped = true, onFlip }: CardProps) {
    const flipAnim = useSharedValue(isFlipped ? 1 : 0);
    const scaleAnim = useSharedValue(0.92);
    const { width } = useWindowDimensions();

    const CARD_WIDTH = Math.min(Math.max(width * 0.82, 280), 420);
    const CARD_HEIGHT = CARD_WIDTH * 1.25;

    const theme = CARD_THEMES[card.type] || CARD_THEMES.fun;

    useEffect(() => {
        flipAnim.value = withTiming(isFlipped ? 1 : 0, { duration: 500 });
        if (isFlipped) {
            scaleAnim.value = withTiming(1, { duration: 400 });
        } else {
            scaleAnim.value = withTiming(0.92, { duration: 300 });
        }
    }, [isFlipped]);

    const frontStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipAnim.value, [0, 1], [0, 180], Extrapolation.CLAMP);
        return {
            transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }, { scale: scaleAnim.value }],
            backfaceVisibility: 'hidden' as const,
            opacity: flipAnim.value < 0.5 ? 1 : 0,
        };
    });

    const backStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipAnim.value, [0, 1], [180, 360], Extrapolation.CLAMP);
        return {
            transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }, { scale: scaleAnim.value }],
            backfaceVisibility: 'hidden' as const,
            opacity: flipAnim.value >= 0.5 ? 1 : 0,
        };
    });

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onFlip?.();
    };

    return (
        <View style={[styles.container, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
            {/* BACK SIDE (card face-down / pre-flip) */}
            <Animated.View style={[styles.cardWrap, frontStyle]}>
                <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={{ flex: 1 }}>
                    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.cardBack} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        {/* Decorative pattern */}
                        <View style={styles.backPattern}>
                            <View style={styles.backCircle1} />
                            <View style={styles.backCircle2} />
                            <View style={styles.backCircle3} />
                        </View>

                        <Text style={styles.backIcon}>🃏</Text>
                        <Text style={styles.backTitle}>Rumbala</Text>
                        <Text style={styles.backHint}>Tap to reveal</Text>

                        {/* Corner decorations */}
                        <View style={[styles.corner, styles.cornerTL]}>
                            <Text style={styles.cornerText}>♠</Text>
                        </View>
                        <View style={[styles.corner, styles.cornerBR]}>
                            <Text style={styles.cornerText}>♠</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            {/* FRONT SIDE (card face-up / revealed) */}
            <Animated.View style={[styles.cardWrap, styles.absoluteCard, backStyle]}>
                <TouchableOpacity activeOpacity={0.95} onPress={handlePress} style={{ flex: 1 }}>
                    <View style={styles.cardFront}>
                        {/* Gradient header strip */}
                        <LinearGradient colors={theme.gradient} style={styles.headerStrip} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <View style={styles.headerContent}>
                                <View style={styles.typeBadge}>
                                    <Text style={styles.typeIcon}>{theme.icon}</Text>
                                    <Text style={styles.typeLabel}>
                                        {card.type === 'ldr' && card.vibe 
                                            ? `LDR • ${card.vibe.toUpperCase()}`
                                            : theme.label
                                        }
                                    </Text>
                                </View>
                                {card.timer && (
                                    <View style={styles.timerBadge}>
                                        <Text style={styles.timerText}>⏱ {card.timer}s</Text>
                                    </View>
                                )}
                            </View>
                            {/* Decorative circles */}
                            <View style={styles.headerCircle1} />
                            <View style={styles.headerCircle2} />
                        </LinearGradient>

                        {/* Main dare content */}
                        <View style={styles.dareBody}>
                            <ScrollView 
                                contentContainerStyle={[styles.scrollContent, { paddingHorizontal: CARD_WIDTH < 320 ? 18 : 24, paddingVertical: CARD_WIDTH < 320 ? 12 : 15 }]}
                                showsVerticalScrollIndicator={false}
                                centerContent={true}
                            >
                                <Text style={styles.dareIcon}>{theme.icon}</Text>
                                <Text style={styles.dareLabel}>Dare!</Text>
                                <Text style={[styles.dareText, { fontSize: CARD_WIDTH < 320 ? 17 : 19, lineHeight: CARD_WIDTH < 320 ? 24 : 28 }]}>{card.text}</Text>
                            </ScrollView>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <LinearGradient colors={theme.gradient} style={styles.xpBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Text style={styles.xpText}>+50 XP</Text>
                            </LinearGradient>
                            {onFlip && <Text style={styles.tapHint}>Tap to close</Text>}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardWrap: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 0,
    },
    absoluteCard: {
        position: 'absolute',
        top: 0,
        left: 0,
    },

    // ── BACK SIDE ──
    // ── BACK SIDE ──
    cardBack: {
        flex: 1,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(26, 26, 46, 0.8)', // Glassy Dark
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    backPattern: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backCircle1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    backCircle2: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    backCircle3: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    backIcon: {
        fontSize: 64,
        marginBottom: 12,
        opacity: 0.9,
    },
    backTitle: {
        fontFamily: 'Pacifico_400Regular',
        fontSize: 32,
        color: '#fff',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    backHint: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    corner: {
        position: 'absolute',
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cornerTL: { top: 16, left: 16 },
    cornerBR: { bottom: 16, right: 16, transform: [{ rotate: '180deg' }] },
    cornerText: { fontSize: 18, color: 'rgba(255, 255, 255, 0.2)' },

    // ── FRONT SIDE ──
    cardFront: {
        flex: 1,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.85)', // Glassy White
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    headerStrip: {
        paddingTop: 24,
        paddingBottom: 20,
        paddingHorizontal: 20,
        overflow: 'hidden',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1,
    },
    headerCircle1: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        top: -40,
        right: -30,
    },
    headerCircle2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        bottom: -30,
        left: 20,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    typeIcon: { fontSize: 16 },
    typeLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1.5,
    },
    timerBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    timerText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#fff',
    },

    dareBody: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dareIcon: {
        fontSize: 48,
        marginBottom: 8,
        opacity: 0.9,
    },
    dareLabel: {
        fontFamily: 'Pacifico_400Regular',
        fontSize: 28,
        color: '#1a1a1a',
        marginBottom: 12,
        opacity: 0.9,
    },
    dareText: {
        fontFamily: 'Quicksand_700Bold',
        color: '#333',
        textAlign: 'center',
    },

    footer: {
        alignItems: 'center',
        paddingBottom: 24,
        gap: 10,
    },
    xpBadge: {
        borderRadius: 24,
        paddingHorizontal: 28,
        paddingVertical: 10,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 0,
    },
    xpText: {
        fontFamily: 'Quicksand_700Bold',
        fontSize: 15,
        color: '#fff',
        letterSpacing: 1,
    },
    tapHint: {
        fontSize: 12,
        color: '#999',
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
``


## D:\Rumbala\src\components\CustomAlert.tsx
``tsx

import React from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    Dimensions, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store/useStore';
import { glassStyles, glassTokens } from '../constants/glass';

const { width } = Dimensions.get('window');

export default function CustomAlert() {
    const { alertConfig, hideAlert } = useStore();
    const { visible, title, message, buttons } = alertConfig;

    const getIcon = (titleText: string) => {
        const lowerTitle = titleText.toLowerCase();
        if (lowerTitle.includes('error') || lowerTitle.includes('fail') || lowerTitle.includes('wrong')) {
            return { name: 'alert-circle', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
        }
        if (lowerTitle.includes('success') || lowerTitle.includes('done') || lowerTitle.includes('saved')) {
            return { name: 'checkmark-circle', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
        }
        if (lowerTitle.includes('warning') || lowerTitle.includes('caution')) {
            return { name: 'warning', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
        }
        return { name: 'information-circle', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' };
    };

    const icon = getIcon(title || '');

    const handleButtonPress = (onPress?: () => void) => {
        hideAlert();
        if (onPress) {
            // Delay slightly to allow modal to close smoothly
            setTimeout(onPress, 150);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={hideAlert}
            hardwareAccelerated={true}
            statusBarTranslucent={true}
        >
            {visible && (
                <View style={styles.overlay}>
                    <Animated.View 
                        entering={FadeInDown.springify().damping(15).stiffness(100)} 
                        exiting={FadeOut.duration(200)}
                        style={[styles.container, glassStyles.container, { backgroundColor: 'rgba(255, 255, 255, 0.98)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)' }]}
                    >
                        <Animated.View entering={ZoomIn.delay(100)} style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
                            <Ionicons name={icon.name as any} size={42} color={icon.color} />
                        </Animated.View>
    
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
    
                        <View style={[styles.buttonContainer, buttons && buttons.length > 2 && { flexDirection: 'column' }]}>
                            {buttons && buttons.length > 0 ? (
                                buttons.map((btn, idx) => {
                                    const isCancel = btn.style === 'cancel';
                                    const isDestructive = btn.style === 'destructive';
                                    const isDefault = !isCancel && !isDestructive;

                                    if (isDefault) {
                                        return (
                                            <TouchableOpacity 
                                                key={idx}
                                                style={[styles.button, styles.stackButton]}
                                                onPress={() => handleButtonPress(btn.onPress)}
                                                activeOpacity={0.8}
                                            >
                                                <LinearGradient 
                                                    colors={['#1a1a1a', '#333333']}
                                                    style={styles.gradientBtn}
                                                    start={{x:0, y:0}} end={{x:1, y:1}}
                                                >
                                                    <Text style={styles.primaryBtnText}>{btn.text}</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        );
                                    }

                                    return (
                                        <TouchableOpacity 
                                            key={idx}
                                            style={[
                                                styles.button,
                                                isCancel ? styles.cancelBtn : styles.destructiveBtn,
                                                buttons.length > 2 && styles.stackButton
                                            ]}
                                            onPress={() => handleButtonPress(btn.onPress)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[
                                                styles.buttonText,
                                                isCancel ? styles.cancelBtnText : styles.primaryBtnText
                                            ]}>
                                                {btn.text}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <TouchableOpacity 
                                    style={[styles.button, styles.stackButton]}
                                    onPress={() => handleButtonPress()}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient 
                                        colors={['#1a1a1a', '#333333']}
                                        style={styles.gradientBtn}
                                        start={{x:0, y:0}} end={{x:1, y:1}}
                                    >
                                        <Text style={styles.primaryBtnText}>OK</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                </View>
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#444',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        fontWeight: '600',
        paddingHorizontal: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        height: 54,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    gradientBtn: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stackButton: {
        width: '100%',
    },
    defaultBtn: {
        backgroundColor: '#1a1a1a',
    },
    destructiveBtn: {
        backgroundColor: '#EF4444',
    },
    cancelBtn: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    cancelBtnText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '800',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '900',
    }
});
``


## D:\Rumbala\src\components\LegalModal.tsx
``tsx

import React from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    ScrollView, Dimensions, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { glassStyles, glassTokens } from '../constants/glass';

interface LegalModalProps {
    visible: boolean;
    onClose: () => void;
    type: 'terms' | 'privacy';
}

export default function LegalModal({ visible, onClose, type }: LegalModalProps) {
    const title = type === 'terms' ? 'Terms of Service' : 'Privacy Policy';
    
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
            hardwareAccelerated={true}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
                
                <View style={[styles.container, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#1a1a1a" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                        style={styles.content} 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                        {type === 'terms' ? <TermsContent /> : <PrivacyContent />}
                    </ScrollView>
                    
                    <TouchableOpacity style={styles.doneBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClose(); }} activeOpacity={0.8}>
                        <LinearGradient colors={['#1a1a1a', '#333333']} style={styles.doneBtnGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                            <Text style={styles.doneBtnText}>I Understand</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const TermsContent = () => (
    <View>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
            By accessing and using Rumbala, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application.
        </Text>

        <Text style={styles.sectionTitle}>2. Use of Service</Text>
        <Text style={styles.text}>
            Rumbala is designed for couples to interact through dares and games. You are responsible for any activity that occurs under your account.
        </Text>

        <Text style={styles.sectionTitle}>3. User Content</Text>
        <Text style={styles.text}>
            Users may upload images or text as proof of dares. You retain ownership but grant Rumbala a limited license to process this data strictly for app functionality.
        </Text>

        <Text style={styles.sectionTitle}>4. Pro Subscription</Text>
        <Text style={styles.text}>
            Premium features require a paid subscription. Payments are handled via Apple/Google stores. Unused portions of free trials are forfeited upon subscription.
        </Text>

        <Text style={styles.sectionTitle}>5. Termination</Text>
        <Text style={styles.text}>
            We reserve the right to suspend or terminate accounts that violate our community guidelines or engage in illegal activities.
        </Text>
    </View>
);

const PrivacyContent = () => (
    <View>
        <Text style={styles.sectionTitle}>1. Data Collection</Text>
        <Text style={styles.text}>
            We collect minimal personal data: your name, email for authentication, and partner names for the gaming experience.
        </Text>

        <Text style={styles.sectionTitle}>2. Data Usage</Text>
        <Text style={styles.text}>
            Your data is used solely to provide and improve the app features. We do not sell your personal information to third parties.
        </Text>

        <Text style={styles.sectionTitle}>3. Encryption</Text>
        <Text style={styles.text}>
            Communication between partners and data stored in our database (via Supabase) is encrypted to ensure your privacy.
        </Text>

        <Text style={styles.sectionTitle}>4. Media & Photos</Text>
        <Text style={styles.text}>
            Photos uploaded as dare proof are stored securely. We do not use these photos for any purpose other than displaying them in your history.
        </Text>

        <Text style={styles.sectionTitle}>5. Your Rights</Text>
        <Text style={styles.text}>
            You can request deletion of your data at any time by contacting our support or using the "Delete Account" feature in settings.
        </Text>
    </View>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 32,
        padding: 24,
        elevation: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1a1a1a',
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        marginHorizontal: -4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FF6B35',
        marginTop: 18,
        marginBottom: 8,
    },
    text: {
        fontSize: 14,
        color: '#444',
        lineHeight: 22,
        fontWeight: '500',
    },
    doneBtn: {
        marginTop: 20,
        borderRadius: 18,
        overflow: 'hidden',
    },
    doneBtnGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
});
``


## D:\Rumbala\src\components\PaywallModal.tsx
``tsx

import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal, 
    Image, Dimensions, ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import LegalModal from './LegalModal';
import { glassStyles, glassTokens } from '../constants/glass';
import { getOfferings } from '../services/revenueCatService';
import { PurchasesPackage } from 'react-native-purchases';
import { PAYWALL_FEATURES, resolvePlanPackages, getPackageKind } from '../constants/pricing';

const { width, height } = Dimensions.get('window');

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
    onSubscribe: (pkg: PurchasesPackage) => void;
}

export default function PaywallModal({ visible, onClose, onSubscribe }: PaywallModalProps) {
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [legalVisible, setLegalVisible] = useState(false);
    const [legalType, setLegalType] = useState<'terms' | 'privacy'>('terms');

    useEffect(() => {
        if (visible) {
            loadOfferings();
        }
    }, [visible]);

    const loadOfferings = async () => {
        setLoading(true);
        try {
            const offerings = await getOfferings();
            const currentOffering = offerings?.current || offerings;

            if (currentOffering?.availablePackages) {
                const allPackages: PurchasesPackage[] = currentOffering.availablePackages;
                const planPackages = allPackages.filter((pkg) => {
                    const kind = getPackageKind(pkg);
                    return kind === 'annual' || kind === 'monthly';
                });
                setPackages(planPackages);

                const { annual, monthly } = resolvePlanPackages(planPackages);
                setSelectedPackage(annual || monthly || planPackages[0] || null);
            } else {
                setPackages([]);
                setSelectedPackage(null);
            }
        } catch {
            setPackages([]);
            setSelectedPackage(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = () => {
        if (!selectedPackage) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSubscribe(selectedPackage);
    };

    const renderPlan = (pkg: PurchasesPackage) => {
        const isAnnual = pkg.packageType === 'ANNUAL';
        const isSelected = selectedPackage?.identifier === pkg.identifier;
        
        return (
            <TouchableOpacity 
                key={pkg.identifier}
                style={[s.planItem, isSelected && s.planActive]} 
                onPress={() => { setSelectedPackage(pkg); Haptics.selectionAsync(); }}
                activeOpacity={0.9}
            >
                {isAnnual && (
                    <View style={s.bestValueBadge}>
                        <Text style={s.bestValueText}>🔥 BEST VALUE • SAVINGS 🔥</Text>
                    </View>
                )}
                <View style={s.planRadio}>
                    <View style={[s.radioOuter, isSelected && s.radioOuterActive]}>
                        {isSelected && <View style={s.radioInner} />}
                    </View>
                </View>
                <View style={s.planInfo}>
                    <Text style={s.planName}>{isAnnual ? 'Annual' : 'Monthly'}</Text>
                    <Text style={s.planDesc}>{isAnnual ? 'Most popular' : 'Flexible access'}</Text>
                </View>
                <View style={s.planPriceWrap}>
                    <Text style={s.planPrice}>{pkg.product.priceString}</Text>
                    <Text style={s.planPeriod}>{isAnnual ? 'per year' : 'per month'}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            transparent 
            hardwareAccelerated={true}
            statusBarTranslucent={true}
        >
            <View style={s.overlay}>
                <View style={s.modalContainer}>
                    <TouchableOpacity style={[s.closeBtn, glassStyles.container]} onPress={onClose} activeOpacity={0.7}>
                        <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>

                    <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
                        <View style={s.headerImageWrap}>
                            <Image 
                                source={{ uri: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80' }} 
                                style={s.headerImage}
                                resizeMode="cover"
                            />
                            <LinearGradient 
                                colors={['transparent', 'rgba(18, 11, 19, 1)']} 
                                style={s.imageOverlay} 
                            />
                        </View>

                        <View style={s.content}>
                            <Text style={s.title}>Unlock Unlimited{'\n'}Fun</Text>
                            <Text style={s.subtitle}>Elevate your connection with Rumbala Pro</Text>

                            <View style={s.featureList}>
                                {PAYWALL_FEATURES.map(f => (
                                    <View key={f.id} style={s.featureItem}>
                                        <LinearGradient colors={['#FF66B2', '#FF8ED4']} style={s.checkCircle} start={{x:0, y:0}} end={{x:1, y:1}}>
                                            <Ionicons name="checkmark-sharp" size={12} color="#fff" />
                                        </LinearGradient>
                                        <Text style={s.featureText}>{f.title}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={s.plansContainer}>
                                {loading ? (
                                    <ActivityIndicator size="large" color="#FF66B2" style={{ marginVertical: 30 }} />
                                ) : packages.length > 0 ? (
                                    packages.map(renderPlan)
                                ) : (
                                    <View style={s.errorState}>
                                        <Ionicons name="alert-circle-outline" size={32} color="#666" />
                                        <Text style={s.errorText}>No active plans found. Please check back later or contact support.</Text>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity 
                                style={[s.ctaBtn, (!selectedPackage || loading) && { opacity: 0.5 }]} 
                                onPress={handleSubscribe} 
                                activeOpacity={0.8}
                                disabled={!selectedPackage || loading}
                            >
                                <LinearGradient 
                                    colors={['#FF8ED4', '#FF66B2']} 
                                    start={{ x: 0, y: 0 }} 
                                    end={{ x: 1, y: 0 }}
                                    style={s.ctaGradient}
                                >
                                    <Text style={s.ctaText}>
                                        {selectedPackage?.product.introPrice ? 'Start Free Trial' : 'Subscribe Now'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={s.trialInfo}>
                                {selectedPackage?.product.introPrice 
                                    ? 'Free trial included. Cancel anytime.'
                                    : 'Secured purchase. Cancel anytime.'}
                            </Text>

                            <View style={s.legalLinks}>
                                <TouchableOpacity><Text style={s.legalText}>Restore Purchase</Text></TouchableOpacity>
                                <View style={s.legalDot} />
                                <TouchableOpacity onPress={() => { setLegalType('terms'); setLegalVisible(true); }}>
                                    <Text style={s.legalText}>Terms of Service</Text>
                                </TouchableOpacity>
                                <View style={s.legalDot} />
                                <TouchableOpacity onPress={() => { setLegalType('privacy'); setLegalVisible(true); }}>
                                    <Text style={s.legalText}>Privacy Policy</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>

                    <LegalModal 
                        visible={legalVisible} 
                        type={legalType} 
                        onClose={() => setLegalVisible(false)} 
                    />
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContainer: { 
        height: '82%', 
        backgroundColor: '#0D080E', 
        borderTopLeftRadius: 32, 
        borderTopRightRadius: 32,
        overflow: 'hidden'
    },
    closeBtn: { 
        position: 'absolute', top: 16, right: 16, zIndex: 10,
        width: 32, height: 32, borderRadius: 16, 
        backgroundColor: 'rgba(255,255,255,0.2)', 
        alignItems: 'center', justifyContent: 'center' 
    },
    scrollContent: { paddingBottom: 40 },
    headerImageWrap: { height: 180, width: '100%', position: 'relative' },
    headerImage: { width: '100%', height: '100%' },
    imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
    
    content: { paddingHorizontal: 24, paddingTop: 4 },
    title: { 
        fontSize: 28, fontWeight: '900', color: '#fff', 
        textAlign: 'center', lineHeight: 34, letterSpacing: 0.5 
    },
    subtitle: { 
        fontSize: 14, color: '#A1B0C1', textAlign: 'center', 
        marginTop: 8, lineHeight: 20, fontWeight: '500' 
    },

    featureList: { marginTop: 24, gap: 10 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkCircle: { 
        width: 22, height: 22, borderRadius: 11, 
        backgroundColor: '#FF66B2', alignItems: 'center', justifyContent: 'center' 
    },
    featureText: { fontSize: 14, color: '#fff', fontWeight: '700' },

    plansContainer: { marginTop: 24, gap: 12 },
    planItem: { 
        flexDirection: 'row', alignItems: 'center', padding: 18, 
        borderRadius: 22, borderWidth: 2, borderColor: '#1F1621',
        backgroundColor: '#160E17' 
    },
    planActive: { borderColor: '#FF66B2', backgroundColor: '#1E111F' },
    planRadio: { marginRight: 14 },
    radioOuter: { 
        width: 22, height: 22, borderRadius: 11, borderWidth: 2, 
        borderColor: '#3D2F3F', alignItems: 'center', justifyContent: 'center' 
    },
    radioOuterActive: { borderColor: '#FF66B2' },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF66B2' },
    
    planInfo: { flex: 1 },
    planName: { fontSize: 16, fontWeight: '800', color: '#fff' },
    planDesc: { fontSize: 12, color: '#888', marginTop: 2 },
    
    planPriceWrap: { alignItems: 'flex-end' },
    planPrice: { fontSize: 16, fontWeight: '800', color: '#fff' },
    planPeriod: { fontSize: 12, color: '#888', marginTop: 2 },

    bestValueBadge: {
        position: 'absolute', top: -12, left: 24, 
        backgroundColor: '#FF8ED4', paddingHorizontal: 12, paddingVertical: 4, 
        borderRadius: 20, zIndex: 10,
        shadowColor: '#FF66B2', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 4
    },
    bestValueText: { fontSize: 10, fontWeight: '900', color: '#0D080E' },

    ctaBtn: { marginTop: 24, borderRadius: 30, overflow: 'hidden' },
    ctaGradient: { paddingVertical: 16, alignItems: 'center' },
    ctaText: { fontSize: 18, fontWeight: '900', color: '#0D080E' },
    
    trialInfo: { 
        fontSize: 12, color: '#666', textAlign: 'center', 
        marginTop: 14, fontWeight: '500' 
    },

    legalLinks: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
        marginTop: 20, gap: 10 
    },
    legalText: { fontSize: 11, color: '#444', fontWeight: '700', textDecorationLine: 'underline' },
    legalDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#333' },
    
    errorState: { 
        alignItems: 'center', justifyContent: 'center', 
        paddingVertical: 30, paddingHorizontal: 20 
    },
    errorText: { 
        fontSize: 14, color: '#888', textAlign: 'center', 
        marginTop: 12, lineHeight: 20 
    }
});

``


## D:\Rumbala\src\constants\cards.ts
``ts

export type CardType = 'fun' | 'romantic' | 'spicy' | 'ldr';

export interface DareCard {
  id: string;
  type: CardType;
  vibe?: CardType; // Sub-category (e.g. for LDR cards: fun, romantic, spicy)
  text: string;
  timer?: number; // Optional timer in seconds for timed dares
}

export const CARDS: DareCard[] = [
  // --- FUN ---
  { id: 'f1', type: 'fun', text: 'Do your best impression of me when I am angry.', timer: 30 },
  { id: 'f2', type: 'fun', text: 'Speak in a weird accent for the next 2 rounds.' },
  { id: 'f3', type: 'fun', text: 'Let your partner style your hair in the funniest way possible.', timer: 60 },
  { id: 'f4', type: 'fun', text: 'Dance without music for 30 seconds.', timer: 30 },
  { id: 'f5', type: 'fun', text: 'Read the last text you sent to your best friend out loud.' },
  { id: 'f6', type: 'fun', text: 'Try to lick your elbow.', timer: 15 },
  { id: 'f7', type: 'fun', text: 'Talk without closing your mouth for the next round.' },
  { id: 'f8', type: 'fun', text: 'Post a weird status on WhatsApp for 10 minutes.', timer: 600 },

  // --- ROMANTIC ---
  { id: 'r1', type: 'romantic', text: 'Share the exact moment you realized you liked me.' },
  { id: 'r2', type: 'romantic', text: 'Give me a 1-minute foot or hand massage.', timer: 60 },
  { id: 'r3', type: 'romantic', text: 'Describe my best physical feature in loving detail.' },
  { id: 'r4', type: 'romantic', text: 'Stare into my eyes without blinking for 30 seconds.', timer: 30 },
  { id: 'r5', type: 'romantic', text: 'Sing a romantic song for me.' },
  { id: 'r6', type: 'romantic', text: 'Tell me about a dream you had about us.' },
  { id: 'r7', type: 'romantic', text: 'Recreate our first hug or kiss.' },
  { id: 'r8', type: 'romantic', text: 'Write a quick 4-line poem about me.', timer: 120 },

  // --- SPICY ---
  { id: 's1', type: 'spicy', text: 'Kiss me on the neck.' },
  { id: 's2', type: 'spicy', text: 'Whisper your deepest fantasy into my ear.' },
  { id: 's3', type: 'spicy', text: 'Take off one piece of clothing.' },
  { id: 's4', type: 'spicy', text: 'Give me a passionate kiss for 10 seconds.', timer: 10 },
  { id: 's5', type: 'spicy', text: 'Let me blindfold you and feed you something sweet.' },
  { id: 's6', type: 'spicy', text: 'Trace my lips with your fingers.' },
  { id: 's7', type: 'spicy', text: 'Tell me the hottest thing I wear.' },
  { id: 's8', type: 'spicy', text: 'Give me a sensuous 2-minute back rub.', timer: 120 },

  // --- LDR ---
  { id: 'l1', type: 'ldr', vibe: 'spicy', text: 'Send me a voice note saying "I love you" in the sexiest voice.' },
  { id: 'l2', type: 'ldr', vibe: 'fun', text: 'Send me a picture of the exact clothes you are wearing right now.' },
  { id: 'l3', type: 'ldr', vibe: 'romantic', text: 'Blow me a kiss through the screen.' },
  { id: 'l4', type: 'ldr', vibe: 'romantic', text: 'Order a small dessert for me right now!' },
  { id: 'l5', type: 'ldr', vibe: 'romantic', text: 'Keep the video call completely silent for 1 minute while we just look at each other.', timer: 60 },
  { id: 'l6', type: 'ldr', vibe: 'spicy', text: 'Describe what we would be doing right now if we were together.' },

  // Fun (9-16)
  { id: '9', type: 'fun', text: 'Pretend to be a gym bro explaining why I desperately need to hit my protein goal today 🍗💪', timer: 45 },
  { id: '10', type: 'fun', text: 'Act out a dramatic, slow-motion death scene from your favorite game right now 🎮💀' },
  { id: '11', type: 'fun', text: 'Explain a complex coding bug to me using only cheesy romantic pickup lines 💻❤️', timer: 60 },
  { id: '12', type: 'fun', text: 'Do your absolute best impression of someone aggressively haggling for clothes 🛍️😂' },
  { id: '13', type: 'fun', text: 'Try to lick your elbow while maintaining intense eye contact with me 👀👅', timer: 15 },
  { id: '14', type: 'fun', text: 'Speak entirely in rhymes for the next 2 minutes 🎤🎶', timer: 120 },
  { id: '15', type: 'fun', text: 'Show me the last meme you saved on your phone without giving any context 📱🤡' },
  { id: '16', type: 'fun', text: 'Balance your phone on your head and walk across the room without dropping it 🚶‍♂️📱' },

  // Romantic (17-23)
  { id: '17', type: 'romantic', text: 'Send me a playlist of 3 songs that instantly remind you of me 🎵🥺' },
  { id: '18', type: 'romantic', text: 'Tell me the exact moment you realized you had feelings for me ✨💖' },
  { id: '19', type: 'romantic', text: 'Write a quick 4-line poem about my smile right now ✍️😊', timer: 60 },
  { id: '20', type: 'romantic', text: 'Name a small, random habit of mine that you absolutely adore 🕵️‍♀️💘' },
  { id: '21', type: 'romantic', text: 'Stare into my eyes (or my photo) for 30 seconds without saying a word 👁️❤️', timer: 30 },
  { id: '22', type: 'romantic', text: 'Tell me about a dream you had about us that you never shared 🌙💭' },
  { id: '23', type: 'romantic', text: 'Plan out our dream vacation itinerary in 3 sentences ✈️🏝️' },

  // Spicy (24-30)
  { id: '24', type: 'spicy', text: 'Describe exactly what you’d do if we were alone in a locked elevator right now 🛗🔥' },
  { id: '25', type: 'spicy', text: 'Send a voice note whispering your favorite physical feature of mine 🤫💦', timer: 20 },
  { id: '26', type: 'spicy', text: 'Rate your current thoughts about me from 1-10 on the spicy scale 🌶️🥵' },
  { id: '27', type: 'spicy', text: 'Tell me the most adventurous place you’d want to make out with me 🗺️💋' },
  { id: '28', type: 'spicy', text: 'Show me the outfit you’d wear if you wanted to guarantee I couldn’t keep my hands off you 👗👔🔥' },
  { id: '29', type: 'spicy', text: 'Describe the way you want me to touch you right now without using any banned words 🤐✨' },
  { id: '30', type: 'spicy', text: 'Send the most suggestive emoji combo you can think of and let me guess what it means 🍆🍑💦' },

  // LDR (31-38)
  { id: '31', type: 'ldr', vibe: 'romantic', text: 'Order me a surprise little dessert right now 🍰🛵' },
  { id: '32', type: 'ldr', vibe: 'fun', text: 'Show me the exact view from your window right this second 🪟🏙️' },
  { id: '33', type: 'ldr', vibe: 'romantic', text: 'Take a picture of the exact spot where you wish I was sitting right now 🪑👻' },
  { id: '34', type: 'ldr', vibe: 'spicy', text: 'Voice note: Tell me how you would wake me up if we were in the same bed tomorrow morning 🛌🌅' },
  { id: '35', type: 'ldr', vibe: 'fun', text: 'Send a quick video spinning around in your room so I can feel like I’m there 🌀📱' },
  { id: '36', type: 'ldr', vibe: 'spicy', text: 'Write my name somewhere on your body with a pen and send a pic 🖊️📸' },
  { id: '37', type: 'ldr', vibe: 'romantic', text: 'Find an item in your room that reminds you of me and explain why 🧸💭' },
  { id: '38', type: 'ldr', vibe: 'fun', text: 'Record a 10-second video pretending you are giving me a massive hug 🤗🫂' },

  // Fun (39-53)
  { id: '39', type: 'fun', text: 'Sing a song loudly but replace every key word with "Paneer" 🧀🎤', timer: 30 },
  { id: '40', type: 'fun', text: 'Explain how to build a custom PC, but make the motherboard and SSD sound like two star-crossed lovers 🖥️❤️', timer: 60 },
  { id: '41', type: 'fun', text: 'Do your best impression of a strict parent catching us holding hands in public 😡😂' },
  { id: '42', type: 'fun', text: 'Let me give you a silly new nickname and you have to respond to it for the next 24 hours 🤪' },
  { id: '43', type: 'fun', text: 'Pretend your smartphone is a walkie-talkie and report a "romantic emergency" to headquarters 👮‍♂️', timer: 45 },
  { id: '44', type: 'fun', text: 'Do 10 squats while singing a popular song at the top of your lungs 💃🍑' },
  { id: '45', type: 'fun', text: 'Talk without opening your teeth for the next 2 minutes 🤐⏱️', timer: 120 },
  { id: '46', type: 'fun', text: 'Put an ice cube down your shirt and try to maintain a totally straight face 🧊😐', timer: 30 },
  { id: '47', type: 'fun', text: 'Let me pick a random emoji to put on your WhatsApp status for the next hour 📱🤷‍♂️' },
  { id: '48', type: 'fun', text: 'Put your shirt on inside out for the rest of our conversation 👕🙃' },
  { id: '49', type: 'fun', text: 'Try to lick your own nose while winking at me 👅👃😉', timer: 15 },
  { id: '50', type: 'fun', text: 'Pitch me a terrible idea for a mobile app like you are on Shark Tank 🦈📱', timer: 60 },
  { id: '51', type: 'fun', text: 'Pretend you are an influencer doing a grand tour of your extremely messy room 🤳🗑️' },
  { id: '52', type: 'fun', text: 'Do a dramatic, soap-opera reading of the last text message you received 📖😂' },
  { id: '53', type: 'fun', text: 'Speak only in a robotic voice for the next 3 minutes 🤖⏱️', timer: 180 },

  // Romantic (54-68)
  { id: '54', type: 'romantic', text: 'Describe our relationship using only 3 movie titles 🍿❤️' },
  { id: '55', type: 'romantic', text: 'Tell me the exact moment you knew you had fallen for me 🥰✨' },
  { id: '56', type: 'romantic', text: 'Plan a dream motorcycle trip for us, including where we stop for tea 🏍️☕' },
  { id: '57', type: 'romantic', text: 'Write my name on your wrist with a pen and keep it there all day 🖊️💕' },
  { id: '58', type: 'romantic', text: 'Serenade me with a romantic song for 30 seconds, no matter how bad your voice is 🎶🎤', timer: 30 },
  { id: '59', type: 'romantic', text: 'Tell me your absolute favorite physical feature of mine and blow a kiss to it 😘' },
  { id: '60', type: 'romantic', text: 'Describe what a perfect lazy Sunday morning looks like with me 🏡☕' },
  { id: '61', type: 'romantic', text: 'Stare into my eyes (or my photo) without blinking or smiling for 60 seconds 👀⏱️', timer: 60 },
  { id: '62', type: 'romantic', text: 'Give me a 5-minute virtual massage by describing exactly how you would do it 💆‍♂️💆‍♀️' },
  { id: '63', type: 'romantic', text: 'Recreate the pose from the first picture we ever took together 📸🔄' },
  { id: '64', type: 'romantic', text: 'Tell me a tiny, adorable secret you’ve never told anyone else before 🤫❤️' },
  { id: '65', type: 'romantic', text: 'Make a list of 5 things you appreciate most about me and read it aloud with full emotion 📜🥺' },
  { id: '66', type: 'romantic', text: 'Tell me the story of our first date purely from your perspective 📖🌹' },
  { id: '67', type: 'romantic', text: 'Dedicate a classic romantic movie dialogue to me right now 🎬💘' },
  { id: '68', type: 'romantic', text: 'Hold your hand up to the screen and tell me why I am your favorite person 🤝💖' },

  // Spicy (69-83)
  { id: '69', type: 'spicy', text: 'Tell me your biggest turn-on that you’ve never fully confessed before 🤫🔥' },
  { id: '70', type: 'spicy', text: 'Describe exactly what you would do if I was wearing your favorite outfit right now 👗🥵', timer: 60 },
  { id: '71', type: 'spicy', text: 'Send a voice note of your best "bedroom voice" whispering my name 🎙️💦' },
  { id: '72', type: 'spicy', text: 'Tell me the dirtiest thought you’ve had about us while at the gym 🏋️‍♂️😈' },
  { id: '73', type: 'spicy', text: 'Send a picture of you biting your lip while looking right at the camera 🫦📸' },
  { id: '74', type: 'spicy', text: 'Rate my kissing skills from 1-10 and explain exactly how I earned that rating 💋📈' },
  { id: '75', type: 'spicy', text: 'Tell me where your favorite unexpected place to be kissed is 🎯😘' },
  { id: '76', type: 'spicy', text: 'Describe a new position or fantasy you want to try next time we have absolute privacy 🤸‍♀️🔥' },
  { id: '77', type: 'spicy', text: 'Unbutton one button or take off one piece of clothing right now 👚👀' },
  { id: '78', type: 'spicy', text: 'Tell me what the most sensitive spot on your body is and how you want me to touch it 🪶✨' },
  { id: '79', type: 'spicy', text: 'Send me a risky text message that you would be terrified if anyone else saw 📱😳' },
  { id: '80', type: 'spicy', text: 'Whisper exactly what you want me to do to you tonight in under 15 seconds 🤫👂', timer: 15 },
  { id: '81', type: 'spicy', text: 'Show me the sexiest piece of clothing you own and tell me when you plan to wear it 👙👔' },
  { id: '82', type: 'spicy', text: 'Tell me the exact explicit thought you had the first time we kissed 💭🔥' },
  { id: '83', type: 'spicy', text: 'Slowly eat a piece of fruit or chocolate while maintaining intense eye contact with me 🍓🍫', timer: 30 },

  // LDR (84-98)
  { id: '84', type: 'ldr', vibe: 'fun', text: 'Send me a 5-second video of your current view, no matter how boring it is 🪟📱' },
  { id: '85', type: 'ldr', vibe: 'romantic', text: 'Order me a surprise treat right now without telling me what it is 🍩🛵' },
  { id: '86', type: 'ldr', vibe: 'romantic', text: 'Take a selfie in the exact spot you wish I was sitting next to you right now 🪑📸' },
  { id: '87', type: 'ldr', vibe: 'spicy', text: 'Send a voice note of you kissing the microphone 3 times slowly 💋🎙️' },
  { id: '88', type: 'ldr', vibe: 'romantic', text: 'Write a 3-line love letter and send a picture of it handwritten on paper ✍️💌', timer: 120 },
  { id: '89', type: 'ldr', vibe: 'fun', text: 'Change into an outfit that has my favorite color in it for the rest of our call 👕🎨' },
  { id: '90', type: 'ldr', vibe: 'fun', text: 'Protect me at all costs during our next game session 🎮🛡️' },
  { id: '91', type: 'ldr', vibe: 'romantic', text: 'Send a picture of the exact spot on your bed where you wish we were cuddling right now 🛏️🥺' },
  { id: '92', type: 'ldr', vibe: 'fun', text: 'Give me a virtual house tour on video call, but pretend you are a fancy real estate agent 🏠🤵' },
  { id: '93', type: 'ldr', vibe: 'fun', text: 'Send me a picture of the sky above you right now so we can share the same view ☁️🌤️' },
  { id: '94', type: 'ldr', vibe: 'romantic', text: 'Record yourself saying a soft "Good morning" so I can wake up to it tomorrow 🌅🎧' },
  { id: '95', type: 'ldr', vibe: 'romantic', text: 'Find an object in your room that instantly reminds you of me and explain why 🧸💭' },
  { id: '96', type: 'ldr', vibe: 'fun', text: 'Share your screen and let me pick the next video we watch together 💻▶️' },
  { id: '97', type: 'ldr', vibe: 'fun', text: 'Send me a screenshot of your home screen right now so I can judge your app layout 📱🔋' },
  { id: '98', type: 'ldr', vibe: 'fun', text: 'Trace my initial on your hand and send me a picture of it ✍️✋' },

  // Fun (99-110)
  { id: '99', type: 'fun', text: 'Try to explain the plot of your favorite movie while holding a plank ⏱️🎬', timer: 60 },
  { id: '100', type: 'fun', text: 'Do 15 pushups and shout out a different snack on each rep! 🏋️‍♂️' },
  { id: '101', type: 'fun', text: 'Talk like a seasoned rickshaw driver negotiating a fare for the next 2 minutes 🛺😎', timer: 120 },
  { id: '102', type: 'fun', text: 'Show me the most embarrassing photo in your phone\'s gallery right now 📸🙈' },
  { id: '103', type: 'fun', text: 'Try to juggle 3 small objects (like rolled-up socks) for 30 seconds 🤹‍♂️🧦', timer: 30 },
  { id: '104', type: 'fun', text: 'Speak in an exaggerated British accent until your next turn ☕💂‍♂️' },
  { id: '105', type: 'fun', text: 'Pretend your phone is a dumbbell and do slow bicep curls while making intense eye contact 💪📱' },
  { id: '106', type: 'fun', text: 'Explain how a database works but make it sound like a dramatic reality TV show 💾📺', timer: 60 },
  { id: '107', type: 'fun', text: 'Put a piece of ice in your mouth and try to sing a popular song 🧊🎤' },
  { id: '108', type: 'fun', text: 'Draw a funny face on your thumb and make it lip-sync to a song of my choice 👍🎤' },
  { id: '109', type: 'fun', text: 'Wear your socks on your hands for the next three rounds 🧦👐' },
  { id: '110', type: 'fun', text: 'Blindfold yourself and try to guess what object I\'m describing in your room 🙈🕵️‍♂️' },

  // Romantic (111-123)
  { id: '111', type: 'romantic', text: 'Tell me about a time you felt incredibly proud of me 🌟🥺' },
  { id: '112', type: 'romantic', text: 'Describe the exact outfit you\'d want me to wear on our next dinner date 👗👔✨' },
  { id: '113', type: 'romantic', text: 'Create a secret handshake for us through the screen 🤝🔮' },
  { id: '114', type: 'romantic', text: 'Tell me which of my quirks makes you smile the most 😊💘' },
  { id: '115', type: 'romantic', text: 'Write a 3-sentence review of "Us" as a couple like it\'s a 5-star app ⭐⭐⭐⭐⭐' },
  { id: '116', type: 'romantic', text: 'Stare into the camera and give me your best, most genuine smile for 15 seconds straight 😁', timer: 15 },
  { id: '117', type: 'romantic', text: 'Tell me a completely random memory of us that lives rent-free in your head 🧠💭' },
  { id: '118', type: 'romantic', text: 'Pretend we are on a long motorcycle ride right now—describe the scenery and our first pit stop 🏍️🌄' },
  { id: '119', type: 'romantic', text: 'Read the last sweet text I sent you out loud using your most romantic voice 📱🗣️' },
  { id: '120', type: 'romantic', text: 'Tell me one thing you\'d love to learn how to do together in the future 📚❤️' },
  { id: '121', type: 'romantic', text: 'Name a song that perfectly describes how you feel about me right this second 🎵🥰' },
  { id: '122', type: 'romantic', text: 'Describe my eyes in as much detail as you can without looking at a picture 👁️✨' },
  { id: '123', type: 'romantic', text: 'If we had a whole weekend with no responsibilities, what’s the first thing you\'d plan for us? 🗓️🛋️' },

  // Spicy (124-136)
  { id: '124', type: 'spicy', text: 'Tell me about a time you were completely distracted by how good I looked 👀🔥' },
  { id: '125', type: 'spicy', text: 'Describe the exact way you want me to greet you the next time we are alone behind closed doors 🚪🥵' },
  { id: '126', type: 'spicy', text: 'Send a voice note of you taking a deep breath and letting it out slowly... right near the mic 🎙️😮‍💨' },
  { id: '127', type: 'spicy', text: 'Tell me which part of my body you think about the most when we are apart 💭👅' },
  { id: '128', type: 'spicy', text: 'Run your hands through your hair slowly while maintaining intense eye contact 💆‍♂️🔥', timer: 20 },
  { id: '129', type: 'spicy', text: 'Describe your favorite memory of us being physically close in vivid detail 🧠🔥' },
  { id: '130', type: 'spicy', text: 'Tell me a fantasy you have that involves just the two of us and a locked hotel room 🏨🗝️' },
  { id: '131', type: 'spicy', text: 'Whisper your favorite spicy word in your sexiest tone 🤫' },
  { id: '132', type: 'spicy', text: 'What is one thing I wear that makes it impossible for you to focus? 👗👖🔥' },
  { id: '133', type: 'spicy', text: 'Bite your bottom lip and hold it for 10 seconds while staring at me 🫦', timer: 10 },
  { id: '134', type: 'spicy', text: 'Tell me exactly what goes through your mind when I lean in close to you 🧠💋' },
  { id: '135', type: 'spicy', text: 'Send a picture of your neck and collarbone right now 📸🔥' },
  { id: '136', type: 'spicy', text: 'Describe the temperature of the room using only suggestive adjectives 🌡️🥵' },

  // LDR (137-148)
  { id: '137', type: 'ldr', vibe: 'fun', text: 'Open your map app and find the exact distance between us right now. Send the screenshot! 🗺️📏' },
  { id: '138', type: 'ldr', vibe: 'fun', text: 'Do a trust fall onto your bed while imagining I\'m there to catch you 🛏️🫂' },
  { id: '139', type: 'ldr', vibe: 'fun', text: 'Send me a quick voice note of your current background noise 🎧🌃' },
  { id: '140', type: 'ldr', vibe: 'fun', text: 'Make a cup of coffee or tea right now and take the first sip "with" me ☕🍵' },
  { id: '141', type: 'ldr', vibe: 'romantic', text: 'Find the softest blanket or hoodie in your room and pretend it\'s a hug from me 🧥🤗' },
  { id: '142', type: 'ldr', vibe: 'fun', text: 'Go to your window and describe the first interesting thing you see outside 🪟👀' },
  { id: '143', type: 'ldr', vibe: 'romantic', text: 'Send me a live photo or recording of you blowing a kiss to the camera 💋🤳' },
  { id: '144', type: 'ldr', vibe: 'fun', text: 'Order a small midnight snack for yourself and tell me what you got 🍕🍟' },
  { id: '145', type: 'ldr', vibe: 'fun', text: 'Let\'s pick a new game or app we can both download and play together right now 📲🎮' },
  { id: '146', type: 'ldr', vibe: 'fun', text: 'Tell me what the weather is like there and how it makes you feel right now ⛈️☀️' },
  { id: '147', type: 'ldr', vibe: 'romantic', text: 'Leave your phone on the pillow next to you for the next 2 minutes so we can just "lay" together 🛏️📱', timer: 120 },
  { id: '148', type: 'ldr', vibe: 'fun', text: 'Send me a picture of the shoes you wore today so I can imagine walking beside you 👟👣' },

  // --- NEW FUN (149-156) ---
  { id: '149', type: 'fun', text: 'Pretend you are a local auto driver arguing over the meter while doing your best dramatic bargaining voice.', timer: 45 },
  { id: '150', type: 'fun', text: 'Do 10 push-ups while shouting the names of your top 5 favorite street foods.', timer: 60 },
  { id: '151', type: 'fun', text: 'Act out a full victory dance but in slow-motion like a dramatic movie scene.', timer: 30 },
  { id: '152', type: 'fun', text: 'Speak only in local slang for the next 2 rounds.', timer: 120 },
  { id: '153', type: 'fun', text: 'Balance a spoon on your nose and try to walk to the nearest window without dropping it.', timer: 30 },
  { id: '154', type: 'fun', text: 'Show me the most random photo in your camera roll and narrate it like a dramatic movie trailer.' },
  { id: '155', type: 'fun', text: 'Do your best impression of a strict parent catching us on a video call.', timer: 45 },
  { id: '156', type: 'fun', text: 'Put your phone on your head and do a silly dance for 20 seconds.', timer: 20 },

  // --- NEW ROMANTIC (157-164) ---
  { id: '157', type: 'romantic', text: 'Tell me the exact moment you realized you were falling for me.', timer: 60 },
  { id: '158', type: 'romantic', text: 'Describe our dream rainy day date with chai at the beach.', timer: 60 },
  { id: '159', type: 'romantic', text: 'Recreate the exact way you held my hand the first time we met through the screen.', timer: 30 },
  { id: '160', type: 'romantic', text: 'Sing the chorus of a romantic song but replace the main word with my name.', timer: 30 },
  { id: '161', type: 'romantic', text: 'Plan our next spontaneous adventure in 3 sentences.', timer: 60 },
  { id: '162', type: 'romantic', text: 'Tell me one tiny habit of mine that makes you fall in love all over again.', timer: 45 },
  { id: '163', type: 'romantic', text: 'Write my name in the air with your finger and blow a kiss to it.', timer: 30 },
  { id: '164', type: 'romantic', text: 'Share the exact wallpaper on your phone and explain why it reminds you of us.', timer: 45 },

  // --- NEW SPICY (165-172) ---
  { id: '165', type: 'spicy', text: 'Describe exactly what you would do if we were stuck in a lift together during a power cut.', timer: 45 },
  { id: '166', type: 'spicy', text: 'Send a voice note of you breathing softly while saying my name slowly.', timer: 20 },
  { id: '167', type: 'spicy', text: 'Take off one piece of clothing slowly while maintaining eye contact.', timer: 30 },
  { id: '168', type: 'spicy', text: 'Tell me the one place on my body you want to kiss right now and why.', timer: 45 },
  { id: '169', type: 'spicy', text: 'Show me the sexiest pose you can do right now in your current outfit.', timer: 10 },
  { id: '170', type: 'spicy', text: 'Whisper the hottest compliment you have about me into the microphone.', timer: 20 },
  { id: '171', type: 'spicy', text: 'Rate how spicy our last kiss was on a scale of 1-10 and explain why.', timer: 45 },
  { id: '172', type: 'spicy', text: 'Slowly run your fingers down your neck while staring at me for 15 seconds.', timer: 15 },

  // --- NEW LDR (173-180) ---
  { id: '173', type: 'ldr', vibe: 'fun', text: 'Order me my favorite food right now and send the order screenshot.', timer: 60 },
  { id: '174', type: 'ldr', vibe: 'fun', text: 'Take a 5-second video of you spinning in your room so I can feel like I am there.', timer: 10 },
  { id: '175', type: 'ldr', vibe: 'romantic', text: 'Send a photo of the exact pillow you wish I was sleeping on right now.', timer: 20 },
  { id: '176', type: 'ldr', vibe: 'romantic', text: 'Send a voice note saying I miss you in the softest, slowest voice possible.', timer: 20 },
  { id: '177', type: 'ldr', vibe: 'romantic', text: 'Show me what is playing on your music app and dedicate the next song to me.', timer: 30 },
  { id: '178', type: 'ldr', vibe: 'fun', text: 'Send a picture of the sunset or sunrise from your window right now so we can watch it together.', timer: 15 },
  { id: '179', type: 'ldr', vibe: 'fun', text: 'Change your status to something only I would understand and keep it for 1 hour.', timer: 60 },
  { id: '180', type: 'ldr', vibe: 'fun', text: 'Do a trust-fall onto your bed while saying my name out loud.', timer: 15 },

  // --- FRESH ENGLISH DARES (181-188) ---
  { id: '181', type: 'fun', text: 'Pretend you are a local train announcer giving the most dramatic delay announcement ever.', timer: 45 },
  { id: '182', type: 'fun', text: 'Do 15 jumping jacks while naming every item on a typical street food menu.', timer: 60 },
  { id: '183', type: 'fun', text: 'Act out a full game victory in slow motion like a superhero movie scene.', timer: 30 },
  { id: '184', type: 'fun', text: 'Speak only in movie dialogues for the next 2 rounds.', timer: 120 },
  { id: '185', type: 'fun', text: 'Balance your phone on your forehead and walk across the room like a model on a runway.', timer: 30 },
  { id: '186', type: 'fun', text: 'Show me the oldest selfie in your gallery and narrate the story behind it like a grand presentation.' },
  { id: '187', type: 'fun', text: 'Do your best impression of a traffic policeman stopping us for a romantic photo.', timer: 45 },
  { id: '188', type: 'fun', text: 'Put on your headphones and dance to the first song that plays without any audible music.', timer: 20 },

  // --- FRESH ROMANTIC (189-196) ---
  { id: '189', type: 'romantic', text: 'Tell me the exact moment you first smiled because of a message from me.', timer: 60 },
  { id: '190', type: 'romantic', text: 'Describe our perfect evening walk along the shore in 3 sentences.', timer: 45 },
  { id: '191', type: 'romantic', text: 'Recreate the way you first hugged me using just your arms and the camera.', timer: 30 },
  { id: '192', type: 'romantic', text: 'Sing the chorus of any romantic song but replace the main word with my name.', timer: 30 },
  { id: '193', type: 'romantic', text: 'Plan our next spontaneous weekend getaway in exactly 3 sentences.', timer: 60 },
  { id: '194', type: 'romantic', text: 'Tell me one small thing I do that instantly makes your day better.', timer: 45 },
  { id: '195', type: 'romantic', text: 'Draw a heart in the air with your finger and pretend to give it to me through the screen.' },
  { id: '196', type: 'romantic', text: 'Share your current phone lock screen and explain why it feels like us.' },

  // --- FRESH SPICY (197-204) ---
  { id: '197', type: 'spicy', text: 'Describe exactly what you would do if we were alone in a parked car right now.', timer: 45 },
  { id: '198', type: 'spicy', text: 'Send a voice note breathing slowly and saying my name in your deepest voice.', timer: 20 },
  { id: '199', type: 'spicy', text: 'Slowly remove one item of clothing while keeping eye contact with the camera.', timer: 30 },
  { id: '200', type: 'spicy', text: 'Tell me the one spot on your body you want me to kiss first next time we meet.', timer: 45 },
  { id: '201', type: 'spicy', text: 'Strike your most seductive pose right now and hold it for 10 seconds.', timer: 10 },
  { id: '202', type: 'spicy', text: 'Whisper the hottest compliment you have ever thought about me into the microphone.', timer: 20 },
  { id: '203', type: 'spicy', text: 'Rate our last make-out session from 1 to 10 and explain every point.', timer: 45 },
  { id: '204', type: 'spicy', text: 'Slowly trace your fingers along your collarbone while looking straight at me.', timer: 15 },

  // --- FRESH LDR (205-212) ---
  { id: '205', type: 'ldr', vibe: 'romantic', text: 'Order my favorite dessert right now and send me the confirmation screenshot.', timer: 60 },
  { id: '206', type: 'ldr', vibe: 'fun', text: 'Take a quick 360-degree video of your room so I can imagine standing there with you.' },
  { id: '207', type: 'ldr', vibe: 'romantic', text: 'Send a photo of the exact side of the bed where you wish I was lying right now.' },
  { id: '208', type: 'ldr', vibe: 'romantic', text: 'Record a voice note saying good night in the softest voice you can manage.' },
  { id: '209', type: 'ldr', vibe: 'romantic', text: 'Show me the current song on your playlist and tell me why it reminds you of me.' },
  { id: '210', type: 'ldr', vibe: 'fun', text: 'Send a picture of the sky outside your window right now so we can look at the same clouds.' },
  { id: '211', type: 'ldr', vibe: 'fun', text: 'Change your profile picture to something that only I would understand.' },
  { id: '212', type: 'ldr', vibe: 'romantic', text: 'Do a pretend hug by wrapping your arms around yourself and saying my name out loud.' }
];

// Helper to get 5 free initial cards for first-time users (mix of fun + romantic)
export const getInitialFreeCards = () => {
  return CARDS.slice(0, 5); // First 5 cards are free for new users
};
``


## D:\Rumbala\src\constants\glass.ts
``ts

import { StyleSheet } from 'react-native';

export const glassTokens = {
    background: 'rgba(255, 255, 255, 0.45)',
    border: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1.5,
    borderRadius: 24,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 0,
};

export const glassStyles = StyleSheet.create({
    container: {
        backgroundColor: glassTokens.background,
        borderColor: glassTokens.border,
        borderWidth: glassTokens.borderWidth,
        borderRadius: glassTokens.borderRadius,
        shadowColor: glassTokens.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: glassTokens.shadowOpacity,
        shadowRadius: glassTokens.shadowRadius,
        elevation: glassTokens.elevation,
    },
    header: {
      
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        borderRadius: 28,
        overflow: 'hidden',
    }
});
``


## D:\Rumbala\src\constants\pricing.ts
``ts

import { PurchasesPackage } from 'react-native-purchases';

export type PackageKind = 'annual' | 'monthly' | 'consumable' | 'unknown';

export const PAYWALL_FEATURES = [
    { id: 'unlimited_cards', title: 'Unlimited Cards', desc: 'Never run out of dares', icon: 'infinite' },
    { id: 'ldr_access', title: 'Video Calls', desc: 'Secure LDR sessions', icon: 'videocam' },
    { id: 'spicy_content', title: 'Spicy Content', desc: 'Exclusive dirty dares', icon: 'flame' },
    { id: 'custom_themes', title: 'Custom Themes', desc: 'Personalize your game', icon: 'color-palette' },
] as const;

export const getPackageKind = (pkg: PurchasesPackage): PackageKind => {
    const identifier = pkg.product.identifier.toLowerCase();
    if (pkg.packageType === 'ANNUAL' || /annual|year/.test(identifier)) return 'annual';
    if (pkg.packageType === 'MONTHLY' || /month/.test(identifier)) return 'monthly';
    if (pkg.packageType === 'CUSTOM') return 'consumable';
    return 'unknown';
};

export const resolvePlanPackages = (availablePackages: PurchasesPackage[] = []) => {
    const annual = availablePackages.find((pkg) => getPackageKind(pkg) === 'annual') || null;
    const monthly = availablePackages.find((pkg) => getPackageKind(pkg) === 'monthly') || null;
    return { annual, monthly };
};

export const inferPeriodLabel = (priceString: string, kind: 'annual' | 'monthly') => {
    if (/\/(yr|year|yearly)/i.test(priceString)) return '';
    if (/\/(mo|month|monthly)/i.test(priceString)) return '';
    return kind === 'annual' ? '/yr' : '/mo';
};
``


## D:\Rumbala\src\constants\theme.ts
``ts

export const theme = {
    colors: {
        light: {
            background: '#FAF9F6',
            card: '#ffffff',
            text: '#1C000B',
            textSecondary: '#666666',
            primary: '#FF6B35',
            secondary: '#FF9800',
            border: '#E8E8E8',
            gradientStart: '#FF6B35',
            gradientEnd: '#FF9800',
        },
        dark: {
            background: '#1C000B',
            card: '#2A0014',
            text: '#ffffff',
            textSecondary: '#FFE4DE',
            primary: '#FF6B35',
            secondary: '#FF9800',
            border: 'rgba(255, 107, 53, 0.3)',
            gradientStart: '#3E001A',
            gradientEnd: '#1C000B',
        },
    },
    typography: {
        display: 'Pacifico_400Regular',
        heading: 'Quicksand_700Bold',
        headingBlack: 'Quicksand_700Bold',
        headingSemiBold: 'Quicksand_600SemiBold',
        body: 'Quicksand_400Regular',
        bodyMedium: 'Quicksand_500Medium',
        bodyBold: 'Quicksand_700Bold',
        bodyLight: 'Quicksand_300Light',
    }
};

``


## D:\Rumbala\src\constants\typography.ts
``ts

import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const typography = StyleSheet.create({
    // Headings
    h1: {
        fontFamily: theme.typography.headingBlack,
        fontSize: 32,
        lineHeight: 40,
        color: theme.colors.dark.text,
    },
    h2: {
        fontFamily: theme.typography.heading,
        fontSize: 28,
        lineHeight: 36,
        color: theme.colors.dark.text,
    },
    h3: {
        fontFamily: theme.typography.heading,
        fontSize: 24,
        lineHeight: 32,
        color: theme.colors.dark.text,
    },
    h4: {
        fontFamily: theme.typography.heading,
        fontSize: 20,
        lineHeight: 28,
        color: theme.colors.dark.text,
    },

    // Body text
    body: {
        fontFamily: theme.typography.body,
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.dark.text,
    },
    bodyMedium: {
        fontFamily: theme.typography.bodyMedium,
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.dark.text,
    },
    bodyBold: {
        fontFamily: theme.typography.bodyBold,
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.dark.text,
    },

    // Small text
    small: {
        fontFamily: theme.typography.body,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.dark.text,
    },
    smallMedium: {
        fontFamily: theme.typography.bodyMedium,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.dark.text,
    },
    smallBold: {
        fontFamily: theme.typography.bodyBold,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.dark.text,
    },

    // Extra small text
    xs: {
        fontFamily: theme.typography.body,
        fontSize: 12,
        lineHeight: 16,
        color: theme.colors.dark.text,
    },
    xsMedium: {
        fontFamily: theme.typography.bodyMedium,
        fontSize: 12,
        lineHeight: 16,
        color: theme.colors.dark.text,
    },
    xsBold: {
        fontFamily: theme.typography.bodyBold,
        fontSize: 12,
        lineHeight: 16,
        color: theme.colors.dark.text,
    },

    // Button text
    button: {
        fontFamily: theme.typography.heading,
        fontSize: 16,
        lineHeight: 24,
        color: '#fff',
    },

    // Label text
    label: {
        fontFamily: theme.typography.bodyMedium,
        fontSize: 13,
        lineHeight: 18,
        color: theme.colors.dark.text,
    },
});

``


## D:\Rumbala\src\services\api.ts
``ts

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

// ─── PUBLIC CMS (Dares) ─────────────────────────────────────────────────────

export const getCmsCards = async () => {
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('is_active', true);
    if (error) throw new Error(error.message);
    return data;
};


``


## D:\Rumbala\src\services\iap.ts
``ts

/**
 * IAP Service — delegates to RevenueCat
 * 
 * This file is kept for backward compatibility with existing imports.
 * All purchases now go through services/revenueCatService.ts
 */

import { useStore } from '../store/useStore';
import { getOfferings, purchasePackage } from './revenueCatService';

// Product IDs (kept for reference / future App Store/Play Store)
export const itemSKUs = [
    'Rumbala_card_1',   // ₹5  → 1 card
    'Rumbala_card_5',   // ₹19 → 5 cards
    'Rumbala_card_10',  // ₹39 → 10 cards
    'Rumbala_card_25',  // ₹89 → 25 cards
];

export const initIAP = async () => {
    console.log('IAP: Using RevenueCat (App Store / Play Store)');
};

/**
 * Buy cards through RevenueCat offerings.
 */
export const buyCards = async (sku: string): Promise<boolean> => {
    const offerings = await getOfferings();
    const current = offerings?.current || offerings;
    const pkg = current?.availablePackages?.find((p: any) => p?.product?.identifier === sku);

    if (!pkg) {
        useStore.getState().showAlert('Store Not Ready', 'Product not found or offerings not loaded yet.');
        return false;
    }

    const result = await purchasePackage(pkg);
    if (!result.success) {
        if (result.error && result.error !== 'Purchase cancelled') {
            useStore.getState().showAlert('Purchase Failed', result.error);
        }
        return false;
    }

    useStore.getState().showAlert('Success! 🎉', `${result.cardsAdded || 0} new dare cards added!`);
    return true;
};

``


## D:\Rumbala\src\services\notificationService.ts
``ts

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useStore } from '../store/useStore';

// Configure how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  const enabled = finalStatus === 'granted';
  useStore.getState().setNotificationsEnabled(enabled);
  return enabled;
};

export const scheduleDailyQuestionReminder = async () => {
  try {
    // Clear any existing scheduled notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    const enabled = useStore.getState().notificationsEnabled;
    if (!enabled) return;

    // Schedule a daily notification at 10:00 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Couple Question 💏",
        body: "It's time for today's question! Open Rumbala to share your thoughts.",
        data: { screen: 'daily' },
        sound: true,
      },
      trigger: {
        hour: 10,
        minute: 0,
        repeats: true,
      } as any,
    });
  } catch (e) {
    console.warn('[NotificationService] Failed to schedule:', e);
  }
};

export const initNotifications = async () => {
  if (Platform.OS === 'web') return;
  
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') {
    useStore.getState().setNotificationsEnabled(true);
    await scheduleDailyQuestionReminder();
  }
};
``


## D:\Rumbala\src\services\revenueCatService.ts
``ts

/**
 * RevenueCat In-App Purchase Service (Mobile & Web)
 * 
 * Supports: 
 * - iOS/Android via react-native-purchases
 * - Web via @revenuecat/purchases-js
 * - Dare Cards (Consumables)
 * - Rumbala Pro (Subscriptions: Monthly, Yearly, Lifetime)
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { addUserCards } from './api';

// Dynamic imports to handle web vs native without breaking bundlers
let NativePurchases: any;
let WebPurchases: any;

if (Platform.OS !== 'web') {
    // Native SDK
    NativePurchases = require('react-native-purchases').default;
    const { LOG_LEVEL } = require('react-native-purchases');
    if (__DEV__) NativePurchases.setLogLevel(LOG_LEVEL.DEBUG);
} else {
    // Web SDK
    WebPurchases = require('@revenuecat/purchases-js').Purchases;
}

// ─── Configuration ─────────────────────────────────────────────
const REVENUECAT_API_KEY_APPLE =
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_API_KEY_GOOGLE =
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
const REVENUECAT_API_KEY_WEB =
    process.env.EXPO_PUBLIC_REVENUECAT_WEB_API_KEY;

// Entitlements
export const ENTITLEMENT_PRO = 'Pro';
export const ENTITLEMENT_CARDS = 'dare_cards';

// ─── Mock Data for Development ────────────────────────────────
const MOCK_OFFERING = {
    current: {
        availablePackages: [
            {
                identifier: 'monthly',
                packageType: 'MONTHLY',
                isMock: true,
                product: {
                    identifier: 'monthly',
                    description: 'Full access to all features monthly',
                    title: 'Monthly Premium',
                    price: 9.99,
                    priceString: '$9.99',
                    currencyCode: 'USD',
                    introPrice: null,
                }
            },
            {
                identifier: 'annual',
                packageType: 'ANNUAL',
                isMock: true,
                product: {
                    identifier: 'annual',
                    description: 'Full access to all features annually',
                    title: 'Annual Premium',
                    price: 59.99,
                    priceString: '$59.99',
                    currencyCode: 'USD',
                    introPrice: {
                        price: 0,
                        priceString: 'Free',
                        period: 'P3D',
                        periodUnit: 'DAY',
                        periodNumberOfUnits: 3,
                        cycles: 1
                    },
                }
            },
            {
                identifier: 'dare_card_5',
                packageType: 'CUSTOM',
                isMock: true,
                product: {
                    identifier: 'dare_card_5',
                    description: 'Get 5 more dares to spice up the night',
                    title: '5 Dare Cards',
                    price: 1.99,
                    priceString: '$1.99',
                    currencyCode: 'USD',
                }
            },
            {
                identifier: 'dare_card_10',
                packageType: 'CUSTOM',
                isMock: true,
                product: {
                    identifier: 'dare_card_10',
                    description: 'Unlock 10 dares and save 20%',
                    title: '10 Dare Cards',
                    price: 3.99,
                    priceString: '$3.99',
                    currencyCode: 'USD',
                }
            },
            {
                identifier: 'dare_card_25',
                packageType: 'CUSTOM',
                isMock: true,
                product: {
                    identifier: 'dare_card_25',
                    description: 'The ultimate card hoard for true lovers',
                    title: '25 Dare Cards',
                    price: 7.99,
                    priceString: '$7.99',
                    currencyCode: 'USD',
                }
            }
        ]
    }
};

// Product Mapping for Consumables
const PRODUCT_CARD_MAP: Record<string, number> = {
    dare_card_1: 1,
    dare_card_5: 5,
    dare_card_10: 10,
    dare_card_25: 25,
};

let isInitialized = false;
let rcInstance: any = null; // Holds the active instance (Web or Native)
const PURCHASE_HISTORY_KEY = '@Rumbala_purchase_history';

export interface PurchaseHistoryRecord {
    id: string;
    date: string;
    productId: string;
    title: string;
    price: string;
    cardsAdded?: number;
    type: 'subscription' | 'consumable';
}

// ─── Initialize RevenueCat ─────────────────────────────────────
export async function initRevenueCat(userId?: string): Promise<void> {
    if (isInitialized) {
        if (userId) await identifyUser(userId);
        return;
    }

    try {
        if (Platform.OS === 'web') {
            if (!REVENUECAT_API_KEY_WEB) {
                throw new Error('Missing EXPO_PUBLIC_REVENUECAT_WEB_API_KEY');
            }
            // Web Initialization
            rcInstance = WebPurchases.configure(REVENUECAT_API_KEY_WEB, userId || undefined);
            console.log('🌐 RevenueCat Web initialized');
        } else {
            // Native Initialization
            const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_APPLE : REVENUECAT_API_KEY_GOOGLE;
            if (!apiKey) {
                throw new Error(
                    Platform.OS === 'ios'
                        ? 'Missing EXPO_PUBLIC_REVENUECAT_IOS_API_KEY'
                        : 'Missing EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY',
                );
            }
            NativePurchases.configure({ apiKey, appUserID: userId || undefined });
            rcInstance = NativePurchases;
            console.log('📱 RevenueCat Native initialized');
        }

        isInitialized = true;

        if (userId) await identifyUser(userId);
    } catch (error: any) {
        console.error('❌ RevenueCat init error:', error.message);
    }
}

// ─── Identify User ─────────────────────────────────────────────
export async function identifyUser(userId: string): Promise<void> {
    try {
        if (Platform.OS === 'web') {
            await rcInstance.changeUser(userId);
        } else {
            await rcInstance.logIn(userId);
        }
        console.log('👤 RevenueCat user identified:', userId);
    } catch (error: any) {
        console.error('❌ RevenueCat identify error:', error.message);
    }
}

// ─── Get Offerings (Paywall/Products) ──────────────────────────
export async function getOfferings(): Promise<any | null> {
    try {
        if (!isInitialized) {
            const userId = useStore.getState().userId;
            await initRevenueCat(userId || undefined);
        }

        if (Platform.OS === 'web') {
            const offerings = await rcInstance.getOfferings();
            console.log('🌐 RC WEB: Offerings loaded:', offerings?.current?.availablePackages?.length || 0);
            return offerings || null;
        } else {
            const offerings = await rcInstance.getOfferings();
            
            if (offerings?.current?.availablePackages) {
                console.log('📱 RC NATIVE: CURRENT OFFERING PACKAGES:');
                offerings.current.availablePackages.forEach((pkg: any) => {
                    console.log(`   - ID: ${pkg.identifier} | ProductID: ${pkg.product.identifier} | Price: ${pkg.product.priceString}`);
                });
            } else {
                console.warn('⚠️ RC NATIVE: No current offering found.');
            }

            // If the offering is valid but empty, it might still throw or return empty
            if (!offerings?.current || offerings.current.availablePackages.length === 0) {
                console.warn('⚠️ No packages in current offering, checking for mock fallback...');
                if (__DEV__) return MOCK_OFFERING;
            }

            return offerings || null;
        }
    } catch (error: any) {
        console.error('❌ Failed to load offerings:', error.message);
        console.error('🔍 Error Details:', JSON.stringify(error, null, 2));
        
        // Fallback to mock in development if configuration error occurs
        if (__DEV__) {
            console.log('🛠️ Using MOCK_OFFERING for development testing');
            return MOCK_OFFERING;
        }
        return null;
    }
}

// ─── Purchase a Package ────────────────────────────────────────
// pkg is either a string (ProductId), a Native Package, or a Web Package
export async function purchasePackage(pkg: any): Promise<{ success: boolean; cardsAdded?: number; error?: string }> {
    try {
        if (!isInitialized) {
            await initRevenueCat(useStore.getState().userId || undefined);
        }

        // 🛠️ Mock Purchase Safety (Development Only)
        // If the package is from our mock data, don't call the native SDK
        if (__DEV__ && (pkg?.identifier === 'monthly' || pkg?.identifier === 'annual' || pkg?.isMock)) {
            console.log('🛠️ Simulating successful MOCK purchase...');
            // Simulate a delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const productId = typeof pkg === 'string' ? pkg : (pkg?.product?.identifier || 'mock_pro');
            const cardsAdded = PRODUCT_CARD_MAP[productId] || 0;
            if (cardsAdded > 0) handleConsumableSuccess(cardsAdded, productId, pkg);
            else await appendPurchaseHistory(pkg, { productId, type: 'subscription' });
            
            return { success: true, cardsAdded: cardsAdded > 0 ? cardsAdded : undefined };
        }

        console.log(`🛒 Purchasing ${typeof pkg === 'string' ? pkg : pkg?.identifier || 'package'}...`);

        let customerInfo;
        if (Platform.OS === 'web') {
            customerInfo = typeof pkg === 'string' 
                ? await rcInstance.purchaseProduct(pkg) 
                : await rcInstance.purchasePackage(pkg);
        } else {
            // Native Purchase (Google Play / App Store)
            if (typeof pkg === 'string') {
                const result = await NativePurchases.purchaseProduct(pkg);
                customerInfo = result.customerInfo;
            } else {
                const result = await NativePurchases.purchasePackage(pkg);
                customerInfo = result.customerInfo;
            }
        }

        // Check if it was a dare card consumable
        const productId = typeof pkg === 'string' 
            ? pkg 
            : (Platform.OS === 'web' ? pkg.rcBillingProduct.identifier : pkg.product.identifier);
            
        const cardsAdded = PRODUCT_CARD_MAP[productId] || 0;

        if (cardsAdded > 0) {
            handleConsumableSuccess(cardsAdded, productId, pkg);
            return { success: true, cardsAdded };
        }

        // Must be a subscription (Rumbala Pro)
        const hasPro = checkProEntitlement(customerInfo);
        if (hasPro) {
            await appendPurchaseHistory(pkg, { productId, type: 'subscription' });
        }
        return { success: !!hasPro };
    } catch (error: any) {
        if (error.userCancelled) {
            console.log('🚫 Purchase cancelled by user');
            return { success: false, error: 'Purchase cancelled' };
        }
        console.error('❌ Purchase error:', error.message || error);
        return { success: false, error: error.message || 'The purchase could not be completed. Please try again.' };
    }
}

// ─── Check Pro Entitlement ─────────────────────────────────────
export function checkProEntitlement(customerInfo: any): boolean {
    if (!customerInfo || !customerInfo.entitlements || !customerInfo.entitlements.active) return false;

    // Support common entitlement naming variants to avoid false negatives.
    const activeEntitlements = customerInfo.entitlements.active;
    return (
        activeEntitlements[ENTITLEMENT_PRO] !== undefined ||
        activeEntitlements['Rumbala Pro'] !== undefined ||
        activeEntitlements['Pro'] !== undefined
    );
}

// ─── Restore Purchases ─────────────────────────────────────────
export async function restorePurchases(): Promise<any | null> {
    try {
        let customerInfo;
        if (Platform.OS === 'web') {
            // Web doesn't strictly have a "restore purchases" like Apple/Google, it reads from the logged-in user
            customerInfo = await rcInstance.getCustomerInfo();
        } else {
            customerInfo = await NativePurchases.restorePurchases();
        }
        console.log('🔄 Purchases restored');
        return customerInfo;
    } catch (error: any) {
        console.error('❌ Restore error:', error.message);
        return null;
    }
}

// ─── Get Customer Info ─────────────────────────────────────────
export async function getCustomerInfo(): Promise<any | null> {
    try {
        if (!isInitialized) {
            const userId = useStore.getState().userId;
            await initRevenueCat(userId || undefined);
        }

        if (Platform.OS === 'web') {
            return await rcInstance.getCustomerInfo();
        } else {
            return await NativePurchases.getCustomerInfo();
        }
    } catch (error: any) {
        console.error('❌ Customer info error:', error.message);
        return null;
    }
}

// ─── Customer Center (Native Only) ─────────────────────────────
export async function showCustomerCenter(): Promise<void> {
    if (Platform.OS === 'web') {
        console.warn('Customer Center is not available on Web natively via SDK.');
        return;
    }

    try {
        const RevenueCatUI = require('react-native-purchases-ui').default;
        if (RevenueCatUI && RevenueCatUI.presentCustomerCenter) {
            await RevenueCatUI.presentCustomerCenter();
        } else {
            console.warn('Customer Center is not supported on this SDK version or platform.');
        }
    } catch (error: any) {
        console.error('❌ Failed to open Customer Center:', error.message);
    }
}

// ─── Helper: Post-Purchase Card Sync ───────────────────────────
function handleConsumableSuccess(cardsAdded: number, productId: string, pkg?: any) {
    const store = useStore.getState();
    const newCount = (store.cardCount || 0) + cardsAdded;
    store.setCardCount(newCount);

    const userId = store.userId;
    if (userId) {
        addUserCards(userId, cardsAdded, productId).catch((err: any) => {
            console.warn('Card sync failed after purchase:', err.message);
        });
    }
    appendPurchaseHistory(pkg, { productId, type: 'consumable', cardsAdded }).catch(() => null);
    console.log(`🎉 Purchase complete! +${cardsAdded} cards (total: ${newCount})`);
}

async function appendPurchaseHistory(pkg: any, extras: { productId: string; type: 'subscription' | 'consumable'; cardsAdded?: number }) {
    try {
        const product = pkg?.product;
        const historyRaw = await AsyncStorage.getItem(PURCHASE_HISTORY_KEY);
        const history: PurchaseHistoryRecord[] = historyRaw ? JSON.parse(historyRaw) : [];
        const nextRecord: PurchaseHistoryRecord = {
            id: `${Date.now()}_${extras.productId}`,
            date: new Date().toISOString(),
            productId: extras.productId,
            title: product?.title || extras.productId,
            price: product?.priceString || 'N/A',
            cardsAdded: extras.cardsAdded,
            type: extras.type,
        };
        const nextHistory = [nextRecord, ...history].slice(0, 30);
        await AsyncStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(nextHistory));
    } catch (error: any) {
        console.warn('Failed to persist purchase history:', error?.message || error);
    }
}

export async function getPurchaseHistory(): Promise<PurchaseHistoryRecord[]> {
    try {
        const historyRaw = await AsyncStorage.getItem(PURCHASE_HISTORY_KEY);
        return historyRaw ? JSON.parse(historyRaw) : [];
    } catch {
        return [];
    }
}

``


## D:\Rumbala\src\services\roomApi.ts
``ts

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

// In-memory handles for real-time subscriptions
let roomSubscriber: ReturnType<typeof setInterval> | null = null;
let chatSubscriber: ReturnType<typeof setInterval> | null = null;

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

    // Clean up subscriptions
    if (roomSubscriber) {
        clearInterval(roomSubscriber);
        roomSubscriber = null;
    }
    if (chatSubscriber) {
        clearInterval(chatSubscriber);
        chatSubscriber = null;
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
    // Clear existing subscriber
    if (roomSubscriber) {
        clearInterval(roomSubscriber);
        roomSubscriber = null;
    }

    // Initial fetch
    getRoomDataV2(roomCode).then(data => {
        if (data) callback(data);
    }).catch(() => { /* initial fetch failed, polling will retry */ });

    // Poll periodically — each tick is wrapped in try/catch so transient
    // network errors don't kill the subscription
    roomSubscriber = setInterval(async () => {
        try {
            const data = await getRoomDataV2(roomCode);
            if (data) callback(data);
        } catch (e) {
            // Silently retry on next tick
        }
    }, POLL_INTERVAL_MS);

    // Return unsubscribe function
    return () => {
        if (roomSubscriber) {
            clearInterval(roomSubscriber);
            roomSubscriber = null;
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
    // Clear existing subscriber
    if (chatSubscriber) {
        clearInterval(chatSubscriber);
        chatSubscriber = null;
    }

    // Initial fetch
    getChatMessagesV2(roomCode).then(messages => {
        callback(messages);
    }).catch(() => { /* initial fetch failed, polling will retry */ });

    // Poll periodically
    chatSubscriber = setInterval(async () => {
        try {
            const messages = await getChatMessagesV2(roomCode);
            callback(messages);
        } catch (e) {
            // Silently retry on next tick
        }
    }, POLL_INTERVAL_MS);

    // Return unsubscribe function
    return () => {
        if (chatSubscriber) {
            clearInterval(chatSubscriber);
            chatSubscriber = null;
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

``


## D:\Rumbala\src\services\supabase.ts
``ts

/**
 * Supabase Client — initialized with anon key + AsyncStorage session persistence.
 * Sessions are automatically refreshed; no manual token management needed.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
        'Missing Supabase env vars: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY)',
    );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

``


## D:\Rumbala\src\store\useStore.ts
``ts

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
``


