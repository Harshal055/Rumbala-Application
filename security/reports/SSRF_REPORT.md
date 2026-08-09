# SSRF (Server-Side Request Forgery) Security Report

## Status: PASS

## Findings

1. **Absence of Server-Side URL Fetching**:
   - The application is a React Native mobile client connecting directly to Supabase BaaS.
   - There are no custom backend services, webhook proxy servers, or server-side URL preview/fetch endpoints.
   - All outgoing network requests are strictly dispatched via official SDK client libraries (`@supabase/supabase-js`, `react-native-purchases`, `agora-react-native-rtc`) to fixed, configured API endpoints.

2. **No User-Controlled URL Ingestion**:
   - The app does not accept arbitrary user-supplied URLs to fetch, download, or proxy on the server.

## What's at risk

In systems where a server fetches user-supplied URLs, attackers can probe internal metadata endpoints (`169.254.169.254`, `localhost`, VPC services). Because Rumbala has no server-side fetching capabilities or arbitrary URL ingest handlers, SSRF vectors do not exist.

## What's already secure

- No server-side HTTP proxying or URL fetching endpoints exist.
- Network communication is constrained to official SDK endpoints.

## Recommendations

- If URL fetching (e.g. link unfurling or avatar fetching) is added in the future, ensure strict URL scheme validation, DNS resolution pinning, and rejection of private IP ranges.
