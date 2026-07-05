import { PurchasesPackage } from 'react-native-purchases';

export type PackageKind = 'annual' | 'monthly' | 'consumable' | 'unknown';

export const PAYWALL_FEATURES = [
    { id: 'unlimited_cards', title: 'Unlimited Cards', desc: 'Never run out of dares', icon: 'infinite' },
    { id: 'ldr_access', title: 'Video Calls', desc: 'Secure LDR sessions', icon: 'videocam' },
    { id: 'spicy_content', title: 'Spicy Content', desc: 'Exclusive dirty dares', icon: 'flame' },
    { id: 'custom_themes', title: 'Custom Themes', desc: 'Personalize your game', icon: 'color-palette' },
] as const;

export const getPackageKind = (pkg: PurchasesPackage): PackageKind => {
    const identifier = pkg.product.identifier.toLowerCase();
    if (pkg.packageType === 'ANNUAL' || /annual|year/.test(identifier)) return 'annual';
    if (pkg.packageType === 'MONTHLY' || /month/.test(identifier)) return 'monthly';
    if (pkg.packageType === 'CUSTOM') return 'consumable';
    return 'unknown';
};

export const resolvePlanPackages = (availablePackages: PurchasesPackage[] = []) => {
    const annual = availablePackages.find((pkg) => getPackageKind(pkg) === 'annual') || null;
    const monthly = availablePackages.find((pkg) => getPackageKind(pkg) === 'monthly') || null;
    return { annual, monthly };
};

export const inferPeriodLabel = (priceString: string, kind: 'annual' | 'monthly') => {
    if (/\/(yr|year|yearly)/i.test(priceString)) return '';
    if (/\/(mo|month|monthly)/i.test(priceString)) return '';
    return kind === 'annual' ? '/yr' : '/mo';
};
