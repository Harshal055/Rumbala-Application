import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, StatusBar, Alert, ActivityIndicator, Platform, Dimensions, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '../../src/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { 
    getOfferings, 
    purchasePackage, 
    getCustomerInfo, 
    checkProEntitlement,
    getProEntitlementDetails,
    restorePurchases,
    rcProduct,
    rcProductId 
} from '../../src/services/revenueCatService';
import { PurchasesPackage } from 'react-native-purchases';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PaywallModal from '../../src/components/PaywallModal';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import { glassStyles, glassTokens } from '../../src/constants/glass';


const { width } = Dimensions.get('window');
const BG_COLORS = ['#FFF5F5', '#FFF0F5', '#F5F5FF']; // Premium romantic base

// Helper mapping for dynamic rendering
const GET_META = (pkg: any) => {
    const product = rcProduct(pkg);
    const id = rcProductId(pkg).toLowerCase();
    const pkgId = (pkg?.identifier || '').toLowerCase();
    const type = (pkg?.packageType || '').toUpperCase();

    if (type === 'ANNUAL' || id.includes('year') || id.includes('annual') || pkgId.includes('annual') || pkgId.includes('year')) {
        return {
            title: 'Annual Pro', subtitle: 'Save 50% • Best for couples',
            icon: '🚀', badge: 'BEST DEAL', badgeColor: '#10B981', iconName: 'rocket' as const,
            colors: ['rgba(255, 95, 109, 0.15)', 'rgba(255, 195, 113, 0.15)'] as const,
        };
    }
    if (type === 'MONTHLY' || id.includes('month') || pkgId.includes('month')) {
        return {
            title: 'Monthly Pro', subtitle: 'Full access + Unlimited dares',
            icon: '✨', badge: null, badgeColor: '', iconName: 'calendar' as const,
            colors: ['rgba(71, 118, 230, 0.15)', 'rgba(142, 84, 233, 0.15)'] as const,
        };
    }
    if (type === 'LIFETIME' || id.includes('lifetime') || pkgId.includes('lifetime')) {
        return {
            title: 'Lifetime Pro', subtitle: 'Pay once, enjoy forever',
            icon: '👑', badge: 'LIFETIME', badgeColor: '#EC4899', iconName: 'trophy' as const,
            colors: ['rgba(236, 72, 153, 0.15)', 'rgba(168, 85, 247, 0.15)'] as const,
        };
    }
    if (id.includes('card_25') || id.includes('25_pack') || id.includes('25pack') || pkgId.includes('25')) {
        return {
            title: '25-Pack Dares', subtitle: 'Unlimited vibes for weeks',
            icon: '👑', badge: 'LEGENDARY', badgeColor: '#F59E0B', iconName: 'trophy' as const,
            colors: ['rgba(255, 179, 0, 0.2)', 'rgba(230, 81, 0, 0.2)'] as const,
        };
    }
    if (id.includes('card_10') || id.includes('10_pack') || id.includes('10pack') || pkgId.includes('10')) {
        return {
            title: '10-Pack Dares', subtitle: 'Save on extra dares',
            icon: '💎', badge: 'POPULAR', badgeColor: '#8B5CF6', iconName: 'diamond' as const,
            colors: ['rgba(124, 77, 255, 0.2)', 'rgba(69, 39, 160, 0.2)'] as const,
        };
    }
    if (id.includes('card_5') || id.includes('5_pack') || id.includes('5pack') || id.includes('consumable') || pkgId === 'custom' || pkgId.includes('5')) {
        return {
            title: '5-Pack Dares', subtitle: 'Get 5 more dares to spice up the night',
            icon: '🔥', badge: 'BEST VALUE', badgeColor: '#10B981', iconName: 'flame' as const,
            colors: ['rgba(255, 145, 66, 0.2)', 'rgba(230, 81, 0, 0.2)'] as const,
        };
    }
    if (id.includes('card_1') || id.includes('single') || pkgId.includes('1')) {
        return {
            title: 'Single Dare', subtitle: 'Perfect for one more laugh',
            icon: '⭐', badge: null, badgeColor: '', iconName: 'star' as const,
            colors: ['rgba(255, 107, 157, 0.2)', 'rgba(233, 30, 140, 0.2)'] as const,
        };
    }
    // Default fallback for any other package discovered
    const title = product?.title ? product.title.replace(' (Rumbala)', '').replace(' (Google Play)', '') : (pkg?.identifier || 'Dare Pack');
    return {
        title,
        subtitle: product?.description || 'Premium access',
        icon: '⭐', badge: null, badgeColor: '', iconName: 'star' as const,
        colors: ['rgba(255, 107, 157, 0.2)', 'rgba(233, 30, 140, 0.2)'] as const,
    };
};

