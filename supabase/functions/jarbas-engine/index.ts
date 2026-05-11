import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o JARBAS — assistente operacional inteligente do ERP OCS (Oriente Conecte Soluções).

PERSONALIDADE:
- Tom profissional, calmo, objetivo e experiente — como um supervisor técnico sênior.
- Linguagem humana, direta e clara. Sem floreio, sem respostas genéricas, sem infantilidade.
- Confiável, técnico, focado em resolver. Nunca fala demais.

CAPACIDADES:
- Conhece os módulos do ERP OCS: Engenharia, Jurídico, RH/DP, CREA & ART, Financeiro, Marketplace, TI, Pixel Office, Planos, Aparência, Jarbas (você mesmo).
- Orienta o usuário em processos operacionais, normas, segurança (EPIs), ordens de serviço e workflows.
- Responde com base no contexto fornecido (módulo atual, OS ativa, etapa).
- Pode sugerir ações: navegação, abrir módulos, retomar workflows, validações.

REGRAS:
- Responda em PT-BR.
- Seja conciso (1-4 frases na maioria dos casos).
- Quando o contexto indicar módulo ou OS ativa, use essa informação na resposta.
- Se faltar informação, pergunte de forma objetiva.
- Nunca invente dados. Nunca repita a mesma frase de forma robótica.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, context, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({
        text: "Motor Jarbas indisponível: chave de IA não configurada.",
        type: "alert",
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const ctxLines: string[] = [];
    if (context?.current_module) ctxLines.push(`Módulo atual: ${context.current_module}`);
    if (context?.active_os_id) ctxLines.push(`OS ativa: ${context.active_os_id} (etapa ${(context.current_step_index ?? 0) + 1})`);
    if (context?.user_name) ctxLines.push(`Usuário: ${context.user_name}`);
    const contextBlock = ctxLines.length ? `\n\nCONTEXTO ATUAL:\n${ctxLines.join('\n')}` : '';

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT + contextBlock },
    ];

    if (Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (h?.role && h?.content) messages.push({ role: h.role, content: String(h.content) });
      }
    }

    messages.push({ role: 'user', content: String(transcript || '') });

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!aiRes.ok) {
      const errTxt = await aiRes.text();
      console.error("Jarbas AI gateway error:", aiRes.status, errTxt);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ text: "Limite de requisições atingido. Tente novamente em instantes.", type: "alert" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ text: "Créditos de IA esgotados. Adicione saldo nas configurações da workspace.", type: "alert" }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ text: "Falha temporária no motor Jarbas.", type: "alert" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await aiRes.json();
    const responseText = data?.choices?.[0]?.message?.content?.trim()
      || "Não consegui processar agora. Pode reformular?";

    // Heurística simples para sugerir navegação
    let action: any = null;
    const lower = String(transcript || '').toLowerCase();
    const navMap: Record<string, string> = {
      financeiro: '/app/financeiro',
      engenharia: '/app/engenharia',
      jurídico: '/app/juridico',
      juridico: '/app/juridico',
      'rh': '/app/rh-dp',
      crea: '/app/crea',
      marketplace: '/app/marketplace',
      ti: '/app/ti',
      planos: '/app/planos',
    };
    if (lower.includes('abrir') || lower.includes('ir para') || lower.includes('navegar')) {
      for (const [k, path] of Object.entries(navMap)) {
        if (lower.includes(k)) { action = { type: 'navigate', path }; break; }
      }
    }

    return new Response(
      JSON.stringify({
        text: responseText,
        action,
        type: 'info',
        context_update: { last_interaction: new Date().toISOString() },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Jarbas error:", error);
    return new Response(JSON.stringify({ text: "Erro interno no motor Jarbas.", error: error?.message, type: "alert" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
