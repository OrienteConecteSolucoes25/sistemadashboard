// Edge: comm-ai-free
// Roteador multi-provedor GRÁTIS (Gemini AI Studio, Groq, GitHub Models, OpenRouter free).
// Não usa Lovable AI Gateway, portanto NÃO consome créditos.
// Suporta novos kinds: linkedin_longo, linkedin_artigo, legenda_longa, thread_x — além dos kinds do comm-ai.
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
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";
const GITHUB_MODELS_TOKEN = Deno.env.get("GITHUB_MODELS_TOKEN") || "";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";

const SYSTEM_BASE = `Você é um assistente sênior de comunicação e marketing da plataforma ERP OCS.
Escreve em pt-BR, claro e direto. Respeita o Brand Kit fornecido (tom, persona, palavras permitidas/proibidas).
Nunca inventa dados. Se faltar info, use [placeholder] claro.`;

function brandPrompt(brand: any) {
  if (!brand) return "Brand Kit: (não fornecido — use tom neutro profissional).";
  return `Brand Kit:
- Marca: ${brand.nome ?? ""}
- Slogan: ${brand.slogan ?? ""}
- Persona: ${brand.persona ?? ""}
- Público-alvo: ${brand.publico_alvo ?? ""}
- Tom de voz: ${brand.tom_de_voz ?? ""}
- Proposta de valor: ${brand.proposta_valor ?? ""}
- CTA padrão: ${brand.cta_padrao ?? ""}
- Palavras permitidas: ${(brand.palavras_permitidas ?? []).join(", ") || "—"}
- Palavras PROIBIDAS: ${(brand.palavras_proibidas ?? []).join(", ") || "—"}`;
}

function userPromptFor(kind: string, inputs: Record<string, any>) {
  const i = inputs ?? {};
  switch (kind) {
    case "linkedin_longo":
    case "linkedin_artigo":
      return `Escreva um POST LONGO para LinkedIn (entre 1500 e 2500 caracteres) sobre: ${i.tema}.
Estrutura obrigatória:
1) Hook (1 frase de impacto)
2) Contexto / problema (2-3 parágrafos)
3) Insight ou aprendizado central (com bullet points)
4) Exemplo prático / case
5) CTA: ${i.cta ?? "engajamento (pergunta aberta)"}
6) 5 a 8 hashtags relevantes ao final
Tom: ${i.tom ?? "profissional + humano"}. Público: ${i.publico ?? "executivos e profissionais brasileiros"}.
Retorne JSON: { titulo, corpo, hashtags:[...], cta, variacao_curta }`;
    case "legenda_longa":
      return `Crie LEGENDA LONGA (até 2200 caracteres, formato Instagram) sobre: ${i.tema}.
Use storytelling, quebras de linha, emojis discretos, CTA forte e 10-15 hashtags.
Retorne JSON: { principal, hashtags:[...], cta, variacao_curta }`;
    case "thread_x":
      return `Crie uma THREAD de ${i.qtd ?? 8} tweets sobre: ${i.tema}. Cada tweet ≤ 270 caracteres.
Retorne JSON: { thread:[{n,texto}], hashtags:[...] }`;
    case "legenda":
      return `Gere LEGENDAS para ${i.canal ?? "rede social"}.
Tema: ${i.tema}; Objetivo: ${i.objetivo ?? "engajamento"}; Tamanho: ${i.tamanho ?? "médio"}.
Retorne JSON: { principal, variacoes:[3], curta, comercial, institucional, hashtags:[...], cta }`;
    case "post":
      return `Crie um POST completo para ${i.canal ?? "Instagram"} (formato: ${i.formato ?? "post"}).
Tema: ${i.tema}; Objetivo: ${i.objetivo}; CTA: ${i.cta ?? ""}.
Retorne JSON: { titulo, legenda, texto_card, hashtags:[...], cta, descricao_alternativa, prompt_visual, variacoes:[{tipo,texto}] }`;
    case "carrossel":
      return `Crie CARROSSEL com ${i.qtd_slides ?? 6} slides. Tema: ${i.tema}; Canal: ${i.canal ?? "Instagram"}.
Retorne JSON: { titulo, legenda, hashtags:[...], cta, slides:[{ordem,titulo,texto,design_sugerido}] }`;
    case "newsletter":
      return `Crie NEWSLETTER. Tema: ${i.tema}; Objetivo: ${i.objetivo}.
Retorne JSON: { assunto, pre_header, abertura, blocos:[{titulo,texto}], cta, rodape, versao_texto }`;
    case "comunicado_interno":
      return `Crie COMUNICADO INTERNO tipo "${i.tipo ?? "aviso"}". Assunto: ${i.tema}.
Retorne JSON: { titulo, mensagem_curta, mensagem_completa, cta, versao_email, versao_whatsapp, versao_mural }`;
    case "texto":
      return `Escreva texto tipo "${i.tipo ?? "institucional"}". Tema: ${i.tema}; Tamanho: ${i.tamanho ?? "médio"}.
Retorne JSON: { titulo, texto, cta }`;
    case "ideia":
      return `Gere ${i.qtd ?? 10} IDEIAS de ${i.categoria ?? "post"} sobre: ${i.tema}.
Retorne JSON: { ideias:[{titulo, resumo, categoria, prioridade}] }`;
    case "campanha":
      return `Crie CAMPANHA "${i.tipo ?? "lançamento"}". Objetivo: ${i.objetivo}; Canais: ${(i.canais ?? []).join(", ")}.
Retorne JSON: { nome, conceito, promessa, mensagens_chave:[...], posts_sugeridos:[{canal,titulo,resumo}], roteiro_lancamento:[...], metricas_esperadas:{} }`;
    default:
      return `Atenda: ${JSON.stringify(i)}. Retorne JSON.`;
  }
}

