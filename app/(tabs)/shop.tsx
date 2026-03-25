import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, StatusBar, Alert, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { getOfferings, purchasePackage } from '../../src/services/revenueCatService';
import { PurchasesPackage } from 'react-native-purchases';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PaywallModal from '../../src/components/PaywallModal';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';

const { width } = Dimensions.get('window');

const BG_COLORS = ['#FFF5F5', '#FFF0F5', '#F5F5FF']; // Premium romantic base

// Static pack display data (used before offerings load)
const PACKS = [
    {
        productId: 'dare_card_1', title: 'Single Dare', subtitle: 'Perfect for one more laugh',
        fallbackPrice: '₹5', count: 1, icon: '⭐', badge: null, badgeColor: '',
        colors: ['rgba(255, 107, 157, 0.2)', 'rgba(233, 30, 140, 0.2)'] as const, iconName: 'star' as const,
    },
    {
        productId: 'dare_card_5', title: '5-Pack', subtitle: 'Save ₹6 • Most popular',
        fallbackPrice: '₹19', count: 5, icon: '🔥', badge: 'BEST VALUE', badgeColor: '#10B981',
        colors: ['rgba(255, 145, 66, 0.2)', 'rgba(230, 81, 0, 0.2)'] as const, iconName: 'flame' as const,
    },
    {
        productId: 'dare_card_10', title: '10-Pack', subtitle: 'Save ₹11 on dares',
        fallbackPrice: '₹39', count: 10, icon: '💎', badge: 'POPULAR', badgeColor: '#8B5CF6',
        colors: ['rgba(124, 77, 255, 0.2)', 'rgba(69, 39, 160, 0.2)'] as const, iconName: 'diamond' as const,
    },
    {
        productId: 'dare_card_25', title: '25-Pack', subtitle: 'Unlimited vibes for weeks',
        fallbackPrice: '₹89', count: 25, icon: '👑', badge: 'LEGENDARY', badgeColor: '#F59E0B',
        colors: ['rgba(255, 179, 0, 0.2)', 'rgba(230, 81, 0, 0.2)'] as const, iconName: 'trophy' as const,
    },
];

