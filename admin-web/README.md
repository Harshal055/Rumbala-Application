# Rumbala Admin (admin-web)

Vite + React + Tailwind admin panel for Rumbala. Talks directly to Supabase; access
is gated by the `admin_roles` table and enforced server-side by Row Level Security.

## Local development
```bash
npm install
npm run dev        # http://localhost:3000
```

## Environment
Copy `.env.example` to `.env` and set your project values (or set them in your
host's dashboard). If unset, the app falls back to the baked-in project URL + anon
key. The anon key is public (RLS-protected) — never put the service_role key here.

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Production build
```bash
npm run build      # outputs static site to dist/
npm run preview    # serve dist/ locally to smoke-test
```

## Deploy (it's a static SPA — no server needed)
Any static host works. It uses no client-side router, so no SPA rewrite rules are
required.

- **Vercel:** import the repo, set Root Directory = `admin-web`, Framework = Vite,
  add the two `VITE_` env vars. Deploy.
- **Netlify:** Base = `admin-web`, Build = `npm run build`, Publish = `admin-web/dist`,
  add the env vars.
- **Cloudflare Pages:** Build = `npm run build`, Output = `dist`, root `admin-web`.
- **Manual / any host:** upload the contents of `dist/` to your static host or bucket.

## Access control (important)
- Only users listed in `public.admin_roles` can read/write admin data — this is
  enforced by RLS (`public.is_admin()`), not by the UI. Add admins via the Supabase
  SQL editor (service role):
  ```sql
  insert into public.admin_roles (user_id)
  select id from auth.users where lower(email) = lower('you@example.com')
  on conflict (user_id) do nothing;
  ```
- The login screen also has a hardcoded email allow-list as a UI convenience; it
  does NOT grant data access (RLS still governs). Consider removing it and relying
  solely on `admin_roles` for a cleaner production posture.
- All privileged writes (cards / Pro) go through `SECURITY DEFINER` RPCs
  (`admin_set_cards`, `admin_set_pro`) — a direct table write is blocked by the
  profile anti-cheat trigger.

## Security notes
- Restrict the site to your team (host-level access control / password, or your
  org SSO) if you don't want the login page publicly reachable — though data is
  safe either way because of RLS.
- Confirm production Supabase Auth settings (email confirmation, password policy).
