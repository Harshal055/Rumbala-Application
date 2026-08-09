# Rumbala — Full Admin Panel Implementation Plan

*A roadmap from the working dashboard we have today to the complete 20-module admin platform you outlined.*

---

## 0. Important reality check first

Your structure is a **full dating-app admin template** (Matches, Media moderation, NSFW/face verification, fake-profile detection, etc.). Rumbala today is a **couples game app** — its Supabase backend has profiles, cards, game history, rooms (LDR sessions), purchases, feedback and bug reports. It does **not** yet have matching, photo uploads, moderation queues, subscriptions-as-plans, notifications infrastructure, or an audit system.

So this plan does two jobs:

1. **Maps each module to what already exists** so we build on real data, not empty screens.
2. **Flags what needs new backend** (tables, storage, edge functions) before its admin screen can do anything.

Building all 20 modules as *real, working* features is a multi-month product effort — most of the work is backend and app-side, not the admin UI. The admin panel is the last 20%; the data it manages is the other 80%.

---

## 1. Where we are today

Already delivered in this session: **`admin-dashboard.html`** — a working, browser-based admin that logs into your live Supabase and manages real data across seven areas:

| Working now | Backed by table |
|-------------|-----------------|
| Overview (users, pro users, rooms, feedback) | `profiles`, `rooms`, `feedback` |
| User search + edit cards + grant/revoke Pro | `profiles` |
| Revenue (totals, SKUs, transactions) | `purchases` |
| Gameplay (popular dares, proof gallery) | `game_history` |
| LDR rooms (view + force-close) | `rooms` |
| Cards CMS (create/edit/delete) | `cards` |
| Support (bug reports + feedback) | `bug_reports`, `feedback` |

That covers, in real terms, roughly **Dashboard, User Management (core), Subscription/Revenue (core), Card Management, and Support (core)** from your tree. Everything below extends from here.

---

## 2. Backend gap analysis (per module)

Legend: 🟢 exists · 🟡 partial (needs fields/tables) · 🔴 new build (backend + app work)

| Module | Status | What's needed |
|--------|--------|---------------|
| 📊 Dashboard | 🟢 | Add time-series (DAU/MAU) via a `daily_stats` rollup table or SQL views |
| 👥 User Management | 🟡 | Add `status` (active/blocked/suspended/deleted), `notes`, `login_history` table |
| ❤️ Match Management | 🔴 | Rumbala has no matching. Needs `matches`, `swipes` tables + app feature |
| 💬 Chat Management | 🟡 | `room_messages` exists; add reporting, soft-delete, moderation flags |
| 📸 Media Management | 🔴 | No photo uploads today. Needs Supabase Storage + `media` table + review queue |
| 🚨 Reports & Moderation | 🔴 | Needs `reports` table (type, target, reporter, status) + `bans`/`warnings` |
| 💳 Subscription & Billing | 🟡 | `purchases` exists; add `plans`, `subscriptions`, `refunds`, `coupons` |
| 📈 Analytics | 🟡 | Aggregate from existing tables + an event-tracking table for depth |
| 🔔 Notifications | 🔴 | Needs push (Expo/FCM) + `notifications`, `campaigns`, `templates` tables |
| 🎁 Promotions | 🔴 | Needs `coupons`, `referrals`, `offers` tables |
| 🎮 Card Management | 🟢 | Exists; add categories + difficulty fields to `cards` |
| 🤖 AI Moderation | 🔴 | Needs moderation pipeline (edge function + `blocked_words`, `ai_logs`) |
| 🎫 Support Tickets | 🟡 | `feedback`/`bug_reports` exist; add `tickets`, `faqs` tables |
| 📝 CMS Pages | 🟡 | Legal pages exist as files; move to a `cms_pages` table for live editing |
| 🌍 Localization | 🔴 | Needs `countries`, `languages`, `currencies`, region rules |
| ⚙️ Settings | 🟡 | Add a `settings` key/value table + feature flags |
| 👨‍💼 Admin Management | 🟡 | `admin_roles` exists (boolean); upgrade to full RBAC (roles + permissions) |
| 📜 Audit Logs | 🔴 | Needs `audit_logs` table + write hooks on every admin action |
| 📂 Data Management | 🟡 | Export = read + CSV now; backup/restore via Supabase tooling |
| ⚡ / 🧰 Monitoring & Dev Tools | 🔴 | Server/DB/queue health — mostly Supabase dashboard + custom health checks |

**Takeaway:** ~40% of the tree can be built on today's data (some with small schema additions). ~60% requires new product features to exist first.

---

## 3. Recommended architecture

The single-file HTML dashboard is perfect for the MVP, but it will not scale to 20 modules with role-based access. For the full build, move to a proper admin framework.

**Recommended stack**

- **Framework:** React + Vite, or **Refine** / **react-admin** (both are purpose-built for admin panels and cut months of work — tables, filters, forms, auth, RBAC out of the box).
- **Backend:** Keep **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions). It already powers the app, so no new infra.
- **Access control:** Supabase **Row Level Security** + a `roles`/`permissions` model, enforced both in the DB (source of truth) and the UI (hide/show).
- **Server-side logic:** Supabase **Edge Functions** for anything the anon key shouldn't do directly (bans, refunds, sending push, audit writes, admin user creation via service key).
- **Hosting:** Vercel or Netlify for the admin app; restrict by admin login + optional IP allowlist.
- **Charts:** Recharts or Chart.js for analytics.

