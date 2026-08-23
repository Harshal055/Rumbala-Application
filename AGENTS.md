# AGENTS.md — Rumbala

Guidance for AI agents (and humans) working in this repo. Read this before making changes.

## What this app is
Rumbala is a couples' dares/games mobile app.
- **Client:** Expo / React Native (SDK 54, RN 0.81), file-based routing under `app/`.
- **Backend:** Supabase (Postgres + Auth + Realtime + Edge Functions). There is **no** custom Node/Express server — the client talks to Supabase directly via `src/services/api.ts`.
- **Payments:** RevenueCat (App Store / Play Store). Server truth arrives via the Edge Function `supabase/functions/revenuecat-webhook/index.ts`.
- **Admin:** a separate Vite/React web app in `admin-web/`, plus an in-app `app/admin.tsx`.
- **Video (LDR):** Agora, in `app/(tabs)/ldr.tsx`.

## Where things live
- `src/services/api.ts` — all Supabase data access (auth, profiles, cards, rooms, messages, promos, admin).
- `src/store/useStore.ts` — Zustand store; local state + AsyncStorage persistence (`hydrate()`), and `syncWithSupabase()`.
- `supabase/migrations/*.sql` — schema + RLS. Migrations run in timestamp order; the latest definition of a function/policy wins.
- `security/` — security reviews. Newest: `security/FULL_CODE_REVIEW_2026-08-22.md`.

## Security model — do not break these invariants
- **RLS is the real security boundary.** User tables are own-row (`profiles`, `purchases`, `game_scores`, `game_history`), rooms are host/guest-only, `room_messages` are participant-gated. Admin access is `public.is_admin()` (backed by the `admin_roles` table only — email checks in client code are cosmetic).
- **Never put the `service_role` key in the client.** It belongs only in Edge Functions (webhook).
- **Anti-cheat trigger:** `restrict_sensitive_profile_updates` blocks the `authenticated` role from changing `card_count`, `last_card_update`, `last_weekly_claim_at`, `is_pro`, `pro_expires_at`. Any legitimate change to those columns must go through a `SECURITY DEFINER` RPC that opens the guard GUC `app.allow_card_mutation` (see `20260812000000_harden_add_purchased_cards.sql`). Do **not** add client-side direct updates to those columns.
- **Entitlements (cards / Pro) should be granted server-side** (RevenueCat webhook → `secure_increment_cards_service_role` / profile update). The client `add_purchased_cards` path is bounded but not receipt-verified.

## Conventions
- SECURITY DEFINER functions must `SET search_path = public`.
- Validate UUIDs before using them in PostgREST filters (see `joinRoom`, `adminSearchUsers`).
- New migrations: name `YYYYMMDDHHMMSS_description.sql`; make them idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS`).
- Don't commit secrets. `.env`, keystores, `google-services.json`, `play-console-key.json` are git-ignored.

## Onboarding data (gender / relationship status / main goal)
- Collected in `app/onboarding.tsx` (pre-login) → stored locally via `setOnboardingPreferences` (store + AsyncStorage).
- Persisted to the DB after login by `syncOnboardingPreferencesToSupabase` (`src/services/api.ts`): writes to `auth.users.raw_user_meta_data` **and** to first-class columns on `public.profiles` (`gender`, `relationship_status`, `app_purpose`; `vibe` too). Columns added in `supabase/migrations/20260822000000_add_onboarding_columns.sql`.
- `syncWithSupabase()` reads them back from the profile row so a fresh device recovers them.
- These preference columns are intentionally NOT guarded by the anti-cheat trigger.

## Verify before you ship
- SQL: parse migrations (e.g. `pglast`) and prefer testing against a real Postgres.
- Types: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`.
- Confirm in the Supabase dashboard (not visible in-repo): the `restrict_sensitive_profile_updates` trigger state, `verify_jwt=false` for the webhook, `REVENUECAT_WEBHOOK_SECRET` set, and production Auth settings.

## Changelog of agent-made changes
- **2026-08-12** Security fixes: hardened `add_purchased_cards` + guard GUC, guarded `claim_weekly_cards`, consolidated `is_admin()`, neutralized `fix-room-join.sql`, untracked `admin-portal.html`.
- **2026-08-22** Full code review (`security/FULL_CODE_REVIEW_2026-08-22.md`). Fixed login/signup bottom safe-area overlap (`edges` now include `bottom`). Added onboarding columns to `profiles` and wired two-way sync (this section). Surfaced gender / relationship / goal in the admin `UsersView` (table column + manage modal). Added server-side deck tailoring: `get_tailored_cards` RPC (`20260822010000`) + `getTailoredCards` in api.ts, wired into store `fetchCards` (tailored deck for signed-in users, falls back to full deck). Added server-side AI dares: `groq-ai-dare` Edge Function + `ai_dares` table (`20260822020000`) + rating UI (see AI dares section).

## AI dares (Groq)
- Generation runs **server-side** in the `groq-ai-dare` Edge Function (`supabase/functions/groq-ai-dare/index.ts`). The Groq key is a Supabase secret, never in the app: `supabase secrets set GROQ_API_KEY=gsk_...` (optionally `GROQ_MODEL`). Keep `verify_jwt = true` for this function so only authenticated users can call it.
- The function generates a dare and saves it to `public.ai_dares` (own-row RLS; migration `20260822020000`), returning the row `id` as `remoteId`.
- Client: `generateAIDare` in `src/services/aiDareService.ts` calls the function and **falls back to local curated templates** on any failure (offline / not configured / quota). `generateLocalDare` is the fallback.
- Rating: `rateAiDare(id, -1|0|1)` in `api.ts`; UI is a thumbs up/down row in `app/ai-generator.tsx` (only shown for AI-saved dares).
- Out-of-dares fallback: when a free user runs out of cards, the "Out of Dares" prompt in `app/(tabs)/index.tsx` offers **"✨ Generate with AI"** — free and unlimited (product decision), handled by `handleAiDare`, saved to `ai_dares`.
- **Never** hardcode the Groq key in the client or commit it.

## Known open items (see the security review)
- Promo codes are readable by all authenticated users and redeemed client-side — move to an admin-only read policy + a `SECURITY DEFINER` `redeem_promo_code` RPC with per-user idempotency.
- Agora video joins with an empty token — add an App Certificate + token server.
- Reconcile the two card-granting SKU schemes (client `card_1/5/10/25` vs webhook `50/150/300/600_cards`).
