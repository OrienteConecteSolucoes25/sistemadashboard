import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calculator, Save, Wand2 } from "lucide-react";

const sb: any = supabase;
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CalculadoraTab() {
  const [cfg, setCfg] = useState<{ valor_por_usuario: number; precos_por_modulo: Record<string, number>; precos_por_integracao: Record<string, number> }>({
    valor_por_usuario: 0, precos_por_modulo: {}, precos_por_integracao: {},
  });
  const [catalog, setCatalog] = useState<any[]>([]);
  const [integ, setInteg] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const [{ data: c }, { data: cat }, { data: ints }, { data: co }, { data: pl }, { data: cu }] = await Promise.all([
      sb.from("plan_pricing_config").select("*").eq("id", true).maybeSingle(),
      sb.from("plan_modules_catalog").select("*").eq("ativo", true).order("ordem"),
      sb.from("plan_integrations_catalog").select("*").eq("ativo", true).order("ordem"),
      sb.from("companies").select("*").order("nome"),
      sb.from("company_plans").select("*"),
      sb.from("company_users").select("company_id, user_id"),
    ]);
    if (c) setCfg({
      valor_por_usuario: Number(c.valor_por_usuario ?? 0),
      precos_por_modulo: c.precos_por_modulo ?? {},
      precos_por_integracao: c.precos_por_integracao ?? {},
    });
    setCatalog(cat ?? []);
    setInteg(ints ?? []);
    setCompanies(co ?? []);
    setPlans(pl ?? []);
    setUsers(cu ?? []);
  }
  useEffect(() => { reload(); }, []);

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await sb.from("plan_pricing_config").upsert({
      id: true,
      valor_por_usuario: cfg.valor_por_usuario,
      precos_por_modulo: cfg.precos_por_modulo,
      precos_por_integracao: cfg.precos_por_integracao,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tabela de preços salva");
  }

  function calcCompany(companyId: string) {
    const plan = plans.find(p => p.company_id === companyId);
    if (!plan) return 0;
    const n = users.filter(u => u.company_id === companyId).length;
    let total = cfg.valor_por_usuario * n;
    (plan.modules || []).forEach((m: string) => total += Number(cfg.precos_por_modulo[m] || 0));
    (plan.integrations || []).forEach((i: string) => total += Number(cfg.precos_por_integracao[i] || 0));
    return total;
  }

  async function applyToCompany(companyId: string) {
    const { data, error } = await sb.rpc("apply_calculated_value", { _company_id: companyId });
    if (error) return toast.error(error.message);
    toast.success(`Aplicado: ${fmt(Number(data))}`);
    reload();
  }
  async function applyAll() {
    for (const c of companies) {
      if (plans.find(p => p.company_id === c.id)) await sb.rpc("apply_calculated_value", { _company_id: c.id });
    }
    toast.success("Valores aplicados a todas as empresas");
    reload();
  }

  const grupos = useMemo(() => Array.from(new Set(catalog.map(c => c.grupo))), [catalog]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5 text-primary" /> Calculadora de Pagamentos</CardTitle>
          <Button size="sm" onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvar tabela</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Label>Valor por usuário (R$ / mês)</Label>
            <Input type="number" step="0.01" value={cfg.valor_por_usuario}
              onChange={e => setCfg({ ...cfg, valor_por_usuario: Number(e.target.value) })} />
          </div>

          <div>
            <Label className="text-base">Preço por módulo (R$ / mês)</Label>
            <div className="grid md:grid-cols-2 gap-3 mt-2">
              {grupos.map(g => (
                <div key={g as string} className="border rounded p-2">
                  <div className="text-xs font-semibold mb-2">{g as string}</div>
                  <div className="space-y-1">
                    {catalog.filter(c => c.grupo === g).map(c => (
                      <div key={c.key} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate">{c.label}</span>
                        <Input type="number" step="0.01" className="w-24 h-7"
                          value={cfg.precos_por_modulo[c.key] ?? 0}
                          onChange={e => setCfg({ ...cfg, precos_por_modulo: { ...cfg.precos_por_modulo, [c.key]: Number(e.target.value) } })} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base">Preço por integração (R$ / mês)</Label>
            <div className="grid md:grid-cols-2 gap-2 mt-2">
              {integ.map(i => (
                <div key={i.key} className="flex items-center gap-2 text-sm border rounded p-2">
                  <span className="flex-1">{i.label}</span>
                  <Input type="number" step="0.01" className="w-24 h-7"
                    value={cfg.precos_por_integracao[i.key] ?? 0}
                    onChange={e => setCfg({ ...cfg, precos_por_integracao: { ...cfg.precos_por_integracao, [i.key]: Number(e.target.value) } })} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Preview por empresa</CardTitle>
          <Button size="sm" variant="outline" onClick={applyAll}><Wand2 className="w-4 h-4 mr-1" /> Aplicar a todas</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-center">Usuários</TableHead>
                <TableHead className="text-center">Módulos</TableHead>
                <TableHead className="text-center">Integrações</TableHead>
                <TableHead className="text-right">Valor calculado</TableHead>
                <TableHead className="text-right">Valor atual</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map(c => {
                const plan = plans.find(p => p.company_id === c.id);
                const n = users.filter(u => u.company_id === c.id).length;
                const calc = calcCompany(c.id);
                const atual = Number(plan?.valor_mensal ?? 0);
                const diff = Math.abs(calc - atual) > 0.01;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-center"><Badge variant="secondary">{n}</Badge></TableCell>
                    <TableCell className="text-center"><Badge variant="outline">{plan?.modules?.length ?? 0}</Badge></TableCell>
                    <TableCell className="text-center"><Badge variant="outline">{plan?.integrations?.length ?? 0}</Badge></TableCell>
                    <TableCell className="text-right font-semibold text-primary">{fmt(calc)}</TableCell>
                    <TableCell className={`text-right ${diff ? "text-orange-600" : ""}`}>{fmt(atual)}</TableCell>
                    <TableCell className="text-right">
                      {plan && (
                        <Button size="sm" variant={diff ? "default" : "ghost"} onClick={() => applyToCompany(c.id)}>
                          Aplicar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
