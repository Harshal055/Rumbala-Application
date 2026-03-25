import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles } from '../../src/constants/glass';

const { width } = Dimensions.get('window');

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
                                        <Image source={{ uri: entry.proofUri }} style={styles.proofImage} />
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
