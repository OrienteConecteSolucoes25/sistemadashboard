// comm-metrics-insights: gera insights via Lovable AI a partir das métricas
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const body = await req.json();
    const { company_id, client_brand_id, scope = "geral", periodo_de, periodo_ate, brand_context } = body;
    if (!company_id) throw new Error("company_id required");

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let q = supa.from("comm_post_metrics").select("*").eq("company_id", company_id).order("collected_at", { ascending: false }).limit(200);
    if (client_brand_id) q = q.eq("client_brand_id", client_brand_id);
    if (periodo_de) q = q.gte("collected_at", periodo_de);
    if (periodo_ate) q = q.lte("collected_at", periodo_ate);
    const { data: metrics } = await q;

    if (!metrics || metrics.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "no_metrics", message: "Sem métricas registradas para gerar insights." }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Agregação simples
    const agg = metrics.reduce((acc: any, m: any) => {
      acc.impressions += m.impressions ?? 0;
      acc.reach += m.reach ?? 0;
      acc.likes += m.likes ?? 0;
      acc.comments += m.comments ?? 0;
      acc.shares += m.shares ?? 0;
      acc.saves += m.saves ?? 0;
      acc.clicks += m.clicks ?? 0;
      acc.posts += 1;
      const er = Number(m.engagement_rate ?? 0);
      acc.er_sum += er; acc.er_count += er > 0 ? 1 : 0;
      return acc;
    }, { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, posts: 0, er_sum: 0, er_count: 0 });
    agg.engagement_rate_avg = agg.er_count ? +(agg.er_sum / agg.er_count).toFixed(2) : 0;

    const top = [...metrics].sort((a: any, b: any) => (Number(b.engagement_rate ?? 0)) - (Number(a.engagement_rate ?? 0))).slice(0, 5);
    const bot = [...metrics].sort((a: any, b: any) => (Number(a.engagement_rate ?? 0)) - (Number(b.engagement_rate ?? 0))).slice(0, 5);

    const prompt = `Você é o Diretor de Comunicação OCS. Analise os dados de desempenho a seguir e gere insights acionáveis em PT-BR.
Marca: ${JSON.stringify(brand_context ?? {}).slice(0, 1500)}

Agregado: ${JSON.stringify(agg)}
Top 5 (maior ER): ${JSON.stringify(top.map((t: any) => ({ provider: t.provider, caption: (t.caption ?? "").slice(0, 80), er: t.engagement_rate, likes: t.likes, comments: t.comments })))}
Bottom 5 (menor ER): ${JSON.stringify(bot.map((t: any) => ({ provider: t.provider, caption: (t.caption ?? "").slice(0, 80), er: t.engagement_rate, likes: t.likes, comments: t.comments })))}

Responda EXCLUSIVAMENTE com JSON válido no formato:
{"resumo": "1-2 parágrafos", "pontos_fortes": ["...","..."], "pontos_fracos": ["...","..."], "recomendacoes": [{"acao":"...","impacto":"alto|medio|baixo","prazo":"curto|medio|longo"}]}`;

    const aiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!aiKey) throw new Error("LOVABLE_API_KEY missing");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é o Diretor de Comunicação OCS, analista sênior. Responda apenas com JSON válido." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      throw new Error("ai_gateway_error: " + t.slice(0, 200));
    }
    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = { resumo: content }; }

    const ins = await supa.from("comm_ai_insights").insert({
      company_id,
      client_brand_id: client_brand_id ?? null,
      scope,
      periodo_de: periodo_de ?? null,
      periodo_ate: periodo_ate ?? null,
      resumo: parsed.resumo ?? "",
      pontos_fortes: parsed.pontos_fortes ?? [],
      pontos_fracos: parsed.pontos_fracos ?? [],
      recomendacoes: parsed.recomendacoes ?? [],
      metrica_base: agg,
      modelo: "google/gemini-2.5-flash",
      created_by: u.user.id,
    }).select().single();

    if (ins.error) throw ins.error;

    return new Response(JSON.stringify({ ok: true, insight: ins.data, agg }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
