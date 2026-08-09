# MOBILE_SPECIFIC Security Report

## Status: PASS (Resolved from MEDIUM)

## Findings

1. **`android:allowBackup` Flag — [RESOLVED]**:
   - In `android/app/src/main/AndroidManifest.xml`, updated `android:allowBackup` to `"false"` to prevent unauthorized physical USB ADB backup extraction of local session tokens and cached preferences.

2. **Android & iOS Permissions — [PASS]**:
   - Camera and Audio recording permissions (`CAMERA`, `RECORD_AUDIO`) are restricted strictly to active user sessions for LDR video calls and photo dare capture.
   - Foreground service media projection is explicitly removed (`FOREGROUND_SERVICE_MEDIA_PROJECTION tools:node="remove"`).
   - iOS `infoPlist` usage descriptions in `app.config.js` provide compliant user-facing rationales.

3. **Exported Activities & Deep Link Filtering — [PASS]**:
   - `MainActivity` is protected by standard `MAIN`/`LAUNCHER` and strict scheme intent-filters (`rumbala://`, `exp+rumbal://`).
   - Deep link parameters are not passed to dynamic shell or native execution layers.

## What's at risk

Leaving `allowBackup="true"` allows an adversary with physical access and USB debugging to dump `AsyncStorage` and application cache without root access. Disabling backup closes this physical attack vector.

## What's already secure

- Explicit removal of unused sensitive permissions.
- Strict Intent filters on exported activities.
- Explicit camera/microphone usage descriptions compliant with Google Play and Apple App Store guidelines.

## Recommendations

- Maintain `android:allowBackup="false"` in future Android manifest updates.
