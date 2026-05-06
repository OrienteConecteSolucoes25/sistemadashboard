// Edge function: comm-ai
// Geração de texto via Lovable AI Gateway para o módulo Comunicação IA Studio.
// kinds: legenda | post | carrossel | newsletter | comunicado_interno | texto | roteiro | briefing | campanha | ideia
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

interface Body {
  kind: string;
  brand?: any;
  inputs?: Record<string, any>;
  model?: string;
  json?: boolean;
  company_id?: string;
}

const SYSTEM_BASE = `Você é um assistente sênior de comunicação e marketing da plataforma ERP OCS.
Sempre escreve em pt-BR, claro, objetivo, sem emojis a menos que solicitado.
Respeita o Brand Kit fornecido (tom, persona, palavras permitidas/proibidas).
Nunca inventa dados ou métricas. Se precisar de algo desconhecido, devolve um placeholder claro entre colchetes.`;

function brandPrompt(brand: any) {
  if (!brand) return "Brand Kit: (não fornecido — use tom neutro profissional).";
  return `Brand Kit:
- Marca: ${brand.nome ?? ""}
- Slogan: ${brand.slogan ?? ""}
- Persona: ${brand.persona ?? ""}
- Público-alvo: ${brand.publico_alvo ?? ""}
- Tom de voz: ${brand.tom_de_voz ?? ""}
- Proposta de valor: ${brand.proposta_valor ?? ""}
- Diferenciais: ${brand.diferenciais ?? ""}
- CTA padrão: ${brand.cta_padrao ?? ""}
- Palavras permitidas: ${(brand.palavras_permitidas ?? []).join(", ") || "—"}
- Palavras PROIBIDAS (nunca usar): ${(brand.palavras_proibidas ?? []).join(", ") || "—"}`;
}

function userPromptFor(kind: string, inputs: Record<string, any>) {
  const i = inputs ?? {};
  switch (kind) {
    case "legenda":
      return `Gere LEGENDAS para um post de ${i.canal ?? "rede social"}.
Tema: ${i.tema}
Objetivo: ${i.objetivo ?? "engajamento"}
Tom: ${i.tom_de_voz ?? "use o do Brand Kit"}
Tamanho: ${i.tamanho ?? "médio"}  Emojis: ${i.emojis ? "sim" : "não"}  Hashtags: ${i.hashtags ? "sim" : "não"}
CTA: ${i.cta ?? "use o padrão do Brand Kit"}

Retorne JSON com: { principal, variacoes:[3], curta, storytelling, comercial, institucional, hashtags:[...], cta }`;
    case "post":
      return `Crie um POST completo para ${i.canal ?? "Instagram"} (formato: ${i.formato ?? "post único"}).
Tema: ${i.tema}; Objetivo: ${i.objetivo}; Público: ${i.publico ?? ""}; CTA: ${i.cta ?? ""}; Palavras-chave: ${(i.palavras_chave ?? []).join(", ")}
Retorne JSON: { titulo, legenda, texto_card, hashtags:[...], cta, descricao_alternativa, prompt_visual, briefing_visual, variacoes:[{tipo,texto}] }`;
    case "carrossel":
      return `Crie um CARROSSEL com ${i.qtd_slides ?? 6} slides.
Tema: ${i.tema}; Público: ${i.publico ?? ""}; Objetivo: ${i.objetivo ?? ""}; Canal: ${i.canal ?? "Instagram"}; CTA: ${i.cta ?? ""}
Estrutura: capa forte, problema, consequência, solução, exemplo, CTA.
Retorne JSON: { titulo, legenda, hashtags:[...], cta, slides:[{ordem,titulo,texto,design_sugerido}] }`;
    case "newsletter":
      return `Crie uma NEWSLETTER.
Tema: ${i.tema}; Objetivo: ${i.objetivo}; Público: ${i.publico ?? ""}; CTA: ${i.cta ?? ""}
Retorne JSON: { assunto, pre_header, abertura, blocos:[{titulo,texto}], cta, rodape, versao_texto }`;
    case "comunicado_interno":
      return `Crie um COMUNICADO INTERNO do tipo "${i.tipo ?? "aviso"}".
Assunto: ${i.tema}; Público: ${i.publico_alvo ?? "todos"}; Prioridade: ${i.prioridade ?? "normal"}
Retorne JSON: { titulo, mensagem_curta, mensagem_completa, cta, versao_email, versao_whatsapp, versao_mural }`;
    case "texto":
      return `Escreva um texto do tipo "${i.tipo ?? "institucional"}".
Tema: ${i.tema}; Objetivo: ${i.objetivo}; Tamanho: ${i.tamanho ?? "médio"}; Palavras obrigatórias: ${(i.palavras_obrigatorias ?? []).join(", ")}
Retorne JSON: { titulo, texto, cta }`;
    case "campanha":
      return `Crie uma CAMPANHA do tipo "${i.tipo ?? "lançamento"}".
Objetivo: ${i.objetivo}; Público: ${i.publico ?? ""}; Produto: ${i.produto ?? ""}; Canais: ${(i.canais ?? []).join(", ")}; Prazo: ${i.prazo ?? ""}
Retorne JSON: { nome, conceito, promessa, mensagens_chave:[...], posts_sugeridos:[{canal,titulo,resumo}], pecas:[...], roteiro_lancamento:[...], metricas_esperadas:{...} }`;
    case "ideia":
      return `Gere ${i.qtd ?? 10} IDEIAS de ${i.categoria ?? "post"} sobre: ${i.tema}.
Retorne JSON: { ideias:[{titulo, resumo, categoria, prioridade}] }`;
    case "briefing_visual":
      return `Crie BRIEFING VISUAL e PROMPT para imagem do post sobre: ${i.tema}.
Formato: ${i.formato ?? "1080x1080"}; Estilo: ${i.estilo_visual ?? "use o Brand Kit"}; Cores: aplicar paleta da marca.
Retorne JSON: { briefing_visual, prompt_visual, paleta:[...], elementos:[...], proibido:[...] }`;
    default:
      return `Atenda à solicitação: ${JSON.stringify(i)}`;
  }
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
    const { kind, brand, inputs = {}, model = "google/gemini-2.5-flash", company_id } = body;
    if (!kind) return new Response(JSON.stringify({ error: "missing_kind" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Permissão
    if (company_id) {
      const { data: ok } = await sb.rpc("comm_can", { _uid: user.id, _company: company_id, _action: "generate_content" });
      if (!ok) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const messages = [
      { role: "system", content: SYSTEM_BASE + "\n\n" + brandPrompt(brand) + "\n\nResponda SEMPRE em JSON válido." },
      { role: "user", content: userPromptFor(kind, inputs) },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, response_format: { type: "json_object" } }),
    });

    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "credits_exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: "ai_error", detail: txt }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }

    // log de uso
    if (company_id) {
      const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SR);
      await sbAdmin.from("comm_ai_usage").insert({
        company_id, user_id: user.id, provider: "lovable", model, kind: "text",
        tokens_in: aiJson.usage?.prompt_tokens ?? 0, tokens_out: aiJson.usage?.completion_tokens ?? 0,
      });
      await sbAdmin.rpc("comm_log_audit", {
        _company: company_id, _action: "ai_generate", _modulo: `comm.${kind}`,
        _entidade_tipo: kind, _payload: { model, tokens: aiJson.usage }
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ ok: true, kind, data: parsed, model }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "internal", message: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
