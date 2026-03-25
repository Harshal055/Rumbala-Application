import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';

const { width } = Dimensions.get('window');

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
    }, [userId]);

    const totalPoints = (scores.partner1 || 0) + (scores.partner2 || 0);
    const togetherSince = history.length > 0 
        ? new Date(history[history.length - 1].date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'JOINED RECENTLY';

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
                                <View style={[styles.avatarCircle, { backgroundColor: '#FF6B35' }]}>
                                    <Text style={styles.avatarInitial}>{partner1?.[0] || 'P'}</Text>
                                </View>
                                <View style={[styles.avatarCircle, styles.avatarOverlap, { backgroundColor: '#2D1B69' }]}>
                                    <Text style={styles.avatarInitial}>{partner2?.[0] || 'P'}</Text>
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
                            <Text style={styles.sinceText}>TOGETHER SINCE {togetherSince.toUpperCase()}</Text>
                        </View>
                    </Animated.View>

                    {/* Stats Row */}
                    <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.statsRow}>
                        <View style={[styles.statCard, glassStyles.container]}>
                            <View style={styles.statHeader}>
                                <Text style={styles.statLabel}>RUMBLE{"\n"}POINTS</Text>
                                <View style={styles.statIconBox}>
                                    <Ionicons name="diamond" size={20} color="#FF6B35" />
                                </View>
                            </View>
                            <Text style={styles.statValue}>{totalPoints.toLocaleString()}</Text>
                            <Text style={styles.statTrend}>{totalPoints > 0 ? '✨ Keep shining!' : '🎁 Start playing!'}</Text>
                        </View>

                        <View style={[styles.statCard, glassStyles.container]}>
                            <View style={styles.statHeader}>
                                <Text style={styles.statLabel}>MEMORIES</Text>
                                <View style={styles.statIconBox}>
                                    <Ionicons name="camera" size={20} color="#FF6B35" />
                                </View>
                            </View>
                            <Text style={styles.statValue}>{history.length}</Text>
                            <Text style={styles.statTrendGreen}>📸 {history.length > 0 ? 'Total Dares' : 'Capture vibes'}</Text>
                        </View>
                    </Animated.View>

                    {/* Memories Section */}
                    <View style={styles.memoriesHeader}>
                        <Text style={styles.sectionTitle}>Our Memories</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                            <Text style={styles.seeAll}>See All <Ionicons name="chevron-forward" size={12} /></Text>
                        </TouchableOpacity>
                    </View>

                    <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.grid}>
                        {history.length > 0 ? (
                            history.slice(0, 4).map((entry, idx) => (
                                <TouchableOpacity key={entry.id} style={[styles.memoryItem, glassStyles.container]}>
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
    avatarContainer: { position: 'relative', marginBottom: 20 },
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
        position: 'absolute', bottom: -5, right: '35%',
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

    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginBottom: 40 },
    statCard: {
        flex: 1, padding: 20, borderRadius: 24,
    },
    statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    statLabel: { fontSize: 12, fontWeight: '800', color: '#444', letterSpacing: 0.5, lineHeight: 16 },
    statIconBox: { width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 32, fontWeight: '900', color: '#1a1a1a', marginTop: 15 },
    statTrend: { fontSize: 12, fontWeight: '700', color: '#10B981', marginTop: 8 },
    statTrendGreen: { fontSize: 12, fontWeight: '700', color: '#10B981', marginTop: 8 },

    memoriesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
    sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.5 },
    seeAll: { fontSize: 14, fontWeight: '700', color: '#FF6B35' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
    memoryItem: {
        width: (width - 52) / 2, height: 220,
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
