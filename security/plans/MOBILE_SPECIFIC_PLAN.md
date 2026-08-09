# MOBILE_SPECIFIC Fix Plan

## Changes

- `android/app/src/main/AndroidManifest.xml` — Set `android:allowBackup="false"` to prevent unauthorized USB ADB backup dumps of private app data.

## Verification goals

- [ ] `android:allowBackup="false"` is set in `AndroidManifest.xml`
- [ ] Permissions remain minimal and appropriate for core app features

## Manual verification (for the human)

- Build Android APK/bundle to confirm manifest compiles smoothly.