const getNextMonday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 1 ? 7 : (8 - day) % 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function ShopScreen() {
    const { cardCount, userId, isPro, proExpiresAt, setIsPro, redeemPromoCode, showAlert } = useStore(useShallow(state => ({
        cardCount: state.cardCount,
        userId: state.userId,
        isPro: state.isPro,
        proExpiresAt: state.proExpiresAt,
        setIsPro: state.setIsPro,
        redeemPromoCode: state.redeemPromoCode,
        showAlert: state.showAlert
    })));
    const router = useRouter();
    const [loadingSku, setLoadingSku] = useState<string | null>(null);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [offeringsLoaded, setOfferingsLoaded] = useState(false);
    const [viewMode, setViewMode] = useState<'packs' | 'pro'>('pro');
    const [showPaywall, setShowPaywall] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    // Promo Code Modal State
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [promoInput, setPromoInput] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    const proDetails = React.useMemo(() => {
        if (!isPro) return null;
        if (!proExpiresAt) {
            return {
                title: 'Lifetime Pro Plan',
                remainingBadge: '♾️ LIFETIME ACCESS',
                remainingSubtitle: 'Enjoy unlimited dares and all features forever ✨',
                expiryDate: 'Never Expires',
                isLifetime: true,
                daysLeft: 9999,
            };
        }
        try {
            const expiry = new Date(proExpiresAt);
            const now = new Date();
            const diffMs = expiry.getTime() - now.getTime();
            if (diffMs <= 0) {
                return {
                    title: 'Active Pro Access',
                    remainingBadge: '👑 ACTIVE',
                    remainingSubtitle: 'Active store subscription connected',
                    expiryDate: 'Renews automatically',
                    isLifetime: false,
                    daysLeft: 1,
                };
            }
            const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            
            let planTitle = 'Pro Plan';
            if (days > 100) planTitle = 'Annual Pro Plan';
            else if (days > 20) planTitle = 'Monthly Pro Plan';
            else planTitle = `${days}-Day Pro Pass`;

            const formattedDate = expiry.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });

            return {
                title: planTitle,
                remainingBadge: days > 1 ? `⏱️ ${days} DAYS LEFT` : `⏱️ ${hours} HOURS LEFT`,
                remainingSubtitle: `Active until ${formattedDate}`,
                expiryDate: formattedDate,
                isLifetime: false,
                daysLeft: days,
            };
        } catch {
            return {
                title: 'Active Pro Plan',
                remainingBadge: '👑 ACTIVE',
                remainingSubtitle: 'Pro access is currently active',
                expiryDate: 'Active',
                isLifetime: false,
                daysLeft: 30,
            };
        }
    }, [isPro, proExpiresAt]);

    useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        try {
            const offerings = await getOfferings();
            const offering = offerings?.current || offerings;
            if (offering?.availablePackages) {
                setPackages(offering.availablePackages);
            } else {
                setPackages([]);
            }
        } catch (e: any) {
            setPackages([]);
            showAlert('Shop Unavailable', e?.message || 'Unable to load store offerings right now.');
        } finally {
            setOfferingsLoaded(true);
        }
    };

    const findPackage = (productId: string): PurchasesPackage | undefined => {
        return packages.find(p => rcProductId(p) === productId || p?.identifier === productId);
    };

    const handlePurchase = async (param: string | PurchasesPackage) => {
        if (loadingSku) return;
        const productId = rcProductId(param);

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
        try {
            setLoadingSku(productId || (typeof param === 'string' ? param : 'buying'));
            const result = await purchasePackage(pkg);
            if (result.success) {
                const isConsumable = (result.cardsAdded !== undefined && result.cardsAdded > 0) || isConsumablePackage(pkg);
                const isSub = !isConsumable;

                if (isSub) {
                    const info = await getCustomerInfo();
                    const proDetails = getProEntitlementDetails(info);
                    const activePro = proDetails.isPro || Boolean((pkg as any)?.isMock) || __DEV__;
                    setIsPro(activePro, proDetails.expiresAt);

                    if (activePro && userId) {
                        const api = await import('../../src/services/api');
                        api.syncProStatusToBackend(userId, true, proDetails.expiresAt).catch(() => {});
                    }

                    if (!activePro) {
                        showAlert('Purchase Pending', 'Your subscription was processed, but Pro is still syncing. Please reopen the app or tap Restore Purchases.');
                        return;
                    }
                }

                const title = isSub ? 'Subscription Active! 👑' : 'Cards Added! 🎉';
                const message = isSub ? 'Welcome to Rumbala Pro! You now have unlimited access.' : `Success! We've added ${result.cardsAdded || 5} dare cards to your deck.`;

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showAlert(title, message, [
                    { text: 'Great!', onPress: () => router.replace('/(tabs)') }
                ]);
            } else if (result.error && result.error !== 'Purchase cancelled') {
                showAlert('Purchase Notice', result.error);
            }
        } catch (e: any) {
            showAlert('Purchase Error', e?.message || 'Transaction could not be completed.');
        } finally {
            setLoadingSku(null);
        }
    };

    const handleRestorePurchases = async () => {
        setIsRestoring(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const info = await restorePurchases();
            const proDetails = getProEntitlementDetails(info);
            if (proDetails.isPro) {
                setIsPro(true, proDetails.expiresAt);
                if (userId) {
                    const api = await import('../../src/services/api');
                    api.syncProStatusToBackend(userId, true, proDetails.expiresAt).catch(() => {});
                }
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showAlert('✅ Purchases Restored!', 'Your Rumbala Pro subscription is active with unlimited access.');
            } else {
                showAlert('No Purchases Found', 'We could not find an active Pro subscription linked to your store account.');
            }
        } catch (e: any) {
            showAlert('Restore Error', e?.message || 'Failed to restore purchases.');
        } finally {
            setIsRestoring(false);
        }
    };

    const handleRedeemPromo = async () => {
        const code = promoInput.trim().toUpperCase();
        if (!code) {
            showAlert('Promo Code', 'Please enter a promo code.');
            return;
        }
        if (!userId) {
            showAlert('Sign In Required', 'Please sign in to redeem promo codes.', [
                { text: 'Sign In', onPress: () => router.push('/login') },
                { text: 'Cancel', style: 'cancel' }
            ]);
            return;
        }
        setIsRedeeming(true);
        try {
            const res = await redeemPromoCode(code);
            if (res.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setShowPromoModal(false);
                setPromoInput('');
                showAlert('🎉 Congratulations!', res.message, [
                    { text: 'Enjoy!', onPress: () => {} }
                ]);
            } else {
                showAlert('Invalid Code', res.message || 'The promo code you entered is invalid or expired.');
            }
        } catch (e: any) {
            showAlert('Redeem Error', e.message || 'Failed to redeem promo code. Please try again.');
        } finally {
            setIsRedeeming(false);
        }
    };

    const isConsumablePackage = (pkg: any) => {
        const id = rcProductId(pkg).toLowerCase();
        const pkgId = (pkg?.identifier || '').toLowerCase();
        const type = (pkg?.packageType || '').toUpperCase();
        return type === 'CUSTOM' || type === 'UNKNOWN' || pkgId === 'custom' || /(card_|pack|consumable)/i.test(id) || /(card_|pack|consumable)/i.test(pkgId);
    };

    const displayedPackages = viewMode === 'pro'
        ? packages.filter(p => !isConsumablePackage(p))
        : packages.filter(p => isConsumablePackage(p));

    return (
        <AnimatedBackground colors={BG_COLORS}>
            <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" />

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Header with Back Button */}
                    <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, glassStyles.header]}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity
                                style={styles.backBtn}
                                activeOpacity={0.8}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    if (router.canGoBack()) {
                                        router.back();
                                    } else {
                                        router.replace('/(tabs)');
                                    }
                                }}
                            >
                                <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
                            </TouchableOpacity>
                            <View style={styles.headerTextWrap}>
                                <Text style={styles.headerTitle}>Rumbala Shop</Text>
                                <Text style={styles.headerSubtitle}>Elevate your shared experiences 🔥</Text>
                            </View>
                        </View>
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

                    {/* Pro Hero Card (When Not Pro) */}
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

                    {/* Pro Active Status Card (When Pro is Active) */}
                    {isPro && proDetails && (
                        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.activeProCard}>
                            <LinearGradient
                                colors={['#181028', '#2D1B4E', '#160E29']}
                                style={styles.activeProGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.activeProTopRow}>
                                    <View style={styles.activeProBadge}>
                                        <Text style={styles.activeProBadgeText}>👑 ACTIVE MEMBERSHIP</Text>
                                    </View>
                                    <View style={styles.activeRemainingTag}>
                                        <Ionicons name="time-outline" size={13} color="#FF66B2" />
                                        <Text style={styles.activeRemainingText}>{proDetails.remainingBadge}</Text>
                                    </View>
                                </View>

                                <View style={styles.activeProMain}>
                                    <Text style={styles.activeProPlanTitle}>{proDetails.title}</Text>
                                    <Text style={styles.activeProSub}>{proDetails.remainingSubtitle}</Text>
                                </View>

                                <View style={styles.activePerksGrid}>
                                    <View style={styles.activePerkItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                        <Text style={styles.activePerkText}>Unlimited Dares (No Card Limits)</Text>
                                    </View>
                                    <View style={styles.activePerkItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                        <Text style={styles.activePerkText}>All Spicy & Intimate Categories</Text>
                                    </View>
                                    <View style={styles.activePerkItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                        <Text style={styles.activePerkText}>LDR Real-time Video Rooms</Text>
                                    </View>
                                    <View style={styles.activePerkItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                        <Text style={styles.activePerkText}>Synced Couple Streaks & Cloud Backup</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    )}

                    {/* 🎁 Promo Code Banner */}
                    <Animated.View entering={FadeInDown.delay(140).duration(500)} style={styles.promoBannerCard}>
                        <TouchableOpacity
                            style={[styles.promoBannerBtn, glassStyles.container]}
                            activeOpacity={0.85}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setShowPromoModal(true);
                            }}
                        >
                            <View style={styles.promoIconWrap}>
                                <Ionicons name="gift-outline" size={22} color="#FF6B35" />
                            </View>
                            <View style={styles.promoTextWrap}>
                                <Text style={styles.promoTitle}>Have a Promo Code?</Text>
                                <Text style={styles.promoSubtitle}>Enter your code to unlock Pro days or bonus cards</Text>
                            </View>
                            <View style={styles.promoActionTag}>
                                <Text style={styles.promoActionText}>Redeem</Text>
                                <Ionicons name="chevron-forward" size={14} color="#FF6B35" />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Content Dynamic discovery from RevenueCat */}
                    {(packages.length === 0 || displayedPackages.length === 0) && offeringsLoaded ? (
                        <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyOfferings}>
                            <Ionicons name="sparkles-outline" size={56} color="#FF6B35" />
                            <Text style={styles.emptyTitle}>Connecting to Store...</Text>
                            <Text style={styles.emptyText}>
                                We are retrieving the latest packages. Tap Refresh to load the shop.
                            </Text>
                            <TouchableOpacity style={styles.reloadBtn} onPress={loadOfferings} activeOpacity={0.85}>
                                <Text style={styles.reloadBtnText}>Refresh Shop</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <>
                            {displayedPackages.map((pkg: any, i) => {
                                const meta = GET_META(pkg);
                                const product = rcProduct(pkg);
                                const productId = rcProductId(pkg) || `pkg_${i}`;
                                const priceString = product?.priceString || product?.currentPrice?.priceString || pkg?.priceString || (product?.price ? `₹${product.price}` : '₹79');

                                return (
                                    <Animated.View key={productId} entering={FadeInDown.delay(100 + i * 80).duration(500)} style={[styles.card, glassStyles.container]}>
                                        <LinearGradient colors={meta.colors} style={styles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                            {meta.badge && (
                                                <View style={[styles.badge, { backgroundColor: meta.badgeColor }]}>
                                                    <Text style={styles.badgeText}>{meta.badge}</Text>
                                                </View>
                                            )}
                                            <Text style={styles.watermarkSub}>{meta.icon}</Text>
                                            <View style={styles.cardContent}>
                                                <View style={styles.cardLeft}>
                                                    <View style={styles.iconCircle}>
                                                        <Ionicons name={meta.iconName} size={24} color="#FF6F43" />
                                                    </View>
                                                    <View>
                                                        <Text style={styles.cardTitle}>{meta.title}</Text>
                                                        <Text style={styles.cardSubtitle}>{meta.subtitle}</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    style={[styles.buyBtn, loadingSku === productId && styles.buyBtnDisabled]}
                                                    onPress={() => handlePurchase(pkg)}
                                                    activeOpacity={0.85}
                                                    disabled={!!loadingSku}
                                                >
                                                    {loadingSku === productId ? (
                                                        <ActivityIndicator size="small" color="#FF6F43" />
                                                    ) : (
                                                        <Text style={styles.buyPrice}>{priceString}</Text>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </LinearGradient>
                                    </Animated.View>
                                );
                            })}
                        </>
                    )}

                    {/* Footer */}
                    <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.footer}>
                        <TouchableOpacity 
                            style={styles.restoreBtn} 
                            onPress={handleRestorePurchases} 
                            disabled={isRestoring}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="refresh-circle-outline" size={16} color="#FF6B35" />
                            <Text style={styles.restoreBtnText}>{isRestoring ? 'Restoring...' : 'Restore Purchases'}</Text>
                        </TouchableOpacity>
                        <Text style={styles.footerText}>Cards are consumed upon use. Prices from Google Play / App Store.</Text>
                        <Text style={styles.footerSecure}>🔐 Secured by Google Play & App Store</Text>
                    </Animated.View>
                </ScrollView>

                {/* Promo Code Redemption Modal */}
                <Modal
                    visible={showPromoModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowPromoModal(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalOverlay}
                    >
                        <View style={[styles.promoModalCard, glassStyles.container]}>
                            <LinearGradient
                                colors={['#1E1B2E', '#161320']}
                                style={styles.promoModalGradient}
                            >
                                <View style={styles.promoModalHeader}>
                                    <View style={styles.promoModalIconWrap}>
                                        <Ionicons name="gift" size={28} color="#FF6B35" />
                                    </View>
                                    <Text style={styles.promoModalTitle}>Redeem Promo Code</Text>
                                    <Text style={styles.promoModalSubtitle}>
                                        Enter your promo or gift voucher to claim Pro duration or bonus dare cards!
                                    </Text>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Ionicons name="pricetag-outline" size={18} color="#FF6B35" style={{ marginRight: 8 }} />
                                    <TextInput
                                        style={styles.promoInput}
                                        placeholder="ENTER CODE (e.g. VIP7DAYS)"
                                        placeholderTextColor="#71717A"
                                        value={promoInput}
                                        onChangeText={setPromoInput}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                        maxLength={30}
                                    />
                                    {promoInput.length > 0 && (
                                        <TouchableOpacity onPress={() => setPromoInput('')}>
                                            <Ionicons name="close-circle" size={18} color="#71717A" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={styles.promoModalBtnRow}>
                                    <TouchableOpacity
                                        style={[styles.promoModalBtn, styles.promoModalCancelBtn]}
                                        onPress={() => {
                                            setShowPromoModal(false);
                                            setPromoInput('');
                                        }}
                                        disabled={isRedeeming}
                                    >
                                        <Text style={styles.promoModalCancelText}>Cancel</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.promoModalBtn, styles.promoModalSubmitBtn]}
                                        onPress={handleRedeemPromo}
                                        disabled={isRedeeming || !promoInput.trim()}
                                    >
                                        {isRedeeming ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.promoModalSubmitText}>Apply Code</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {!isPro && (
                    <PaywallModal
                        visible={showPaywall}
                        onClose={() => setShowPaywall(false)}
                        onSubscribe={(pkg) => {
                            setShowPaywall(false);
                            handlePurchase(pkg);
                        }}
                    />
                )}
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
    header: { marginBottom: 24, paddingHorizontal: 10, paddingVertical: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    headerTextWrap: { flex: 1 },
    headerTitle: {
        fontFamily: 'Pacifico_400Regular', fontSize: 30, color: '#1a1a1a', marginBottom: 2,
    },
    headerSubtitle: { fontSize: 13, color: '#666', fontWeight: '500', lineHeight: 18 },

    // Active Pro Card
    activeProCard: {
        borderRadius: 22, marginBottom: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255, 102, 178, 0.35)',
        shadowColor: '#FF66B2', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 3
    },
    activeProGradient: { padding: 22 },
    activeProTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    activeProBadge: {
        backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    activeProBadgeText: { fontSize: 11, fontWeight: '900', color: '#fff' },
    activeRemainingTag: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(255, 102, 178, 0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
        borderWidth: 1, borderColor: 'rgba(255, 102, 178, 0.3)',
    },
    activeRemainingText: { fontSize: 11, fontWeight: '800', color: '#FF66B2' },
    activeProMain: { marginBottom: 16 },
    activeProPlanTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
    activeProSub: { fontSize: 14, color: '#D1D5DB', fontWeight: '600' },
    activePerksGrid: { gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    activePerkItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    activePerkText: { fontSize: 13, color: '#F3F4F6', fontWeight: '600' },

    // Info pill
    infoPill: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
        marginBottom: 16,
    },
    infoPillLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
    infoPillText: { fontSize: 14, color: '#555' },
    infoPillBold: { fontWeight: '700', color: '#1a1a1a' },
    resetBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    },
    resetText: { fontSize: 10, color: '#888', fontWeight: '600' },

    // Promo Banner
    promoBannerCard: {
        marginBottom: 20,
    },
    promoBannerBtn: {
        flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18,
    },
    promoIconWrap: {
        width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255, 107, 53, 0.12)',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    promoTextWrap: { flex: 1, marginRight: 8 },
    promoTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
    promoSubtitle: { fontSize: 12, color: '#666', lineHeight: 16 },
    promoActionTag: {
        flexDirection: 'row', alignItems: 'center', gap: 2,
        backgroundColor: 'rgba(255, 107, 53, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    },
    promoActionText: { fontSize: 12, fontWeight: '700', color: '#FF6B35' },

    // Pro Hero
    proHeroCard: {
        borderRadius: 20, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#3A2D3D',
        shadowColor: 'rgba(255, 102, 178, 0.2)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 0
    },
    proHeroGradient: { padding: 24 },
    proHeroContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    proHeroTextWrap: { flex: 1, marginRight: 10 },
    proHeroTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 4 },
    proHeroSubtitle: { fontSize: 13, color: '#A1B0C1', fontWeight: '500' },
    proHeroBtn: { backgroundColor: '#FF66B2', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    proHeroBtnText: { color: '#1A111B', fontSize: 13, fontWeight: '800' },
    bestValueBadgePro: {
        position: 'absolute', top: 12, left: 16,
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
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
    packIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,107,53,0.1)', alignItems: 'center', justifyContent: 'center' },
    iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,111,67,0.1)', alignItems: 'center', justifyContent: 'center' },
    cardIcon: { fontSize: 24 },
    cardTitle: { fontSize: 19, fontWeight: '800', color: '#1a1a1a', marginBottom: 2 },
    cardSubtitle: { fontSize: 12, color: '#666', fontWeight: '500', flexShrink: 1, lineHeight: 16 },
    buyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14,
        minWidth: 80, justifyContent: 'center',
    },
    buyBtnDisabled: { opacity: 0.7 },
    buyPrice: { fontSize: 15, fontWeight: '800', color: '#FF6B35' },

    // Promo Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center', padding: 20,
    },
    promoModalCard: {
        width: '100%', maxWidth: 360, borderRadius: 24, overflow: 'hidden',
    },
    promoModalGradient: {
        padding: 24, alignItems: 'center',
    },
    promoModalHeader: {
        alignItems: 'center', marginBottom: 20,
    },
    promoModalIconWrap: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 107, 53, 0.15)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    promoModalTitle: {
        fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 6, textAlign: 'center',
    },
    promoModalSubtitle: {
        fontSize: 13, color: '#A1B0C1', textAlign: 'center', lineHeight: 18, paddingHorizontal: 10,
    },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', width: '100%',
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
        marginBottom: 20,
    },
    promoInput: {
        flex: 1, color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1,
    },
    promoModalBtnRow: {
        flexDirection: 'row', gap: 12, width: '100%',
    },
    promoModalBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    },
    promoModalCancelBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    promoModalCancelText: {
        color: '#E4E4E7', fontSize: 14, fontWeight: '700',
    },
    promoModalSubmitBtn: {
        backgroundColor: '#FF6B35',
    },
    promoModalSubmitText: {
        color: '#fff', fontSize: 14, fontWeight: '800',
    },

    // Footer
    footer: { alignItems: 'center', marginTop: 12, paddingBottom: 20 },
    restoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, marginBottom: 12, borderRadius: 20, backgroundColor: 'rgba(255, 107, 53, 0.08)' },
    restoreBtnText: { fontSize: 13, color: '#FF6B35', fontWeight: '700' },
    footerText: { fontSize: 11, color: '#999', textAlign: 'center', marginBottom: 6 },
    footerSecure: { fontSize: 11, color: '#888', textAlign: 'center', fontWeight: '500' },

    emptyOfferings: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, opacity: 0.9 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a', marginTop: 16, marginBottom: 8 },
    emptyText: { color: '#666', fontSize: 13, textAlign: 'center', marginBottom: 24, paddingHorizontal: 40, lineHeight: 20 },
    reloadBtn: { backgroundColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
    reloadBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
