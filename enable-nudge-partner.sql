-- ─── NUDGE PARTNER: push tokens + secure partner-token lookup ────────────────
-- Adds Expo push-token storage and an RPC that lets one room member fetch their
-- partner's push token WITHOUT exposing the profiles table to everyone.

-- 1. Store each user's Expo push token on their profile.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS push_token text;

-- 2. Secure lookup: given a room code, return the *other* member's push token.
--    SECURITY DEFINER so it can read the partner's profile row, but it only
--    returns anything when the caller is actually a member of that room.
CREATE OR REPLACE FUNCTION public.get_room_partner_push_token(p_room_code text)
RETURNS TABLE (partner_token text, partner_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room   public.rooms%ROWTYPE;
    v_partner uuid;
BEGIN
    SELECT * INTO v_room FROM public.rooms WHERE code = p_room_code;
    IF NOT FOUND THEN
        RETURN; -- no such room
    END IF;

    -- Caller must be a member of this room.
    IF auth.uid() = v_room.host_user_id THEN
        v_partner := v_room.guest_user_id;
    ELSIF auth.uid() = v_room.guest_user_id THEN
        v_partner := v_room.host_user_id;
    ELSE
        RETURN; -- caller is not in this room → return nothing
    END IF;

    IF v_partner IS NULL THEN
        RETURN; -- partner hasn't joined yet
    END IF;

    RETURN QUERY
        SELECT p.push_token,
               COALESCE(NULLIF(p.display_name, ''), p.partner1, 'Your partner')
        FROM public.profiles p
        WHERE p.id = v_partner;
END;
$$;

REVOKE ALL ON FUNCTION public.get_room_partner_push_token(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_room_partner_push_token(text) TO authenticated;
