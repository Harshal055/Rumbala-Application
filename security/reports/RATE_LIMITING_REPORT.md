# RATE_LIMITING Security Report

## Status: PASS

## Findings

1. **Authentication Rate Limiting**:
   - Supabase Auth infrastructure enforces strict IP and user-level rate limiting on authentication operations (`signUp`, `signInWithPassword`, `resetPasswordForEmail`).
   - `src/services/api.ts` intercepts rate limit responses (`/email rate limit exceeded/i`) and provides clear user feedback without crashing.

2. **Business Logic Rate Limiting & Cooldowns**:
   - Weekly free card claims (`claim_weekly_cards`) enforce a strict 7-day cooldown at the database engine level (`v_days_since_claim < 7`), preventing abuse or rapid repeat claims.

3. **Client Polling Throttling & Cleanup**:
   - LDR room and chat updates use a throttled 2500ms interval (`POLL_INTERVAL_MS = 2500`) to conserve battery, network, and backend resources.
   - Per-room subscriber maps ensure that intervals are cleanly destroyed on unmount or room exit, preventing runaway polling leaks.

## What's at risk

Unconstrained endpoints allow brute-force password cracking, credential stuffing, or server resource exhaustion. Rumbala benefits from Supabase gateway rate limits and strict SQL-level business logic cooldowns.

## What's already secure

- Supabase Auth rate limits on login/signup/reset endpoints.
- Database-level 7-day cooldown on weekly reward claims.
- Controlled polling frequency with guaranteed cleanup routines.

## Recommendations

- Ensure Supabase project Rate Limit settings in the dashboard remain enabled and configured for production volumes.
