import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-2.5-flash";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// ---------------- Tools (governança + operação) ----------------
const TOOLS = [
  {
    type: "function",
    function: {
      name: "kpis",
      description: "KPIs gerais (totais, valores) das ARTs da empresa, com filtros opcionais.",
      parameters: {
        type: "object",
        properties: {
          uf: { type: "string" }, ano: { type: "number" }, mes: { type: "number" },
          rt_id: { type: "string" }, contratante_id: { type: "string" }, empresa_id: { type: "string" },
        },
      },
    },
  },
  { type: "function", function: { name: "top_rts", description: "Top responsáveis técnicos por quantidade de ARTs.", parameters: { type: "object", properties: { limit: { type: "number" }, ano: { type: "number" }, uf: { type: "string" } } } } },
  { type: "function", function: { name: "top_empresas", description: "Top empresas por quantidade de ARTs.", parameters: { type: "object", properties: { limit: { type: "number" }, ano: { type: "number" }, uf: { type: "string" } } } } },
  { type: "function", function: { name: "por_setor", description: "Distribuição de ARTs por setor principal.", parameters: { type: "object", properties: { ano: { type: "number" }, uf: { type: "string" } } } } },
  { type: "function", function: { name: "vencidas", description: "Lista ARTs vencidas e não pagas.", parameters: { type: "object", properties: { limit: { type: "number" } } } } },
  { type: "function", function: { name: "divergencias", description: "Lista conciliações com status divergente.", parameters: { type: "object", properties: { limit: { type: "number" } } } } },
  {
    type: "function",
    function: {
      name: "contar",
      description: "Conta registros de uma entidade do módulo CREA. Use para perguntas como 'quantas ARTs há?', 'quantos protocolos abertos?'.",
      parameters: {
        type: "object",
        properties: {
          entidade: { type: "string", enum: ["arts","protocolos","cats","certidoes","baixas","tratativas","prazos","rts","empresas","documentos"] },
          status: { type: "string" },
        },
        required: ["entidade"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar",
      description: "Lista registros recentes de uma entidade do módulo CREA (até 20).",
      parameters: {
        type: "object",
        properties: {
          entidade: { type: "string", enum: ["arts","protocolos","cats","certidoes","baixas","tratativas","prazos","rts","empresas","documentos","normas","links_oficiais"] },
          limit: { type: "number" },
          status: { type: "string" },
        },
        required: ["entidade"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_normas",
      description: "Busca em Normas e Regras (crea_norms) por palavra-chave, UF, tipo, número, ano ou tema. Retorna até 20 normas com link, resumo e vigência.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Texto a buscar em tipo, número, tema, resumo, órgão." },
          uf: { type: "string" }, tipo: { type: "string" }, ano: { type: "number" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "links_oficiais",
      description: "Retorna links oficiais (portal, consultas, certidões, protocolo, normas) por UF.",
      parameters: { type: "object", properties: { uf: { type: "string" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_link",
      description: "Baixa o conteúdo de uma URL (anexo PDF/HTML, link de norma, portal oficial) e retorna texto extraído (até 12k caracteres). Use para LER de fato o conteúdo de um link/anexo cadastrado em Normas e Regras, Documentações ou Links Oficiais.",
      parameters: {
        type: "object",
        properties: { url: { type: "string", description: "URL completa (https://...)" } },
        required: ["url"],
      },
    },
  },
];

const ENTIDADE_TABLE: Record<string,string> = {
  arts: "crea_arts", protocolos: "crea_protocolos", cats: "crea_cats",
  certidoes: "crea_certidoes", baixas: "crea_baixas", tratativas: "crea_tratativas",
  prazos: "crea_prazos", rts: "crea_responsaveis_tecnicos", empresas: "crea_empresas",
  documentos: "crea_documents",
  normas: "crea_norms", links_oficiais: "crea_links_oficiais",
};

// Extrai texto legível de HTML simples (sem dependências externas)
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchUrlContent(url: string): Promise<{ url: string; status?: number; tipo?: string; texto?: string; bytes?: number; error?: string }> {
  try {
    if (!/^https?:\/\//i.test(url)) return { url, error: "URL inválida" };
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const resp = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 OCS-Assistant/1.0", Accept: "text/html,application/pdf,*/*" },
      redirect: "follow",
    });
    clearTimeout(t);
    const ct = (resp.headers.get("content-type") ?? "").toLowerCase();
    if (!resp.ok) return { url, status: resp.status, tipo: ct, error: `HTTP ${resp.status}` };
    if (ct.includes("application/pdf") || url.toLowerCase().endsWith(".pdf")) {
      const buf = new Uint8Array(await resp.arrayBuffer());
      // Extração simples de strings legíveis do PDF (sem libs)
      const dec = new TextDecoder("latin1");
      const raw = dec.decode(buf);
      const matches = raw.match(/\(([^()\\]{2,}?)\)/g) ?? [];
      const texto = matches.map(m => m.slice(1, -1)).join(" ").replace(/\s+/g, " ").slice(0, 12000);
      return { url, status: resp.status, tipo: "application/pdf", bytes: buf.length, texto: texto || "(PDF sem texto extraível por método simples)" };
    }
    const txt = await resp.text();
    const out = ct.includes("text/html") ? htmlToText(txt) : txt;
    return { url, status: resp.status, tipo: ct, bytes: txt.length, texto: out.slice(0, 12000) };
  } catch (e) {
    return { url, error: e instanceof Error ? e.message : "fetch falhou" };
  }
}

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
  if (name === "contar") {
    const tbl = ENTIDADE_TABLE[args?.entidade];
    if (!tbl) return { error: "entidade inválida" };
    let q = supabase.from(tbl).select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_deleted", false);
    if (args?.status) q = q.eq("status", args.status);
    const { count, error } = await q;
    if (error) return { error: error.message };
    return { entidade: args.entidade, total: count ?? 0 };
  }
  if (name === "listar") {
    const tbl = ENTIDADE_TABLE[args?.entidade];
    if (!tbl) return { error: "entidade inválida" };
    let q = supabase.from(tbl).select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }).limit(Math.min(args?.limit ?? 10, 20));
    if (args?.status) q = q.eq("status", args.status);
    const { data, error } = await q;
    if (error) return { error: error.message };
    return data ?? [];
  }
  return { error: `tool desconhecida: ${name}` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const { question, uf, history } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "question required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: u } = await supabase.auth.getUser();
    const { data: cu } = u?.user ? await supabase.from("company_users").select("company_id").eq("user_id", u.user.id).maybeSingle() : { data: null } as any;
    const companyId = cu?.company_id ?? null;

    // RAG: fontes de Normas/Regras
    let sq = supabase.from("crea_ai_sources").select("id,titulo,tipo,uf,conteudo,link").eq("ativo", true).eq("is_deleted", false).limit(30);
    if (uf) sq = sq.in("uf", [uf, "BR"]);
    const { data: sources } = await sq;
    const ctx = (sources ?? []).map((s, i) =>
      `[${i+1}] ${s.titulo} (${s.tipo ?? ""} · ${s.uf ?? "-"})\n${(s.conteudo ?? "").slice(0, 1500)}`
    ).join("\n\n---\n\n");

    const MODULE_DOCS = `MÓDULO CREA & ART — VISÃO COMPLETA (Dashboard, ARTs, CATs, Certidões, Baixas, RTs, Empresas e CREAs, Documentações (com sub-aba Protocolos), Normas e Regras (com sub-abas Links Oficiais, Prazos, Tratativas), Credenciais, Governança ART, Admin (com sub-abas Integrações, Auditoria), Assistente IA).
Status ART: nao_iniciada, em_emissao, emitida, paga, registrada, baixada, cancelada.
Toda exclusão é soft delete com motivo, registrada em crea_audit_logs.
Importação adaptativa: colunas extras vão para JSONB "data" e voltam na exportação.
Credenciais: senhas cifradas (AES); revelação exige motivo e auto-oculta em 30s.`;

    const system = `Você é o Assistente único do módulo CREA & ART do ERP OCS. Você sabe TUDO sobre o módulo: operação (ARTs, protocolos, CATs, certidões, baixas, tratativas, prazos, RTs, empresas, documentos, credenciais), normas/regras e GOVERNANÇA (KPIs, rankings, vencidas, divergências, conciliação).

Regras:
- Para perguntas SOBRE DADOS REAIS da empresa (quantidades, listas, KPIs, rankings, vencidas, divergências), CHAME AS TOOLS. Não especule números.
- Para perguntas sobre COMO O MÓDULO FUNCIONA, abas, status e fluxos: use a seção MÓDULO.
- Para perguntas sobre NORMAS, RESOLUÇÕES, DN/PL ou prazos legais: responda APENAS com base nas FONTES e cite [n]. Se não houver suporte nas fontes, diga "Não tenho fonte cadastrada para responder isso — confirme no portal oficial do CREA da UF".
- Nunca invente número de DN/PL/Resolução nem prazo.
- Responda em PT-BR, com valores R$ X.XXX,XX e listas curtas.

MÓDULO:
${MODULE_DOCS}

FONTES:
${ctx || "(nenhuma fonte cadastrada)"}`;

    const messages: any[] = [
      { role: "system", content: system },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: question },
    ];

    const toolCallsLog: any[] = [];
    let finalAnswer = "";
    const t0 = Date.now();
    const useTools = !!companyId;

    for (let i = 0; i < 4; i++) {
      const body: any = { model: MODEL, messages };
      if (useTools) { body.tools = TOOLS; body.tool_choice = "auto"; }
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      if (!calls.length) { finalAnswer = msg.content ?? ""; break; }
      for (const c of calls) {
        let args: any = {};
        try { args = JSON.parse(c.function.arguments ?? "{}"); } catch { /* */ }
        const result = await execTool(supabase, companyId!, c.function.name, args);
        toolCallsLog.push({ name: c.function.name, args, ok: !result?.error });
        messages.push({
          role: "tool", tool_call_id: c.id, name: c.function.name,
          content: JSON.stringify(result).slice(0, 8000),
        });
      }
    }

    const ms = Date.now() - t0;
    const cited = new Set<number>();
    for (const m of String(finalAnswer).matchAll(/\[(\d+)\]/g)) cited.add(Number(m[1]));
    const citedSources = (sources ?? []).filter((_, i) => cited.has(i+1)).map(s => ({ titulo: s.titulo, uf: s.uf, link: s.link }));

    try {
      if (u?.user) {
        await supabase.from("crea_ai_questions").insert({
          user_id: u.user.id, pergunta: question, resposta: finalAnswer,
          fontes_citadas: citedSources, uf: uf ?? null, modelo: MODEL, duracao_ms: ms,
        });
      }
    } catch (_e) { /* ignore */ }

    return new Response(JSON.stringify({ answer: finalAnswer || "(sem resposta)", sources: citedSources, tools: toolCallsLog, duracao_ms: ms }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