const SUBSCRIPTIONS = [
    {
        productId: 'Rumbala_pro_monthly', title: 'Monthly Pro', subtitle: 'Full access + Unlimited dares',
        fallbackPrice: '₹99/mo', icon: '✨', badge: null, badgeColor: '',
        colors: ['rgba(71, 118, 230, 0.15)', 'rgba(142, 84, 233, 0.15)'] as const, iconName: 'calendar' as const,
    },
    {
        productId: 'Rumbala_pro_yearly', title: 'Annual Pro', subtitle: 'Save 40% • Best for couples',
        fallbackPrice: '₹599/yr', icon: '🚀', badge: 'BEST DEAL', badgeColor: '#10B981',
        colors: ['rgba(255, 95, 109, 0.15)', 'rgba(255, 195, 113, 0.15)'] as const, iconName: 'rocket' as const,
    },
];

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
        const offerings = await getOfferings();
        const offering = offerings?.current || offerings;
        if (offering?.availablePackages) {
            setPackages(offering.availablePackages);
        }
        setOfferingsLoaded(true);
    };

    const findPackage = (productId: string): PurchasesPackage | undefined => {
        return packages.find(p => p.product.identifier === productId);
    };

    const getPrice = (productId: string, fallbackPrice: string): string => {
        const pkg = findPackage(productId);
        return pkg?.product.priceString || fallbackPrice;
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
        setLoadingSku(productId);
        const result = await purchasePackage(pkg);
        setLoadingSku(null);
        if (result.success) {
            const isSub = SUBSCRIPTIONS.some(s => s.productId === productId);
            const title = isSub ? 'Subscription Active! 👑' : 'Cards Added! 🎉';
            const message = isSub ? 'Welcome to Rumbala Pro! You now have unlimited access.' : `Success! We've added ${result.cardsAdded || 0} dare cards to your deck.`;
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showAlert(title, message, [
                { text: 'Great!', onPress: () => router.replace('/(tabs)') }
            ]);
        } else if (result.error && result.error !== 'Purchase cancelled') {
            showAlert('Purchase Failed 😔', result.error);
        }
    };

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

                    {/* Content based on Tab */}
                    {viewMode === 'pro' ? (
                        <>
                            {SUBSCRIPTIONS.map((sub, i) => (
                                <Animated.View key={sub.productId} entering={FadeInDown.delay(100 + i * 80).duration(500)} style={[styles.card, glassStyles.container]}>
                                    <LinearGradient colors={sub.colors} style={styles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                        {sub.badge && (
                                            <View style={[styles.badge, { backgroundColor: sub.badgeColor }]}>
                                                <Text style={styles.badgeText}>{sub.badge}</Text>
                                            </View>
                                        )}
                                        <Text style={styles.watermarkSub}>{sub.productId.includes('yearly') ? '🏆' : '✨'}</Text>
                                        <View style={styles.cardContent}>
                                            <View style={styles.cardLeft}>
                                                <View style={styles.iconCircle}>
                                                     <Ionicons name={sub.iconName} size={24} color="#FF6F43" />
                                                </View>
                                                <View>
                                                    <Text style={styles.cardTitle}>{sub.title}</Text>
                                                    <Text style={styles.cardSubtitle}>{sub.subtitle}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.buyBtn, loadingSku === sub.productId && styles.buyBtnDisabled]}
                                                onPress={() => handlePurchase(sub.productId)}
                                                activeOpacity={0.85}
                                                disabled={!!loadingSku}
                                            >
                                                {loadingSku === sub.productId ? (
                                                    <ActivityIndicator size="small" color="#FF6F43" />
                                                ) : (
                                                    <Text style={styles.buyPrice}>{getPrice(sub.productId, sub.fallbackPrice)}</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </LinearGradient>
                                </Animated.View>
                            ))}
                        </>
                    ) : (
                        <>
                            {/* Pack Cards */}
                            {PACKS.map((pack, i) => (
                                <Animated.View key={pack.productId} entering={FadeInDown.delay(100 + i * 80).duration(500)} style={[styles.card, glassStyles.container]}>
                                    <LinearGradient colors={pack.colors} style={styles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                        {pack.badge && (
                                            <View style={[styles.badge, { backgroundColor: pack.badgeColor }]}>
                                                <Text style={styles.badgeText}>{pack.badge}</Text>
                                            </View>
                                        )}
                                        <Text style={styles.watermark}>{pack.icon}</Text>
                                        <View style={styles.cardContent}>
                                            <View style={styles.cardLeft}>
                                                <View style={styles.packIconWrap}>
                                                    <Text style={styles.cardIcon}>{pack.icon}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.cardTitle}>{pack.title}</Text>
                                                    <Text style={styles.cardSubtitle}>{pack.subtitle}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.buyBtn, loadingSku === pack.productId && styles.buyBtnDisabled]}
                                                onPress={() => handlePurchase(pack.productId)}
                                                activeOpacity={0.85}
                                                disabled={!!loadingSku}
                                            >
                                                {loadingSku === pack.productId ? (
                                                    <ActivityIndicator size="small" color="#FF6B35" />
                                                ) : (
                                                    <>
                                                        <Text style={styles.buyPrice}>{getPrice(pack.productId, pack.fallbackPrice)}</Text>
                                                        <Ionicons name="chevron-forward" size={14} color="#FF6B35" />
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </LinearGradient>
                                </Animated.View>
                            ))}
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
    headerSubtitle: { fontSize: 14, color: '#666', fontWeight: '500' },

    // Info pill
    infoPill: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
        marginBottom: 20,
    },
    infoPillLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    packIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,107,53,0.1)', alignItems: 'center', justifyContent: 'center' },
    iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,111,67,0.1)', alignItems: 'center', justifyContent: 'center' },
    cardIcon: { fontSize: 24 },
    cardTitle: { fontSize: 19, fontWeight: '800', color: '#1a1a1a', marginBottom: 2 },
    cardSubtitle: { fontSize: 12, color: '#666', fontWeight: '500' },
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
});
