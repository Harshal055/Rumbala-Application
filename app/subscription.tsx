import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, StatusBar, useWindowDimensions, Platform } from 'react-native';
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
    withDelay,
    interpolate,
    Extrapolation,
    FadeInDown,
    FadeInUp,
    Easing,
} from 'react-native-reanimated';
import { useStore } from '../src/store/useStore';
import { getOfferings, purchasePackage, restorePurchases, checkProEntitlement, getCustomerInfo } from '../src/services/revenueCatService';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles } from '../src/constants/glass';
import { resolvePlanPackages, inferPeriodLabel, PAYWALL_FEATURES } from '../src/constants/pricing';


const FALLBACK_ANNUAL = { title: 'Annual Pro', price: '₹999/year', trialText: '3 days free, then ₹999/yr' };
const FALLBACK_MONTHLY = { title: 'Monthly Pro', price: '₹99/month', trialText: '3 days free, then ₹99/mo' };
const BG_COLORS = ['#06000A', '#150820', '#0A0414'];

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

    const crownFloat = useSharedValue(0);
    const glowPulse = useSharedValue(0);
    const ctaPulse = useSharedValue(0);
    const ringRotate = useSharedValue(0);

    useEffect(() => {
        crownFloat.value = withRepeat(
            withSequence(
                withTiming(-12, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) })
            ),
            -1, true
        );
        glowPulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1, true
        );
        ctaPulse.value = withRepeat(
            withSequence(
                withDelay(3000, withTiming(1, { duration: 600 })),
                withTiming(0, { duration: 600 })
            ),
            -1, true
        );
        ringRotate.value = withRepeat(
            withTiming(360, { duration: 12000, easing: Easing.linear }),
            -1, false
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

    const crownStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: crownFloat.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: interpolate(glowPulse.value, [0, 1], [0.15, 0.45], Extrapolation.CLAMP),
        transform: [{ scale: interpolate(glowPulse.value, [0, 1], [0.85, 1.15], Extrapolation.CLAMP) }],
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${ringRotate.value}deg` }],
    }));

    const ctaGlowStyle = useAnimatedStyle(() => ({
        opacity: interpolate(ctaPulse.value, [0, 1], [0, 0.5], Extrapolation.CLAMP),
        transform: [{ scale: interpolate(ctaPulse.value, [0, 1], [0.95, 1.08], Extrapolation.CLAMP) }],
    }));

    const handleSelectPlan = (plan: 'monthly' | 'annual') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedPlan(plan);
    };

    const btnScale = useSharedValue(1);
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

    const featureIconColors: Record<string, string[]> = {
        'infinite': ['#A855F7', '#7C3AED'],
        'videocam': ['#EC4899', '#DB2777'],
        'flame': ['#F97316', '#EF4444'],
        'color-palette': ['#06B6D4', '#3B82F6'],
    };

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top']}>
                <StatusBar barStyle="light-content" />
                
                {/* Header */}
                <View style={[styles.header, { top: insets.top + 8 }]}>
                    <TouchableOpacity onPress={handleSkip} style={styles.closeBtn}>
                        <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    
                    {/* Hero */}
                    <Animated.View entering={FadeInDown.duration(700).springify()} style={styles.heroWrap}>
                        {/* Outer glow */}
                        <Animated.View style={[styles.heroGlow, glowStyle]} />
                        {/* Rotating ring */}
                        <Animated.View style={[styles.heroRing, ringStyle]}>
                            <LinearGradient
                                colors={['#A855F7', '#EC4899', '#F97316', '#A855F7']}
                                style={styles.heroRingGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                        </Animated.View>
                        {/* Crown icon */}
                        <Animated.View style={[styles.heroIconWrap, crownStyle]}>
                            <LinearGradient
                                colors={['#A855F7', '#EC4899']}
                                style={styles.heroIconBg}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="diamond" size={36} color="#fff" />
                            </LinearGradient>
                        </Animated.View>
                    </Animated.View>

                    {/* Title */}
                    <Animated.View entering={FadeInDown.delay(80).duration(600).springify()} style={styles.titleWrap}>
                        <Text style={styles.title}>Unlock Premium</Text>
                        <Text style={styles.subtitle}>
                            Get absolute unlimited access to all features, dares, and exclusive LDR video calls.
                        </Text>
                    </Animated.View>

                    {/* Horizontal Feature Strip */}
                    <Animated.View entering={FadeInDown.delay(150).duration(600).springify()} style={styles.featureStrip}>
                        {PAYWALL_FEATURES.map((f, i) => {
                            const colors = featureIconColors[f.icon] || ['#A855F7', '#7C3AED'];
                            return (
                                <View key={f.id} style={styles.featureChip}>
                                    <LinearGradient
                                        colors={colors as unknown as readonly [string, string, ...string[]]}
                                        style={styles.featureChipIcon}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Ionicons name={f.icon as any} size={16} color="#fff" />
                                    </LinearGradient>
                                    <View style={styles.featureChipText}>
                                        <Text style={styles.featureChipTitle}>{f.title}</Text>
                                        <Text style={styles.featureChipDesc}>{f.desc}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </Animated.View>

                    {/* Plan Cards */}
                    <Animated.View entering={FadeInUp.delay(250).duration(600).springify()} style={styles.plansWrap}>

                        {/* Annual Plan */}
                        <TouchableOpacity
                            style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
                            activeOpacity={0.85}
                            onPress={() => handleSelectPlan('annual')}
                        >
                            {/* Background gradient on selection */}
                            {selectedPlan === 'annual' && (
                                <LinearGradient
                                    colors={['rgba(168,85,247,0.12)', 'rgba(236,72,153,0.06)', 'transparent']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            )}
                            {/* Best Value badge */}
                            <View style={styles.saveBadge}>
                                <LinearGradient
                                    colors={['#A855F7', '#EC4899']}
                                    style={styles.saveBadgeGrad}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.saveBadgeText}>BEST VALUE</Text>
                                </LinearGradient>
                            </View>
                            <View style={styles.planRow}>
                                <View style={styles.planLeft}>
                                    <View style={[styles.radioOuter, selectedPlan === 'annual' && styles.radioOuterActive]}>
                                        {selectedPlan === 'annual' && (
                                            <LinearGradient
                                                colors={['#A855F7', '#EC4899']}
                                                style={styles.radioInner}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            />
                                        )}
                                    </View>
                                    <View style={styles.planTextWrap}>
                                        <Text style={styles.planName}>{annualInfo.title}</Text>
                                        <Text style={styles.planTrial}>{annualInfo.trialText}</Text>
                                    </View>
                                </View>
                                <View style={styles.planRight}>
                                    <Text style={styles.planPrice}>
                                        {annualInfo.price.split('/')[0]}
                                        <Text style={styles.planPeriod}>{annualSuffix}</Text>
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Monthly Plan */}
                        <TouchableOpacity
                            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
                            activeOpacity={0.85}
                            onPress={() => handleSelectPlan('monthly')}
                        >
                            {selectedPlan === 'monthly' && (
                                <LinearGradient
                                    colors={['rgba(168,85,247,0.12)', 'rgba(236,72,153,0.06)', 'transparent']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            )}
                            <View style={styles.planRow}>
                                <View style={styles.planLeft}>
                                    <View style={[styles.radioOuter, selectedPlan === 'monthly' && styles.radioOuterActive]}>
                                        {selectedPlan === 'monthly' && (
                                            <LinearGradient
                                                colors={['#A855F7', '#EC4899']}
                                                style={styles.radioInner}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            />
                                        )}
                                    </View>
                                    <View style={styles.planTextWrap}>
                                        <Text style={styles.planName}>{monthlyInfo.title}</Text>
                                        <Text style={styles.planTrial}>{monthlyInfo.trialText}</Text>
                                    </View>
                                </View>
                                <View style={styles.planRight}>
                                    <Text style={styles.planPrice}>
                                        {monthlyInfo.price.split('/')[0]}
                                        <Text style={styles.planPeriod}>{monthlySuffix}</Text>
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                    </Animated.View>

                    {/* Bottom spacer */}
                    <View style={{ height: 140 }} />

                </ScrollView>

                {/* Sticky Footer */}
                <Animated.View entering={FadeInUp.delay(400).duration(500)} style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <LinearGradient colors={['transparent', 'rgba(6,0,10,0.95)', '#06000A']} style={styles.footerGradient} />
                    
                    <View style={styles.footerContent}>
                        <TouchableOpacity
                            onPressIn={handleTrialPressIn}
                            onPressOut={handleTrialPressOut}
                            onPress={handleStartTrial}
                            disabled={isPurchasing}
                            activeOpacity={0.9}
                        >
                            <Animated.View style={styles.ctaBtnWrap}>
                                {/* Pulsing glow behind CTA */}
                                <Animated.View style={[styles.ctaGlow, ctaGlowStyle]} />
                                <Animated.View style={[styles.ctaBtn, { transform: [{ scale: btnScale }] }]}>
                                    <LinearGradient
                                        colors={['#A855F7', '#EC4899', '#F97316']}
                                        style={styles.ctaGrad}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {isPurchasing ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Text style={styles.ctaText}>Start Free Trial</Text>
                                                <View style={styles.ctaArrow}>
                                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                                </View>
                                            </>
                                        )}
                                    </LinearGradient>
                                </Animated.View>
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

    /* Header */
    header: { position: 'absolute', right: 16, zIndex: 100 },
    closeBtn: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center', alignItems: 'center',
    },

    scroll: { paddingHorizontal: 20, paddingTop: 50 },

    /* Hero */
    heroWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 28, height: 120 },
    heroGlow: {
        position: 'absolute', width: 160, height: 160, borderRadius: 80,
        backgroundColor: '#A855F7',
    },
    heroRing: {
        position: 'absolute', width: 110, height: 110, borderRadius: 55,
        justifyContent: 'center', alignItems: 'center',
    },
    heroRingGradient: {
        width: 110, height: 110, borderRadius: 55,
        opacity: 0.2,
    },
    heroIconWrap: { zIndex: 10 },
    heroIconBg: {
        width: 76, height: 76, borderRadius: 26,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 16,
    },

    /* Title */
    titleWrap: { alignItems: 'center', marginBottom: 28 },
    title: {
        fontSize: 34, fontFamily: 'Pacifico_400Regular',
        color: '#fff', marginBottom: 10,
    },
    subtitle: {
        fontSize: 15, color: 'rgba(255,255,255,0.55)',
        textAlign: 'center', lineHeight: 22, paddingHorizontal: 16,
    },

    /* Feature Strip */
    featureStrip: {
        flexDirection: 'row', flexWrap: 'wrap',
        gap: 10, marginBottom: 32,
        justifyContent: 'center',
    },
    featureChip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        width: '47%' as any,
    },
    featureChipIcon: {
        width: 32, height: 32, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 10,
    },
    featureChipText: { flex: 1 },
    featureChipTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 1 },
    featureChipDesc: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },

    /* Plans */
    plansWrap: { gap: 12 },

    planCard: {
        borderRadius: 20, overflow: 'hidden',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 18,
        position: 'relative',
    },
    planCardSelected: {
        borderColor: 'rgba(168,85,247,0.5)',
        backgroundColor: 'rgba(168,85,247,0.04)',
    },

    saveBadge: {
        position: 'absolute', top: -1, right: 20,
        borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
        overflow: 'hidden',
    },
    saveBadgeGrad: {
        paddingHorizontal: 10, paddingVertical: 4,
    },
    saveBadgeText: {
        color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1.2,
    },

    planRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    planLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    planRight: { alignItems: 'flex-end' },

    radioOuter: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    radioOuterActive: { borderColor: '#A855F7' },
    radioInner: { width: 10, height: 10, borderRadius: 5 },

    planTextWrap: { flex: 1 },
    planName: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 3 },
    planTrial: { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
    planPrice: { fontSize: 20, fontWeight: '900', color: '#fff' },
    planPeriod: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },

    /* Footer */
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    footerGradient: { position: 'absolute', top: -60, left: 0, right: 0, bottom: 0 },
    footerContent: { paddingHorizontal: 20, paddingTop: 8 },

    ctaBtnWrap: { position: 'relative' },
    ctaGlow: {
        position: 'absolute', top: -4, left: 20, right: 20, bottom: -4,
        borderRadius: 30,
        backgroundColor: '#A855F7',
    },
    ctaBtn: {
        borderRadius: 28, overflow: 'hidden',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 12,
    },
    ctaGrad: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 18, borderRadius: 28,
    },
    ctaText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
    ctaArrow: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },

    footerLinks: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginTop: 16,
    },
    footerLinkText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.25)' },
    restoreText: {
        fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
