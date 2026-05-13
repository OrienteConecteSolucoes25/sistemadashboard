// Edge unificada do Soluções-Verso: 1 endpoint, vários módulos.
// - Cota mensal por usuário (custo IA absorvido pela OCS)
// - Cache 24h para perguntas genéricas
// - Tool-calling com leituras via JWT do usuário (RLS isola dados)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { KNOWLEDGE } from "./knowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const MODEL = "google/gemini-3-flash-preview";

// ---- Tools por módulo ----
type ToolDef = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  // deno-lint-ignore no-explicit-any
  handler: (sb: any, args: any) => Promise<unknown>;
};

const ENG_TOOLS: ToolDef[] = [
  {
    name: "listar_obras",
    description: "Lista obras visíveis ao usuário (RLS aplica).",
    parameters: {
      type: "object",
      properties: { limite: { type: "number", default: 20 } },
    },
    handler: async (sb, args) => {
      const { data, error } = await sb
        .from("eng_fibra_obras")
        .select("id, nome, status, data_inicio, prazo_fim")
        .order("created_at", { ascending: false })
        .limit(Math.min(args?.limite ?? 20, 50));
      if (error) return { error: error.message };
      return { obras: data ?? [] };
    },
  },
  {
    name: "kpis_engenharia",
    description: "KPIs gerais: total de obras, projetos, RFIs e pendências do usuário.",
    parameters: { type: "object", properties: {} },
    handler: async (sb) => {
      const [obras, projetos, rfis, pend] = await Promise.all([
        sb.from("eng_fibra_obras").select("*", { count: "exact", head: true }),
        sb.from("eng_projetos").select("*", { count: "exact", head: true }),
        sb.from("eng_rfi").select("*", { count: "exact", head: true }),
        sb.from("eng_pendencias").select("*", { count: "exact", head: true }),
      ]);
      return {
        obras: obras.count ?? 0,
        projetos: projetos.count ?? 0,
        rfis: rfis.count ?? 0,
        pendencias: pend.count ?? 0,
      };
    },
  },
  {
    name: "pendencias_abertas",
    description: "Lista pendências em aberto.",
    parameters: { type: "object", properties: { limite: { type: "number", default: 10 } } },
    handler: async (sb, args) => {
      const { data, error } = await sb
        .from("eng_pendencias")
        .select("id, titulo, status, prazo, responsavel")
        .neq("status", "concluida")
        .order("prazo", { ascending: true })
        .limit(Math.min(args?.limite ?? 10, 30));
      if (error) return { error: error.message };
      return { pendencias: data ?? [] };
    },
  },
];

// deno-lint-ignore no-explicit-any
const countOf = async (sb: any, table: string, filter?: (q: any) => any) => {
  let q = sb.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  return error ? 0 : (count ?? 0);
};

const RHDP_TOOLS: ToolDef[] = [
  {
    name: "listar_colaboradores",
    description: "Lista colaboradores ativos.",
    parameters: { type: "object", properties: { limite: { type: "number", default: 20 } } },
    handler: async (sb, args) => {
      const { data, error } = await sb.from("hrdp_employees")
        .select("id, full_name, position, department, status")
        .limit(Math.min(args?.limite ?? 20, 50));
      return error ? { error: error.message } : { colaboradores: data ?? [] };
    },
  },
  {
    name: "kpis_rhdp",
    description: "KPIs gerais: colaboradores, contratos, férias e solicitações.",
    parameters: { type: "object", properties: {} },
    handler: async (sb) => ({
      colaboradores: await countOf(sb, "hrdp_employees"),
      contratos: await countOf(sb, "hrdp_contracts"),
      ferias: await countOf(sb, "hrdp_vacations"),
      solicitacoes: await countOf(sb, "hrdp_employee_requests"),
    }),
  },
  {
    name: "ferias_proximas",
    description: "Lista próximas férias programadas.",
    parameters: { type: "object", properties: { limite: { type: "number", default: 10 } } },
    handler: async (sb, args) => {
      const { data, error } = await sb.from("hrdp_vacations")
        .select("id, employee_id, start_date, end_date, status")
        .order("start_date", { ascending: true })
        .limit(Math.min(args?.limite ?? 10, 30));
      return error ? { error: error.message } : { ferias: data ?? [] };
    },
  },
  {
    name: "solicitacoes_pendentes",
    description: "Solicitações de colaboradores em aberto.",
    parameters: { type: "object", properties: {} },
    handler: async (sb) => {
      const { data, error } = await sb.from("hrdp_employee_requests")
        .select("id, employee_id, request_type, status, created_at")
        .neq("status", "approved")
        .neq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(20);
      return error ? { error: error.message } : { solicitacoes: data ?? [] };
    },
  },
];

