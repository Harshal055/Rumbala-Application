# RATE_LIMITING Fix Plan

## Changes

- None required. Rate limiting is enforced across auth and business logic.

## Verification goals

- [x] Auth operations are protected by Supabase rate limits
- [x] Card reward claims enforce 7-day server-side cooldown
- [x] Client polling intervals are throttled and cleanly released

## Manual verification (for the human)

- Verify that trying to claim weekly cards twice in a row returns the 7-day cooldown notice.