// ============== PROVIDERS ==============
type CallResult = { ok: boolean; text?: string; provider: string; model: string; error?: string };

async function tryGemini(messages: any[]): Promise<CallResult> {
  if (!GEMINI_API_KEY) return { ok: false, provider: "gemini", model: "gemini-2.5-pro", error: "no_key" };
  const sys = messages.find((m) => m.role === "system")?.content ?? "";
  const usr = messages.find((m) => m.role === "user")?.content ?? "";
  const body = {
    system_instruction: { parts: [{ text: sys }] },
    contents: [{ role: "user", parts: [{ text: usr }] }],
    generationConfig: { response_mime_type: "application/json", temperature: 0.7, maxOutputTokens: 4096 },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) {
    // tenta flash se pro estourar quota
    const url2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const r2 = await fetch(url2, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r2.ok) return { ok: false, provider: "gemini", model: "gemini-2.5-flash", error: `${r2.status}: ${(await r2.text()).slice(0, 200)}` };
    const j2 = await r2.json();
    const t2 = j2?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { ok: !!t2, text: t2, provider: "gemini-free", model: "gemini-2.5-flash" };
  }
  const j = await r.json();
  const t = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return { ok: !!t, text: t, provider: "gemini-free", model: "gemini-2.5-pro" };
}

async function tryGroq(messages: any[]): Promise<CallResult> {
  if (!GROQ_API_KEY) return { ok: false, provider: "groq", model: "llama-3.3-70b", error: "no_key" };
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, temperature: 0.7, response_format: { type: "json_object" } }),
  });
  if (!r.ok) return { ok: false, provider: "groq", model: "llama-3.3-70b", error: `${r.status}: ${(await r.text()).slice(0, 200)}` };
  const j = await r.json();
  return { ok: true, text: j.choices?.[0]?.message?.content ?? "", provider: "groq-free", model: "llama-3.3-70b-versatile" };
}

async function tryGithubModels(messages: any[]): Promise<CallResult> {
  if (!GITHUB_MODELS_TOKEN) return { ok: false, provider: "github-models", model: "gpt-4o-mini", error: "no_key" };
  const r = await fetch("https://models.inference.ai.azure.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GITHUB_MODELS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", messages, temperature: 0.7, response_format: { type: "json_object" } }),
  });
  if (!r.ok) return { ok: false, provider: "github-models", model: "gpt-4o-mini", error: `${r.status}: ${(await r.text()).slice(0, 200)}` };
  const j = await r.json();
  return { ok: true, text: j.choices?.[0]?.message?.content ?? "", provider: "github-models-free", model: "gpt-4o-mini" };
}

async function tryOpenRouter(messages: any[]): Promise<CallResult> {
  if (!OPENROUTER_API_KEY) return { ok: false, provider: "openrouter", model: "free", error: "no_key" };
  const model = "google/gemini-2.0-flash-exp:free";
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
  });
  if (!r.ok) return { ok: false, provider: "openrouter", model, error: `${r.status}: ${(await r.text()).slice(0, 200)}` };
  const j = await r.json();
  return { ok: true, text: j.choices?.[0]?.message?.content ?? "", provider: "openrouter-free", model };
}

