# FILE_UPLOADS Security Report

## Status: PASS

## Findings

1. **Local Media Handling Only**:
   - Dare photos and camera memories are saved locally to device storage / photo library (`MediaLibrary.saveToLibraryAsync`) and are not transmitted to remote file storage buckets or web servers.
   - Zero Supabase Storage buckets or multipart upload endpoints are configured for user files.

2. **Telemetry Uploads**:
   - Crash reporting (`src/services/crashReporter.ts`) uploads structured JSON metadata directly into the database table `crash_reports` with strict RLS policies rather than binary file storage.

## What's at risk

Unrestricted file uploads (e.g. uploading executable files, path traversal in file names, SVG XSS) allow remote code execution or storage exhaustion. Because Rumbala does not support remote binary file uploads, file upload attack vectors do not apply.

## What's already secure

- Photo capture is stored strictly on the local device.
- No public binary upload endpoints exist.

## Recommendations

- If Supabase Storage is configured in the future for user avatars or media sharing, implement bucket-level MIME-type whitelisting, file size caps, and strict RLS policies on `storage.objects`.
