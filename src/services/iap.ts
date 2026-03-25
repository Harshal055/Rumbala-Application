/**
 * IAP Service — delegates to RevenueCat
 * 
 * This file is kept for backward compatibility with existing imports.
 * All purchases now go through services/revenueCatService.ts
 */

import { useStore } from '../store/useStore';
import { getOfferings, purchasePackage } from './revenueCatService';

// Product IDs (kept for reference / future App Store/Play Store)
export const itemSKUs = [
    'Rumbala_card_1',   // ₹5  → 1 card
    'Rumbala_card_5',   // ₹19 → 5 cards
    'Rumbala_card_10',  // ₹39 → 10 cards
    'Rumbala_card_25',  // ₹89 → 25 cards
];

export const initIAP = async () => {
    console.log('IAP: Using RevenueCat (App Store / Play Store)');
};

/**
 * Buy cards through RevenueCat offerings.
 */
export const buyCards = async (sku: string): Promise<boolean> => {
    const offerings = await getOfferings();
    const current = offerings?.current || offerings;
    const pkg = current?.availablePackages?.find((p: any) => p?.product?.identifier === sku);

    if (!pkg) {
        useStore.getState().showAlert('Store Not Ready', 'Product not found or offerings not loaded yet.');
        return false;
    }

    const result = await purchasePackage(pkg);
    if (!result.success) {
        if (result.error && result.error !== 'Purchase cancelled') {
            useStore.getState().showAlert('Purchase Failed', result.error);
        }
        return false;
    }

    useStore.getState().showAlert('Success! 🎉', `${result.cardsAdded || 0} new dare cards added!`);
    return true;
};

