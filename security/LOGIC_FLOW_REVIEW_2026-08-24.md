# Rumbala — Logic, Flow & Security Findings (2026-08-24)

Beyond type-checking (which is clean). These are behavioral bugs, broken flows, and security holes.

---

## 🔴 CRITICAL / systemic — every privileged profile write fights the anti-cheat trigger

`restrict_sensitive_profile_updates` is a `BEFORE UPDATE` trigger on `profiles` that blocks the `authenticated` role from changing `card_count`, `is_pro`, `pro_expires_at`, `last_card_update`, `last_weekly_claim_at`. But the client writes those columns **directly** in many places:

| Flow | Code | Writes |
|------|------|--------|
| Spend a card on draw | `syncCardCount` (`api.ts:263`), called by `drawCard` (`useStore.ts:637`) | `card_count` |
| Redeem promo | `redeemPromoCode` (`api.ts` ~866) | `is_pro`, `pro_expires_at`, `card_count` |
| In-app admin grant Pro | `adminGrantPro` (`api.ts:930`) | `is_pro`, `pro_expires_at` |
| In-app admin set cards | `adminUpdateUserCards` (`api.ts:726`) | `card_count` |
| Admin-web grant/revoke/save | `UsersView.tsx` (164, 208, 254) | `is_pro`, `pro_expires_at`, `card_count` |

Only `add_purchased_cards` and `claim_weekly_cards` were converted to guarded `SECURITY DEFINER` RPCs. Everything above is a plain client `UPDATE`, so behaviour depends entirely on whether the trigger's check (`current_setting('request.jwt.claim.role') = 'authenticated'`) actually fires — and that legacy GUC is not reliably set on current Supabase. **Both possible outcomes are broken:**

- **If the trigger fires** → all the writes above are silently rejected (the callers `.catch(console.warn)` and swallow it): card spend never persists, promo redemption fails, admins can't grant Pro or cards.
- **If the trigger does NOT fire** (legacy GUC empty) → the anti-cheat is a **no-op**, and since `profiles_update_own` RLS lets a user update their own row, **any user can `UPDATE profiles SET is_pro = true, card_count = 99999` for themselves** → free Pro + unlimited cards. **Security breach.**

**Fix (deterministic):** route *all* privileged writes through `SECURITY DEFINER` RPCs that open the `app.allow_card_mutation` guard (as done for purchases) — `spend_card`, `redeem_promo_code`, `admin_set_cards`, `admin_set_pro` — and harden the trigger to test `auth.role() = 'authenticated'` (reliable) instead of the legacy GUC, so direct client writes are always blocked.

---

## 🟠 HIGH — Card spend doesn't persist (economy leak)

`drawCard` decrements `cardCount` locally and calls `syncCardCount` (direct `UPDATE` → blocked by the trigger, error swallowed). Then on the next `syncWithSupabase`, `set({ cardCount: profile.card_count })` (`useStore.ts:715`) **overwrites the local count with the un-decremented DB value**. Net effect: a free user's spent cards come back after any sync/app restart — they effectively never run out, so the "Out of Dares → shop/AI" flow rarely triggers and card sales are undercut. (This is the trigger issue above, seen from the gameplay side.)

---

## 🟠 HIGH — Promo system (still open from the security review)

- `promo_codes` is readable by **every** authenticated user (`SELECT ... USING (true)`), leaking every code + its value.
- `redeemPromoCode` runs client-side with **no per-user redemption record** and a non-atomic `used_count` bump → the same user can redeem repeatedly; the usage cap is racy.
- Its `is_pro`/`card_count` writes also hit the trigger (see CRITICAL).
**Fix:** admin-only read policy + a `SECURITY DEFINER redeem_promo_code` RPC with a `promo_redemptions` unique constraint.

---

## 🟠 MEDIUM — Admin Pro/card management is broken (if the trigger is active)

In-app `adminGrantPro` / `adminUpdateUserCards` and admin-web `UsersView` (grant Pro, revoke, save card balance) all do direct `profiles` updates to trigger-guarded columns. If the trigger fires, none of these actually work — the admin sees an error (or, in `adminGrantPro`, a silent fallback). Must go through admin RPCs.

---

## 🟡 MEDIUM — Onboarding flow dead-ends on `/login` — ✅ NOT AN ISSUE (verified 2026-08-24)

Re-checked against the current `onboarding.tsx`: `handleComplete` already routes correctly (`!isAuthenticated → /welcome`, `isPro||hasSeenSubscription → /(tabs)`, else `/subscription`) — no `/login`. The `/login` redirect was from an outdated read; the "Re-architect onboarding flow to occur post-login" commit already fixed it. No change needed.

---

## 🟡 Carried over from `FULL_CODE_REVIEW_2026-08-22.md`

- **Agora video** — ✅ FIXED (2026-08-24): added the `agora-token` Edge Function (membership-checked, App Certificate stays server-side) and `ldr.tsx` now fetches a short-lived RTC token before `joinChannel`, falling back to `''` until the certificate is enabled. **Action needed:** enable the App Certificate in the Agora console, `supabase secrets set AGORA_APP_ID / AGORA_APP_CERTIFICATE`, and deploy the function.
- **Webhook vs client SKU / double-grant** — ✅ RESOLVED (2026-08-24): split the responsibilities so nothing is granted twice — **cards are granted client-side** (`add_purchased_cards`, bounded/validated), **Pro is granted by the webhook**. The webhook's consumable card-granting block was removed (lifetime Pro still falls through to its entitlement handler). Trade-off: card grants remain client-side and bounded, not receipt-verified — to close that, switch to webhook-only card grants and `REVOKE EXECUTE` on `add_purchased_cards` from `authenticated` (noted in the webhook file).
- **Webhook `verify_jwt`** must be `false` for `revenuecat-webhook` or RevenueCat calls are rejected (verify in dashboard).

---

## Priority
1. **CRITICAL trigger/RPC unification** — it simultaneously fixes card spend, promo, and admin management, and closes the self-grant security hole. Everything else is downstream of this.
2. Promo read-policy + RPC.
3. Onboarding `/login` redirect.
4. Agora tokens.

> Note: which CRITICAL outcome you're currently in can only be confirmed against the live DB — run `UPDATE profiles SET card_count = card_count WHERE id = auth.uid()` as a normal user (or check whether spent cards persist after restart). Either result points to the same fix.