**Security must-fix (do this regardless of scope):** the current in-app admin (`app/admin.tsx`) uses a hardcoded email/password in client code (`adminhr@andx.com` / `123456`). That is not secure — anyone decompiling the app can read it. Replace with real Supabase Auth + the `admin_roles`/RBAC check. The new web dashboard already uses real Supabase login.

---

## 4. Roles & permissions (RBAC)

Your role table is solid. Implement it as `roles` + `role_permissions` in Postgres, checked by RLS:

| Role | Scope |
|------|-------|
| Super Admin | Everything, incl. Settings, Admins, Dev Tools |
| Admin | Everything except Super-Admin-only settings |
| Moderator | Users, Reports, Chats, Media |
| Support | Tickets, Users (read + notes) |
| Finance | Payments, Revenue, Refunds, Coupons |
| Content Manager | CMS, Cards, Notifications |
| Marketing | Promotions, Analytics |
| Developer | Logs, Monitoring, Settings (technical) |

Each admin row gets a `role`; each screen and each Edge Function checks the role's permissions before rendering or acting. Every write also emits an **audit log** entry (who, what, when, before/after).

---

## 5. Phased roadmap

Phases are ordered so each one ships usable value and lays groundwork for the next.

### Phase 1 — Harden the MVP *(1–2 weeks)*
Secure what we already have. Replace hardcoded admin creds with Supabase Auth + `admin_roles` gate. Confirm/repair RLS policies so admins (and only admins) can read/write the tables the dashboard touches. Ship the current HTML dashboard as the interim tool.

### Phase 2 — Framework migration + RBAC *(2–3 weeks)*
Stand up the React/Refine admin app. Port the 7 working modules. Build the `roles`/`permissions` model and the `audit_logs` table with write hooks. Add Admin Management (invite admins, assign roles) and Audit Logs viewer.

### Phase 3 — User & content depth *(2–3 weeks)*
Extend `profiles` with `status`, add `user_notes` and `login_history`. Build block/suspend/delete flows. Move legal pages into a `cms_pages` table for live editing. Add card categories + difficulty. Build a `settings` table with feature flags + maintenance mode.

### Phase 4 — Trust & safety *(3–4 weeks, needs app features)*
Build `reports`, `warnings`, `bans` tables and the moderation queues (User/Chat Reports, Ban History). Add chat reporting + soft-delete to `room_messages`. This phase depends on the app exposing "report" actions to users.

### Phase 5 — Monetization & growth *(2–3 weeks)*
Add `plans`, `subscriptions`, `refunds`, `coupons`, `referrals`. Build Finance screens. Wire refunds/coupons through Edge Functions. Analytics module: DAU/MAU rollups, revenue charts, country/gender/device breakdowns.

### Phase 6 — Engagement infrastructure *(3–4 weeks, needs app features)*
Notifications system (Expo push / FCM) with campaigns, templates, scheduling. Promotions module. In-app notification center.

### Phase 7 — Media & AI (only if the product adds these) *(4–6 weeks)*
Photo/video uploads via Supabase Storage, review queues, NSFW/AI moderation pipeline, verification requests. This is a large product initiative, not just admin work — schedule only if Rumbala's roadmap includes user media/matching.

### Phase 8 — Ops & developer tooling *(ongoing)*
Monitoring (DB/API health, storage usage, error logs), data export/backup, webhooks, cron jobs. Much of this leans on Supabase's own dashboards plus lightweight custom health checks.

**Rough total for a realistic v1 (Phases 1–5):** ~10–15 weeks for one full-stack developer. Phases 6–8 depend on whether the app itself gains matching, media, and notifications.

---

## 6. Dashboard widgets (Phase 1–2 targets)

Buildable from current data: Total Users, Premium Users, Revenue, Match/Room Count, Support Tickets, Recent Signups, Recent Payments, Recent Activities.

Needs rollups/events: Online Users, New Users Today, DAU, MAU, Notifications Sent.

Needs monitoring hooks: App Crashes, API Status, Database Status, Storage Usage.

---

## 7. Future / AI features

The AI and advanced items you listed — fraud detection, fake-profile and face verification, live chat monitoring, heat maps, A/B testing, user-journey analytics, remote config, geo/device blocking, multi-language, white-label — are strong long-term bets but each is a **product feature with its own backend**, not an admin screen. Slot them after Phase 7 once the underlying data (media, matches, events) exists to act on.

---

## 8. Immediate next steps

1. Decide the target: keep extending the single-file dashboard, or move to the React/Refine framework now (recommended once you go past ~8 modules).
2. Confirm which modules are **real priorities** — building screens for features Rumbala doesn't have yet (matches, media) wastes effort. Tell me the top 5 you actually need next.
3. I can then: run the SQL to add the first new tables (`roles`, `audit_logs`, user `status`), scaffold the React admin project, or extend the current dashboard with the next 2–3 modules.

*Tell me which of the three you want first and I'll start building.*
