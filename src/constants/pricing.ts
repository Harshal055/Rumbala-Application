import { PurchasesPackage } from 'react-native-purchases';
import { rcProductId } from '../services/revenueCatService';

export type PackageKind = 'annual' | 'monthly' | 'lifetime' | 'consumable' | 'unknown';

export const PAYWALL_FEATURES = [
    { id: 'unlimited_cards', title: 'Unlimited Cards', desc: 'Never run out of dares', icon: 'infinite' },
    { id: 'ldr_access', title: 'Video Calls', desc: 'Secure LDR sessions', icon: 'videocam' },
    { id: 'spicy_content', title: 'Spicy Content', desc: 'Exclusive dirty dares', icon: 'flame' },
    { id: 'custom_themes', title: 'Custom Themes', desc: 'Personalize your game', icon: 'color-palette' },
] as const;

export const getPackageKind = (pkg: any): PackageKind => {
    const identifier = rcProductId(pkg).toLowerCase();
    const pkgId = (pkg?.identifier || '').toLowerCase();
    if (pkg?.packageType === 'LIFETIME' || /lifetime/.test(identifier) || /lifetime/.test(pkgId)) return 'lifetime';
    if (pkg?.packageType === 'ANNUAL' || /annual|year/.test(identifier) || /annual|year/.test(pkgId)) return 'annual';
    if (pkg?.packageType === 'MONTHLY' || /month/.test(identifier) || /month/.test(pkgId)) return 'monthly';
    if (pkg?.packageType === 'CUSTOM' || pkg?.packageType === 'UNKNOWN' || /(card_|pack|consumable|custom)/.test(identifier) || /(card_|pack|consumable|custom)/.test(pkgId)) return 'consumable';
    return 'unknown';
};

export const resolvePlanPackages = (availablePackages: PurchasesPackage[] = []) => {
    const lifetime = availablePackages.find((pkg) => getPackageKind(pkg) === 'lifetime') || null;
    const annual = availablePackages.find((pkg) => getPackageKind(pkg) === 'annual') || null;
    const monthly = availablePackages.find((pkg) => getPackageKind(pkg) === 'monthly') || null;
    return { lifetime, annual, monthly };
};

export const inferPeriodLabel = (priceString: string, kind: 'annual' | 'monthly' | 'lifetime') => {
    // The caller strips any existing "/period" off the price before rendering
    // (price.split('/')[0]) and appends this suffix, so always return a suffix
    // for the plan kind — returning '' here left fallback prices like
    // "₹999/year" rendering as a bare "₹999" with no period.
    if (kind === 'annual') return '/yr';
    if (kind === 'monthly') return '/mo';
    return '';
};
