# PAYMENT_WEBHOOKS Fix Plan

## Changes

- None required. Receipt validation and entitlement verification are handled server-side via RevenueCat.

## Verification goals

- [x] Purchases verified via Google Play / App Store cryptographic receipts
- [x] Pro entitlements validated against RevenueCat customer info
- [x] Mock purchases strictly disabled in production builds (`__DEV__` guarded)

## Manual verification (for the human)

- Test real or sandbox purchase in Google Play internal test track to confirm receipt verification.
