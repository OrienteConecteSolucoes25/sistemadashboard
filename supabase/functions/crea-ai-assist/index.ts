import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { question, uf, history } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "question required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // RAG simples: busca fontes ativas, opcionalmente filtradas por UF
    let q = supabase.from("crea_ai_sources").select("id,titulo,tipo,uf,conteudo,link").eq("ativo", true).eq("is_deleted", false).limit(30);
    if (uf) q = q.in("uf", [uf, "BR"]);
    const { data: sources } = await q;

    const ctx = (sources ?? []).map((s, i) =>
      `[${i+1}] ${s.titulo} (${s.tipo ?? ""} · ${s.uf ?? "-"})\n${(s.conteudo ?? "").slice(0, 1500)}`
    ).join("\n\n---\n\n");

    const MODULE_DOCS = `MÓDULO CREA & ART — VISÃO GERAL
Sub-abas: Dashboard, ARTs, Protocolos, CATs, Certidões, Baixas, Tratativas, Prazos, RTs, Engenheiros, Empresas e CREAs, Documentações, Normas e Regras, Links Oficiais, Credenciais, Auditoria, Assistente IA, Admin.
Status ART: nao_iniciada, em_emissao, emitida, paga, registrada, baixada, cancelada.
Datas finas em ART (preenchidas em aba lateral): rascunho, envio para validação, validada, emissão, pagamento, baixa.
Status protocolo: aberto, em_exigencia, deferido, indeferido, arquivado.
Toda exclusão é soft delete com motivo, registrada em crea_audit_logs.
Importação adaptativa: colunas extras vão para JSONB "data" e voltam na exportação.
Anexos: bucket "crea-attachments" privado, em qualquer formulário.
Credenciais: senhas cifradas (AES) com chave-mestra; revelação exige motivo e auto-oculta em 30s.
Flags de integração (off por padrão): scraping, rpa_portais, assinatura_digital, confea_api_oficial, ia_externa_paga, revelar_senha_sem_motivo.`;

    const system = `Você é o Assistente do módulo CREA & ART do ERP OCS.
- Para perguntas sobre COMO O MÓDULO FUNCIONA, suas abas, status, fluxos: responda usando a seção MÓDULO abaixo.
- Para perguntas sobre NORMAS, RESOLUÇÕES, DN, PL, prazos legais ou procedimentos do CREA: responda APENAS com base nas FONTES e cite [n] no final das frases relevantes. Se não houver suporte nas fontes, diga "Não tenho fonte cadastrada para responder isso — confirme no portal oficial do CREA da UF".
- Nunca invente número de DN/PL/Resolução nem prazo.

MÓDULO:
${MODULE_DOCS}

FONTES:
${ctx || "(nenhuma fonte cadastrada)"}`;

    const userMsgs = [...(Array.isArray(history) ? history : []), { role: "user", content: question }];

    const t0 = Date.now();
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...userMsgs],
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit excedido" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados na Lovable AI" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: "AI error: " + t.slice(0,300) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await r.json();
    const answer = j?.choices?.[0]?.message?.content ?? "(sem resposta)";
    const ms = Date.now() - t0;

    // Detecta quais fontes foram citadas [n]
    const cited = new Set<number>();
    for (const m of String(answer).matchAll(/\[(\d+)\]/g)) cited.add(Number(m[1]));
    const citedSources = (sources ?? []).filter((_, i) => cited.has(i+1)).map(s => ({ titulo: s.titulo, uf: s.uf, link: s.link }));

    // Persiste histórico (com user via Authorization)
    try {
      const { data: u } = await supabase.auth.getUser();
      if (u?.user) {
        await supabase.from("crea_ai_questions").insert({
          user_id: u.user.id, pergunta: question, resposta: answer,
          fontes_citadas: citedSources, uf: uf ?? null, modelo: "google/gemini-2.5-flash", duracao_ms: ms,
        });
      }
    } catch (_e) { /* ignore */ }

    return new Response(JSON.stringify({ answer, sources: citedSources, duracao_ms: ms }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
