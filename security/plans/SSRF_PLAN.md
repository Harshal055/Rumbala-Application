# SSRF Fix Plan

## Changes

- None required. No server-side fetching or proxy endpoints exist.

## Verification goals

- [x] Zero server-side URL fetch endpoints exist in the codebase.
- [x] Client requests strictly target authenticated Supabase, RevenueCat, Agora, and Google endpoints.

## Manual verification (for the human)

- None needed.
