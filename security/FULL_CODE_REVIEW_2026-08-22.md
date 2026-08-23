# Rumbala — Full Security Code Review

**Date:** 2026-08-22
**Reviewer:** Claude (fresh read of the whole codebase, not a re-run of the earlier 17-point audit)
**Scope read:** all Supabase migrations + RLS policies, `phase1_schema_rls`, the RevenueCat Edge Function, `src/services/*` (api, roomApi, revenueCat, aiDare, crashReporter, supabase clients), `admin-web` auth gate, `app/(tabs)/ldr.tsx` (video), `app/admin.tsx`, auth screens, config.toml, and the root `enable-*.sql` / `fix-room-join.sql` scripts. `node_modules` excluded.

---

## TL;DR

The **core data model is genuinely solid**: row-level security is own-row / participant-only across every user table, `admin_roles` cannot be self-inserted, there is no service-role key in the client, and there are no XSS/eval sinks. The real problems are all in the **money + entitlements layer** (cards, Pro, promo codes) and one in **video privacy**. Two systems (client-side grants vs. webhook) were built at different times and now contradict each other and the anti-cheat trigger.

Severity counts: **2 High, 3 Medium, 4 Low.** Several were partially fixed on 2026-08-12 (see the "Already remediated" section).

---

## High

### H1 — Promo codes are readable by everyone and redeemed client-side
**Evidence:**
- `supabase/migrations/20260803100000_enterprise_admin_schema.sql:104` — `CREATE POLICY "Promo codes readable by authenticated" ON public.promo_codes FOR SELECT TO authenticated USING (true);`
- `src/services/api.ts:785` `redeemPromoCode()` — reads the code, then directly `UPDATE profiles SET is_pro / pro_expires_at / card_count`, then increments `used_count` in a separate non-atomic write.

**Why it matters:** Any logged-in user can run `select * from promo_codes` and read every code string plus its `grant_pro_days` / `bonus_cards` / `max_uses`. They just redeem the most valuable one (e.g. `grant_pro_days >= 9999` = lifetime). Worse, redemption has **no per-user record**, so the same user can redeem the same code repeatedly, and the `used_count` check is racy (two concurrent calls both pass `used_count < max_uses`). The entire promo system can be drained for free Pro/cards.

**Fix:**
1. Remove the public read policy — promo codes should never be client-readable. Admin-only:
   `USING (public.is_admin())`.
2. Move redemption into a `SECURITY DEFINER` RPC `redeem_promo_code(p_code text)` that: looks up the code server-side, checks active/expiry/`max_uses` with `FOR UPDATE`, records `(user_id, code)` in a new `promo_redemptions` table with a **unique constraint** (blocks re-redeem), grants atomically, and sets the guard GUC (see M2). The client sends only the code string.

### H2 — Card grants were client-trusted (partially fixed)
**Evidence:** `add_purchased_cards` originally trusted the client's `p_count` and `p_amount`; `src/services/api.ts:269` calls it directly after a client-side purchase, with no receipt check.
**Status:** **Mitigated 2026-08-12** — `supabase/migrations/20260812000000_harden_add_purchased_cards.sql` caps counts at 25, validates count against SKU, and clamps amounts. This bounds abuse to one legit pack per call but is still not proof-of-purchase. **Complete fix:** grant cards only from the RevenueCat webhook (`secure_increment_cards_service_role`) and stop the client calling `add_purchased_cards` (or lock its EXECUTE to service_role). See M1 — the webhook already exists but its SKUs don't match.

---

## Medium

### M1 — Two inconsistent card-granting systems (client vs. webhook)
**Evidence:**
- Webhook `supabase/functions/revenuecat-webhook/index.ts:56-63` grants for product IDs `50_cards / 150_cards / 300_cards / 600_cards` (fallback 50).
- Client `src/services/revenueCatService.ts` `PRODUCT_CARD_MAP` + `add_purchased_cards` use `card_1 / card_5 / card_10 / card_25` (1/5/10/25).

**Why it matters:** The two paths use **different product-ID schemes and different pack sizes**. If both fire on a purchase, the buyer is granted cards twice (client RPC + webhook). If only the webhook is live, real client SKUs (`card_5`, etc.) match none of its strings, so paying users get nothing server-side. Pick one source of truth (recommended: webhook only) and delete the other path. Align the SKU→count map in exactly one place.

### M2 — Anti-cheat trigger blocks legitimate privileged writes
**Evidence:**
- `supabase/migrations/20260317000000_secure_rls_policies.sql:19` defines `restrict_sensitive_profile_updates` (attached as `trg_restrict_sensitive_profile_updates`), blocking the `authenticated` role from changing `card_count` / `last_card_update` / `last_weekly_claim_at`. `20260809120000_secure_payments.sql` extends it to `is_pro` / `pro_expires_at`.
- Direct client updates that do exactly those writes: `redeemPromoCode` (`api.ts:866`), `adminUpdateUserCards` (`api.ts:711`), `adminGrantPro` (`api.ts:901`).

**Why it matters:** Those three flows are plain authenticated `UPDATE`s (not `SECURITY DEFINER`), so the trigger blocks them — they are **broken and/or inconsistent** wherever the trigger is applied. The right shape is: every privileged mutation goes through a `SECURITY DEFINER` RPC that (a) checks `public.is_admin()` for admin actions or validates the promo server-side, and (b) opens the guard GUC introduced on 2026-08-12 so only vetted RPCs may touch these columns. `add_purchased_cards` and `claim_weekly_cards` were already converted this way on 2026-08-12; `redeem_promo_code`, an admin `set_user_cards`, and an admin `set_user_pro` RPC still need to be added.

