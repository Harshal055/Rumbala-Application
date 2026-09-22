/**
 * RevenueCat In-App Purchase Service (Mobile & Web)
 * 
 * Supports: 
 * - iOS/Android via react-native-purchases
 * - Web via @revenuecat/purchases-js
 * - Dare Cards (Consumables)
 * - Rumbala Pro (Subscriptions: Monthly, Yearly, Lifetime)
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { addUserCards } from './api';

// Dynamic imports to handle web vs native without breaking bundlers
let NativePurchases: any;
let WebPurchases: any;

if (Platform.OS !== 'web') {
    // Native SDK
    NativePurchases = require('react-native-purchases').default;
    const { LOG_LEVEL } = require('react-native-purchases');
    if (__DEV__) NativePurchases.setLogLevel(LOG_LEVEL.DEBUG);
} else {
    // Web SDK
    WebPurchases = require('@revenuecat/purchases-js').Purchases;
}

// ─── Configuration ─────────────────────────────────────────────
const REVENUECAT_API_KEY_APPLE =
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_API_KEY_GOOGLE =
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
const REVENUECAT_API_KEY_WEB =
    process.env.EXPO_PUBLIC_REVENUECAT_WEB_API_KEY;

export function isPlaceholderKey(key?: string | null): boolean {
    if (!key) return true;
    const clean = key.trim().toLowerCase();
    return (
        clean === '' ||
        clean.includes('your_') ||
        clean.includes('placeholder') ||
        clean.includes('dummy') ||
        clean.includes('example') ||
        clean.includes('xxxx')
    );
}

export function isRevenueCatConfigured(): boolean {
    if (Platform.OS === 'web') {
        return !isPlaceholderKey(REVENUECAT_API_KEY_WEB);
    }
    const key = Platform.OS === 'ios' ? REVENUECAT_API_KEY_APPLE : REVENUECAT_API_KEY_GOOGLE;
    return !isPlaceholderKey(key);
}

// Entitlements
export const ENTITLEMENT_PRO = 'Pro';
export const ENTITLEMENT_CARDS = 'dare_cards';

// Unified RevenueCat Product & Identifier Helpers (Native & Web)
export const rcProduct = (pkg: any) =>
    pkg?.rcBillingProduct ?? pkg?.storeProduct ?? pkg?.product ?? (typeof pkg === 'object' && (pkg?.priceString || pkg?.currentPrice) ? pkg : {});

export const rcProductId = (pkg: any): string => {
    if (!pkg) return '';
    if (typeof pkg === 'string') return pkg;
    const prod = rcProduct(pkg);
    return prod?.identifier ?? pkg?.storeProduct?.identifier ?? pkg?.product?.identifier ?? pkg?.identifier ?? '';
};

// ─── Mock Data for Development & Offline Fallback ───────────────
const MOCK_OFFERING = {
    current: {
        availablePackages: [
            {
                identifier: 'monthly',
                packageType: 'MONTHLY',
                isMock: true,
                product: {
                    identifier: 'monthly',
                    description: 'Full access to all features monthly',
                    title: 'Monthly Premium',
                    price: 99,
                    priceString: '₹99',
                    currencyCode: 'INR',
                    introPrice: null,
                }
            },
            {
                identifier: 'annual',
                packageType: 'ANNUAL',
                isMock: true,
                product: {
                    identifier: 'annual',
                    description: 'Full access to all features annually',
                    title: 'Annual Premium',
                    price: 999,
                    priceString: '₹999',
                    currencyCode: 'INR',
                    introPrice: {
                        price: 0,
                        priceString: 'Free',
                        period: 'P3D',
                        periodUnit: 'DAY',
                        periodNumberOfUnits: 3,
                        cycles: 1
                    },
                }
            },
            {
                identifier: 'lifetime',
                packageType: 'LIFETIME',
                isMock: true,
                product: {
                    identifier: 'lifetime',
                    description: 'Lifetime access to all features forever',
                    title: 'Lifetime Premium',
                    price: 2499,
                    priceString: '₹2,499',
                    currencyCode: 'INR',
                    introPrice: null,
                }
            },
            {
                identifier: 'dare_card_1',
                packageType: 'CUSTOM',
                isMock: true,
                product: {
                    identifier: 'dare_card_1',
                    description: 'Get 1 more dare to keep the spark alive',
                    title: '1 Dare Card',
                    price: 29,
                    priceString: '₹29',
                    currencyCode: 'INR',
                }
            },
            {
                identifier: 'dare_card_5',
                packageType: 'CUSTOM',
                isMock: true,
                product: {
                    identifier: 'dare_card_5',
                    description: 'Get 5 more dares to spice up the night',
                    title: '5 Dare Cards',
                    price: 79,
                    priceString: '₹79',
                    currencyCode: 'INR',
                }
            },
            {
                identifier: 'dare_card_10',
                packageType: 'CUSTOM',
                isMock: true,
                product: {
                    identifier: 'dare_card_10',
                    description: 'Unlock 10 dares and save 20%',
                    title: '10 Dare Cards',
                    price: 139,
                    priceString: '₹139',
                    currencyCode: 'INR',
                }
            },
            {
                identifier: 'dare_card_25',
                packageType: 'CUSTOM',
                isMock: true,
                product: {
                    identifier: 'dare_card_25',
                    description: 'The ultimate card hoard for true lovers',
                    title: '25 Dare Cards',
                    price: 279,
                    priceString: '₹279',
                    currencyCode: 'INR',
                }
            }
        ]
    }
};

// Product Mapping for Consumables
const PRODUCT_CARD_MAP: Record<string, number> = {
    consumable: 5,
    custom: 5,
    dare_card_1: 1,
    dare_card_5: 5,
    dare_card_10: 10,
    dare_card_25: 25,
    '5_pack': 5,
    '10_pack': 10,
    '25_pack': 25,
    'single': 1,
};

export function getCardsForProduct(productId: string): number {
    if (!productId) return 0;
    const lower = productId.toLowerCase();
    if (PRODUCT_CARD_MAP[lower] !== undefined) return PRODUCT_CARD_MAP[lower];
    
    // New Webhook Tiers
    if (lower.includes('600_cards') || lower.includes('600_pack') || lower.includes('card_600')) return 600;
    if (lower.includes('300_cards') || lower.includes('300_pack') || lower.includes('card_300')) return 300;
    if (lower.includes('150_cards') || lower.includes('150_pack') || lower.includes('card_150')) return 150;
    if (lower.includes('50_cards') || lower.includes('50_pack') || lower.includes('card_50')) return 50;
    
    // Legacy Tiers
    if (lower.includes('card_25') || lower.includes('25_pack') || lower.includes('25pack') || lower.includes('25_cards') || lower.includes('25pack')) return 25;
    if (lower.includes('card_10') || lower.includes('10_pack') || lower.includes('10pack') || lower.includes('10_cards') || lower.includes('10pack')) return 10;
    if (lower.includes('card_5') || lower.includes('5_pack') || lower.includes('5pack') || lower.includes('5_cards') || lower.includes('consumable') || lower === 'custom') return 5;
    if (lower.includes('card_1') || lower.includes('1_pack') || lower.includes('1pack') || lower.includes('single')) return 1;
    
    return 0;
}

let isInitialized = false;
let rcInstance: any = null; // Holds the active instance (Web or Native)
const PURCHASE_HISTORY_KEY = '@Rumbala_purchase_history';

export interface PurchaseHistoryRecord {
    id: string;
    date: string;
    productId: string;
    title: string;
    price: string;
    cardsAdded?: number;
    type: 'subscription' | 'consumable';
}

// ─── Initialize RevenueCat ─────────────────────────────────────
export async function initRevenueCat(userId?: string): Promise<void> {
    if (isInitialized) {
        if (userId && isRevenueCatConfigured()) await identifyUser(userId);
        return;
    }

    if (!isRevenueCatConfigured()) {
        if (__DEV__) {
            console.log('ℹ️ RevenueCat in mock/dev mode (placeholder or missing API key detected in .env)');
        }
        isInitialized = true;
        return;
    }

    try {
        if (Platform.OS === 'web') {
            if (!REVENUECAT_API_KEY_WEB || isPlaceholderKey(REVENUECAT_API_KEY_WEB)) {
                isInitialized = true;
                return;
            }
            // Web Initialization
            rcInstance = WebPurchases.configure(REVENUECAT_API_KEY_WEB, userId || undefined);
            if (__DEV__) console.log('🌐 RevenueCat Web initialized');
        } else {
            // Native Initialization
            const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_APPLE : REVENUECAT_API_KEY_GOOGLE;
            if (!apiKey || isPlaceholderKey(apiKey)) {
                isInitialized = true;
                return;
            }
            NativePurchases.configure({ apiKey, appUserID: userId || undefined });
            rcInstance = NativePurchases;
            if (__DEV__) console.log('📱 RevenueCat Native initialized');
        }

        isInitialized = true;

        if (userId) await identifyUser(userId);
    } catch (error: any) {
        console.error('❌ RevenueCat init error:', error.message);
        isInitialized = true;
    }
}

// ─── Identify User ─────────────────────────────────────────────
export async function identifyUser(userId: string): Promise<void> {
    if (!isRevenueCatConfigured() || !rcInstance) {
        return;
    }
    try {
        if (Platform.OS === 'web') {
            await rcInstance.changeUser(userId);
        } else {
            await rcInstance.logIn(userId);
        }
        if (__DEV__) console.log('👤 RevenueCat user identified:', userId);
    } catch (error: any) {
        console.error('❌ RevenueCat identify error:', error.message);
    }
}

// ─── Get Offerings (Paywall/Products) ──────────────────────────
export async function getOfferings(): Promise<any | null> {
    try {
        if (!isRevenueCatConfigured() || !rcInstance) {
            return MOCK_OFFERING;
        }

        if (!isInitialized) {
            const userId = useStore.getState().userId;
            await initRevenueCat(userId || undefined);
        }

        if (Platform.OS === 'web') {
            const offerings = await rcInstance.getOfferings();
            if (offerings?.current?.availablePackages && offerings.current.availablePackages.length > 0) {
                return offerings;
            }
            return MOCK_OFFERING;
        } else {
            const offerings = await rcInstance.getOfferings();
            
            if (offerings?.current?.availablePackages && offerings.current.availablePackages.length > 0) {
                if (__DEV__) {
                    console.log('📱 RC NATIVE: CURRENT OFFERING PACKAGES:');
                    offerings.current.availablePackages.forEach((pkg: any) => {
                        console.log(`   - ID: ${pkg.identifier} | ProductID: ${rcProductId(pkg)} | Price: ${rcProduct(pkg)?.priceString}`);
                    });
                }

                // Check if we have consumable dare pack packages in the active offering
                const hasConsumables = offerings.current.availablePackages.some((pkg: any) => {
                    const id = rcProductId(pkg).toLowerCase();
                    const pkgId = (pkg?.identifier || '').toLowerCase();
                    const type = (pkg?.packageType || '').toUpperCase();
                    return type === 'CUSTOM' || type === 'UNKNOWN' || pkgId === 'custom' || /(card_|pack|consumable)/i.test(id) || /(card_|pack|consumable)/i.test(pkgId);
                });

                if (!hasConsumables) {
                    // If Google Play hasn't propagated consumable in-app products to device cache yet,
                    // seamlessly merge the fallback dare packs so the shop tab is never empty
                    const mockConsumables = MOCK_OFFERING.current.availablePackages.filter((p: any) => p.packageType === 'CUSTOM');
                    return {
                        ...offerings,
                        current: {
                            ...offerings.current,
                            availablePackages: [...offerings.current.availablePackages, ...mockConsumables]
                        }
                    };
                }

                return offerings;
            }

            // If empty or null from store, return standard offerings fallback
            return MOCK_OFFERING;
        }
    } catch (error: any) {
        console.error('❌ Failed to load offerings:', error?.message || error);
        return MOCK_OFFERING;
    }
}

// ─── Purchase a Package ────────────────────────────────────────
// pkg is either a string (ProductId), a Native Package, or a Web Package
export async function purchasePackage(pkg: any): Promise<{ success: boolean; cardsAdded?: number; error?: string }> {
    try {
        if (!isInitialized) {
            await initRevenueCat(useStore.getState().userId || undefined);
        }

        const prod = rcProduct(pkg);
        const productId = typeof pkg === 'string' ? pkg : (prod?.identifier || pkg?.identifier || '');
        const pkgIdentifier = typeof pkg === 'string' ? pkg : (pkg?.identifier || '');

        let cardsAdded = getCardsForProduct(productId);
        if (cardsAdded === 0 && pkgIdentifier) {
            cardsAdded = getCardsForProduct(pkgIdentifier);
        }

        // 🛠️ Mock / Offline Fallback Purchase Handling
        const isMockPurchase =
            pkg?.isMock ||
            !isRevenueCatConfigured() ||
            !rcInstance ||
            (__DEV__ && (pkgIdentifier === 'monthly' || pkgIdentifier === 'annual' || pkgIdentifier === 'lifetime'));

        if (isMockPurchase) {
            // 🔒 SAFETY: never complete a fake purchase in a production build if live keys are configured.
            if (pkg?.isMock && !__DEV__ && isRevenueCatConfigured()) {
                return {
                    success: false,
                    error: 'The store is still getting ready. Please try again in a moment.',
                };
            }
            if (__DEV__) console.log('🛠️ Handling mock package purchase...', { productId, pkgIdentifier, cardsAdded });
            await new Promise(resolve => setTimeout(resolve, 800));
            if (cardsAdded > 0) {
                handleConsumableSuccess(cardsAdded, productId || pkgIdentifier, pkg);
                return { success: true, cardsAdded };
            } else {
                await appendPurchaseHistory(pkg, { productId: productId || pkgIdentifier, type: 'subscription' });
                const store = useStore.getState();
                const expiry = (pkgIdentifier === 'lifetime' || productId.includes('lifetime')) ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                store.setIsPro(true, expiry);
                return { success: true };
            }
        }

        if (__DEV__) console.log(`🛒 Purchasing ${productId || pkgIdentifier}...`, { pkg });

        let customerInfo;
        if (Platform.OS === 'web') {
            customerInfo = typeof pkg === 'string' 
                ? await rcInstance.purchaseProduct(pkg) 
                : await rcInstance.purchasePackage(pkg);
        } else {
            // Native Purchase (Google Play / App Store)
            if (typeof pkg === 'object' && pkg?.identifier && (pkg?.product || pkg?.storeProduct)) {
                const result = await NativePurchases.purchasePackage(pkg);
                customerInfo = result.customerInfo;
            } else if (typeof pkg === 'object' && (pkg?.storeProduct || pkg?.product)) {
                const storeProd = pkg.storeProduct || pkg.product;
                if (NativePurchases.purchaseStoreProduct) {
                    const result = await NativePurchases.purchaseStoreProduct(storeProd);
                    customerInfo = result.customerInfo;
                } else {
                    const result = await NativePurchases.purchaseProduct(storeProd.identifier);
                    customerInfo = result.customerInfo;
                }
            } else {
                const targetId = productId || (typeof pkg === 'string' ? pkg : '');
                const result = await NativePurchases.purchaseProduct(targetId);
                customerInfo = result.customerInfo;
            }
        }

        // If it was a dare card consumable, always grant the cards upon successful store transaction!
        if (cardsAdded > 0) {
            handleConsumableSuccess(cardsAdded, productId || pkgIdentifier || 'dare_card', pkg);
            return { success: true, cardsAdded };
        }

        // Must be a subscription (Rumbala Pro)
        const proDetails = getProEntitlementDetails(customerInfo);
        if (proDetails.isPro) {
            await appendPurchaseHistory(pkg, { productId, type: 'subscription' });
            const store = useStore.getState();
            store.setIsPro(true, proDetails.expiresAt);
            if (store.userId) {
                const api = await import('./api');
                api.syncProStatusToBackend(store.userId, true, proDetails.expiresAt).catch((e: any) => console.warn('Pro backend sync error:', e));
            }
        }
        return { success: proDetails.isPro };
    } catch (error: any) {
        if (error.userCancelled) {
            if (__DEV__) console.log('🚫 Purchase cancelled by user');
            return { success: false, error: 'Purchase cancelled' };
        }
        const raw = (error.message || String(error || '')).trim();
        let formatted = raw || 'The purchase could not be completed. Please try again.';

        if (/network|offline|internet|connection|failed to fetch/i.test(raw)) {
            formatted = 'Unable to reach payment services. Please check your internet connection and try again.';
        } else if (/store_problem|play store|billing.*unavailable/i.test(raw)) {
            formatted = 'App store billing is temporarily unavailable. Please try again in a few moments.';
        } else if (/payment_pending/i.test(raw)) {
            formatted = 'Payment is pending confirmation. Your access will activate as soon as it clears.';
        }

        console.error('❌ Purchase error:', formatted);
        return { success: false, error: formatted };
    }
}

// ─── Get Pro Entitlement Details (Status + Expiration) ─────────
export function getProEntitlementDetails(customerInfo: any): { isPro: boolean; expiresAt: string | null; productIdentifier?: string } {
    if (!customerInfo || !customerInfo.entitlements || !customerInfo.entitlements.active) {
        return { isPro: false, expiresAt: null };
    }

    const activeEntitlements = customerInfo.entitlements.active;
    const ent = activeEntitlements[ENTITLEMENT_PRO] || 
                activeEntitlements['Rumbala Pro'] || 
                activeEntitlements['Pro'] || 
                activeEntitlements['pro'] || 
                activeEntitlements['premium'];

    if (ent) {
        return {
            isPro: true,
            expiresAt: ent.expirationDate || null,
            productIdentifier: ent.productIdentifier || ent.identifier,
        };
    }
    return { isPro: false, expiresAt: null };
}

// ─── Check Pro Entitlement ─────────────────────────────────────
export function checkProEntitlement(customerInfo: any): boolean {
    return getProEntitlementDetails(customerInfo).isPro;
}

// ─── Restore Purchases ─────────────────────────────────────────
export async function restorePurchases(): Promise<any> {
    if (!isRevenueCatConfigured() || !rcInstance) {
        if (__DEV__) console.log('ℹ️ restorePurchases called in mock mode — returning empty mock info');
        return { entitlements: { active: {} } };
    }
    try {
        let customerInfo;
        if (Platform.OS === 'web') {
            customerInfo = await rcInstance.getCustomerInfo();
        } else {
            customerInfo = await NativePurchases.restorePurchases();
        }
        if (__DEV__) console.log('🔄 Purchases restored');
        return customerInfo;
    } catch (error: any) {
        console.error('❌ Restore error:', error.message || error);
        const raw = error.message || '';
        if (/network|offline|internet|connection|failed to fetch/i.test(raw)) {
            throw new Error('Unable to connect to the app store. Please check your internet connection.');
        }
        throw error;
    }
}

// ─── Get Customer Info ─────────────────────────────────────────
export async function getCustomerInfo(): Promise<any | null> {
    if (!isRevenueCatConfigured() || !rcInstance) {
        return { entitlements: { active: {} } };
    }
    try {
        if (!isInitialized) {
            const userId = useStore.getState().userId;
            await initRevenueCat(userId || undefined);
        }

        if (Platform.OS === 'web') {
            return await rcInstance.getCustomerInfo();
        } else {
            return await NativePurchases.getCustomerInfo();
        }
    } catch (error: any) {
        console.error('❌ Customer info error:', error.message);
        return null;
    }
}

// ─── Customer Center (Native Only) ─────────────────────────────
export async function showCustomerCenter(): Promise<void> {
    if (Platform.OS === 'web') {
        console.warn('Customer Center is not available on Web natively via SDK.');
        return;
    }

    if (!isRevenueCatConfigured() || !rcInstance) {
        if (__DEV__) console.log('Customer Center not available in mock mode.');
        return;
    }

    try {
        const RevenueCatUI = require('react-native-purchases-ui').default;
        if (RevenueCatUI && RevenueCatUI.presentCustomerCenter) {
            await RevenueCatUI.presentCustomerCenter();
        } else {
            console.warn('Customer Center is not supported on this SDK version or platform.');
        }
    } catch (error: any) {
        console.error('❌ Failed to open Customer Center:', error.message);
    }
}

// ─── Helper: Post-Purchase Card Sync ───────────────────────────
function handleConsumableSuccess(cardsAdded: number, productId: string, pkg?: any) {
    // 1. Optimistic Local Update
    const store = useStore.getState();
    const newCount = (store.cardCount || 0) + cardsAdded;
    store.setCardCount(newCount);

    // 2. Persist to Supabase database via the add_purchased_cards RPC
    // As designed in AGENTS.md, consumable cards are granted client-side via
    // add_purchased_cards (which validates SKU, bounds counts, and writes to purchases atomically).
    if (store.userId) {
        addUserCards(store.userId, cardsAdded, productId).then((res: any) => {
            if (res?.card_count !== undefined) {
                store.setCardCount(res.card_count);
            }
        }).catch((err) => {
            console.warn('Post-purchase card sync to DB error:', err);
        });
    }

    appendPurchaseHistory(pkg, { productId, type: 'consumable', cardsAdded }).catch(() => null);
    if (__DEV__) console.log(`🎉 Purchase complete! +${cardsAdded} cards (optimistic total: ${newCount})`);
}

async function appendPurchaseHistory(pkg: any, extras: { productId: string; type: 'subscription' | 'consumable'; cardsAdded?: number }) {
    try {
        const product = pkg?.product;
        const historyRaw = await AsyncStorage.getItem(PURCHASE_HISTORY_KEY);
        const history: PurchaseHistoryRecord[] = historyRaw ? JSON.parse(historyRaw) : [];
        const nextRecord: PurchaseHistoryRecord = {
            id: `${Date.now()}_${extras.productId}`,
            date: new Date().toISOString(),
            productId: extras.productId,
            title: product?.title || extras.productId,
            price: product?.priceString || 'N/A',
            cardsAdded: extras.cardsAdded,
            type: extras.type,
        };
        const nextHistory = [nextRecord, ...history].slice(0, 30);
        await AsyncStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(nextHistory));
    } catch (error: any) {
        console.warn('Failed to persist purchase history:', error?.message || error);
    }
}

export async function getPurchaseHistory(): Promise<PurchaseHistoryRecord[]> {
    try {
        const historyRaw = await AsyncStorage.getItem(PURCHASE_HISTORY_KEY);
        return historyRaw ? JSON.parse(historyRaw) : [];
    } catch {
        return [];
    }
}

