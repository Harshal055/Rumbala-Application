// Edge Function: agora-token
// Issues a short-lived Agora RTC token for a room's video call — but only to a
// verified member of that room. This closes the "anyone with the App ID + a room
// code can join a private call" hole (App-ID-only / empty-token joins).
//
// Requires (set as function secrets):
//   supabase secrets set AGORA_APP_ID=xxxxx
//   supabase secrets set AGORA_APP_CERTIFICATE=xxxxx   (enable App Certificate in Agora console)
// Keep verify_jwt = true (default) so only authenticated users can call it.
// The App Certificate never leaves the server.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { RtcTokenBuilder, RtcRole } from "https://esm.sh/agora-token@2.0.5";

const APP_ID = Deno.env.get("AGORA_APP_ID") ?? "";
const APP_CERT = Deno.env.get("AGORA_APP_CERTIFICATE") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!APP_ID || !APP_CERT) {
    console.error("AGORA_APP_ID / AGORA_APP_CERTIFICATE not set");
    return json({ error: "Agora not configured" }, 500);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const channelName = String(body.channelName ?? "").trim().toUpperCase();
    const uid = Number.isFinite(Number(body.uid)) ? Number(body.uid) : 0;
    if (!channelName) return json({ error: "channelName is required" }, 400);

    // Membership check: rooms RLS only returns the row to a participant, so a hit
    // here proves the caller is the host or guest of this room.
    const { data: room, error: roomErr } = await supabase
      .from("rooms")
      .select("code, host_user_id, guest_user_id")
      .eq("code", channelName)
      .maybeSingle();

    if (roomErr) console.error("room lookup error:", roomErr.message);
    if (!room || (room.host_user_id !== user.id && room.guest_user_id !== user.id)) {
      return json({ error: "You are not a member of this room." }, 403);
    }

    const expireSeconds = 3600; // token + privilege validity
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERT,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      expireSeconds,
      expireSeconds,
    );

    return json({ token, uid, channelName, expiresIn: expireSeconds });
  } catch (err) {
    console.error("agora-token error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
