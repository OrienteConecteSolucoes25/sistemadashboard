// Edge function: comm-director-agent
// Diretor de Comunicação OCS — agente com tool calling para criar registros nas
// abas do módulo Comunicação OCS (calendário, posts, carrosséis, newsletters,
// comunicados internos, ideias, campanhas).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const SYSTEM = `Você é o **Diretor de Comunicação OCS** — sênior, estratégico e direto, como diretor de marketing das melhores marcas (iFood, Coca-Cola, Nubank).

Sua missão: ajudar o usuário a planejar e executar TUDO no módulo de Comunicação OCS, conversando.

## Princípios
- Sempre pergunte o necessário antes de criar (quantos posts/semana, canais, datas, tema central, público).
- Use o **Brand Kit** fornecido para todos os textos (tom, palavras permitidas/proibidas, persona, cores).
- Comunicação **externa** = posts/legendas/carrosséis/newsletter/calendário usando o brand kit.
- Comunicação **interna** = comunicados internos para a equipe usando os módulos liberados.
- Respostas sempre em pt-BR, claras, objetivas, em markdown.
- Quando criar registros, use as ferramentas (tool calls). NUNCA invente IDs.
- Após chamar uma ferramenta, explique brevemente o que foi criado e proponha o próximo passo.

## Ferramentas disponíveis
- criar_calendario_item: cria um item no calendário editorial
- criar_post: cria rascunho de post
- criar_carrossel: cria carrossel
- criar_newsletter: cria newsletter
- criar_comunicado_interno: cria comunicado interno
- criar_ideia: adiciona ideia ao banco
- criar_campanha: cria campanha
- planejar_semana: cria múltiplos itens de calendário de uma vez
- consultar_top_posts: lista posts com maior engajamento (use quando o usuário pedir referências do que funcionou)

## Métricas & Insights
- Você recebe no contexto um **resumo de performance** dos últimos 30 dias (impressões, alcance, engajamento médio, melhor canal) e o **último insight de IA** já gerado para a marca.
- Use SEMPRE esses dados para fundamentar recomendações: cite números, aponte o que performou bem/mal e proponha o próximo conteúdo baseado no que dá resultado.
- Se faltarem métricas, diga que ainda não há dados suficientes e sugira começar a coletar (publicar + registrar métricas).

Tudo nasce como rascunho — exige aprovação humana.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "criar_calendario_item",
      description: "Cria 1 item no calendário editorial",
      parameters: {
        type: "object",
        properties: {
          data_planejada: { type: "string", description: "YYYY-MM-DD" },
          canal: { type: "string" },
          formato: { type: "string" },
          tema: { type: "string" },
          legenda: { type: "string" },
          texto: { type: "string" },
          cta: { type: "string" },
          prioridade: { type: "string", enum: ["baixa", "normal", "alta", "urgente"] },
        },
        required: ["data_planejada", "tema"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "planejar_semana",
      description: "Cria vários itens no calendário (use quando o usuário pedir 'monte X posts por semana')",
      parameters: {
        type: "object",
        properties: {
          itens: {
            type: "array",
            items: {
              type: "object",
              properties: {
                data_planejada: { type: "string" },
                canal: { type: "string" },
                formato: { type: "string" },
                tema: { type: "string" },
                legenda: { type: "string" },
                cta: { type: "string" },
              },
              required: ["data_planejada", "tema"],
            },
          },
        },
        required: ["itens"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_post",
      description: "Cria um rascunho de post",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          tema: { type: "string" },
          canal: { type: "string" },
          formato: { type: "string" },
          legenda: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
          cta: { type: "string" },
          prompt_visual: { type: "string" },
        },
        required: ["titulo", "legenda"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_carrossel",
      description: "Cria um carrossel",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string" }, canal: { type: "string" },
          legenda: { type: "string" }, cta: { type: "string" },
          slides: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ordem: { type: "number" }, titulo: { type: "string" }, texto: { type: "string" },
              },
            },
          },
        },
        required: ["titulo", "slides"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_newsletter",
      description: "Cria uma newsletter",
      parameters: {
        type: "object",
        properties: {
          assunto: { type: "string" }, pre_header: { type: "string" },
          publico: { type: "string" }, conteudo: { type: "string" }, cta: { type: "string" },
        },
        required: ["assunto", "conteudo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_comunicado_interno",
      description: "Cria um comunicado interno para a equipe",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string" }, titulo: { type: "string" },
          mensagem_curta: { type: "string" }, mensagem_completa: { type: "string" },
          publico_alvo: { type: "string" }, prioridade: { type: "string" },
        },
        required: ["titulo", "mensagem_completa"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_ideia",
      description: "Adiciona 1+ ideias ao banco",
      parameters: {
        type: "object",
        properties: {
          ideias: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ideia: { type: "string" }, categoria: { type: "string" }, prioridade: { type: "string" },
              },
              required: ["ideia"],
            },
          },
        },
        required: ["ideias"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_campanha",
      description: "Cria uma campanha",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string" }, tipo: { type: "string" },
          objetivo: { type: "string" }, descricao: { type: "string" },
          publico_alvo: { type: "string" },
          data_inicio: { type: "string" }, data_fim: { type: "string" },
        },
        required: ["nome"],
      },
    },
  },
];

