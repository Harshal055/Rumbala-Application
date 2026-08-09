# Purchase Flow Review — Rumbala

_Reviewed: 7 Aug 2026 · Scope: in-app purchase / subscription ("Pro") and dare-card flow_

## How the flow works

Purchases run through **RevenueCat** (`src/services/revenueCatService.ts`), which wraps the native iOS/Android SDK and the web SDK behind one interface. The legacy `src/services/iap.ts` just delegates to it.

The flow has three entry points, all calling the same `purchasePackage()`:

1. **`app/subscription.tsx`** — the full-screen paywall (annual / monthly Pro).
2. **`src/components/PaywallModal.tsx`** — the inline popup shown on the Home and LDR tabs when a gated feature is hit.
3. **`app/(tabs)/shop.tsx`** — the shop tab, for both Pro subscriptions and consumable dare-card packs.

A purchase resolves like this: `getOfferings()` loads products (falling back to `MOCK_OFFERING` if the store returns nothing) → the user picks a package → `purchasePackage()` runs the store transaction → consumables grant cards via `handleConsumableSuccess()` → `addUserCards()` (Supabase RPC); subscriptions read the RevenueCat entitlement, call `setIsPro()` (Zustand store, persisted to AsyncStorage) and `syncProStatusToBackend()` (Supabase). On launch, `app/_layout.tsx` and `postAuthSync()` re-verify Pro from RevenueCat and reconcile with Supabase. `drawCard()` in the store decrements cards only for non-Pro users.

Overall the architecture is sound and consistent. The issues below were found in the edges.

## Issues found and fixed

### 1. Fake purchases could grant real cards / Pro in production — **Critical, fixed**

When `getOfferings()` failed or the store returned no packages, it returned `MOCK_OFFERING` with `isMock: true` — **on production builds, not just dev.** `purchasePackage()` then took its mock branch for any `isMock` package and granted cards for free (writing them to the backend) and returned success, with no real transaction. So any user whose RevenueCat offerings failed to load would see purchasable products they could "buy" for nothing.

**Fix:** `purchasePackage()` now refuses to complete an `isMock` purchase in a production build and returns "The store is still getting ready. Please try again in a moment." Dev/offline testing behavior is unchanged (`revenueCatService.ts`).

### 2. Inline paywall popups didn't verify or persist Pro — **Fixed**

`handlePaywallSubscribe` on the Home and LDR tabs did `setIsPro(true)` on any success — without reading the actual entitlement, without an expiry date, and without syncing to Supabase. Pro unlocked locally but the backend never knew, and it would be treated as never-expiring until the next launch re-check.

**Fix:** both handlers now read the entitlement via `getCustomerInfo()`/`getProEntitlementDetails()`, pass the real `expiresAt`, sync to the backend, and show a "Purchase Pending" message if the entitlement hasn't synced yet — matching the shop and subscription screens (`app/(tabs)/index.tsx`, `app/(tabs)/ldr.tsx`).

### 3. Subscription screen always showed "Purchase Pending" in dev/offline — **Fixed**

After a successful mock/dev subscription purchase, `subscription.tsx` re-checked the real (empty) customer info, found no entitlement, and always showed "Purchase Pending" — inconsistent with the shop, which trusts the mock result in dev.

**Fix:** `handleStartTrial` now also accepts a mock/`__DEV__` success (`app/subscription.tsx`).

### 4. Annual price lost its "/yr" suffix on fallback prices — **Fixed (cosmetic)**

`inferPeriodLabel()` returned an empty suffix when the price string already contained a period (e.g. the fallback `₹999/year`), but the caller had already stripped the period off for display — so the annual card rendered a bare "₹999" with no "/yr".

**Fix:** `inferPeriodLabel()` now always returns the correct suffix for the plan kind (`src/constants/pricing.ts`).

## Open item — needs a product decision (not changed)

**Lifetime plan is advertised but never shown.** The service header documents "Subscriptions: Monthly, Yearly, Lifetime" and the entitlement logic already supports a non-expiring (lifetime) entitlement, but `resolvePlanPackages()` and `getPackageKind()` only recognize annual and monthly. A Lifetime package configured in RevenueCat is classified as `unknown` and never appears on the main subscription paywall. If a Lifetime tier is intended, the pricing resolver and the paywall UI need a `lifetime` case added — that's a feature/UI decision rather than a bug fix, so I left it for you.

## Verification

TypeScript compiles clean across the whole project (`tsc --noEmit` → 0 errors) after all changes.

## Files changed

- `src/services/revenueCatService.ts` — block mock purchases in production
- `app/(tabs)/index.tsx` — verify + sync Pro from inline paywall
- `app/(tabs)/ldr.tsx` — verify + sync Pro from inline paywall
- `app/subscription.tsx` — accept mock/dev success
- `src/constants/pricing.ts` — fix period suffix