const CREA_TOOLS: ToolDef[] = [
  {
    name: "listar_arts",
    description: "Lista ARTs cadastradas.",
    parameters: { type: "object", properties: { limite: { type: "number", default: 20 } } },
    handler: async (sb, args) => {
      const { data, error } = await sb.from("crea_arts")
        .select("id, numero, status, data_emissao")
        .order("data_emissao", { ascending: false })
        .limit(Math.min(args?.limite ?? 20, 50));
      return error ? { error: error.message } : { arts: data ?? [] };
    },
  },
  {
    name: "kpis_crea",
    description: "KPIs: RTs, ARTs, anuidades e obras com ART.",
    parameters: { type: "object", properties: {} },
    handler: async (sb) => ({
      rts: await countOf(sb, "crea_responsible_technicians"),
      arts: await countOf(sb, "crea_arts"),
      anuidades: await countOf(sb, "crea_anuidades"),
      obras_art: await countOf(sb, "crea_art_obras"),
    }),
  },
  {
    name: "anuidades_proximas",
    description: "Anuidades próximas do vencimento.",
    parameters: { type: "object", properties: {} },
    handler: async (sb) => {
      const { data, error } = await sb.from("crea_anuidades")
        .select("id, ano, valor, status, data_vencimento")
        .order("data_vencimento", { ascending: true })
        .limit(20);
      return error ? { error: error.message } : { anuidades: data ?? [] };
    },
  },
];

const FIN_TOOLS: ToolDef[] = [
  {
    name: "kpis_financeiro",
    description: "KPIs: contas, transações, dívidas e cartões.",
    parameters: { type: "object", properties: {} },
    handler: async (sb) => ({
      contas: await countOf(sb, "fin_bank_accounts"),
      transacoes: await countOf(sb, "fin_transactions"),
      contas_a_pagar: await countOf(sb, "fin_bills"),
      dividas: await countOf(sb, "fin_debts"),
    }),
  },
  {
    name: "contas_vencendo",
    description: "Contas a pagar próximas do vencimento.",
    parameters: { type: "object", properties: { limite: { type: "number", default: 10 } } },
    handler: async (sb, args) => {
      const { data, error } = await sb.from("fin_bills")
        .select("id, descricao, valor, data_vencimento, status")
        .order("data_vencimento", { ascending: true })
        .limit(Math.min(args?.limite ?? 10, 30));
      return error ? { error: error.message } : { contas: data ?? [] };
    },
  },
];

const TI_TOOLS: ToolDef[] = [
  {
    name: "kpis_ti",
    description: "KPIs: chamados, ativos, incidentes e pedidos de acesso.",
    parameters: { type: "object", properties: {} },
    handler: async (sb) => ({
      chamados: await countOf(sb, "ti_tickets"),
      ativos: await countOf(sb, "ti_assets"),
      incidentes: await countOf(sb, "ti_security_incidents"),
      pedidos_acesso: await countOf(sb, "ti_access_requests"),
    }),
  },
  {
    name: "chamados_abertos",
    description: "Lista chamados abertos.",
    parameters: { type: "object", properties: { limite: { type: "number", default: 10 } } },
    handler: async (sb, args) => {
      const { data, error } = await sb.from("ti_tickets")
        .select("id, title, priority, status, created_at")
        .neq("status", "closed")
        .order("created_at", { ascending: false })
        .limit(Math.min(args?.limite ?? 10, 30));
      return error ? { error: error.message } : { chamados: data ?? [] };
    },
  },
];

const COMM_TOOLS: ToolDef[] = [
  {
    name: "kpis_comunicacao",
    description: "KPIs: posts, campanhas, brand kits e aprovações.",
    parameters: { type: "object", properties: {} },
    handler: async (sb) => ({
      posts: await countOf(sb, "comm_content_posts"),
      campanhas: await countOf(sb, "comm_campaigns"),
      brand_kits: await countOf(sb, "comm_brand_kits"),
      aprovacoes: await countOf(sb, "comm_approvals"),
    }),
  },
  {
    name: "posts_agendados",
    description: "Posts agendados na fila de publicação.",
    parameters: { type: "object", properties: {} },
    handler: async (sb) => {
      const { data, error } = await sb.from("comm_social_publish_queue")
        .select("id, scheduled_at, status, platform")
        .order("scheduled_at", { ascending: true })
        .limit(20);
      return error ? { error: error.message } : { posts: data ?? [] };
    },
  },
];

const PLANOS_TOOLS: ToolDef[] = [
  {
    name: "listar_modulos_catalogo",
    description: "Lista módulos do catálogo OCS.",
    parameters: { type: "object", properties: {} },
    handler: async (sb) => {
      const { data, error } = await sb.from("plan_modules_catalog")
        .select("module_key, display_name, base_price, is_active")
        .eq("is_active", true).limit(50);
      return error ? { error: error.message } : { modulos: data ?? [] };
    },
  },
  {
    name: "listar_integracoes_catalogo",
    description: "Lista integrações disponíveis.",
    parameters: { type: "object", properties: {} },
    handler: async (sb) => {
      const { data, error } = await sb.from("plan_integrations_catalog")
        .select("integration_key, display_name, base_price").limit(50);
      return error ? { error: error.message } : { integracoes: data ?? [] };
    },
  },
];

