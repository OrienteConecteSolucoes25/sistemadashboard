import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save } from "lucide-react";

const CHART_TYPES = [
  { key: "kpi", label: "KPI" },
  { key: "pie", label: "Pizza" },
  { key: "donut", label: "Donut" },
  { key: "bar", label: "Barras V" },
  { key: "barH", label: "Barras H" },
  { key: "line", label: "Linha" },
  { key: "area", label: "Área" },
  { key: "radar", label: "Radar" },
  { key: "funnel", label: "Funil" },
  { key: "gauge", label: "Medidor" },
  { key: "stack", label: "Stacked" },
  { key: "combo", label: "Linha+Barra" },
  { key: "heatmap", label: "Heatmap" },
  { key: "ranking", label: "Ranking" },
  { key: "table", label: "Tabela" },
];

const CATALOG: { module: string; tab: string; metric: string; label: string; default: string[] }[] = [
  { module: "engenharia", tab: "dashboard", metric: "pendencias_status", label: "Engenharia · Pendências por status", default: ["pie", "bar", "donut"] },
  { module: "engenharia", tab: "dashboard", metric: "obras_progresso", label: "Engenharia · Progresso de obras", default: ["bar", "line"] },
  { module: "engenharia", tab: "dashboard", metric: "rfi_volume", label: "Engenharia · Volume de RFI", default: ["line", "bar"] },
  { module: "juridico", tab: "processos", metric: "processos_tipo", label: "Jurídico · Processos por tipo", default: ["pie", "barH", "donut"] },
  { module: "juridico", tab: "dashboard", metric: "prazos_vencimento", label: "Jurídico · Prazos por vencimento", default: ["bar", "line"] },
  { module: "rh-dp", tab: "absenteismo", metric: "absent_mensal", label: "RH/DP · Absenteísmo mensal", default: ["line", "bar", "area"] },
  { module: "crea", tab: "dashboard", metric: "arts_status", label: "CREA · ARTs por status", default: ["pie", "bar"] },
  { module: "comunicacao", tab: "dashboard", metric: "publicacoes_canal", label: "Comunicação · Publicações por canal", default: ["bar", "pie"] },
];

interface Props {
  /** null = preferência global (vale para todos os projetos sem override) */
  companyId: string | null;
  onDirtyChange?: (dirty: boolean) => void;
}

type Pref = {
  metric_key: string;
  module_key: string;
  tab_key: string;
  allowed: string[];
  default: string;
  user_can_switch: boolean;
};

export function ChartPreferencesPanel({ companyId, onDirtyChange }: Props) {
  const [prefs, setPrefs] = useState<Record<string, Pref>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("company_chart_preferences").select("*").eq("company_id", companyId);
      const map: Record<string, Pref> = {};
      CATALOG.forEach(c => {
        const row = (data || []).find((r: any) => r.module_key === c.module && r.tab_key === c.tab && r.metric_key === c.metric);
        map[c.metric] = {
          metric_key: c.metric,
          module_key: c.module,
          tab_key: c.tab,
          allowed: row?.allowed_chart_types ?? c.default,
          default: row?.default_chart_type ?? c.default[0],
          user_can_switch: row?.user_can_switch ?? true,
        };
      });
      setPrefs(map);
      onDirtyChange?.(false);
    })();
  }, [companyId, onDirtyChange]);

  const update = (metric: string, patch: Partial<Pref>) => {
    setPrefs(p => ({ ...p, [metric]: { ...p[metric], ...patch } }));
    onDirtyChange?.(true);
  };

  const toggleType = (metric: string, type: string) => {
    const cur = prefs[metric];
    const allowed = cur.allowed.includes(type) ? cur.allowed.filter(t => t !== type) : [...cur.allowed, type];
    if (allowed.length === 0) { toast.error("Mantenha ao menos 1 tipo"); return; }
    const def = allowed.includes(cur.default) ? cur.default : allowed[0];
    update(metric, { allowed, default: def });
  };

  const handleSave = async () => {
    setSaving(true);
    const rows = Object.values(prefs).map(p => ({
      company_id: companyId,
      module_key: p.module_key,
      tab_key: p.tab_key,
      subtab_key: "",
      metric_key: p.metric_key,
      allowed_chart_types: p.allowed,
      default_chart_type: p.default,
      user_can_switch: p.user_can_switch,
      is_active: true,
    }));
    const { error } = await (supabase as any)
      .from("company_chart_preferences")
      .upsert(rows, { onConflict: "company_id,module_key,tab_key,subtab_key,metric_key" });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar gráficos: " + error.message); return; }
    toast.success("Preferências de gráficos salvas.");
    onDirtyChange?.(false);
  };

  const restore = () => {
    const map: Record<string, Pref> = {};
    CATALOG.forEach(c => {
      map[c.metric] = {
        metric_key: c.metric, module_key: c.module, tab_key: c.tab,
        allowed: c.default, default: c.default[0], user_can_switch: true,
      };
    });
    setPrefs(map);
    onDirtyChange?.(true);
    toast.message("Padrão OCS aplicado ao rascunho. Salve para confirmar.");
  };

  return (
    <Card className="card-elegant">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Tipos de gráfico por indicador</CardTitle>
            <p className="text-xs text-muted-foreground">Escolha quais visualizações ficam disponíveis em cada dashboard. Marque um padrão e permita ou não que o usuário troque.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={restore}>Restaurar padrão OCS</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> {saving ? "Salvando..." : "Salvar gráficos"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {CATALOG.map(c => {
          const p = prefs[c.metric];
          if (!p) return null;
          return (
            <div key={c.metric} className="rounded-md border p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium text-sm">{c.label}</div>
                <div className="flex items-center gap-2 text-xs">
                  <Switch checked={p.user_can_switch} onCheckedChange={(v) => update(c.metric, { user_can_switch: v })} />
                  <Label className="text-xs">Usuário pode trocar</Label>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CHART_TYPES.map(t => {
                  const enabled = p.allowed.includes(t.key);
                  const isDef = p.default === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => toggleType(c.metric, t.key)}
                      className={`text-xs px-2 py-1 rounded border transition ${
                        enabled ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/70"
                      }`}
                    >
                      {t.label}{isDef && enabled ? " ★" : ""}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Padrão:</span>
                <select
                  value={p.default}
                  onChange={e => update(c.metric, { default: e.target.value })}
                  className="bg-background border rounded px-2 py-1 text-xs"
                >
                  {p.allowed.map(a => {
                    const ct = CHART_TYPES.find(x => x.key === a);
                    return <option key={a} value={a}>{ct?.label || a}</option>;
                  })}
                </select>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
