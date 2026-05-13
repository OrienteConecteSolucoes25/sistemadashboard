import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";
import { useEngDemoMode } from "../../demo/useEngDemoMode";
import { usePlanosAccess } from "@/modules/planos/hooks/usePlanosAccess";

/** Toggle "Modo Demo / Mockup" — visível APENAS para OCS staff.
 *  Quando ativo, dashboards e listas usam dados fictícios para apresentação comercial.
 */
export function EngDemoToggle() {
  const { isOcsStaff } = usePlanosAccess();
  const { enabled, toggle } = useEngDemoMode();
  if (!isOcsStaff) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card hover:bg-muted/50 transition-colors text-xs"
      title="Visível apenas para staff OCS"
    >
      <FlaskConical className={`w-3.5 h-3.5 ${enabled ? "text-amber-500" : "text-muted-foreground"}`} />
      <span className="font-medium">Modo Demo</span>
      <Switch checked={enabled} onCheckedChange={toggle} className="scale-75 -my-2" />
      {enabled && <Badge variant="outline" className="border-amber-500/50 text-amber-600 text-[10px]">Mockup ON</Badge>}
    </button>
  );
}

export function EngDemoBanner() {
  const { enabled } = useEngDemoMode();
  if (!enabled) return null;
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-4 py-1.5 text-xs flex items-center gap-2">
      <FlaskConical className="w-3.5 h-3.5" />
      <span><strong>Modo Demo ativo</strong> — todos os dados exibidos são fictícios. Visível só para staff OCS.</span>
    </div>
  );
}
