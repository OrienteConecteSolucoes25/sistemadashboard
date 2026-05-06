// Edge function: traduz fórmulas Excel -> JS seguro via Lovable AI
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FormulaIn { col_letter: string; header: string; sample_formula: string; sample_values?: unknown[] }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { formulas } = (await req.json()) as { formulas: FormulaIn[] };
    if (!Array.isArray(formulas) || formulas.length === 0) {
      return new Response(JSON.stringify({ results: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const sys = `Você converte fórmulas Excel para expressões JavaScript SEGURAS usando expr-eval.
Use APENAS operadores + - * / % parênteses e essas funções:
sum(arr), avg(arr), min(arr), max(arr), count(arr), iff(cond,a,b), round(n,d), abs(n), and(a,b), or(a,b), not(a), concat(a,b).
Variáveis disponíveis: row.<LETRA> (ex: row.A, row.B, row.AA) referem-se ao valor da coluna na MESMA linha.
Para faixas tipo SUM(B2:B10) use cols.<LETRA> (array com toda a coluna).
NUNCA invente nomes além de row.X e cols.X.
Devolva APENAS JSON.`;

    const userMsg = `Traduza cada fórmula. Devolva JSON {"results":[{"col_letter":"X","formula_js":"...","purpose":"explicação curta em PT-BR","return_type":"number|date|text|percent|currency|boolean"}]}.

Fórmulas:
${JSON.stringify(formulas, null, 2)}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
        response_format: { type: "json_object" },
      }),
    });
    if (r.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "payment_required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      console.error("AI gateway error", r.status, t);
      return new Response(JSON.stringify({ error: "ai_error", detail: t }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await r.json();
    const content = j.choices?.[0]?.message?.content ?? "{\"results\":[]}";
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { results: [] }; }
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("gov-analyze-formula error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
