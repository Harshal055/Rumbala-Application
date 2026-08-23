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
import { generateAIDare } from '../../src/services/aiDareService';
import { getOfferings, purchasePackage, getCustomerInfo, getProEntitlementDetails } from '../../src/services/revenueCatService';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens, brandGradient } from '../../src/constants/glass';


const BG_COLORS = ['#FFFAF0', '#FFE4E1', '#E6E6FA']; // Soft, elegant base for glass

const VIBES = [
    { key: 'all', label: 'All', color: '#FF6B35', premium: false },
    { key: 'fun', label: 'Fun', color: '#FF9800', premium: false },
    { key: 'romantic', label: 'Romantic', color: '#FF1493', premium: true },
    { key: 'spicy', label: 'Spicy', color: '#EF4444', premium: true },
    { key: 'ldr', label: 'LDR', color: '#8B5CF6', premium: true },
] as const;

// One-line description shown under the filters so users know what they're picking
const VIBE_INFO: Record<string, string> = {
    all: 'A mix of everything — fun, romantic and spicy.',
    fun: 'Silly, playful challenges to make you both laugh.',
    romantic: 'Sweet, heartfelt moments to feel closer.',
    spicy: 'Flirty dares that heat up: Seductive → Steamy → Extreme.',
    ldr: 'Long-distance dares by text, voice, photo and video call.',
};

const INTENSITY_LABEL: Record<number, string> = { 1: 'Seductive', 2: 'Steamy', 3: 'Extreme' };

// Steps shown in the "How to Play" help modal
const HOW_TO_PLAY = [
    { icon: 'heart', text: 'Tap the heart to draw a dare card.' },
    { icon: 'color-filter', text: 'Pick a vibe — Fun, Romantic, Spicy or LDR — to set the mood.' },
    { icon: 'flame', text: 'In Spicy, choose your heat: Seductive, Steamy or Extreme. It builds up slowly.' },
    { icon: 'checkmark-circle', text: 'Do the dare, then tap Done to earn points — or Skip if you\'d rather pass.' },
    { icon: 'happy', text: 'Golden rule: either partner can pass anytime. Consent keeps it fun.' },
];

