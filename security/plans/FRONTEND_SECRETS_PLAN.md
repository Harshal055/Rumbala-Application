# FRONTEND_SECRETS Fix Plan

## Changes

- None required. All frontend variables are public client keys.

## Verification goals

- [x] No private secrets or `service_role` keys prefixed with `EXPO_PUBLIC_`
- [x] No private keys or passwords hardcoded in JavaScript/TypeScript source files
- [x] `app.config.js` and `eas.json` free of sensitive secrets

## Manual verification (for the human)

- Verify that when building the production APK/bundle, only public SDK keys are included.
