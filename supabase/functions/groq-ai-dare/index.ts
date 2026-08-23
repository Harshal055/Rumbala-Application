// Edge Function: groq-ai-dare
// Generates a couple's dare via Groq and saves it to public.ai_dares.
//
// Security:
//   - GROQ_API_KEY is read from the function's secret env; it is NEVER shipped
//     to the client. Set it with:  supabase secrets set GROQ_API_KEY=gsk_...
//   - Keep verify_jwt = true for this function (default) so only authenticated
//     users can call it. The row is inserted as the calling user (RLS own-row).
//
// Env used: GROQ_API_KEY (required), GROQ_MODEL (optional),
//           SUPABASE_URL + SUPABASE_ANON_KEY (auto-provided by the platform).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const GROQ_MODEL = Deno.env.get("GROQ_MODEL") ?? "llama-3.3-70b-versatile";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const clampIntensity = (n: unknown) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(3, Math.max(1, v)) : 2;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!GROQ_API_KEY) {
    console.error("GROQ_API_KEY not set");
    return json({ error: "AI not configured" }, 500);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const vibe = ["fun", "romantic", "spicy", "ldr"].includes(String(body.vibe)) ? String(body.vibe) : "spicy";
    const intensity = clampIntensity(body.intensity);
    const mood = typeof body.mood === "string" ? body.mood.slice(0, 40) : "";
    const prompt = typeof body.prompt === "string" ? body.prompt.slice(0, 300) : "";
    const p1 = (typeof body.partner1 === "string" && body.partner1.trim()) ? body.partner1.trim().slice(0, 40) : "Partner 1";
    const p2 = (typeof body.partner2 === "string" && body.partner2.trim()) ? body.partner2.trim().slice(0, 40) : "Partner 2";

    const intensityWord = intensity === 1 ? "mild and playful" : intensity === 2 ? "flirty and warm" : "bold and passionate";
    const vibeWord =
      vibe === "fun" ? "funny and lighthearted"
      : vibe === "romantic" ? "romantic and tender"
      : vibe === "ldr" ? "long-distance friendly (doable apart, over a video call)"
      : "sensual and suggestive";

    const system = [
      "You write a single dare for a consenting adult couple playing a private romantic game.",
      "Output ONLY the dare text: one or two sentences, no preamble, no quotes, no numbering.",
      `Address ${p1} and instruct them to do something with or for ${p2}.`,
      "Keep it consensual, tasteful and suggestive at most — never explicit sexual detail.",
      "Never include illegal, non-consensual, degrading, or unsafe acts.",
    ].join(" ");

    const userMsg = [
      `Create a ${intensityWord}, ${vibeWord} dare.`,
      mood ? `Mood: ${mood}.` : "",
      prompt ? `Incorporate this scenario: "${prompt}".` : "",
    ].filter(Boolean).join(" ");

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.9,
        max_tokens: 120,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!groqRes.ok) {
      console.error("Groq error:", groqRes.status, await groqRes.text());
      return json({ error: "AI generation failed" }, 502);
    }

    const groqJson = await groqRes.json();
    let text: string = groqJson?.choices?.[0]?.message?.content?.trim() ?? "";
    text = text.replace(/^["']|["']$/g, "").trim();
    if (!text) return json({ error: "Empty AI response" }, 502);

    // Persist (RLS: user owns the row).
    const { data: saved, error: insErr } = await supabase
      .from("ai_dares")
      .insert({ user_id: user.id, prompt: prompt || null, vibe, intensity, mood: mood || null, text, source: "ai" })
      .select()
      .single();

    if (insErr) console.error("ai_dares insert error:", insErr.message);

    return json({ id: saved?.id ?? null, text, vibe, intensity, mood });
  } catch (err) {
    console.error("groq-ai-dare error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
