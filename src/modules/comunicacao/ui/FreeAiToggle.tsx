import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { isFreeAiEnabled, setFreeAiEnabled } from "../lib/api";

/**
 * Toggle global "IA Grátis (estudante)" vs "IA Paga (Lovable AI)".
 * Persistido em localStorage. Default = grátis (sem custo).
 */
export function FreeAiToggle({ compact = false }: { compact?: boolean }) {
  const [on, setOn] = useState(true);
  useEffect(() => { setOn(isFreeAiEnabled()); }, []);
  function toggle(v: boolean) { setOn(v); setFreeAiEnabled(v); }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Switch id="free-ai" checked={on} onCheckedChange={toggle} />
        <Label htmlFor="free-ai" className="text-xs cursor-pointer flex items-center gap-1">
          {on ? <><Sparkles className="w-3 h-3 text-emerald-500" /> IA grátis</> : <><ShieldCheck className="w-3 h-3 text-amber-500" /> IA paga</>}
        </Label>
      </div>
    );
  }
  return (
    <div className="rounded-lg border bg-card p-3 flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-medium flex items-center gap-2">
          {on ? <Sparkles className="w-4 h-4 text-emerald-500" /> : <ShieldCheck className="w-4 h-4 text-amber-500" />}
          IA {on ? "Grátis (BYOK estudante)" : "Paga (Lovable AI)"}
          <Badge variant={on ? "secondary" : "default"} className="text-[10px]">{on ? "0 créditos" : "consome créditos"}</Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {on
            ? "Usa Gemini AI Studio / Groq / GitHub Models / Pollinations. Custo zero para o cliente."
            : "Usa o gateway Lovable AI (consome créditos da workspace)."}
        </div>
      </div>
      <Switch checked={on} onCheckedChange={toggle} />
    </div>
  );
}
