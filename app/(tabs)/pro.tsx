import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, useWindowDimensions, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withSpring,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';



const BG_COLORS = ['#FDFCFB', '#FFE4E1', '#E6E6FA'];

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

    // Animations
    const heartBeat = useSharedValue(1);
    const badgeRotate = useSharedValue(0);
    const glowOpacity = useSharedValue(0.3);

    useEffect(() => {
        heartBeat.value = withRepeat(
            withSequence(
                withTiming(1.25, { duration: 400, easing: Easing.out(Easing.ease) }),
                withTiming(1, { duration: 300, easing: Easing.in(Easing.ease) }),
                withTiming(1.15, { duration: 300, easing: Easing.out(Easing.ease) }),
                withTiming(1, { duration: 600, easing: Easing.in(Easing.ease) }),
                withDelay(1500, withTiming(1, { duration: 0 }))
            ), -1, false
        );
        badgeRotate.value = withRepeat(
            withSequence(
                withTiming(8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                withTiming(-8, { duration: 1200, easing: Easing.inOut(Easing.ease) })
            ), -1, true
        );
        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ), -1, true
        );
    }, []);

    const heartAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartBeat.value }],
    }));
    const badgeAnimStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${badgeRotate.value}deg` }],
    }));
    const glowAnimStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

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

    // Score bar ratio
    const p1 = profileInsights.p1Wins;
    const p2 = profileInsights.p2Wins;
    const totalScore = p1 + p2;
    const p1Ratio = totalScore > 0 ? p1 / totalScore : 0.5;

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />
                
                {/* Header */}
                <View style={[styles.header, glassStyles.header]}>
                    <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Couple Profile</Text>
                    <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerBtn}>
                        <Ionicons name="settings-sharp" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                    {/* ── Profile Hero ── */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarRow}>
                            {/* Partner 1 Avatar */}
                            <View style={styles.avatarWrap}>
                                <Animated.View style={[styles.avatarGlow, { backgroundColor: 'rgba(255,107,53,0.15)' }, glowAnimStyle]} />
                                <View style={[styles.avatarCircle, { backgroundColor: '#FF6B35' }]}>
                                    <Text style={styles.avatarInitial}>{partner1?.[0]?.toUpperCase() || 'P'}</Text>
                                </View>
                            </View>

                            {/* Heart badge */}
                            <Animated.View style={[styles.heartBadge, badgeAnimStyle]}>
                                <LinearGradient colors={['#FF6B35', '#FF1493']} style={styles.heartBadgeGrad}>
                                    <Ionicons name="heart" size={18} color="#fff" />
                                </LinearGradient>
                            </Animated.View>

                            {/* Partner 2 Avatar */}
                            <View style={styles.avatarWrap}>
                                <Animated.View style={[styles.avatarGlow, { backgroundColor: 'rgba(45,27,105,0.12)' }, glowAnimStyle]} />
                                <View style={[styles.avatarCircle, { backgroundColor: '#2D1B69' }]}>
                                    <Text style={styles.avatarInitial}>{partner2?.[0]?.toUpperCase() || 'P'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Names */}
                        <View style={styles.nameSection}>
                            <Text style={styles.coupleName}>{partner1 || 'Partner 1'}</Text>
                            <Animated.View style={heartAnimStyle}>
                                <Ionicons name="heart" size={16} color="#FF6B35" style={{ marginHorizontal: 6 }} />
                            </Animated.View>
                            <Text style={styles.coupleName}>{partner2 || 'Partner 2'}</Text>
                        </View>

                        {/* Since badge */}
                        <View style={styles.sincePill}>
                            <Ionicons name="calendar-outline" size={13} color="#FF6B35" />
                            <Text style={styles.sinceText}>Together since {profileInsights.togetherSince}</Text>
                        </View>
                    </View>

                    {/* ── Score Bar ── */}
                    <View style={[styles.scoreCard, glassStyles.container]}>
                        <View style={styles.scoreHeader}>
                            <Text style={styles.scoreTitle}>Score Board</Text>
                            <View style={styles.scoreTotalPill}>
                                <Ionicons name="diamond" size={12} color="#FF6B35" />
                                <Text style={styles.scoreTotalText}>{profileInsights.totalPoints} pts</Text>
                            </View>
                        </View>

                        {/* Visual score bar */}
                        <View style={styles.scoreBarOuter}>
                            <LinearGradient
                                colors={['#FF6B35', '#FF9800']}
                                style={[styles.scoreBarLeft, { flex: p1Ratio || 0.01 }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            />
                            <LinearGradient
                                colors={['#6C3BD5', '#2D1B69']}
                                style={[styles.scoreBarRight, { flex: (1 - p1Ratio) || 0.01 }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            />
                        </View>

                        <View style={styles.scoreLabels}>
                            <View style={styles.scoreLabelWrap}>
                                <View style={[styles.scoreDot, { backgroundColor: '#FF6B35' }]} />
                                <Text style={styles.scoreLabelName}>{partner1 || 'P1'}</Text>
                                <Text style={styles.scoreLabelVal}>{p1}</Text>
                            </View>
                            <View style={styles.scoreLabelWrap}>
                                <Text style={styles.scoreLabelVal}>{p2}</Text>
                                <Text style={styles.scoreLabelName}>{partner2 || 'P2'}</Text>
                                <View style={[styles.scoreDot, { backgroundColor: '#2D1B69' }]} />
                            </View>
                        </View>
                    </View>

                    {/* ── Stats Row ── */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, glassStyles.container]}>
                            <View style={styles.statIconBox}>
                                <Ionicons name="diamond" size={20} color="#FF6B35" />
                            </View>
                            <Text style={styles.statValue}>{profileInsights.totalPoints.toLocaleString()}</Text>
                            <Text style={styles.statLabel}>Rumble Points</Text>
                        </View>
                        <View style={[styles.statCard, glassStyles.container]}>
                            <View style={styles.statIconBox}>
                                <Ionicons name="images" size={20} color="#FF6B35" />
                            </View>
                            <Text style={styles.statValue}>{profileInsights.memories}</Text>
                            <Text style={styles.statLabel}>Memories</Text>
                        </View>
                        <View style={[styles.statCard, glassStyles.container]}>
                            <View style={styles.statIconBox}>
                                <Ionicons name="flame" size={20} color="#FF6B35" />
                            </View>
                            <Text style={styles.statValue}>{profileInsights.topVibe}</Text>
                            <Text style={styles.statLabel}>Top Vibe</Text>
                        </View>
                    </View>

                    {/* ── Detail Card ── */}
                    <View style={[styles.detailCard, glassStyles.container]}>
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
                    </View>

                    {/* ── Memories Section ── */}
                    <View style={styles.memoriesHeader}>
                        <Text style={styles.sectionTitle}>Our Memories</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                            <Text style={styles.seeAll}>See All <Ionicons name="chevron-forward" size={12} /></Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.grid, isCompact && styles.gridCompact]}>
                        {history.length > 0 ? (
                            history.slice(0, 4).map((entry, idx) => (
                                <Animated.View key={entry.id} entering={FadeInUp.delay(450 + idx * 80).duration(500)}>
                                    <TouchableOpacity style={[styles.memoryItem, glassStyles.container, { width: memoryCardWidth }]}> 
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
                                </Animated.View>
                            ))
                        ) : (
                            <View style={styles.emptyMemories}>
                                <Ionicons name="images-outline" size={48} color="rgba(0,0,0,0.1)" />
                                <Text style={styles.emptyText}>No memories yet. Draw a card and finish a dare to see it here!</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16,
    },
    headerTitle: { fontSize: 24, fontFamily: 'Pacifico_400Regular', color: '#1a1a1a', paddingRight: 10 },
    headerBtn: { padding: 8 },

    // ── Profile Hero ──
    profileSection: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    avatarWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarCircle: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3.5, borderColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12, shadowRadius: 10, elevation: 6,
    },
    avatarInitial: { color: '#fff', fontSize: 30, fontWeight: '900' },
    heartBadge: {
        marginHorizontal: -8,
        zIndex: 10,
    },
    heartBadgeGrad: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#fff',
        shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
    },
    nameSection: {
        flexDirection: 'row', alignItems: 'center',
    },
    coupleName: { fontSize: 20, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.3 },
    sincePill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 10,
        backgroundColor: 'rgba(255,107,53,0.08)',
        paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 20,
    },
    sinceText: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 0.3 },

    // ── Score Card ──
    scoreCard: {
        marginHorizontal: 20, marginBottom: 16,
        padding: 18, borderRadius: 22,
    },
    scoreHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14,
    },
    scoreTitle: { fontSize: 15, fontWeight: '900', color: '#1a1a1a' },
    scoreTotalPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(255,107,53,0.08)',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    },
    scoreTotalText: { fontSize: 12, fontWeight: '800', color: '#FF6B35' },
    scoreBarOuter: {
        flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    scoreBarLeft: { borderTopLeftRadius: 5, borderBottomLeftRadius: 5 },
    scoreBarRight: { borderTopRightRadius: 5, borderBottomRightRadius: 5 },
    scoreLabels: {
        flexDirection: 'row', justifyContent: 'space-between',
        marginTop: 10,
    },
    scoreLabelWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    scoreDot: { width: 8, height: 8, borderRadius: 4 },
    scoreLabelName: { fontSize: 13, fontWeight: '700', color: '#555' },
    scoreLabelVal: { fontSize: 14, fontWeight: '900', color: '#1a1a1a' },

    // ── Stats Row ──
    statsRow: {
        flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16,
    },
    statCard: {
        flex: 1, padding: 14, borderRadius: 20, alignItems: 'center',
    },
    statIconBox: {
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: 'rgba(255,107,53,0.08)',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 8,
    },
    statValue: { fontSize: 18, fontWeight: '900', color: '#1a1a1a', marginBottom: 2 },
    statLabel: { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 0.3, textAlign: 'center' },

    // ── Detail Card ──
    detailCard: {
        borderRadius: 24, marginHorizontal: 20,
        padding: 18, marginBottom: 24,
    },
    detailTitle: {
        fontSize: 16, fontWeight: '900', color: '#1a1a1a', marginBottom: 12,
    },
    detailGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10,
        justifyContent: 'space-between',
    },
    detailChip: {
        width: '48%',
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, paddingVertical: 10, paddingHorizontal: 10,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    detailChipIcon: {
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,107,53,0.1)',
        marginRight: 10,
    },
    detailChipTextWrap: { flex: 1, minWidth: 0 },
    detailChipLabel: { fontSize: 11, color: '#888', fontWeight: '700', letterSpacing: 0.4 },
    detailChipValue: { fontSize: 13, color: '#1a1a1a', fontWeight: '800', marginTop: 2 },

    // ── Memories ──
    memoriesHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, marginBottom: 16,
    },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.5 },
    seeAll: { fontSize: 14, fontWeight: '700', color: '#FF6B35' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
    gridCompact: { flexDirection: 'column' },
    memoryItem: {
        height: 200, borderRadius: 22, overflow: 'hidden',
    },
    memoryOverlay: { ...StyleSheet.absoluteFillObject },
    memoryContent: { position: 'absolute', bottom: 14, left: 14, right: 14 },
    memoryTitle: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 2 },
    memoryDate: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },

    placeholderPlant: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
    emptyMemories: { width: '100%', paddingVertical: 40, alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20, paddingHorizontal: 40 },
});
