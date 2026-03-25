import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
    Modal, Dimensions, StatusBar, Platform
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

const { width } = Dimensions.get('window');

const BG_COLORS = ['#FFFAF0', '#FFE4E1', '#E6E6FA']; // Soft, elegant base for glass

const VIBES = [
    { key: 'all', label: 'All', color: '#FF6B35' },
    { key: 'fun', label: 'Fun', color: '#FF9800' },
    { key: 'romantic', label: 'Romantic', color: '#FF1493' },
    { key: 'spicy', label: 'Spicy', color: '#EF4444' },
    { key: 'ldr', label: 'LDR', color: '#8B5CF6' },
] as const;

export default function TabHomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        partner1, partner2, cardCount,
        lastFreeClaimDate, claimWeeklyFree, hydrate,
        selectedVibe, setSelectedVibe, scores, addPoint, addHistoryEntry,
        isPro, lastPaywallShown, setLastPaywallShown, showAlert,
        drawCard, updateStreak, syncWithSupabase
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
    }, [isPro, lastPaywallShown]);
    
    useFocusEffect(
        React.useCallback(() => {
            useStore.getState().syncWithSupabase();
        }, [])
    );

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
                            <Card card={currentCard} isFlipped={isFlipped} onFlip={() => setIsFlipped(true)} />
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
                            {VIBES.map(({ key, label, color }) => {
                                const active = activeVibeKey === key;
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
                                            if (key === 'ldr') {
                                                router.push('/(tabs)/ldr');
                                            } else {
                                                setSelectedVibe(key === 'all' ? null : key);
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.pillImage, { backgroundColor: color, borderRadius: 11 }]} />
                                        <Text style={[styles.pillText, active && { color }]}>{label}</Text>
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
