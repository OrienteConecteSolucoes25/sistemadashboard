import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Sparkles, Info, RefreshCcw, ExternalLink } from "lucide-react";
import { FreeAiToggle } from "./FreeAiToggle";

interface Provider {
  key: string; label: string; kind: string; configured: boolean; needs: string[]; note?: string;
}

const HOW_TO: Record<string, { url: string; label: string }> = {
  GEMINI_API_KEY: { url: "https://aistudio.google.com/apikey", label: "Google AI Studio → Create API key" },
  GROQ_API_KEY: { url: "https://console.groq.com/keys", label: "Groq Cloud → Create API Key" },
  GITHUB_MODELS_TOKEN: { url: "https://github.com/settings/personal-access-tokens", label: "GitHub → Fine-grained PAT" },
  CF_ACCOUNT_ID: { url: "https://dash.cloudflare.com", label: "Cloudflare → Account ID" },
  CF_AI_TOKEN: { url: "https://dash.cloudflare.com/profile/api-tokens", label: "Cloudflare → API Tokens (Workers AI)" },
  HF_TOKEN: { url: "https://huggingface.co/settings/tokens", label: "Hugging Face → Tokens (Read)" },
  OPENROUTER_API_KEY: { url: "https://openrouter.ai/keys", label: "OpenRouter → Keys" },
};

export default function IAECustosPage() {
  const [data, setData] = useState<{ providers: Provider[]; warning?: string; consumes_lovable_credits?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<{ provider: string; count: number }[]>([]);

  async function load() {
    setLoading(true);
    try {
      const { data: res } = await supabase.functions.invoke("comm-providers-status", { body: {} });
      setData(res as any);
    } catch {
      setData({ providers: [], warning: "Não foi possível consultar o status dos provedores." });
    }
    // contagem últimos 30d por provedor
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: rows } = await supabase.from("comm_ai_usage").select("provider").gte("created_at", since).limit(5000);
    const map = new Map<string, number>();
    (rows ?? []).forEach((r: any) => map.set(r.provider, (map.get(r.provider) ?? 0) + 1));
    setUsage([...map.entries()].map(([provider, count]) => ({ provider, count })).sort((a, b) => b.count - a.count));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const providers = data?.providers ?? [];

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> IA & Custos</h1>
          <p className="text-xs text-muted-foreground">Status dos provedores grátis usados pelo módulo Comunicação. Nenhum cobra do cliente.</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCcw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />Atualizar</Button>
      </div>

      <FreeAiToggle />

      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription className="text-xs">
          <b>Não consome créditos Lovable.</b> Pollinations (imagem) e Template Local (texto) funcionam sem nenhuma configuração.
          {data?.warning && <> {data.warning}</>}
        </AlertDescription>
      </Alert>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-2 border-b bg-muted/40 text-xs font-semibold">Provedores</div>
        <div className="divide-y">
          {providers.map((p) => {
            const used = usage.find((u) => u.provider.startsWith(p.key))?.count ?? 0;
            return (
              <div key={p.key} className="p-3 flex items-start gap-3">
                <div className="pt-1">
                  {p.configured
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : <XCircle className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{p.label}</span>
                    <Badge variant="outline" className="text-[10px]">{p.kind}</Badge>
                    {p.configured
                      ? <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 border-emerald-500/40">ativo</Badge>
                      : <Badge variant="secondary" className="text-[10px]">precisa configurar</Badge>}
                    {used > 0 && <Badge variant="outline" className="text-[10px]">{used} usos / 30d</Badge>}
                  </div>
                  {p.note && <div className="text-[11px] text-muted-foreground mt-0.5">{p.note}</div>}
                  {!p.configured && p.needs.length > 0 && (
                    <div className="text-[11px] mt-1 space-y-0.5">
                      <div className="text-muted-foreground">Falta configurar:</div>
                      {p.needs.map((n) => (
                        <div key={n} className="flex items-center gap-1">
                          <code className="bg-muted px-1 rounded text-[10px]">{n}</code>
                          {HOW_TO[n] && (
                            <a href={HOW_TO[n].url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                              {HOW_TO[n].label} <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {providers.length === 0 && !loading && (
            <div className="p-4 text-xs text-muted-foreground">Sem provedores retornados.</div>
          )}
        </div>
      </Card>

      <Card className="p-4 text-xs space-y-2">
        <div className="font-semibold text-sm">Como funciona o roteiro de fallback</div>
        <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
          <li><b>Texto:</b> Gemini → Groq → GitHub Models → OpenRouter → <b>Template Local</b> (sempre funciona).</li>
          <li><b>Imagem:</b> <b>Pollinations</b> (default, sem chave) → Gemini Image → Cloudflare Flux → HuggingFace FLUX.</li>
          <li>Sempre que um provedor com chave está ausente, ele é simplesmente pulado — nada quebra.</li>
          <li>O log <code>comm_ai_usage</code> grava <code>provider</code> e <code>cost_credits = 0</code> para todos os modos grátis.</li>
        </ol>
      </Card>
    </div>
  );
}
