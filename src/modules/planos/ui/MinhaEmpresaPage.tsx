import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePlanosAccess } from "../hooks/usePlanosAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Shield, Eye, Pencil, Trash2, Image as ImgIcon } from "lucide-react";
import { toast } from "sonner";
import { paymentStatus, ymNow } from "../lib/billing";
import BrandingTab from "./BrandingTab";

const sb: any = supabase;

type Permission = { user_id: string; module_key: string; can_view: boolean; can_edit: boolean; can_delete: boolean };
type Member = { id: string; user_id: string; is_company_admin: boolean; email?: string; nome?: string };

export default function MinhaEmpresaPage() {
  const { isCompanyAdmin, companyId, checking } = usePlanosAccess();
  const [company, setCompany] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [pays, setPays] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [perms, setPerms] = useState<Record<string, Permission>>({}); // key user_id+module
  const [catalog, setCatalog] = useState<any[]>([]);

  async function reload() {
    if (!companyId) return;
    const [{ data: c }, { data: pl }, { data: pa }, { data: cu }, { data: pm }, { data: cat }] = await Promise.all([
      sb.from("companies").select("*").eq("id", companyId).maybeSingle(),
      sb.from("company_plans").select("*").eq("company_id", companyId).maybeSingle(),
      sb.from("company_plan_payments").select("*"),
      sb.from("company_users").select("id,user_id,is_company_admin").eq("company_id", companyId),
      sb.from("company_module_permissions").select("*").eq("company_id", companyId),
      sb.from("plan_modules_catalog").select("*").eq("ativo", true).order("ordem"),
    ]);
    setCompany(c);
    setPlan(pl);
    setCatalog(cat ?? []);
    // pega emails dos profiles
    const userIds = (cu ?? []).map((m: any) => m.user_id);
    const { data: profs } = await sb.from("profiles").select("id, email, full_name").in("id", userIds);
    setMembers((cu ?? []).map((m: any) => {
      const p = profs?.find((x: any) => x.id === m.user_id);
      return { ...m, email: p?.email, nome: p?.full_name };
    }));
    const map: Record<string, Permission> = {};
    (pm ?? []).forEach((p: any) => { map[`${p.user_id}|${p.module_key}`] = p; });
    setPerms(map);
    if (pl) setPays((pa ?? []).filter((x: any) => x.company_plan_id === pl.id));
  }

  useEffect(() => { if (!checking && companyId) reload(); }, [checking, companyId]);

  if (checking) return null;
  if (!companyId) return <Navigate to="/app" replace />;

  async function togglePerm(user_id: string, module_key: string, field: "can_view" | "can_edit" | "can_delete", value: boolean) {
    if (!isCompanyAdmin) { toast.error("Apenas o admin da empresa pode editar permissões"); return; }
    const k = `${user_id}|${module_key}`;
    const existing = perms[k];
    const payload: any = {
      company_id: companyId, user_id, module_key,
      can_view: existing?.can_view ?? true,
      can_edit: existing?.can_edit ?? false,
      can_delete: existing?.can_delete ?? false,
      [field]: value,
    };
    if (existing) {
      const { error } = await sb.from("company_module_permissions").update(payload).eq("user_id", user_id).eq("company_id", companyId).eq("module_key", module_key);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await sb.from("company_module_permissions").insert(payload);
      if (error) return toast.error(error.message);
    }
    setPerms({ ...perms, [k]: { ...payload } });
  }

  const planModules: string[] = plan?.modules ?? [];
  const planCatalog = catalog.filter((c) => planModules.includes(c.key));
  const st = plan ? paymentStatus(plan, pays) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-primary" /> Minha Empresa</h1>
        <p className="text-sm text-muted-foreground">Visão do seu plano e gestão das permissões dos usuários da empresa.</p>
      </div>

      <Tabs defaultValue="plano">
        <TabsList>
          <TabsTrigger value="plano">Plano</TabsTrigger>
          {isCompanyAdmin && <TabsTrigger value="branding"><ImgIcon className="w-4 h-4 mr-1" /> Branding</TabsTrigger>}
          {isCompanyAdmin && <TabsTrigger value="permissoes"><Shield className="w-4 h-4 mr-1" /> Permissões</TabsTrigger>}
        </TabsList>

        <TabsContent value="plano" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{company?.nome ?? "—"}</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
              <div><div className="text-muted-foreground text-xs">CNPJ</div><div>{company?.cnpj ?? "—"}</div></div>
              <div><div className="text-muted-foreground text-xs">Valor mensal</div><div className="font-semibold">{plan ? Number(plan.valor_mensal).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) : "—"}</div></div>
              <div><div className="text-muted-foreground text-xs">Vencimento</div><div>Dia {plan?.dia_vencimento ?? "—"}</div></div>
              <div><div className="text-muted-foreground text-xs">Status do mês ({ymNow()})</div><div>{st ? <Badge variant="outline">{st.status}</Badge> : "—"}</div></div>
              <div className="md:col-span-2"><div className="text-muted-foreground text-xs">Abas contratadas</div>
                <div className="flex flex-wrap gap-1 mt-1">{planCatalog.map((c) => <Badge key={c.key} variant="secondary">{c.label}</Badge>)}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Histórico de pagamentos</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Competência</TableHead><TableHead>Valor</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pays.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.competencia}</TableCell>
                      <TableCell>{Number(p.valor_pago).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</TableCell>
                      <TableCell>{new Date(p.data_pagamento).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                  {pays.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhum pagamento registrado.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {isCompanyAdmin && companyId && (
          <TabsContent value="branding" className="space-y-4">
            <BrandingTab companyId={companyId} />
          </TabsContent>
        )}

        {isCompanyAdmin && (
          <TabsContent value="permissoes" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Permissões dos usuários ({members.length})</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      {planCatalog.map((c) => (
                        <TableHead key={c.key} className="text-center text-xs">{c.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.user_id}>
                        <TableCell className="text-sm">
                          <div className="font-medium">{m.nome ?? m.email}</div>
                          <div className="text-xs text-muted-foreground">{m.email} {m.is_company_admin && <Badge variant="outline" className="ml-1 text-[10px]">admin</Badge>}</div>
                        </TableCell>
                        {planCatalog.map((c) => {
                          const k = `${m.user_id}|${c.key}`;
                          const p = perms[k];
                          return (
                            <TableCell key={c.key} className="text-center">
                              <div className="flex flex-col gap-1 items-center">
                                <label className="flex items-center gap-1 text-xs"><Eye className="w-3 h-3" /><Checkbox checked={p?.can_view ?? true} onCheckedChange={(v) => togglePerm(m.user_id, c.key, "can_view", !!v)} /></label>
                                <label className="flex items-center gap-1 text-xs"><Pencil className="w-3 h-3" /><Checkbox checked={p?.can_edit ?? false} onCheckedChange={(v) => togglePerm(m.user_id, c.key, "can_edit", !!v)} /></label>
                                <label className="flex items-center gap-1 text-xs"><Trash2 className="w-3 h-3" /><Checkbox checked={p?.can_delete ?? false} onCheckedChange={(v) => togglePerm(m.user_id, c.key, "can_delete", !!v)} /></label>
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    {members.length === 0 && <TableRow><TableCell colSpan={planCatalog.length + 1} className="text-center text-muted-foreground">Nenhum usuário vinculado.</TableCell></TableRow>}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-3">V = visualizar · E = editar · D = excluir. Só aparecem as abas que estão no plano contratado.</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
