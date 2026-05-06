import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { HeartHandshake } from "lucide-react";

const sb: any = supabase;

type Company = { id: string; nome: string };
type Catalog = { key: string; nome: string; area: string; descricao: string };
type Settings = {
  id?: string;
  company_id: string;
  submodulos_ativos: string[];
  jornada_padrao_horas: number;
  regra_he: any;
  regra_ferias: any;
};

export default function RhdpAdminTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: cat }] = await Promise.all([
        sb.from("companies").select("id, nome").order("nome"),
        sb.from("hrdp_submodules_catalog").select("*").eq("ativo", true).order("ordem"),
      ]);
      setCompanies(c ?? []);
      setCatalog(cat ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!companyId) { setSettings(null); return; }
    (async () => {
      const { data } = await sb.from("hrdp_module_settings").select("*").eq("company_id", companyId).maybeSingle();
      setSettings(data ?? {
        company_id: companyId,
        submodulos_ativos: [],
        jornada_padrao_horas: 8,
        regra_he: { diurna_pct: 50, noturna_pct: 75, dsr_pct: 100 },
        regra_ferias: { dias_aquisitivos: 30, abono_max: 10, adiantamento_13: true },
      });
    })();
  }, [companyId]);

  const grouped = useMemo(() => {
    const g: Record<string, Catalog[]> = { rh: [], dp: [], bi: [] };
    catalog.forEach(c => { (g[c.area] ??= []).push(c); });
    return g;
  }, [catalog]);

  function toggle(key: string) {
    if (!settings) return;
    const set = new Set(settings.submodulos_ativos);
    set.has(key) ? set.delete(key) : set.add(key);
    setSettings({ ...settings, submodulos_ativos: Array.from(set) });
  }

  async function save() {
    if (!settings) return;
    setLoading(true);
    const { error } = await sb.from("hrdp_module_settings").upsert(settings, { onConflict: "company_id" });
    setLoading(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Configurações de RH/DP salvas");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label>Empresa</Label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Selecione uma empresa" /></SelectTrigger>
            <SelectContent>
              {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {settings && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-primary" /> Submódulos ativos
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["rh","dp","bi"] as const).map(area => (
                <div key={area} className="space-y-2">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">{area}</div>
                  {(grouped[area] ?? []).map(item => (
                    <label key={item.key} className="flex items-start gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={settings.submodulos_ativos.includes(item.key)}
                        onCheckedChange={() => toggle(item.key)}
                      />
                      <div>
                        <div className="font-medium">{item.nome}</div>
                        <div className="text-xs text-muted-foreground">{item.descricao}</div>
                      </div>
                    </label>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Parâmetros base</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Jornada padrão (horas/dia)</Label>
                <Input type="number" step="0.5" value={settings.jornada_padrao_horas}
                  onChange={(e) => setSettings({ ...settings, jornada_padrao_horas: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>HE diurna (%)</Label>
                <Input type="number" value={settings.regra_he?.diurna_pct ?? 50}
                  onChange={(e) => setSettings({ ...settings, regra_he: { ...settings.regra_he, diurna_pct: Number(e.target.value) } })} />
              </div>
              <div className="space-y-1">
                <Label>HE noturna (%)</Label>
                <Input type="number" value={settings.regra_he?.noturna_pct ?? 75}
                  onChange={(e) => setSettings({ ...settings, regra_he: { ...settings.regra_he, noturna_pct: Number(e.target.value) } })} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={save} disabled={loading}>Salvar configurações</Button>
          </div>
        </>
      )}

      {!companyId && (
        <div className="text-sm text-muted-foreground">Selecione uma empresa para configurar os submódulos RH/DP.</div>
      )}
    </div>
  );
}
