# CORS Fix Plan

## Changes

- None required. Mobile application uses Bearer authentication and RLS.

## Verification goals

- [x] API access is gated by JWT Bearer tokens rather than Origin headers.
- [x] RLS enforces strict data ownership regardless of request origin.

## Manual verification (for the human)

- None needed.