### M3 — Video calls join Agora with no token (uninvited-join / eavesdrop)
**Evidence:** `app/(tabs)/ldr.tsx:657` — `engine.current.joinChannel('', channelId, numericUid, {...})` with an empty token; `channelId` is the room code.
**Why it matters:** With token auth disabled (App-ID-only mode), Agora performs **no authorization** — anyone who has the App ID (it ships in the client bundle as `EXPO_PUBLIC_AGORA_APP_ID` and is trivially extractable) and a room code can join that channel's audio/video. Your Supabase RLS protects the `rooms` table but not the Agora channel. For an intimate couples' app this is a real privacy exposure.
**Fix:** Enable an Agora **App Certificate** and mint short-lived RTC tokens server-side (a Supabase Edge Function that issues a token only after confirming the caller is the room's host or guest), then pass that token to `joinChannel`.

### (M4 note) — RevenueCat webhook may be unreachable
**Evidence:** No `[functions.revenuecat-webhook]` block with `verify_jwt = false` in `supabase/config.toml`.
**Why it matters:** If `verify_jwt` isn't disabled for this function (in the dashboard or config), Supabase's gateway rejects RevenueCat's requests — which carry your shared secret, not a Supabase JWT — before they reach the function, so Pro/cards never sync server-side. The function already does its own bearer-secret check, so JWT verification should be off for it. **Verify in the dashboard; add the config block.**

---

## Low / hygiene

- **L1 — admin-web email fallback.** `admin-web/src/App.tsx` `verifyAdminRole()` grants the admin UI if the email is `adminhr@andx.com` / `admin@rumbala.app`, even when the `admin_roles` lookup fails. It's cosmetic (server RLS still enforces `is_admin()` via `admin_roles`), but drop the hardcoded-email bypass so the UI can't mislead.
- **L2 — Pro broadcast is spoofable.** `adminGrantPro` (`api.ts:927`) sends `is_pro` on Realtime channel `user-updates:${userId}`. Realtime broadcast is unauthenticated, so a malicious client could publish a fake `user_updated` to flip a victim's *local* Pro UI. Server state is unaffected and re-syncs from the DB, so impact is low — but the client should re-verify against the DB, not trust the broadcast payload.
- **L3 — Fuzzy webhook matching.** `revenuecat-webhook` treats any entitlement containing `"pro"` as Pro and any `"pack"`/`"consumable"` as 50 cards. Tighten to exact product/entitlement IDs to avoid mis/over-granting.
- **L4 — config.toml is dev-only.** `minimum_password_length = 6`, `enable_confirmations = false`, `[api.tls] enabled = false` are **local** defaults and don't govern the hosted project. Confirm the production dashboard has the intended email-confirmation setting, a stronger password policy, leaked-password protection, and correct redirect URLs.

---

## What's already solid (keep it)

- **RLS is well-designed:** `profiles` / `purchases` / `game_scores` / `game_history` are strictly own-row; `rooms` is host/guest-only; `room_messages` SELECT/INSERT are gated by an `EXISTS` participant check (`phase1_schema_rls.sql:283`). Private chats are not leakable by knowing a code.
- **No admin self-promotion:** `admin_roles` has RLS on with only a SELECT-own policy and no INSERT policy — clients cannot grant themselves admin; provisioning is service-role only.
- **No client-side service_role key**, no secrets in git history, no `eval` / `dangerouslySetInnerHTML` / WebViews.
- **Good hygiene:** `SECURITY DEFINER` functions pin `search_path = public`; UUIDs are regex-validated before being used in PostgREST filters (`api.ts:357`, `:699`).
- The room-hijack hole is properly closed in `20260712000000_fix_room_join_security.sql`.

---

## Already remediated on 2026-08-12
- `add_purchased_cards` hardened (caps + SKU validation + guard) and `claim_weekly_cards` guard-wrapped — `supabase/migrations/20260812000000_harden_add_purchased_cards.sql`.
- `is_admin()` consolidated to the `admin_roles` version — `supabase/migrations/20260812000100_cleanup_is_admin.sql`.
- Dangerous `fix-room-join.sql` root script neutralized into a safe repair.
- `admin-portal.html` untracked from git.

---

## Recommended priority order
1. **H1** — lock down `promo_codes` read + move redemption to a server RPC with per-user idempotency.
2. **M3** — Agora token auth for video calls.
3. **M1 + M2 + H2** — settle on webhook-only entitlement grants, align SKUs, convert the remaining admin/promo writes to guarded `SECURITY DEFINER` RPCs, then verify the webhook (M4) actually runs.
4. **L1–L4** — hygiene.

## Verify-in-production checklist (can't be seen from the repo)
- Is the `restrict_sensitive_profile_updates` trigger actually applied? If yes, promo redemption and admin card/pro edits are currently failing until M2 is done.
- Is `verify_jwt` off for the webhook function, and is `REVENUECAT_WEBHOOK_SECRET` set?
- Production Auth settings (password policy, email confirmation, leaked-password protection, redirect URLs).
- Rotate the Android keystore passwords (`FINAL_RELEASE_KEY_INFO.txt`, currently `rumbala123`) and move them out of the project folder into a secret manager.
