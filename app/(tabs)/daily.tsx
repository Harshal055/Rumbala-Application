import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, KeyboardAvoidingView, Platform, Dimensions, StatusBar
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

const { width } = Dimensions.get('window');

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
                            />
                            <MilestoneCard 
                                title="First Dare" 
                                sub="1 Dare Done" 
                                icon="trophy" 
                                unlocked={milestones.includes('first_dare')} 
                                color="#FF9800" 
                                delay={800}
                            />
                            <MilestoneCard 
                                title="On Fire" 
                                sub="7 Day Streak" 
                                icon="flame" 
                                unlocked={milestones.includes('7_day_streak')} 
                                color="#EF4444" 
                                delay={900}
                            />
                            <MilestoneCard 
                                title="Eternal Love" 
                                sub="100 Days" 
                                icon="infinite" 
                                unlocked={milestones.includes('100_days')} 
                                color="#8B5CF6" 
                                delay={1000}
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

function MilestoneCard({ title, sub, icon, unlocked, color, delay }: { title: string, sub: string, icon: any, unlocked: boolean, color: string, delay: number }) {
    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(600)}>
            <TouchableOpacity 
                style={[styles.milestoneCard, glassStyles.container, !unlocked && styles.milestoneCardLocked]}
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
        width: (width - 56) / 2,
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
