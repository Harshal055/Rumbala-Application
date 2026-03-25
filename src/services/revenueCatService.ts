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

// Entitlements
export const ENTITLEMENT_PRO = 'Pro';
export const ENTITLEMENT_CARDS = 'dare_cards';

// ─── Mock Data for Development ────────────────────────────────
const MOCK_OFFERING = {
    current: {
        availablePackages: [
            {
                identifier: 'monthly',
                packageType: 'MONTHLY',
                isMock: true,
                product: {
                    identifier: 'monthly_premium',
                    description: 'Full access to all features monthly',
                    title: 'Monthly Premium',
                    price: 9.99,
                    priceString: '$9.99',
                    currencyCode: 'USD',
                    introPrice: null,
                }
            },
            {
                identifier: 'annual',
                packageType: 'ANNUAL',
                isMock: true,
                product: {
                    identifier: 'annual_premium',
                    description: 'Full access to all features annually',
                    title: 'Annual Premium',
                    price: 59.99,
                    priceString: '$59.99',
                    currencyCode: 'USD',
                    introPrice: {
                        price: 0,
                        priceString: 'Free',
                        period: 'P3D',
                        periodUnit: 'DAY',
                        periodNumberOfUnits: 3,
                        cycles: 1
                    },
                }
            }
        ]
    }
};

// Product Mapping for Consumables
const PRODUCT_CARD_MAP: Record<string, number> = {
    dare_card_1: 1,
    dare_card_5: 5,
    dare_card_10: 10,
    dare_card_25: 25,
};

let isInitialized = false;
let rcInstance: any = null; // Holds the active instance (Web or Native)

// ─── Initialize RevenueCat ─────────────────────────────────────
export async function initRevenueCat(userId?: string): Promise<void> {
    if (isInitialized) {
        if (userId) await identifyUser(userId);
        return;
    }

    try {
        if (Platform.OS === 'web') {
            if (!REVENUECAT_API_KEY_WEB) {
                throw new Error('Missing EXPO_PUBLIC_REVENUECAT_WEB_API_KEY');
            }
            // Web Initialization
            rcInstance = WebPurchases.configure(REVENUECAT_API_KEY_WEB, userId || undefined);
            console.log('🌐 RevenueCat Web initialized');
        } else {
            // Native Initialization
            const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_APPLE : REVENUECAT_API_KEY_GOOGLE;
            if (!apiKey) {
                throw new Error(
                    Platform.OS === 'ios'
                        ? 'Missing EXPO_PUBLIC_REVENUECAT_IOS_API_KEY'
                        : 'Missing EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY',
                );
            }
            NativePurchases.configure({ apiKey, appUserID: userId || undefined });
            rcInstance = NativePurchases;
            console.log('📱 RevenueCat Native initialized');
        }

        isInitialized = true;

        if (userId) await identifyUser(userId);
    } catch (error: any) {
        console.error('❌ RevenueCat init error:', error.message);
    }
}

// ─── Identify User ─────────────────────────────────────────────
export async function identifyUser(userId: string): Promise<void> {
    try {
        if (Platform.OS === 'web') {
            await rcInstance.changeUser(userId);
        } else {
            await rcInstance.logIn(userId);
        }
        console.log('👤 RevenueCat user identified:', userId);
    } catch (error: any) {
        console.error('❌ RevenueCat identify error:', error.message);
    }
}

// ─── Get Offerings (Paywall/Products) ──────────────────────────
export async function getOfferings(): Promise<any | null> {
    try {
        if (!isInitialized) {
            const userId = useStore.getState().userId;
            await initRevenueCat(userId || undefined);
        }

        if (Platform.OS === 'web') {
            const offerings = await rcInstance.getOfferings();
            return offerings || null;
        } else {
            const offerings = await rcInstance.getOfferings();
            
            // If the offering is valid but empty, it might still throw or return empty
            if (!offerings?.current || offerings.current.availablePackages.length === 0) {
                console.warn('⚠️ No current offering found, checking for mock fallback...');
                if (__DEV__) return MOCK_OFFERING;
            }

            console.log('📦 Offerings loaded:', Object.keys(offerings?.all || {}).length, 'found');
            return offerings || null;
        }
    } catch (error: any) {
        console.error('❌ Failed to load offerings:', error.message);
        console.error('🔍 Error Details:', JSON.stringify(error, null, 2));
        
        // Fallback to mock in development if configuration error occurs
        if (__DEV__) {
            console.log('🛠️ Using MOCK_OFFERING for development testing');
            return MOCK_OFFERING;
        }
        return null;
    }
}

