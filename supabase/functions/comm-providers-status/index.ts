// Edge: comm-providers-status
// Retorna apenas BOOLEANOS indicando se cada provedor grátis tem chave configurada.
// NÃO expõe valores de secrets. NÃO consome créditos Lovable.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const has = (k: string) => !!(Deno.env.get(k) || "").trim();
  const providers = [
    { key: "pollinations", label: "Pollinations", kind: "image", configured: true, needs: [], note: "Ativo sem chave — provedor padrão de imagem." },
    { key: "template-local", label: "Template Local", kind: "text", configured: true, needs: [], note: "Ativo sem chave — gerador determinístico de textos longos." },
    { key: "gemini", label: "Google Gemini (AI Studio)", kind: "text+image", configured: has("GEMINI_API_KEY") || has("GOOGLE_API_KEY"), needs: ["GEMINI_API_KEY"], note: "IA real grátis com cota generosa." },
    { key: "groq", label: "Groq (Llama 3.3 70B)", kind: "text", configured: has("GROQ_API_KEY"), needs: ["GROQ_API_KEY"], note: "Textos muito rápidos." },
    { key: "github-models", label: "GitHub Models (GPT-4o-mini)", kind: "text", configured: has("GITHUB_MODELS_TOKEN"), needs: ["GITHUB_MODELS_TOKEN"], note: "Grátis com Student Pack." },
    { key: "cloudflare", label: "Cloudflare Workers AI (Flux)", kind: "image", configured: has("CF_ACCOUNT_ID") && has("CF_AI_TOKEN"), needs: ["CF_ACCOUNT_ID", "CF_AI_TOKEN"], note: "Imagens HQ grátis até 10k/dia." },
    { key: "huggingface", label: "Hugging Face (FLUX-schnell)", kind: "image", configured: has("HF_TOKEN"), needs: ["HF_TOKEN"], note: "Fallback grátis de imagem." },
    { key: "openrouter", label: "OpenRouter (modelos :free)", kind: "text", configured: has("OPENROUTER_API_KEY"), needs: ["OPENROUTER_API_KEY"], note: "Vários modelos free comunitários." },
  ];
  return new Response(JSON.stringify({
    ok: true,
    consumes_lovable_credits: false,
    warning: "Provedores externos gratuitos podem ter limites próprios. Pollinations e Template Local funcionam sem chave.",
    providers,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