const TOOLS_BY_MODULE: Record<string, ToolDef[]> = {
  engenharia: ENG_TOOLS,
  rhdp: RHDP_TOOLS,
  crea: CREA_TOOLS,
  financeiro: FIN_TOOLS,
  ti: TI_TOOLS,
  comunicacao: COMM_TOOLS,
  planos: PLANOS_TOOLS,
};

// ---- Util ----
async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { module_key, message, history = [] } = await req.json();
    const knowledge = KNOWLEDGE[module_key];
    if (!knowledge) {
      return new Response(JSON.stringify({ error: `Módulo desconhecido: ${module_key}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- 1. Cota ----
    const { data: quotaRow } = await sb
      .from("verso_agent_quota")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    let quota = quotaRow;
    if (!quota) {
      const { data: created } = await sb
        .from("verso_agent_quota")
        .insert({ user_id: user.id })
        .select()
        .single();
      quota = created;
    }
    if (quota && new Date(quota.data_reset) <= new Date()) {
      const next = new Date();
      next.setMonth(next.getMonth() + 1);
      await sb.from("verso_agent_quota").update({
        mensagens_usadas_mes: 0, data_reset: next.toISOString(),
      }).eq("user_id", user.id);
      quota.mensagens_usadas_mes = 0;
    }
    if (quota && quota.mensagens_usadas_mes >= quota.limite_mensal) {
      return new Response(JSON.stringify({
        reply: "Você atingiu o limite mensal de mensagens com os agentes Soluções-Verso. Fale com o admin OCS para ampliar sua cota.",
        quota_exceeded: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- 2. Cache ----
    const qHash = await sha256(`${module_key}::${message.trim().toLowerCase()}`);
    const { data: cacheHit } = await sb
      .from("verso_agent_cache")
      .select("answer, expires_at")
      .eq("module_key", module_key)
      .eq("question_hash", qHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    // ---- 3. Prompt + tools ----
    const tools = TOOLS_BY_MODULE[module_key] ?? [];
    const rotasTxt = knowledge.rotas.map(r => `- ${r.label} (${r.path}): ${r.desc}`).join("\n");
    const systemPrompt = `${knowledge.persona}

ROTAS DO MÓDULO:
${rotasTxt}

CONCEITOS: ${knowledge.conceitos.join(", ")}
AÇÕES TÍPICAS: ${knowledge.acoes.join(", ")}

REGRAS:
- Se a rota não está acima, diga que ela não existe neste módulo.
- Para responder com números reais do cliente, use as tools disponíveis.
- Nunca exponha dados de outros clientes — você só vê o que a sessão do usuário permite.`;

    if (cacheHit) {
      return new Response(JSON.stringify({ reply: cacheHit.answer, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- 4. Chama IA com tool-calling ----
    const aiTools = tools.map(t => ({
      type: "function",
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));

    const messages: Array<Record<string, unknown>> = [
      { role: "system", content: systemPrompt },
      ...history.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    let reply = "";
    const toolsUsed: string[] = [];

    for (let step = 0; step < 3; step++) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          tools: aiTools.length ? aiTools : undefined,
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requisições. Tente novamente em instantes." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (resp.status === 402) {
          // Agentes Soluções-Verso são bônus — nunca expor erro de crédito ao cliente.
          console.warn("verso-agent: AI gateway sem créditos OCS; respondendo fallback amigável.");
          return new Response(JSON.stringify({
            reply: "No momento estou momentaneamente indisponível para responder com IA — a equipe OCS já foi notificada. Enquanto isso, você pode navegar pelo módulo normalmente.",
            ai_unavailable: true,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const t = await resp.text();
        console.error("AI gateway:", resp.status, t);
        throw new Error("Falha na IA.");
      }

      const data = await resp.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) break;

      const calls = msg.tool_calls ?? [];
      if (calls.length === 0) {
        reply = msg.content ?? "";
        break;
      }

      messages.push(msg);
      for (const call of calls) {
        const tool = tools.find(t => t.name === call.function?.name);
        toolsUsed.push(call.function?.name);
        let result: unknown = { error: "tool_not_found" };
        if (tool) {
          try {
            const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
            result = await tool.handler(sb, args);
          } catch (e) {
            result = { error: (e as Error).message };
          }
        }
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    if (!reply) reply = "Sem resposta no momento.";

    // ---- 5. Persiste cota + auditoria + cache (se sem tools) ----
    await sb.from("verso_agent_quota").update({
      mensagens_usadas_mes: (quota?.mensagens_usadas_mes ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    await sb.from("verso_agent_audit").insert({
      user_id: user.id,
      module_key,
      prompt: message,
      tools_used: toolsUsed,
    });

    if (toolsUsed.length === 0) {
      await sb.from("verso_agent_cache").upsert({
        module_key, question_hash: qHash, answer: reply,
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      }, { onConflict: "module_key,question_hash" });
    }

    return new Response(JSON.stringify({ reply, tools_used: toolsUsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
