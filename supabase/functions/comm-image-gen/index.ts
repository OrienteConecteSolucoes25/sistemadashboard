// Edge function: comm-image-gen
// Gera imagens via Lovable AI Gateway (gemini image preview), salva em bucket privado e registra uso/quota.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BLOCK_DEFAULT = ["nudity", "porn", "violência gráfica", "decapit", "celebridade", "presidente", "lula", "bolsonaro"];

interface Body {
  prompt: string;
  company_id: string;
  brand_kit_id?: string;
  format?: string; // "1080x1080" etc
  model?: string;  // "google/gemini-3-pro-image-preview" or "google/gemini-2.5-flash-image"
  linked_post_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "no_auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body: Body = await req.json();
    const { prompt, company_id, brand_kit_id, format = "1080x1080", model = "google/gemini-2.5-flash-image", linked_post_id } = body;
    if (!prompt || !company_id) return new Response(JSON.stringify({ error: "missing_params" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Permissão
    const { data: ok } = await sb.rpc("comm_can", { _uid: user.id, _company: company_id, _action: "generate_image" });
    if (!ok) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SR);

    // Quotas
    const { data: q } = await sbAdmin.from("comm_ai_quotas").select("*").eq("company_id", company_id).maybeSingle();
    const monthlyLimit = q?.monthly_image_limit ?? 200;
    const dailyLimit = q?.daily_image_limit ?? 50;
    const blocklist = [...BLOCK_DEFAULT, ...((q?.blocklist ?? []) as string[])].map((s) => s.toLowerCase());

    const promptLower = prompt.toLowerCase();
    const blocked = blocklist.find((w) => w && promptLower.includes(w));
    if (blocked) {
      await sbAdmin.rpc("comm_log_audit", {
        _company: company_id, _action: "image_blocked", _modulo: "comm.imagem",
        _payload: { prompt, blocked }
      });
      return new Response(JSON.stringify({ error: "prompt_blocked", blocked }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    const dayAgo = new Date(); dayAgo.setDate(dayAgo.getDate() - 1);
    const { count: monthCount } = await sbAdmin.from("comm_ai_usage").select("*", { count: "exact", head: true })
      .eq("company_id", company_id).eq("kind", "image").gte("created_at", monthAgo.toISOString());
    const { count: dayCount } = await sbAdmin.from("comm_ai_usage").select("*", { count: "exact", head: true })
      .eq("company_id", company_id).eq("kind", "image").gte("created_at", dayAgo.toISOString());
    if ((monthCount ?? 0) >= monthlyLimit) return new Response(JSON.stringify({ error: "monthly_quota", fallback: true, limit: monthlyLimit }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if ((dayCount ?? 0) >= dailyLimit) return new Response(JSON.stringify({ error: "daily_quota", fallback: true, limit: dailyLimit }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Chama Lovable AI — UMA ÚNICA tentativa (cada chamada consome créditos)
    let aiJson: any = null;
    let dataUrl: string | undefined;
    let lastErrDetail = "";
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "rate_limited", fallback: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "credits_exhausted", fallback: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiRes.ok) {
      lastErrDetail = await aiRes.text();
      // Registra a tentativa falha pra contar na cota (evita sangrar crédito)
      await sbAdmin.from("comm_ai_usage").insert({ company_id, user_id: user.id, provider: "lovable", model, kind: "image", tokens_in: 0, tokens_out: 0 });
      return new Response(JSON.stringify({ error: "ai_error", detail: lastErrDetail, fallback: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    aiJson = await aiRes.json();
    dataUrl = aiJson.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl?.startsWith("data:")) {
      console.error("[comm-image-gen] no_image", { model, sample: JSON.stringify(aiJson).slice(0, 500) });
      // Tentativa consumiu crédito → registra no usage pra contar na cota
      await sbAdmin.from("comm_ai_usage").insert({
        company_id, user_id: user.id, provider: "lovable", model, kind: "image",
        tokens_in: aiJson.usage?.prompt_tokens ?? 0, tokens_out: aiJson.usage?.completion_tokens ?? 0,
      });
      return new Response(JSON.stringify({ error: "no_image", detail: "modelo retornou sem imagem", fallback: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Decode base64 e upload
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*?);base64/)?.[1] ?? "image/png";
    const ext = mime.includes("jpeg") ? "jpg" : "png";
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `${company_id}/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await sbAdmin.storage.from("comm-generated-images").upload(path, bin, { contentType: mime, upsert: false });
    if (upErr) return new Response(JSON.stringify({ error: "upload_failed", detail: upErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: signed } = await sbAdmin.storage.from("comm-generated-images").createSignedUrl(path, 60 * 60 * 24 * 7);

    const { data: row, error: insErr } = await sbAdmin.from("comm_generated_images").insert({
      company_id, brand_kit_id, prompt, prompt_revisado: prompt, provider: "lovable", model, format,
      storage_path: path, public_url: signed?.signedUrl ?? null,
      tokens_in: aiJson.usage?.prompt_tokens ?? 0, tokens_out: aiJson.usage?.completion_tokens ?? 0,
      status: "ready", approval_status: "rascunho", generated_by: user.id, linked_post_id,
    }).select().single();
    if (insErr) return new Response(JSON.stringify({ error: "insert_failed", detail: insErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    await sbAdmin.from("comm_ai_usage").insert({
      company_id, user_id: user.id, provider: "lovable", model, kind: "image",
      tokens_in: aiJson.usage?.prompt_tokens ?? 0, tokens_out: aiJson.usage?.completion_tokens ?? 0,
    });
    await sbAdmin.rpc("comm_log_audit", {
      _company: company_id, _action: "image_generate", _modulo: "comm.imagem",
      _entidade_tipo: "comm_generated_images", _entidade_id: row.id, _payload: { format, model }
    });

    return new Response(JSON.stringify({ ok: true, image: row, signed_url: signed?.signedUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "internal", message: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
