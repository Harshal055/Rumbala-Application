// Runnable self-check for the RevenueCat product->cards money path.
// Mirrors getCardsForProduct / rcProductId in revenueCatService.ts.
// Run: node src/services/revenueCatService.selfcheck.mjs
const PRODUCT_CARD_MAP = { consumable: 5, custom: 5, dare_card_1: 1, dare_card_5: 5, dare_card_10: 10, dare_card_25: 25, '5_pack': 5, '10_pack': 10, '25_pack': 25, single: 1 };
const rcProduct = (pkg) => pkg?.rcBillingProduct ?? pkg?.storeProduct ?? pkg?.product ?? (typeof pkg === 'object' && (pkg?.priceString || pkg?.currentPrice) ? pkg : {});
const rcProductId = (pkg) =>
  typeof pkg === 'string' ? pkg : (rcProduct(pkg)?.identifier ?? pkg?.storeProduct?.identifier ?? pkg?.product?.identifier ?? pkg?.identifier ?? '');
function getCardsForProduct(id) {
  if (!id) return 0;
  const l = id.toLowerCase();
  if (PRODUCT_CARD_MAP[l] !== undefined) return PRODUCT_CARD_MAP[l];
  if (l.includes('card_25') || l.includes('25_pack') || l.includes('25pack') || l.includes('25_cards')) return 25;
  if (l.includes('card_10') || l.includes('10_pack') || l.includes('10pack') || l.includes('10_cards')) return 10;
  if (l.includes('card_5') || l.includes('5_pack') || l.includes('5pack') || l.includes('5_cards') || l.includes('consumable') || l === 'custom') return 5;
  if (l.includes('card_1') || l.includes('1_pack') || l.includes('1pack') || l.includes('single')) return 1;
  return 0;
}
const eq = (a, b, m) => { if (a !== b) { console.error('FAIL', m, 'expected', b, 'got', a); process.exit(1); } };

eq(getCardsForProduct('dare_card_25'), 25, 'exact 25');
eq(getCardsForProduct('dare_card_1'), 1, 'exact 1');
eq(getCardsForProduct('custom'), 5, 'custom lookup key -> 5');
eq(getCardsForProduct('com.rumbala.card_10_pack'), 10, 'fuzzy 10');
eq(getCardsForProduct('DARE_25PACK'), 25, 'case-insensitive 25');
eq(getCardsForProduct('monthly_consumable'), 5, 'consumable->5');
eq(getCardsForProduct('card_25'), 25, '25 not misread as 5');
eq(getCardsForProduct('annual_pro'), 0, 'subscription -> 0 cards');
eq(getCardsForProduct(''), 0, 'empty -> 0');
eq(rcProductId('raw_id'), 'raw_id', 'string passthrough');
eq(rcProductId({ product: { identifier: 'native_x' } }), 'native_x', 'native shape');
eq(rcProductId({ storeProduct: { identifier: 'store_x' } }), 'store_x', 'RN Purchases 9.x storeProduct shape');
eq(rcProductId({ rcBillingProduct: { identifier: 'web_x' } }), 'web_x', 'web shape');
eq(rcProductId({ identifier: 'pkg_x' }), 'pkg_x', 'pkg fallback');
eq(rcProductId({}), '', 'empty pkg is safe');
console.log('OK: all money-path assertions passed');
