import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    FadeInDown
} from 'react-native-reanimated';
import { useStore } from '../src/store/useStore';
import { getOfferings, purchasePackage, restorePurchases, checkProEntitlement } from '../src/services/revenueCatService';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../src/constants/glass';

const { width } = Dimensions.get('window');

const FALLBACK_ANNUAL = { title: 'Annual Pro', price: '₹999/year', trialText: '₹2 for 3 days, then ₹999/yr' };
const FALLBACK_MONTHLY = { title: 'Monthly Basic', price: '₹99/month', trialText: '₹2 for 3 days, then ₹99/mo' };

const BG_COLORS = ['#0F0F1A', '#05050A', '#1A000D'];

export default function SubscriptionScreen() {
    const router = useRouter();
    const { setHasSeenSubscription, setIsPro, showAlert } = useStore();

    const revealProgress = useSharedValue(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const [annualPackage, setAnnualPackage] = useState<any>(null);
    const [monthlyPackage, setMonthlyPackage] = useState<any>(null);
    const [annualInfo, setAnnualInfo] = useState(FALLBACK_ANNUAL);
    const [monthlyInfo, setMonthlyInfo] = useState(FALLBACK_MONTHLY);

    const pulseValue = useSharedValue(1);

    useEffect(() => {
        pulseValue.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 1500 }),
                withTiming(0.9, { duration: 1500 })
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
            if (!current) return;

            const annual = current.annual;
            const monthly = current.monthly;

            if (annual) {
                setAnnualPackage(annual);
                const p = annual.product;
                setAnnualInfo({
                    title: p.title || 'Annual Pro',
                    price: p.priceString || '₹999/year',
                    trialText: p.introPrice
                        ? `${p.introPrice.priceString} for ${p.introPrice.periodNumberOfUnits} days, then ${p.priceString}`
                        : p.priceString,
                });
            }
            if (monthly) {
                setMonthlyPackage(monthly);
                const p = monthly.product;
                setMonthlyInfo({
                    title: p.title || 'Monthly Basic',
                    price: p.priceString || '₹99/month',
                    trialText: p.introPrice
                        ? `${p.introPrice.priceString} for ${p.introPrice.periodNumberOfUnits} days, then ${p.priceString}`
                        : p.priceString,
                });
            }
        } catch (e) {
            console.warn('Offerings load failed, using fallback prices');
        }
    };

    const glowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }],
        opacity: interpolate(pulseValue.value, [0.9, 1.1], [0.3, 0.7], Extrapolation.CLAMP)
    }));

    const handleSelectPlan = (plan: 'monthly' | 'annual') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedPlan(plan);
        if (!isRevealed) {
            setIsRevealed(true);
            revealProgress.value = withSpring(1, { damping: 15, stiffness: 100 });
        }
    };

    const handleStartTrial = async () => {
        const pkg = selectedPlan === 'annual' ? annualPackage : monthlyPackage;
        if (!pkg) {
            setIsPro(true);
            setHasSeenSubscription(true);
            router.replace('/(tabs)');
            return;
        }

        setIsPurchasing(true);
        try {
            const result = await purchasePackage(pkg);
            if (result.success) {
                setIsPro(true);
                setHasSeenSubscription(true);
                showAlert('🎉 Welcome to Pro!', 'You now have unlimited access.', [
                    { text: "Let's Go!", onPress: () => router.replace('/(tabs)') }
                ]);
            } else if (result.error && result.error !== 'Purchase cancelled') {
                showAlert('Purchase Failed', result.error || 'Please try again.');
            }
        } catch (e: any) {
            showAlert('Purchase Error', e.message || 'We couldn\'t process your purchase. Please try again.');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            const info = await restorePurchases();
            const hasPro = checkProEntitlement(info);
            if (hasPro) {
                setIsPro(true);
                setHasSeenSubscription(true);
                showAlert('✅ Restored!', 'Your Pro subscription has been restored.', [
                    { text: 'Continue', onPress: () => router.replace('/(tabs)') }
                ]);
            } else {
                showAlert('No Active Subscription', 'No active Pro subscription found for this account.');
            }
        } catch (e: any) {
            showAlert('Restore Error', e.message || 'We couldn\'t restore your past purchases. Please try again.');
        } finally {
            setIsRestoring(false);
        }
    };

    const handleSkip = () => {
        setHasSeenSubscription(true);
        router.replace('/(tabs)');
    };

    const strikethroughStyle = useAnimatedStyle(() => ({
        opacity: withTiming(isRevealed ? 0.5 : 1, { duration: 300 }),
        textDecorationLine: isRevealed ? 'line-through' : 'none',
    }));

    const discountMessageStyle = useAnimatedStyle(() => ({
        opacity: revealProgress.value,
        transform: [{ translateY: withSpring(isRevealed ? 0 : -20, { damping: 12 }) }]
    }));

    const newPriceStyle = useAnimatedStyle(() => ({
        opacity: revealProgress.value,
        transform: [{ scale: withSpring(isRevealed ? 1 : 0.8) }]
    }));

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="light-content" />
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleSkip} style={[styles.skipBtn, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </View>

                    {/* Title */}
                    <View style={styles.titleContainer}>
                        <View style={styles.iconContainerWrapper}>
                            <Animated.View style={[styles.glow, glowStyle]} />
                            <LinearGradient colors={['#FF1493', '#FF6B35']} style={styles.iconContainer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                <Ionicons name="diamond" size={42} color="#FFFFFF" />
                            </LinearGradient>
                        </View>
                        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
                            <Text style={styles.title}>Unlock Premium</Text>
                            <Text style={styles.subtitle}>Get absolutamente unlimited cards, unhinged dares, and endless video calls.</Text>
                        </Animated.View>
                    </View>

                    {/* Features */}
                    <View style={styles.featuresList}>
                        {[
                            { icon: 'infinite', text: 'Unlimited dare cards' },
                            { icon: 'videocam', text: 'Unlimited video calls' },
                            { icon: 'flash', text: 'Exclusive spicy content' },
                            { icon: 'star', text: 'Priority support' },
                        ].map((f, i) => (
                            <Animated.View key={i} entering={FadeInDown.delay(200 + i * 100).duration(500)} style={[styles.featureRow, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 16, marginBottom: 8 }]}>
                                <View style={[styles.featureIconBg, glassStyles.container, { backgroundColor: 'rgba(255, 20, 147, 0.2)' }]}>
                                    <Ionicons name={f.icon as any} size={16} color="#FFB8D2" />
                                </View>
                                <Text style={styles.featureText}>{f.text}</Text>
                            </Animated.View>
                        ))}
                    </View>

                    {/* Discount banner */}
                    <Animated.View style={[styles.discountMessageWrapper, discountMessageStyle]}>
                        <LinearGradient
                            colors={['rgba(255, 20, 147, 0.4)', 'rgba(255, 107, 53, 0.4)']}
                            style={[styles.discountBadge, glassStyles.container]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.discountBadgeText}>✨ Special Offer Unlocked!</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* Plans */}
                    <View style={styles.plansContainer}>
                        {/* Annual */}
                        <TouchableOpacity activeOpacity={0.9} style={[styles.planCard, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.06)' }, selectedPlan === 'annual' && styles.planCardSelected]} onPress={() => handleSelectPlan('annual')}>
                            <View style={styles.popularBadge}><Text style={styles.popularText}>BEST VALUE</Text></View>
                            <View style={styles.planHeader}>
                                <Text style={styles.planName}>{annualInfo.title}</Text>
                                <View style={[styles.radioOuter, glassStyles.container, selectedPlan === 'annual' && styles.radioOuterSelected]}>
                                    {selectedPlan === 'annual' && <View style={styles.radioInner} />}
                                </View>
                            </View>
                            <View style={styles.priceRow}>
                                <Animated.Text style={[styles.originalPrice, strikethroughStyle]}>{annualInfo.price}</Animated.Text>
                            </View>
                            <Animated.View style={[styles.newPriceWrapper, newPriceStyle]}>
                                {isRevealed && <Text style={styles.newPriceHighlight}>{annualInfo.trialText}</Text>}
                            </Animated.View>
                        </TouchableOpacity>

                        {/* Monthly */}
                        <TouchableOpacity activeOpacity={0.9} style={[styles.planCard, glassStyles.container, { backgroundColor: 'rgba(255,255,255,0.06)' }, selectedPlan === 'monthly' && styles.planCardSelected]} onPress={() => handleSelectPlan('monthly')}>
                            <View style={styles.planHeader}>
                                <Text style={styles.planName}>{monthlyInfo.title}</Text>
                                <View style={[styles.radioOuter, glassStyles.container, selectedPlan === 'monthly' && styles.radioOuterSelected]}>
                                    {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
                                </View>
                            </View>
                            <View style={styles.priceRow}>
                                <Animated.Text style={[styles.originalPrice, strikethroughStyle]}>{monthlyInfo.price}</Animated.Text>
                            </View>
                            <Animated.View style={[styles.newPriceWrapper, newPriceStyle]}>
                                {isRevealed && <Text style={styles.newPriceHighlight}>{monthlyInfo.trialText}</Text>}
                            </Animated.View>
                        </TouchableOpacity>
                    </View>

                    {/* CTA */}
                    <Animated.View style={[styles.ctaContainer, { opacity: revealProgress }]} pointerEvents={isRevealed ? 'auto' : 'none'}>
                        <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTrial} disabled={isPurchasing} activeOpacity={0.85}>
                            <LinearGradient colors={['#FF1493', '#FF4D17']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                {isPurchasing
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.primaryBtnText}>Start My 3-Day Free Trial</Text>
                                }
                            </LinearGradient>
                        </TouchableOpacity>
                        <Text style={styles.footerNote}>Cancel anytime. You won't be charged before the trial ends.</Text>
                        <TouchableOpacity onPress={handleRestore} disabled={isRestoring} style={styles.restoreBtn}>
                            {isRestoring
                                ? <ActivityIndicator color="rgba(255,255,255,0.5)" size="small" />
                                : <Text style={styles.restoreText}>Restore Purchases</Text>
                            }
                        </TouchableOpacity>
                    </Animated.View>

                </ScrollView>
            </SafeAreaView>
        </AnimatedBackground>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
    header: { flexDirection: 'row', justifyContent: 'flex-end', paddingBottom: 16 },
    skipBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    titleContainer: { alignItems: 'center', marginBottom: 28 },
    iconContainerWrapper: { position: 'relative', width: 90, height: 90, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    glow: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#FF1493' },
    iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    title: { fontSize: 34, fontWeight: '900', color: '#FFFFFF', marginBottom: 10, textAlign: 'center', letterSpacing: 0.5 },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: 10, lineHeight: 24, fontWeight: '600' },
    featuresList: { marginBottom: 24 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureIconBg: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    featureText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600' },
    discountMessageWrapper: { alignItems: 'center', marginBottom: 20, height: 44, justifyContent: 'center' },
    discountBadge: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(255, 20, 147, 0.4)' },
    discountBadgeText: { color: '#FFB8D2', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
    plansContainer: { gap: 16, marginBottom: 32 },
    planCard: { borderRadius: 28, padding: 24, position: 'relative', overflow: 'visible' },
    planCardSelected: { borderColor: '#FF1493', borderWidth: 2, backgroundColor: 'rgba(255, 20, 147, 0.1)' },
    popularBadge: { position: 'absolute', top: -14, right: 24, backgroundColor: '#FF1493', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, zIndex: 10 },
    popularText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    planName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
    radioOuter: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
    radioOuterSelected: { borderColor: '#FF1493' },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF1493' },
    priceRow: { flexDirection: 'row', alignItems: 'center' },
    originalPrice: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
    newPriceWrapper: { marginTop: 4, height: 24 },
    newPriceHighlight: { fontSize: 15, fontWeight: '800', color: '#FFB8D2' },
    ctaContainer: { marginTop: 'auto', alignItems: 'center', paddingBottom: 20 },
    primaryBtn: { width: '100%', height: 64, borderRadius: 32, overflow: 'hidden', marginBottom: 16 },
    btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    primaryBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
    footerNote: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingHorizontal: 20, marginBottom: 12, fontWeight: '500' },
    restoreBtn: { paddingVertical: 8, paddingHorizontal: 16 },
    restoreText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});
