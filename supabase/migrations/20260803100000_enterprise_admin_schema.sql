-- Migration: Enterprise Admin Panel Schema
-- Date: 2026-08-03
-- Description: Adds tables for Audit Logs, Support Tickets, Remote Configs, Promo Codes, Blocked Keywords, and CMS Documents with strict RLS

-- 1. Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin audit logs viewable only by admins" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin audit logs insertable by admins" ON public.admin_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- 2. Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text,
  subject text NOT NULL,
  category text DEFAULT 'general',
  priority text DEFAULT 'medium',
  status text DEFAULT 'open',
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own support tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create support tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can update support tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete support tickets" ON public.support_tickets
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 3. App Remote Configs / Feature Flags
CREATE TABLE IF NOT EXISTS public.app_remote_configs (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.app_remote_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Remote configs readable by everyone" ON public.app_remote_configs
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Remote configs modifiable only by admins" ON public.app_remote_configs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Insert default system configs if not exists
INSERT INTO public.app_remote_configs (key, value, description)
VALUES 
  ('maintenance_mode', '{"enabled": false, "message": "We are performing scheduled maintenance. Please check back soon!"}'::jsonb, 'Toggle application maintenance mode'),
  ('min_app_version', '{"android": 5, "ios": 5, "enforce": false}'::jsonb, 'Minimum supported app version code'),
  ('feature_flags', '{"video_calls": true, "shop_enabled": true, "ai_moderation": true, "gift_cards": true}'::jsonb, 'Application runtime feature flags')
ON CONFLICT (key) DO NOTHING;

-- 4. Promo Codes & Coupons
CREATE TABLE IF NOT EXISTS public.promo_codes (
  code text PRIMARY KEY,
  bonus_cards integer DEFAULT 0,
  grant_pro_days integer DEFAULT 0,
  discount_percent integer DEFAULT 0,
  max_uses integer DEFAULT 100,
  used_count integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promo codes readable by authenticated" ON public.promo_codes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Promo codes manageable only by admins" ON public.promo_codes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Blocked Keywords & AI Moderation Rules
CREATE TABLE IF NOT EXISTS public.blocked_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text UNIQUE NOT NULL,
  severity text DEFAULT 'block',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.blocked_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blocked keywords manageable only by admins" ON public.blocked_keywords
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. CMS Documents (Legal & Content)
CREATE TABLE IF NOT EXISTS public.cms_documents (
  slug text PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'legal',
  is_published boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cms_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CMS documents readable by all" ON public.cms_documents
  FOR SELECT TO authenticated, anon
  USING (is_published = true OR public.is_admin());

CREATE POLICY "CMS documents manageable only by admins" ON public.cms_documents
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed initial CMS documents if not exists
INSERT INTO public.cms_documents (slug, title, content, category, is_published)
VALUES
  ('privacy-policy', 'Privacy Policy', 'Privacy Policy for Rumbala App. We respect your privacy and protect couple game data.', 'legal', true),
  ('terms-of-service', 'Terms of Service', 'Terms and conditions governing the use of Rumbala date-night and couple games.', 'legal', true),
  ('community-guidelines', 'Community Guidelines', 'Keep all interactions respectful, consensual, and safe.', 'guidelines', true)
ON CONFLICT (slug) DO NOTHING;