// ─── Purchase a Package ────────────────────────────────────────
// pkg is either a string (ProductId), a Native Package, or a Web Package
export async function purchasePackage(pkg: any): Promise<{ success: boolean; cardsAdded?: number; error?: string }> {
    try {
        if (!isInitialized) {
            await initRevenueCat(useStore.getState().userId || undefined);
        }

        // 🛠️ Mock Purchase Safety (Development Only)
        // If the package is from our mock data, don't call the native SDK
        if (__DEV__ && (pkg?.identifier === 'monthly' || pkg?.identifier === 'annual' || pkg?.isMock)) {
            console.log('🛠️ Simulating successful MOCK purchase...');
            // Simulate a delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const productId = typeof pkg === 'string' ? pkg : (pkg?.product?.identifier || 'mock_pro');
            const cardsAdded = PRODUCT_CARD_MAP[productId] || 0;
            if (cardsAdded > 0) handleConsumableSuccess(cardsAdded, productId);
            
            return { success: true, cardsAdded: cardsAdded > 0 ? cardsAdded : undefined };
        }

        console.log(`🛒 Purchasing ${typeof pkg === 'string' ? pkg : pkg?.identifier || 'package'}...`);

        let customerInfo;
        if (Platform.OS === 'web') {
            customerInfo = typeof pkg === 'string' 
                ? await rcInstance.purchaseProduct(pkg) 
                : await rcInstance.purchasePackage(pkg);
        } else {
            // Native Purchase (Google Play / App Store)
            if (typeof pkg === 'string') {
                const result = await NativePurchases.purchaseProduct(pkg);
                customerInfo = result.customerInfo;
            } else {
                const result = await NativePurchases.purchasePackage(pkg);
                customerInfo = result.customerInfo;
            }
        }

        // Check if it was a dare card consumable
        const productId = typeof pkg === 'string' 
            ? pkg 
            : (Platform.OS === 'web' ? pkg.rcBillingProduct.identifier : pkg.product.identifier);
            
        const cardsAdded = PRODUCT_CARD_MAP[productId] || 0;

        if (cardsAdded > 0) {
            handleConsumableSuccess(cardsAdded, productId);
            return { success: true, cardsAdded };
        }

        // Must be a subscription (Rumbala Pro)
        const hasPro = checkProEntitlement(customerInfo);
        return { success: !!hasPro };
    } catch (error: any) {
        if (error.userCancelled) {
            console.log('🚫 Purchase cancelled by user');
            return { success: false, error: 'Purchase cancelled' };
        }
        console.error('❌ Purchase error:', error.message || error);
        return { success: false, error: error.message || 'The purchase could not be completed. Please try again.' };
    }
}

// ─── Check Pro Entitlement ─────────────────────────────────────
export function checkProEntitlement(customerInfo: any): boolean {
    if (!customerInfo || !customerInfo.entitlements || !customerInfo.entitlements.active) return false;

    // Check if 'Rumbala Pro' entitlement is active
    return customerInfo.entitlements.active[ENTITLEMENT_PRO] !== undefined;
}

// ─── Restore Purchases ─────────────────────────────────────────
export async function restorePurchases(): Promise<any | null> {
    try {
        let customerInfo;
        if (Platform.OS === 'web') {
            // Web doesn't strictly have a "restore purchases" like Apple/Google, it reads from the logged-in user
            customerInfo = await rcInstance.getCustomerInfo();
        } else {
            customerInfo = await NativePurchases.restorePurchases();
        }
        console.log('🔄 Purchases restored');
        return customerInfo;
    } catch (error: any) {
        console.error('❌ Restore error:', error.message);
        return null;
    }
}

// ─── Get Customer Info ─────────────────────────────────────────
export async function getCustomerInfo(): Promise<any | null> {
    try {
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
function handleConsumableSuccess(cardsAdded: number, productId: string) {
    const store = useStore.getState();
    const newCount = (store.cardCount || 0) + cardsAdded;
    store.setCardCount(newCount);

    const userId = store.userId;
    if (userId) {
        addUserCards(userId, cardsAdded, productId).catch((err: any) => {
            console.warn('Card sync failed after purchase:', err.message);
        });
    }
    console.log(`🎉 Purchase complete! +${cardsAdded} cards (total: ${newCount})`);
}

