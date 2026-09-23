import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Share,
    StatusBar,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '../src/store/useStore';
import { getFavoriteDares, removeFavoriteDare } from '../src/services/api';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles } from '../src/constants/glass';

const BG_COLORS = ['#FFF5F5', '#FFF0F5', '#F5F5FF'];

interface FavoriteItem {
    id: string;
    text: string;
    type?: string;
    vibe?: string;
    intensity?: number;
    source?: string;
    created_at: string;
}

const VIBE_FILTERS = [
    { key: 'all', label: 'All', emoji: '✨' },
    { key: 'spicy', label: 'Spicy', emoji: '🌶️' },
    { key: 'romantic', label: 'Romantic', emoji: '💖' },
    { key: 'fun', label: 'Fun', emoji: '🎈' },
    { key: 'ldr', label: 'LDR', emoji: '✈️' },
];

const VIBE_COLORS: Record<string, [string, string]> = {
    spicy: ['#FF416C', '#FF4B2B'],
    romantic: ['#FF6B8B', '#FF8E53'],
    fun: ['#4FACFE', '#00F2FE'],
    ldr: ['#667EEA', '#764BA2'],
    default: ['#FF6B35', '#FF8E53'],
};

export default function FavoritesScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const userId = useStore(state => state.userId);
    const showAlert = useStore(state => state.showAlert);
    const setActiveCustomCard = useStore(state => state.setActiveCustomCard);

    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadFavorites = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            const data = await getFavoriteDares(userId);
            setFavorites(data || []);
        } catch (e: any) {
            console.warn('Failed to load favorites:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => {
        loadFavorites();
    }, [loadFavorites]);

    const onRefresh = () => {
        setRefreshing(true);
        loadFavorites();
    };

    const handlePlayDare = (item: FavoriteItem) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const validTypes = ['fun', 'romantic', 'spicy', 'ldr'] as const;
        type ValidType = typeof validTypes[number];

        const cardType: ValidType = validTypes.includes(item.type as ValidType)
            ? (item.type as ValidType)
            : validTypes.includes(item.vibe as ValidType)
            ? (item.vibe as ValidType)
            : 'romantic';

        const cardVibe: ValidType | undefined = validTypes.includes(item.vibe as ValidType)
            ? (item.vibe as ValidType)
            : undefined;

        setActiveCustomCard({
            id: item.id,
            text: item.text,
            type: cardType,
            vibe: cardVibe,
            intensity: item.intensity || 1,
        });
        showAlert('Dare Loaded! 🎮', 'Your favorite dare is ready to play on the home screen.', [
            { text: 'Play Now', onPress: () => router.replace('/(tabs)') },
        ]);
    };

    const handleShare = async (text: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            await Share.share({
                message: `🔥 Rumbala Couple Dare:\n\n"${text}"\n\nDare your partner on Rumbala!`,
            });
        } catch {}
    };

    const handleDelete = (item: FavoriteItem) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        showAlert('Remove Favorite', 'Are you sure you want to remove this dare from your favorites?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    setDeletingId(item.id);
                    try {
                        await removeFavoriteDare(item.id);
                        setFavorites(prev => prev.filter(f => f.id !== item.id));
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } catch (e) {
                        showAlert('Error', 'Could not remove dare. Please try again.');
                    } finally {
                        setDeletingId(null);
                    }
                },
            },
        ]);
    };

    const filteredFavorites = favorites.filter(item => {
        if (activeFilter === 'all') return true;
        const vibe = (item.vibe || item.type || '').toLowerCase();
        return vibe.includes(activeFilter);
    });

    const formatDate = (isoString: string) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return '';
        }
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
                <StatusBar barStyle="dark-content" />

                {/* ── Header ── */}
                <View style={[styles.header, glassStyles.header]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
                    </TouchableOpacity>

                    <View style={styles.headerTitleWrap}>
                        <Text style={styles.headerTitle}>Saved Dares ❤️</Text>
                        <Text style={styles.headerSub}>
                            {favorites.length} {favorites.length === 1 ? 'favorite' : 'favorites'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={onRefresh}
                        style={styles.actionBtn}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="refresh-outline" size={20} color="#FF6B35" />
                    </TouchableOpacity>
                </View>

                {/* ── Vibe Filter Chips ── */}
                <View style={styles.filterRow}>
                    {VIBE_FILTERS.map(filter => {
                        const active = activeFilter === filter.key;
                        return (
                            <TouchableOpacity
                                key={filter.key}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setActiveFilter(filter.key);
                                }}
                                style={[styles.filterChip, active && styles.filterChipActive]}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.filterEmoji}>{filter.emoji}</Text>
                                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── Main Content ── */}
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#FF6B35" />
                        <Text style={styles.loadingText}>Loading your favorites...</Text>
                    </View>
                ) : !userId ? (
                    <View style={styles.centerContainer}>
                        <Ionicons name="lock-closed-outline" size={48} color="#FF6B35" />
                        <Text style={styles.emptyTitle}>Sign In Required</Text>
                        <Text style={styles.emptySub}>
                            Log in to view and manage your saved couple dares across devices.
                        </Text>
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => router.push('/login')}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.primaryBtnText}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                ) : filteredFavorites.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="heart-dislike-outline" size={42} color="#FF6B35" />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {activeFilter === 'all' ? 'No Saved Dares Yet' : `No ${activeFilter} Dares Saved`}
                        </Text>
                        <Text style={styles.emptySub}>
                            When you generate dares with AI or find cards you love, tap the heart icon to save them here!
                        </Text>
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => router.push('/ai-generator')}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#FF6B35', '#FF8E53']}
                                style={styles.btnGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="sparkles" size={16} color="#fff" />
                                <Text style={styles.primaryBtnText}>Open AI Dare Studio</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={filteredFavorites}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
                        }
                        renderItem={({ item, index }) => {
                            const vibe = (item.vibe || item.type || 'romantic').toLowerCase();
                            const colors = VIBE_COLORS[vibe] || VIBE_COLORS.default;
                            const isDeleting = deletingId === item.id;

                            return (
                                <Animated.View
                                    entering={FadeInDown.delay(index * 60).duration(400)}
                                    style={[styles.card, glassStyles.container]}
                                >
                                    {/* Top meta row */}
                                    <View style={styles.cardHeader}>
                                        <LinearGradient
                                            colors={colors}
                                            style={styles.vibeBadge}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={styles.vibeBadgeText}>
                                                {item.vibe ? item.vibe.toUpperCase() : 'DARE'}
                                            </Text>
                                        </LinearGradient>

                                        {item.source === 'ai' && (
                                            <View style={styles.aiTag}>
                                                <Ionicons name="sparkles" size={11} color="#FF6B35" />
                                                <Text style={styles.aiTagText}>AI Created</Text>
                                            </View>
                                        )}

                                        <View style={{ flex: 1 }} />

                                        {item.created_at && (
                                            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                                        )}
                                    </View>

                                    {/* Dare text */}
                                    <Text style={styles.dareText}>{item.text}</Text>

                                    {/* Action Bar */}
                                    <View style={styles.cardActions}>
                                        <TouchableOpacity
                                            style={styles.playBtn}
                                            onPress={() => handlePlayDare(item)}
                                            activeOpacity={0.85}
                                        >
                                            <LinearGradient
                                                colors={['#FF6B35', '#FF8E53']}
                                                style={styles.playBtnGradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            >
                                                <Ionicons name="play" size={14} color="#FFFFFF" />
                                                <Text style={styles.playBtnText}>Play Dare</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.iconActionBtn}
                                            onPress={() => handleShare(item.text)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="share-outline" size={18} color="#666" />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.iconActionBtn}
                                            onPress={() => handleDelete(item)}
                                            disabled={isDeleting}
                                            activeOpacity={0.7}
                                        >
                                            {isDeleting ? (
                                                <ActivityIndicator size="small" color="#FF3B30" />
                                            ) : (
                                                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </Animated.View>
                            );
                        }}
                    />
                )}
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
    },
    headerTitleWrap: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A2E',
    },
    headerSub: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
        marginTop: 1,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        justifyContent: 'center',
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.06)',
        gap: 4,
    },
    filterChipActive: {
        backgroundColor: '#FF6B35',
        borderColor: '#FF6B35',
    },
    filterEmoji: {
        fontSize: 13,
    },
    filterLabel: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#4B5563',
    },
    filterLabelActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 14,
    },
    card: {
        padding: 18,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    vibeBadge: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
    },
    vibeBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    aiTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
    },
    aiTagText: {
        color: '#FF6B35',
        fontSize: 10,
        fontWeight: '700',
    },
    dateText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    dareText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#1A1A2E',
        fontWeight: '600',
        marginBottom: 16,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
        paddingTop: 12,
    },
    playBtn: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    playBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    playBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    iconActionBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 36,
        marginTop: 40,
    },
    emptyIconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A1A2E',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySub: {
        fontSize: 14,
        lineHeight: 20,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    loadingText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 12,
        fontWeight: '500',
    },
    primaryBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        minWidth: 200,
    },
    btnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
});
