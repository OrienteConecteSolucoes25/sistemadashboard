import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-2.5-flash";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// ---------------- Tools ----------------
const TOOLS = [
  {
    type: "function",
    function: {
      name: "kpis",
      description: "Retorna KPIs gerais (totais, valores) das ARTs da empresa, com filtros opcionais.",
      parameters: {
        type: "object",
        properties: {
          uf: { type: "string" }, ano: { type: "number" }, mes: { type: "number" },
          rt_id: { type: "string" }, contratante_id: { type: "string" }, empresa_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "top_rts",
      description: "Top responsáveis técnicos por quantidade de ARTs.",
      parameters: { type: "object", properties: { limit: { type: "number" }, ano: { type: "number" }, uf: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "top_empresas",
      description: "Top empresas por quantidade de ARTs.",
      parameters: { type: "object", properties: { limit: { type: "number" }, ano: { type: "number" }, uf: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "por_setor",
      description: "Distribuição de ARTs por setor principal.",
      parameters: { type: "object", properties: { ano: { type: "number" }, uf: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "vencidas",
      description: "Lista ARTs vencidas e não pagas.",
      parameters: { type: "object", properties: { limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "divergencias",
      description: "Lista conciliações com status divergente.",
      parameters: { type: "object", properties: { limit: { type: "number" } } },
    },
  },
];

async function buildBaseQuery(supabase: any, companyId: string, args: any) {
  let q = supabase.from("crea_gov_arts").select("*").eq("company_id", companyId).eq("is_deleted", false);
  if (args?.uf) q = q.eq("uf", args.uf);
  if (args?.ano) q = q.eq("ano", args.ano);
  if (args?.mes) q = q.eq("mes", args.mes);
  if (args?.rt_id) q = q.eq("rt_id", args.rt_id);
  if (args?.contratante_id) q = q.eq("contratante_id", args.contratante_id);
  if (args?.empresa_id) q = q.eq("empresa_id", args.empresa_id);
  return q.limit(5000);
}

async function execTool(supabase: any, companyId: string, name: string, args: any): Promise<any> {
  if (name === "kpis") {
    const { data } = await (await buildBaseQuery(supabase, companyId, args));
    const arts = data ?? [];
    const today = new Date().toISOString().slice(0, 10);
    let emitido = 0, pago = 0, vencidas = 0, baixadas = 0;
    for (const a of arts) {
      emitido += Number(a.valor_taxa ?? 0);
      pago += Number(a.valor_pago ?? 0);
      if (a.data_baixa) baixadas++;
      if (a.data_vencimento && a.data_vencimento < today && !a.data_pagamento) vencidas++;
    }
    return { total: arts.length, valor_emitido: emitido, valor_pago: pago, valor_pendente: Math.max(0, emitido - pago), vencidas, baixadas };
  }
  if (name === "top_rts" || name === "top_empresas") {
    const { data } = await (await buildBaseQuery(supabase, companyId, args));
    const col = name === "top_rts" ? "rt_id" : "empresa_id";
    const counts = new Map<string, number>();
    for (const a of (data ?? [])) {
      const k = a[col] || "—";
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const arr = [...counts].map(([id, qtd]) => ({ id, qtd })).sort((a, b) => b.qtd - a.qtd).slice(0, args?.limit ?? 10);
    // resolve names
    const ids = arr.map(x => x.id).filter(x => x !== "—");
    if (ids.length) {
      const tbl = name === "top_rts" ? "crea_responsaveis_tecnicos" : "companies";
      const { data: refs } = await supabase.from(tbl).select("id,nome,name").in("id", ids);
      const map = new Map((refs ?? []).map((r: any) => [r.id, r.nome ?? r.name]));
      return arr.map(x => ({ id: x.id, nome: map.get(x.id) ?? x.id, qtd: x.qtd }));
    }
    return arr;
  }
  if (name === "por_setor") {
    let q = supabase.from("crea_gov_arts").select("setor_principal_id").eq("company_id", companyId).eq("is_deleted", false).limit(5000);
    if (args?.ano) q = q.eq("ano", args.ano);
    if (args?.uf) q = q.eq("uf", args.uf);
    const { data } = await q;
    const counts = new Map<string, number>();
    for (const a of (data ?? [])) {
      const k = a.setor_principal_id || "sem_setor";
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const arr = [...counts].map(([id, qtd]) => ({ id, qtd })).sort((a, b) => b.qtd - a.qtd);
    const ids = arr.map(x => x.id).filter(x => x !== "sem_setor");
    if (ids.length) {
      const { data: refs } = await supabase.from("crea_gov_setores").select("id,nome").in("id", ids);
      const map = new Map((refs ?? []).map((r: any) => [r.id, r.nome]));
      return arr.map(x => ({ nome: map.get(x.id) ?? "Sem setor", qtd: x.qtd }));
    }
    return arr;
  }
  if (name === "vencidas") {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from("crea_gov_arts")
      .select("id,numero,uf,valor_taxa,data_vencimento,rt_id,contratante_id")
      .eq("company_id", companyId).eq("is_deleted", false)
      .lt("data_vencimento", today).is("data_pagamento", null)
      .order("data_vencimento", { ascending: true }).limit(args?.limit ?? 20);
    return data ?? [];
  }
  if (name === "divergencias") {
    const { data } = await supabase.from("crea_gov_conciliacoes")
      .select("id,art_id,pagamento_id,score,motivo,status,art:art_id(numero,valor_taxa),pagamento:pagamento_id(numero_boleto,valor)")
      .eq("company_id", companyId).eq("status", "divergente").limit(args?.limit ?? 20);
    return data ?? [];
  }
  return { error: `tool desconhecida: ${name}` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const { question, history } = await req.json();
    if (!question) return new Response(JSON.stringify({ error: "question required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: cu } = await supabase.from("company_users").select("company_id").eq("user_id", u.user.id).maybeSingle();
    const companyId = cu?.company_id;
    if (!companyId) return new Response(JSON.stringify({ error: "company não encontrada" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const system = `Você é o Assistente de Governança de ARTs do ERP OCS.
Use as ferramentas disponíveis para responder com DADOS REAIS da empresa do usuário.
Sempre prefira chamar uma tool a especular. Responda em PT-BR, com números formatados (R$ X.XXX,XX) e listas curtas.
Quando responder com listas/rankings, devolva também um pequeno resumo interpretando os números.`;

    const messages: any[] = [
      { role: "system", content: system },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: question },
    ];

    const toolCallsLog: any[] = [];
    let finalAnswer = "";

    for (let i = 0; i < 4; i++) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, tool_choice: "auto" }),
      });
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit excedido" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados na Lovable AI" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!r.ok) {
        const t = await r.text();
        return new Response(JSON.stringify({ error: "AI error: " + t.slice(0, 300) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const j = await r.json();
      const msg = j?.choices?.[0]?.message;
      if (!msg) break;
      messages.push(msg);
      const calls = msg.tool_calls ?? [];
      if (!calls.length) {
        finalAnswer = msg.content ?? "";
        break;
      }
      for (const c of calls) {
        let args: any = {};
        try { args = JSON.parse(c.function.arguments ?? "{}"); } catch { /* */ }
        const result = await execTool(supabase, companyId, c.function.name, args);
        toolCallsLog.push({ name: c.function.name, args, ok: !result?.error });
        messages.push({
          role: "tool", tool_call_id: c.id, name: c.function.name,
          content: JSON.stringify(result).slice(0, 8000),
        });
      }
    }

    return new Response(JSON.stringify({ answer: finalAnswer || "(sem resposta)", tools: toolCallsLog }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