function brandPrompt(b: any) {
  if (!b) return "Brand Kit: (nenhum cliente selecionado — peça ao usuário para selecionar um cliente/marca no topo).";
  return `Brand Kit ATIVO:
- Cliente/Marca: ${b.nome}
- Slogan: ${b.slogan ?? ""}
- Descrição: ${b.descricao ?? ""}
- Persona: ${b.persona ?? ""}
- Público-alvo: ${b.publico_alvo ?? ""}
- Tom de voz: ${b.tom_de_voz ?? ""}
- Proposta de valor: ${b.proposta_valor ?? ""}
- Diferenciais: ${b.diferenciais ?? ""}
- CTA padrão: ${b.cta_padrao ?? ""}
- Estilo visual: ${b.estilo_visual ?? ""}
- Cores: ${(b.cores_principais ?? []).join(", ")}
- Palavras permitidas: ${(b.palavras_permitidas ?? []).join(", ") || "—"}
- Palavras PROIBIDAS: ${(b.palavras_proibidas ?? []).join(", ") || "—"}`;
}

async function executeTools(sb: any, toolCalls: any[], ctx: { company_id: string; brand_kit_id: string | null; user_id: string }) {
  const results: any[] = [];
  for (const tc of toolCalls) {
    const name = tc.function?.name;
    let args: any = {};
    try { args = JSON.parse(tc.function?.arguments ?? "{}"); } catch {}
    const base = { company_id: ctx.company_id, brand_kit_id: ctx.brand_kit_id, created_by: ctx.user_id };
    let summary = "";
    let ok = false;
    try {
      if (name === "criar_calendario_item") {
        const { error } = await sb.from("comm_editorial_calendar").insert({
          ...base, status: "planejado",
          data_planejada: args.data_planejada,
          canal: args.canal, formato: args.formato, tema: args.tema,
          legenda: args.legenda, texto: args.texto, cta: args.cta, prioridade: args.prioridade,
        });
        if (error) throw error;
        summary = `Calendário: "${args.tema}" em ${args.data_planejada}`;
        ok = true;
      } else if (name === "planejar_semana") {
        const rows = (args.itens ?? []).map((it: any) => ({
          ...base, status: "planejado",
          data_planejada: it.data_planejada,
          canal: it.canal, formato: it.formato, tema: it.tema,
          legenda: it.legenda, cta: it.cta,
        }));
        if (rows.length) {
          const { error } = await sb.from("comm_editorial_calendar").insert(rows);
          if (error) throw error;
        }
        summary = `${rows.length} itens criados no calendário`;
        ok = true;
      } else if (name === "criar_post") {
        const { error } = await sb.from("comm_content_posts").insert({
          ...base, status: "rascunho_ia", ai_generated: true,
          titulo: args.titulo, tema: args.tema, canal: args.canal, formato: args.formato,
          legenda: args.legenda, hashtags: args.hashtags ?? [], cta: args.cta, prompt_visual: args.prompt_visual,
        });
        if (error) throw error;
        summary = `Post "${args.titulo}" criado como rascunho`;
        ok = true;
      } else if (name === "criar_carrossel") {
        const { error } = await sb.from("comm_carousels").insert({
          ...base, status: "rascunho_ia",
          titulo: args.titulo, canal: args.canal, legenda: args.legenda, cta: args.cta,
          slides: args.slides ?? [],
        });
        if (error) throw error;
        summary = `Carrossel "${args.titulo}" com ${args.slides?.length ?? 0} slides`;
        ok = true;
      } else if (name === "criar_newsletter") {
        const { error } = await sb.from("comm_newsletters").insert({
          ...base, status: "rascunho_ia",
          assunto: args.assunto, pre_header: args.pre_header,
          publico: args.publico, conteudo: args.conteudo, cta: args.cta,
        });
        if (error) throw error;
        summary = `Newsletter "${args.assunto}" criada`;
        ok = true;
      } else if (name === "criar_comunicado_interno") {
        const { error } = await sb.from("comm_internal_comms").insert({
          ...base, status: "rascunho_ia",
          tipo: args.tipo, titulo: args.titulo,
          mensagem_curta: args.mensagem_curta, mensagem_completa: args.mensagem_completa,
          publico_alvo: args.publico_alvo, prioridade: args.prioridade ?? "normal",
        });
        if (error) throw error;
        summary = `Comunicado interno "${args.titulo}" criado`;
        ok = true;
      } else if (name === "criar_ideia") {
        const rows = (args.ideias ?? []).map((i: any) => ({
          ...base, ideia: i.ideia, categoria: i.categoria ?? "post",
          prioridade: i.prioridade ?? "média", origem: "Diretor IA",
        }));
        if (rows.length) {
          const { error } = await sb.from("comm_idea_bank").insert(rows);
          if (error) throw error;
        }
        summary = `${rows.length} ideias adicionadas ao banco`;
        ok = true;
      } else if (name === "criar_campanha") {
        const { error } = await sb.from("comm_campaigns").insert({
          ...base, status: "planejada",
          nome: args.nome, tipo: args.tipo, objetivo: args.objetivo, descricao: args.descricao,
          publico_alvo: args.publico_alvo, data_inicio: args.data_inicio, data_fim: args.data_fim,
        });
        if (error) throw error;
        summary = `Campanha "${args.nome}" criada`;
        ok = true;
      } else {
        summary = `(ferramenta desconhecida: ${name})`;
      }
    } catch (e: any) {
      summary = `❌ ${name}: ${e.message ?? "erro"}`;
      ok = false;
    }
    results.push({ tool: name, summary, ok, args });
  }
  return results;
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
    const { conversation_id, company_id, brand_kit_id, scope = "externa" } = body;
    if (!conversation_id || !company_id) {
      return new Response(JSON.stringify({ error: "missing_params" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Permission
    const { data: ok } = await sb.rpc("comm_can", { _uid: user.id, _company: company_id, _action: "view" });
    if (!ok) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Load brand kit
    let brand: any = null;
    if (brand_kit_id) {
      const { data } = await sb.from("comm_brand_kits").select("*").eq("id", brand_kit_id).maybeSingle();
      brand = data;
    }

    // Load history
    const { data: history } = await sb
      .from("comm_director_messages")
      .select("role, content")
      .eq("conversation_id", conversation_id)
      .order("created_at")
      .limit(40);

    const messages = [
      { role: "system", content: SYSTEM + "\n\n" + brandPrompt(brand) + `\n\nEscopo desta conversa: **${scope === "interna" ? "Comunicação interna" : "Comunicação externa"}**.\nData de hoje: ${new Date().toISOString().slice(0, 10)}.` },
      ...(history ?? []).filter((m: any) => m.content).map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: TOOLS,
      }),
    });

    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "credits_exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: "ai_error", detail: txt }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const aiJson = await aiRes.json();
    const choice = aiJson.choices?.[0]?.message;
    let reply = choice?.content ?? "";
    let toolResults: any[] = [];

    if (choice?.tool_calls?.length) {
      toolResults = await executeTools(sb, choice.tool_calls, {
        company_id, brand_kit_id: brand_kit_id ?? null, user_id: user.id,
      });

      // Second turn: ask the model to summarize results to the user
      const followMessages = [
        ...messages,
        { role: "assistant", content: reply || null, tool_calls: choice.tool_calls },
        ...choice.tool_calls.map((tc: any, idx: number) => ({
          role: "tool",
          tool_call_id: tc.id,
          name: tc.function?.name,
          content: JSON.stringify(toolResults[idx] ?? { ok: false }),
        })),
      ];

      const aiRes2 = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: followMessages }),
      });
      if (aiRes2.ok) {
        const j2 = await aiRes2.json();
        reply = j2.choices?.[0]?.message?.content ?? reply ?? "Pronto!";
      } else {
        reply = reply || `Concluído. ${toolResults.map((r) => "• " + r.summary).join("\n")}`;
      }
    }

    return new Response(JSON.stringify({ ok: true, reply, tool_results: toolResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("director error:", e);
    return new Response(JSON.stringify({ error: "internal", message: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