export default function TabHomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const {
        partner1, partner2, cardCount,
        lastFreeClaimDate, claimWeeklyFree, hydrate,
        selectedVibe, setSelectedVibe, selectedIntensity, setSelectedIntensity,
        scores, addPoint, addHistoryEntry,
        isPro, lastPaywallShown, setLastPaywallShown, showAlert,
        drawCard, activeCustomCard, setActiveCustomCard, streak, updateStreak, syncWithSupabase,
        hasHydrated, remoteConfigs,
        gender, relationshipStatus, appPurpose
    } = useStore(useShallow((state: any) => ({
        partner1: state.partner1,
        partner2: state.partner2,
        cardCount: state.cardCount,
        lastFreeClaimDate: state.lastFreeClaimDate,
        claimWeeklyFree: state.claimWeeklyFree,
        hydrate: state.hydrate,
        selectedVibe: state.selectedVibe,
        setSelectedVibe: state.setSelectedVibe,
        selectedIntensity: state.selectedIntensity,
        setSelectedIntensity: state.setSelectedIntensity,
        scores: state.scores,
        addPoint: state.addPoint,
        addHistoryEntry: state.addHistoryEntry,
        isPro: state.isPro,
        lastPaywallShown: state.lastPaywallShown,
        setLastPaywallShown: state.setLastPaywallShown,
        showAlert: state.showAlert,
        drawCard: state.drawCard,
        activeCustomCard: state.activeCustomCard,
        setActiveCustomCard: state.setActiveCustomCard,
        streak: state.streak,
        updateStreak: state.updateStreak,
        syncWithSupabase: state.syncWithSupabase,
        hasHydrated: state.hasHydrated,
        remoteConfigs: state.remoteConfigs,
        gender: state.gender,
        relationshipStatus: state.relationshipStatus,
        appPurpose: state.appPurpose,
    })));

    const [currentCard, setCurrentCard] = useState<DareCard | null>(null);

    useEffect(() => {
        if (activeCustomCard) {
            setCurrentCard(activeCustomCard);
            setIsFlipped(false);
            setActiveCustomCard(null);
        }
    }, [activeCustomCard]);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [cardsPlayed, setCardsPlayed] = useState(0);
    const [showCamera, setShowCamera] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [hintRevealed, setHintRevealed] = useState(false);
    const confettiRef = useRef<LottieView>(null);

    // Animations
    const pulseScale = useSharedValue(1);
    const pointsY = useSharedValue(20);
    const pointsO = useSharedValue(0);
    const glowO = useSharedValue(0.3);

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
            const store = useStore.getState();
            const now = Date.now();
            const lastSync = (store as any)._lastSyncTs || 0;
            if (now - lastSync > 60000) {
                (store as any)._lastSyncTs = now;
                store.syncWithSupabase();
            }
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

    // Free, unlimited AI dare generation — used when a user runs out of cards.
    // The dare is generated server-side (Groq) and saved to ai_dares; on any
    // failure generateAIDare falls back to local templates so it always works.
    const handleAiDare = async () => {
        if (aiGenerating) return;
        setAiGenerating(true);
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            const dare = await generateAIDare({
                vibe: (selectedVibe as any) || 'spicy',
                intensity: selectedIntensity || 2,
                partner1: partner1 || 'Partner 1',
                partner2: partner2 || 'Partner 2',
            });
            setCurrentCard(dare);
            setIsFlipped(false);
            setCardsPlayed(p => p + 1);
            setHintRevealed(false);
            useStore.getState().updateStreak();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } catch (e) {
            showAlert('AI Unavailable', 'Could not generate a dare right now. Please try again in a moment.');
        } finally {
            setAiGenerating(false);
        }
    };

    const handleDrawCard = async () => {
        const store = useStore.getState();

        if (!store.isPro && store.cardCount <= 0 && store.isAuthenticated) {
            await store.syncWithSupabase();
        }

        if (cardsPlayed > 0 && cardsPlayed % 5 === 0) {
            showAlert('Having Fun?', 'Share your rumble vibe with friends!', [
                { text: 'Keep Playing', style: 'cancel' },
                { text: 'Share', onPress: () => router.push('/(tabs)/history') }
            ]);
        }

        // Out of cards check ONLY applies to non-Pro users!
        if (!store.isPro && store.cardCount <= 0) {
            showAlert('Out of Dares!', 'You\'ve played all your current cards. Generate a fresh one with AI for free, reload from the shop, or upgrade to Pro!', [
                { text: '✨ Generate with AI', onPress: () => handleAiDare() },
                { text: 'Go to Shop', onPress: () => router.push('/(tabs)/shop') },
                { text: 'Not right now', style: 'cancel' }
            ]);
            return;
        }

        let drawn = store.drawCard(selectedVibe);
        if (!drawn) {
            drawn = store.drawCard(null);
        }

        if (!drawn) {
            if (!store.isPro) {
                showAlert('Out of Dares!', 'You\'ve played all your current cards. Generate a fresh one with AI for free, or reload from the shop.', [
                    { text: '✨ Generate with AI', onPress: () => handleAiDare() },
                    { text: 'Go to Shop', onPress: () => router.push('/(tabs)/shop') },
                    { text: 'Not right now', style: 'cancel' }
                ]);
            } else {
                showAlert('Cards Loading', 'Deck is refreshing. Please tap Draw again.');
            }
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrentCard(drawn);
        setIsFlipped(false);
        setCardsPlayed(p => p + 1);
        setHintRevealed(false);
        store.updateStreak();
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
                setCurrentCard(null);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            };
            showAlert('Skip Dare?', 'Are you sure you want to skip this dare?', [
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
                const info = await getCustomerInfo();
                const proDetails = getProEntitlementDetails(info);
                const activePro = proDetails.isPro || Boolean(pkg?.isMock) || __DEV__;
                const store = useStore.getState();
                store.setIsPro(activePro, proDetails.expiresAt);
                if (activePro && store.userId) {
                    const api = await import('../../src/services/api');
                    api.syncProStatusToBackend(store.userId, true, proDetails.expiresAt).catch(() => {});
                }
                setShowPaywall(false);
                if (activePro) {
                    showAlert('🎉 Welcome to Pro!', 'You now have unlimited access.');
                } else {
                    showAlert('Purchase Pending', 'Your purchase is complete, but Pro is still syncing. Please reopen the app or tap Restore.');
                }
            } else if (result.error && result.error !== 'Purchase cancelled') {
                showAlert('Purchase Failed', result.error);
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

    const getRecommendation = () => {
        if (appPurpose === 'spice') {
            return {
                emoji: '🔥',
                badge: 'Spicy Goal',
                title: 'Sensual Heat & Dares',
                desc: 'Turn up the passion and intimate heat tonight.',
                action: () => {
                    setSelectedVibe('spicy');
                    setSelectedIntensity(2);
                    Haptics.selectionAsync();
                },
                cta: 'Play Spicy',
                color: '#F43F5E',
                gradient: ['rgba(244, 63, 94, 0.15)', 'rgba(249, 115, 22, 0.15)'] as const
            };
        } else if (appPurpose === 'deep') {
            return {
                emoji: '💬',
                badge: 'Connection Goal',
                title: 'Deep Heart-to-Heart',
                desc: 'Spark intimate discussions and deep bonding.',
                action: () => {
                    setSelectedVibe('romantic');
                    Haptics.selectionAsync();
                },
                cta: 'Explore',
                color: '#EC4899',
                gradient: ['rgba(236, 72, 153, 0.15)', 'rgba(168, 85, 247, 0.15)'] as const
            };
        } else if (appPurpose === 'ldr' || relationshipStatus === 'ldr') {
            return {
                emoji: '✈️',
                badge: 'LDR Mode',
                title: 'Long Distance Room',
                desc: 'Real-time dare sync & synced video calls.',
                action: () => {
                    Haptics.selectionAsync();
                    router.push('/(tabs)/ldr');
                },
                cta: 'Open LDR',
                color: '#3B82F6',
                gradient: ['rgba(59, 130, 246, 0.15)', 'rgba(99, 102, 241, 0.15)'] as const
            };
        } else if (appPurpose === 'fantasies') {
            return {
                emoji: '🚀',
                badge: 'Fantasy Goal',
                title: 'Explore New Desires',
                desc: 'Exciting dares to discover new sides together.',
                action: () => {
                    setSelectedVibe('spicy');
                    setSelectedIntensity(3);
                    Haptics.selectionAsync();
                },
                cta: 'Start Now',
                color: '#8B5CF6',
                gradient: ['rgba(139, 92, 246, 0.15)', 'rgba(236, 72, 153, 0.15)'] as const
            };
        } else {
            return {
                emoji: '✨',
                badge: 'Fun & Party',
                title: 'Playful Laughter & Games',
                desc: 'Lighthearted dares made for smiling together.',
                action: () => {
                    setSelectedVibe('fun');
                    Haptics.selectionAsync();
                },
                cta: 'Play Fun',
                color: '#10B981',
                gradient: ['rgba(16, 185, 129, 0.15)', 'rgba(245, 158, 11, 0.15)'] as const
            };
        }
    };

    const recommendation = getRecommendation();

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
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <TouchableOpacity
                            style={[styles.helpBtn, glassStyles.container]}
                            activeOpacity={0.8}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setShowHelp(true);
                            }}
                        >
                            <Ionicons name="help-circle-outline" size={20} color="#1a1a1a" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.cardPill, isPro && styles.proCardPill, !isPro && glassStyles.container]}
                            activeOpacity={0.8}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/(tabs)/shop');
                            }}
                        >
                            <Ionicons name={isPro ? "diamond" : "bag-handle-outline"} size={14} color={isPro ? "#FF66B2" : "#1a1a1a"} />
                            <Text style={[styles.cardPillText, isPro && styles.proCardPillText]}>
                                {isPro ? 'Pro Active' : `${cardCount} cards`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* ── Streak Teaser ── */}
                {!currentCard && streak > 0 && (
                    <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.streakTeaserWrap}>
                        <TouchableOpacity
                            style={[styles.streakTeaser, glassStyles.container]}
                            activeOpacity={0.8}
                            onPress={() => router.push('/(tabs)/daily')}
                        >
                            <Text style={styles.streakTeaserText}>🔥 {streak}-day love streak — answer today's question</Text>
                            <Ionicons name="chevron-forward" size={14} color="#FF6B35" />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* ── Smart Recommendation Banner ── */}
                {!currentCard && (
                    <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.recommendationWrap}>
                        <LinearGradient
                            colors={recommendation.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.recommendationCard, glassStyles.container]}
                        >
                            <View style={styles.recIconWrap}>
                                <Text style={styles.recEmoji}>{recommendation.emoji}</Text>
                            </View>
                            <View style={styles.recContent}>
                                <View style={styles.recBadgeRow}>
                                    <View style={[styles.recBadge, { backgroundColor: recommendation.color }]}>
                                        <Text style={styles.recBadgeText}>{recommendation.badge}</Text>
                                    </View>
                                    <Text style={styles.recHint}>Recommended</Text>
                                </View>
                                <Text style={styles.recTitle}>{recommendation.title}</Text>
                                <Text style={styles.recDesc} numberOfLines={1}>{recommendation.desc}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.recBtn, { backgroundColor: recommendation.color }]}
                                onPress={recommendation.action}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.recBtnText}>{recommendation.cta}</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* ── Quick Discovery Row (AI Studio & Quiz Mode) ── */}
                {!currentCard && (
                    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.quickFeaturesRow}>
                        <TouchableOpacity
                            style={[styles.quickFeatureTile, glassStyles.container]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/ai-generator');
                            }}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['rgba(255, 107, 53, 0.12)', 'rgba(236, 72, 153, 0.08)']}
                                style={styles.quickFeatureGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.quickFeatureEmoji}>✨</Text>
                                <View style={styles.quickFeatureTextWrap}>
                                    <Text style={styles.quickFeatureTitle}>AI Dare Studio</Text>
                                    <Text style={styles.quickFeatureSub}>Custom dares</Text>
                                </View>
                                <Ionicons name="sparkles" size={14} color="#FF6B35" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickFeatureTile, glassStyles.container]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/quiz');
                            }}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['rgba(99, 102, 241, 0.12)', 'rgba(236, 72, 153, 0.08)']}
                                style={styles.quickFeatureGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.quickFeatureEmoji}>💑</Text>
                                <View style={styles.quickFeatureTextWrap}>
                                    <Text style={styles.quickFeatureTitle}>Couples Quiz</Text>
                                    <Text style={styles.quickFeatureSub}>Test harmony</Text>
                                </View>
                                <Ionicons name="heart" size={14} color="#EC4899" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}

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
                                <View style={[styles.drawCircle, glassStyles.container, { borderRadius: 140, overflow: 'hidden' }]}>
                                    <LinearGradient colors={brandGradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                                    <View style={styles.drawInner}>
                                        <Ionicons name="heart" size={48} color="#fff" />
                                        <Text style={[styles.drawLabel, { color: '#fff' }]}>Draw Card</Text>
                                        <Text style={[styles.drawSub, { color: 'rgba(255,255,255,0.85)' }]}>Tap to play</Text>
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

                {/* 🌈 Bottom Section 🌈 */}
                {!currentCard && (
                    <Animated.View
                        entering={FadeInDown.delay(400).duration(600)}
                        renderToHardwareTextureAndroid={Platform.OS === 'android'}
                        style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 8) + 88 }]}
                    >
                        {/* Vibe Filters */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
                            {VIBES.filter(v => v.key !== 'spicy' || (remoteConfigs?.feature_flags?.spicy_category ?? true)).map(({ key, label, color, premium }) => {
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

                        {/* Vibe description — helps users understand each mode */}
                        <Text style={styles.vibeInfo}>{VIBE_INFO[activeVibeKey]}</Text>

                        {/* Intensity Selector — Only visible in Spicy mode */}
                        {activeVibeKey === 'spicy' && (
                        <View style={styles.intensityContainer}>
                            <Text style={styles.intensityLabel}>
                                Spicy Intensity — Level {selectedIntensity} of 3: {INTENSITY_LABEL[selectedIntensity]}
                            </Text>
                            <View style={styles.intensityRow}>
                                {[
                                    { level: 1, label: 'Seductive 😏', color: '#FF9800' },
                                    { level: 2, label: 'Steamy 🔥', color: '#F44336' },
                                    { level: 3, label: 'Extreme 🥵', color: '#9C27B0' }
                                ].map((item) => (
                                    <TouchableOpacity 
                                        key={item.level} 
                                        style={[
                                            styles.intensityBtn, 
                                            selectedIntensity === item.level && { backgroundColor: item.color, borderColor: item.color }
                                        ]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSelectedIntensity(item.level);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[
                                            styles.intensityBtnText,
                                            selectedIntensity === item.level && { color: '#fff' }
                                        ]}>{item.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        )}
                    </Animated.View>
                )}

                {/* ── How to Play Modal ── */}
                <Modal visible={showHelp} transparent animationType="fade" onRequestClose={() => setShowHelp(false)}>
                    <View style={styles.overlay}>
                        <View style={[styles.modalCard, glassStyles.container]}>
                            <View style={styles.modalIconWrap}>
                                <Ionicons name="sparkles" size={26} color="#FF6B35" />
                            </View>
                            <Text style={styles.modalTitle}>How to Play</Text>
                            <Text style={styles.modalSub}>Draw, dare, connect. Here's the quick version:</Text>
                            {HOW_TO_PLAY.map((step, i) => (
                                <View key={i} style={styles.helpRow}>
                                    <Ionicons name={step.icon as any} size={18} color="#FF6B35" style={{ marginTop: 1 }} />
                                    <Text style={styles.helpText}>{step.text}</Text>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.helpCloseBtn} onPress={() => setShowHelp(false)} activeOpacity={0.85}>
                                <LinearGradient colors={brandGradient} style={styles.helpCloseGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    <Text style={styles.actionTextLight}>Got it 💕</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

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
        letterSpacing: 0.5,
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
    helpBtn: {
        width: 38, height: 38, borderRadius: 19,
        justifyContent: 'center', alignItems: 'center',
    },

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

    // ── Streak Teaser ──
    streakTeaserWrap: { paddingHorizontal: 16, marginTop: 8 },
    streakTeaser: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
        paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20,
    },
    streakTeaserText: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },

    // ── Card ──
    cardWrapper: { alignItems: 'center', justifyContent: 'center', width: '100%' },
    actionRow: {
        flexDirection: 'row', marginTop: 14, gap: 12, justifyContent: 'center',
    },
    actionBtn: {
        borderRadius: 16, overflow: 'hidden',
        shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1, shadowRadius: 6, elevation: 0,
    },
    actionGradient: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 11, paddingHorizontal: 22,
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
        paddingHorizontal: 11, paddingVertical: 10,
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

    // Vibe description line
    vibeInfo: {
        fontSize: 12.5, color: '#777', fontWeight: '600', textAlign: 'center',
        marginTop: 10, paddingHorizontal: 24, lineHeight: 18,
    },

    // Help modal rows
    helpRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        width: '100%', marginBottom: 12, paddingHorizontal: 4,
    },
    helpText: { flex: 1, fontSize: 13.5, color: '#333', lineHeight: 19, fontWeight: '500' },
    helpCloseBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginTop: 8 },
    helpCloseGradient: { paddingVertical: 14, alignItems: 'center' },

    // Intensity Selector
    intensityContainer: { marginTop: 16, paddingHorizontal: 20 },
    intensityLabel: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
    intensityRow: { flexDirection: 'row', justifyContent: 'space-between' },
    intensityBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', marginHorizontal: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
    intensityBtnText: { fontSize: 14, fontWeight: '600', color: '#555', fontFamily: 'Inter_600SemiBold' },

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

    // Recommendation Banner
    recommendationWrap: { paddingHorizontal: 20, marginTop: 10, marginBottom: 2 },
    recommendationCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' },
    recIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    recEmoji: { fontSize: 22 },
    recContent: { flex: 1, marginRight: 10 },
    recBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    recBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    recBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
    recHint: { fontSize: 10, color: '#888', fontWeight: '600' },
    recTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a1a', marginBottom: 2 },
    recDesc: { fontSize: 11.5, color: '#666', fontWeight: '500' },
    recBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    recBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

    // Quick Discovery Row
    quickFeaturesRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 8, marginBottom: 4 },
    quickFeatureTile: { flex: 1, borderRadius: 18, overflow: 'hidden' },
    quickFeatureGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, gap: 8 },
    quickFeatureEmoji: { fontSize: 20 },
    quickFeatureTextWrap: { flex: 1 },
    quickFeatureTitle: { fontSize: 12.5, fontWeight: '800', color: '#1A1A2E' },
    quickFeatureSub: { fontSize: 10.5, color: '#6B7280', fontWeight: '500' },
});