// ============== TEMPLATE LOCAL (sem nenhuma API key) ==============
function localTemplate(kind: string, inputs: Record<string, any>, brand: any): any {
  const i = inputs ?? {};
  const tema = i.tema || i.assunto || "[tema]";
  const cta = i.cta || brand?.cta_padrao || "Saiba mais";
  const publico = i.publico || i.publico_alvo || brand?.publico_alvo || "nosso público";
  const tom = i.tom || brand?.tom_de_voz || "profissional e próximo";
  const marca = brand?.nome || "[Marca]";
  const valor = brand?.proposta_valor || "entregar resultado de verdade";
  const dif = brand?.diferenciais || "qualidade, agilidade e atendimento próximo";
  const hashtags = (i.hashtags_extra ?? []).concat([
    `#${marca.replace(/\s+/g, "")}`, "#OCS", "#Brasil", "#Inovacao", "#Gestao",
  ]).slice(0, 10);
  const linhas = (txt: string) => txt.split("\n").filter(Boolean);

  switch (kind) {
    case "linkedin_longo":
    case "linkedin_artigo": {
      const corpo = [
        `🚀 ${tema} — o que ninguém te conta.`,
        ``,
        `Nos últimos meses, vimos uma mudança importante: ${tema} deixou de ser tendência e virou exigência de mercado. Para ${publico}, ignorar isso significa perder espaço para quem já adaptou seu jogo.`,
        ``,
        `Na ${marca}, trabalhamos com tom ${tom}, e o que aprendemos foi:`,
        ``,
        `• Estrutura > improviso. Quem documenta processo escala.`,
        `• Comunicação clara > volume de mensagens. Ruído mata projeto.`,
        `• Dados > opinião. Decisão sem número é fé, não estratégia.`,
        ``,
        `Um caso prático: aplicamos isso em ${tema} e o resultado apareceu em poucas semanas — não por mágica, por método. ${valor}. Nosso diferencial: ${dif}.`,
        ``,
        `💡 Reflexão: se você ainda trata ${tema} como item secundário, está pagando um custo invisível. Aquele que só aparece quando a concorrência leva o cliente.`,
        ``,
        `👉 ${cta}`,
        ``,
        hashtags.map((h: string) => h.startsWith("#") ? h : `#${h}`).join(" "),
      ].join("\n");
      return {
        titulo: `${tema}: por que ${publico} precisa repensar agora`,
        corpo,
        hashtags,
        cta,
        variacao_curta: `${tema} virou exigência. ${cta}.`,
      };
    }
    case "legenda_longa":
    case "legenda": {
      const principal = [
        `✨ ${tema} — e aqui vai o que mudou pra gente.`,
        ``,
        `Quando ${publico} fala em ${tema}, normalmente pensa em ${tema} de forma genérica. Mas tem detalhe que faz diferença: ${dif}.`,
        ``,
        `Foi exatamente isso que a ${marca} entregou: ${valor}.`,
        ``,
        `Comenta aqui 👇 se faz sentido pro seu momento.`,
        ``,
        `👉 ${cta}`,
      ].join("\n");
      return {
        principal,
        variacoes: [
          `${tema}: solução prática para ${publico}. ${cta}.`,
          `Como a ${marca} resolve ${tema} — com ${tom}. ${cta}.`,
          `Você ainda trata ${tema} no improviso? ${cta}.`,
        ],
        curta: `${tema}? ${cta}.`,
        comercial: `${marca} entrega ${tema} com ${dif}. ${cta}.`,
        institucional: `Na ${marca}, ${tema} é prioridade. ${valor}.`,
        hashtags,
        cta,
      };
    }
    case "post":
    case "post_institucional": {
      return {
        titulo: `${marca} apresenta: ${tema}`,
        legenda: `${tema} — pensado para ${publico}.\n\n${valor}\n\n${cta}`,
        texto_card: `${tema.toUpperCase()}\n${dif}`,
        hashtags,
        cta,
        descricao_alternativa: `Card sobre ${tema} com identidade visual da ${marca}.`,
        prompt_visual: `Post quadrado moderno sobre ${tema}, paleta da marca ${marca}, tipografia limpa, sem rostos.`,
        variacoes: [
          { tipo: "curta", texto: `${tema}. ${cta}.` },
          { tipo: "humanizada", texto: `A gente sabe que ${tema} dá trabalho. Por isso a ${marca} existe. ${cta}.` },
        ],
      };
    }
    case "carrossel": {
      const qtd = parseInt(i.qtd_slides ?? 6, 10) || 6;
      const slides = Array.from({ length: qtd }, (_, k) => {
        const ordem = k + 1;
        const mapa = [
          { titulo: `${tema}`, texto: `Por que isso importa para ${publico}.` },
          { titulo: `O problema`, texto: `Sem método, ${tema} vira custo invisível.` },
          { titulo: `Consequência`, texto: `Você paga em retrabalho, atraso e cliente perdido.` },
          { titulo: `A virada`, texto: `${dif}. É assim que a ${marca} resolve.` },
          { titulo: `Como aplicar`, texto: `Passo a passo simples: diagnóstico → plano → execução.` },
          { titulo: `Resultado`, texto: `${valor}.` },
          { titulo: `Próximo passo`, texto: cta },
          { titulo: `Fale com a gente`, texto: cta },
        ];
        const s = mapa[Math.min(k, mapa.length - 1)];
        return { ordem, titulo: s.titulo, texto: s.texto, design_sugerido: "fundo escuro, título grande, ícone simples" };
      });
      return {
        titulo: `Carrossel: ${tema}`,
        legenda: `${tema} explicado em ${qtd} cards.\n\n${cta}`,
        hashtags, cta, slides,
      };
    }
    case "newsletter": {
      return {
        assunto: `${marca}: o que você precisa saber sobre ${tema}`,
        pre_header: `${tema} em pauta — e como isso afeta ${publico}.`,
        abertura: `Olá! Esta semana o tema é ${tema}. Direto ao ponto: ${valor}.`,
        blocos: [
          { titulo: "O contexto", texto: `${tema} subiu na pauta. ${publico} precisa de clareza.` },
          { titulo: "O que a ${marca} entrega", texto: `${dif}.` },
          { titulo: "Próximos passos", texto: `${cta}.` },
        ],
        cta, rodape: `Até a próxima — equipe ${marca}.`,
        versao_texto: `${tema} — ${valor}. ${cta}.`,
      };
    }
    case "comunicado_interno": {
      const tipo = i.tipo || "aviso";
      return {
        titulo: `[${tipo.toUpperCase()}] ${tema}`,
        mensagem_curta: `${tema} — ação necessária.`,
        mensagem_completa: `Time, segue ${tipo} sobre ${tema}.\n\nContexto: ${valor}.\nAção: ${cta}.\n\nDúvidas, falar com gestão.`,
        cta,
        versao_email: `Assunto: [${tipo}] ${tema}\n\n${tema}. ${cta}.`,
        versao_whatsapp: `*[${tipo.toUpperCase()}] ${tema}* — ${cta}.`,
        versao_mural: `${tema.toUpperCase()}\n${cta}`,
      };
    }
    case "texto": {
      return {
        titulo: `${tema}`,
        texto: `${tema}.\n\n${valor}.\n\n${dif}.\n\n${cta}.`,
        cta,
      };
    }
    case "ideia": {
      const qtd = parseInt(i.qtd ?? 10, 10) || 10;
      const bases = ["dica rápida", "case real", "antes e depois", "checklist", "mito x verdade", "pergunta provocativa", "estatística", "tutorial", "tendência", "FAQ"];
      const ideias = Array.from({ length: qtd }, (_, k) => ({
        titulo: `${bases[k % bases.length]}: ${tema}`,
        resumo: `Conteúdo de ${bases[k % bases.length]} sobre ${tema} para ${publico}.`,
        categoria: i.categoria || "post",
        prioridade: k < 3 ? "alta" : k < 6 ? "média" : "baixa",
      }));
      return { ideias };
    }
    case "thread_x": {
      const qtd = Math.min(parseInt(i.qtd ?? 8, 10) || 8, 12);
      const thread = Array.from({ length: qtd }, (_, k) => ({
        n: k + 1,
        texto: k === 0
          ? `${tema}: uma thread em ${qtd} tweets 🧵`
          : k === qtd - 1
            ? `Se curtiu, dá RT no primeiro. ${cta}.`
            : `${k}/ ${linhas(`${tema} - ponto ${k}: ${dif}`)[0]}`,
      }));
      return { thread, hashtags };
    }
    case "campanha": {
      return {
        nome: `Campanha ${tema}`,
        conceito: `${tema} como mote central para ${publico}.`,
        promessa: valor,
        mensagens_chave: [tema, dif, cta],
        posts_sugeridos: [
          { canal: "Instagram", titulo: `Teaser ${tema}`, resumo: "card único" },
          { canal: "LinkedIn", titulo: `Manifesto ${tema}`, resumo: "post longo" },
          { canal: "Email", titulo: `Lançamento ${tema}`, resumo: "newsletter" },
        ],
        roteiro_lancamento: ["semana -2: teaser", "semana -1: bastidor", "semana 0: lançamento", "semana +1: prova social"],
        metricas_esperadas: { alcance: "+30%", engajamento: "+20%", leads: "+15%" },
      };
    }
    case "roteiro":
    case "roteiro_video":
    case "roteiro_video_curto": {
      return {
        titulo: `Roteiro vídeo curto — ${tema}`,
        duracao: "30-45s",
        roteiro: [
          { tempo: "0-3s", fala: `${tema}? Você está fazendo errado.` },
          { tempo: "3-15s", fala: `Maioria de ${publico} faz assim — e perde tempo. O caminho certo é: ${dif}.` },
          { tempo: "15-30s", fala: `Foi assim que a ${marca} entregou ${valor}.` },
          { tempo: "30-40s", fala: `${cta}.` },
        ],
        cta,
        hashtags,
      };
    }
    default:
      return { titulo: tema, texto: `${tema} — ${valor}. ${cta}.`, cta, hashtags };
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

    const body = await req.json();
    const { kind, brand, inputs = {}, company_id, preferred = "auto" } = body ?? {};
    if (!kind) return new Response(JSON.stringify({ error: "missing_kind" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (company_id) {
      const { data: ok } = await sb.rpc("comm_can", { _uid: user.id, _company: company_id, _action: "generate_content" });
      if (!ok) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const messages = [
      { role: "system", content: SYSTEM_BASE + "\n\n" + brandPrompt(brand) + "\n\nResponda SEMPRE em JSON válido." },
      { role: "user", content: userPromptFor(kind, inputs) },
    ];

    const order =
      preferred === "groq" ? [tryGroq, tryGemini, tryGithubModels, tryOpenRouter]
      : preferred === "github" ? [tryGithubModels, tryGemini, tryGroq, tryOpenRouter]
      : preferred === "openrouter" ? [tryOpenRouter, tryGemini, tryGroq, tryGithubModels]
      : [tryGemini, tryGroq, tryGithubModels, tryOpenRouter];

    const attempts: string[] = [];
    let result: CallResult | null = null;
    for (const fn of order) {
      const r = await fn(messages);
      attempts.push(`${r.provider}:${r.ok ? "ok" : r.error}`);
      if (r.ok && r.text) { result = r; break; }
    }
    if (!result) {
      // Fallback FINAL: template local determinístico — sempre funciona, sem chave
      const parsed = localTemplate(kind, inputs, brand);
      if (company_id) {
        const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SR);
        await sbAdmin.from("comm_ai_usage").insert({
          company_id, user_id: user.id, provider: "template-local", model: "template-local", kind: "text",
          tokens_in: 0, tokens_out: 0, cost_credits: 0,
        });
      }
      return new Response(JSON.stringify({
        ok: true, kind, data: parsed, model: "template-local", provider: "template-local",
        attempts, note: "Nenhuma chave externa configurada — usando Template Local. Adicione GEMINI_API_KEY para IA generativa real.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let parsed: any;
    try { parsed = JSON.parse(result.text!); }
    catch {
      // fallback: tenta extrair JSON entre ```json ... ```
      const m = result.text!.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
      try { parsed = JSON.parse(m?.[1] ?? "{}"); } catch { parsed = { raw: result.text }; }
    }

    if (company_id) {
      const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SR);
      await sbAdmin.from("comm_ai_usage").insert({
        company_id, user_id: user.id, provider: result.provider, model: result.model, kind: "text",
        tokens_in: 0, tokens_out: 0, cost_credits: 0,
      });
    }

    return new Response(JSON.stringify({ ok: true, kind, data: parsed, model: result.model, provider: result.provider, attempts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "internal", message: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
