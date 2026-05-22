// Edge: comm-image-free
// Gera imagens GRÁTIS usando Pollinations (sem chave), Gemini Image, Cloudflare Flux ou Hugging Face.
// NÃO usa Lovable AI Gateway → custo zero para o cliente.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY") || "";
const HF_TOKEN = Deno.env.get("HF_TOKEN") || "";
const CF_ACCOUNT_ID = Deno.env.get("CF_ACCOUNT_ID") || "";
const CF_AI_TOKEN = Deno.env.get("CF_AI_TOKEN") || "";

const BLOCK_DEFAULT = ["nudity", "porn", "violência gráfica", "decapit", "celebridade", "presidente", "lula", "bolsonaro"];

type ImgResult = { ok: boolean; bin?: Uint8Array; mime?: string; provider: string; error?: string };

function parseSize(format = "1080x1080") {
  const [w, h] = format.split("x").map((n) => parseInt(n, 10) || 1024);
  return { w: w || 1024, h: h || 1024 };
}

async function viaPollinations(prompt: string, format: string): Promise<ImgResult> {
  try {
    const { w, h } = parseSize(format);
    const enc = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${enc}?width=${w}&height=${h}&nologo=true&enhance=true&model=flux`;
    const r = await fetch(url);
    if (!r.ok) return { ok: false, provider: "pollinations", error: `${r.status}` };
    const ct = r.headers.get("content-type") || "image/jpeg";
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.length < 1000) return { ok: false, provider: "pollinations", error: "empty" };
    return { ok: true, bin: buf, mime: ct, provider: "pollinations-free" };
  } catch (e) { return { ok: false, provider: "pollinations", error: String(e) }; }
}

async function viaGeminiImage(prompt: string): Promise<ImgResult> {
  if (!GEMINI_API_KEY) return { ok: false, provider: "gemini-image", error: "no_key" };
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["IMAGE"] } }),
    });
    if (!r.ok) return { ok: false, provider: "gemini-image", error: `${r.status}: ${(await r.text()).slice(0, 200)}` };
    const j = await r.json();
    const parts = j?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p: any) => p?.inlineData?.data);
    if (!imgPart) return { ok: false, provider: "gemini-image", error: "no_inline" };
    const bin = Uint8Array.from(atob(imgPart.inlineData.data), (c) => c.charCodeAt(0));
    return { ok: true, bin, mime: imgPart.inlineData.mimeType || "image/png", provider: "gemini-image-free" };
  } catch (e) { return { ok: false, provider: "gemini-image", error: String(e) }; }
}

async function viaCloudflare(prompt: string): Promise<ImgResult> {
  if (!CF_ACCOUNT_ID || !CF_AI_TOKEN) return { ok: false, provider: "cloudflare", error: "no_key" };
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`;
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${CF_AI_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, steps: 4 }),
    });
    if (!r.ok) return { ok: false, provider: "cloudflare", error: `${r.status}` };
    const j = await r.json();
    const b64 = j?.result?.image;
    if (!b64) return { ok: false, provider: "cloudflare", error: "no_image" };
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return { ok: true, bin, mime: "image/jpeg", provider: "cloudflare-flux-free" };
  } catch (e) { return { ok: false, provider: "cloudflare", error: String(e) }; }
}

async function viaHuggingFace(prompt: string): Promise<ImgResult> {
  if (!HF_TOKEN) return { ok: false, provider: "huggingface", error: "no_key" };
  try {
    const r = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
      method: "POST",
      headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: prompt }),
    });
    if (!r.ok) return { ok: false, provider: "huggingface", error: `${r.status}` };
    const buf = new Uint8Array(await r.arrayBuffer());
    return { ok: true, bin: buf, mime: "image/jpeg", provider: "huggingface-flux-free" };
  } catch (e) { return { ok: false, provider: "huggingface", error: String(e) }; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "no_auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { prompt, company_id, brand_kit_id, format = "1080x1080", linked_post_id, preferred = "pollinations" } = body ?? {};
    if (!prompt || !company_id) return new Response(JSON.stringify({ error: "missing_params" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: ok } = await sb.rpc("comm_can", { _uid: user.id, _company: company_id, _action: "generate_image" });
    if (!ok) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SR);
    const { data: q } = await sbAdmin.from("comm_ai_quotas").select("*").eq("company_id", company_id).maybeSingle();
    const blocklist = [...BLOCK_DEFAULT, ...((q?.blocklist ?? []) as string[])].map((s) => s.toLowerCase());
    const promptLower = prompt.toLowerCase();
    const blocked = blocklist.find((w) => w && promptLower.includes(w));
    if (blocked) {
      return new Response(JSON.stringify({ error: "prompt_blocked", blocked }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const providers: Record<string, () => Promise<ImgResult>> = {
      pollinations: () => viaPollinations(prompt, format),
      gemini: () => viaGeminiImage(prompt),
      cloudflare: () => viaCloudflare(prompt),
      huggingface: () => viaHuggingFace(prompt),
    };
    const order = preferred && providers[preferred]
      ? [preferred, ...Object.keys(providers).filter((p) => p !== preferred)]
      : Object.keys(providers);

    const attempts: string[] = [];
    let result: ImgResult | null = null;
    for (const k of order) {
      const r = await providers[k]();
      attempts.push(`${r.provider}:${r.ok ? "ok" : r.error}`);
      if (r.ok && r.bin) { result = r; break; }
    }
    if (!result) {
      return new Response(JSON.stringify({ error: "no_free_provider", attempts, fallback: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ext = (result.mime || "").includes("png") ? "png" : "jpg";
    const path = `${company_id}/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await sbAdmin.storage.from("comm-generated-images").upload(path, result.bin!, { contentType: result.mime, upsert: false });
    if (upErr) return new Response(JSON.stringify({ error: "upload_failed", detail: upErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: signed } = await sbAdmin.storage.from("comm-generated-images").createSignedUrl(path, 60 * 60 * 24 * 7);

    const { data: row, error: insErr } = await sbAdmin.from("comm_generated_images").insert({
      company_id, brand_kit_id, prompt, prompt_revisado: prompt, provider: result.provider, model: result.provider, format,
      storage_path: path, public_url: signed?.signedUrl ?? null,
      tokens_in: 0, tokens_out: 0, status: "ready", approval_status: "rascunho", generated_by: user.id, linked_post_id,
    }).select().single();
    if (insErr) return new Response(JSON.stringify({ error: "insert_failed", detail: insErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    await sbAdmin.from("comm_ai_usage").insert({
      company_id, user_id: user.id, provider: result.provider, model: result.provider, kind: "image",
      tokens_in: 0, tokens_out: 0, cost_credits: 0,
    });

    return new Response(JSON.stringify({ ok: true, image: row, signed_url: signed?.signedUrl, provider: result.provider, attempts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "internal", message: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
