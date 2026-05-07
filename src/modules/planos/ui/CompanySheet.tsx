import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { UserPlus, Trash2, Users, Shield, CreditCard } from "lucide-react";

const sb: any = supabase;
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CompanySheet({ company, onClose, onChanged }: { company: any; onClose: () => void; onChanged: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [perms, setPerms] = useState<Record<string, Record<string, { v: boolean; e: boolean; d: boolean }>>>({});
  const [calc, setCalc] = useState<number>(0);
  const [emailNew, setEmailNew] = useState("");

  async function reload() {
    const [{ data: cu }, { data: pl }, { data: cat }] = await Promise.all([
      sb.from("company_users").select("*").eq("company_id", company.id),
      sb.from("company_plans").select("*").eq("company_id", company.id).maybeSingle(),
      sb.from("plan_modules_catalog").select("*").eq("ativo", true).order("ordem"),
    ]);
    const ids = (cu ?? []).map((x: any) => x.user_id);
    let profs: any[] = [];
    if (ids.length) {
      const { data } = await sb.from("profiles").select("id, email, full_name").in("id", ids);
      profs = data ?? [];
    }
    setUsers((cu ?? []).map((x: any) => ({ ...x, profile: profs.find(p => p.id === x.user_id) })));
    setPlan(pl);
    setCatalog(cat ?? []);
    const { data: pm } = await sb.from("company_module_permissions").select("*").eq("company_id", company.id);
    const map: any = {};
    (pm ?? []).forEach((p: any) => {
      map[p.user_id] ??= {};
      map[p.user_id][p.module_key] = { v: p.can_view, e: p.can_edit, d: p.can_delete };
    });
    setPerms(map);
    const { data: v } = await sb.rpc("calc_company_plan_value", { _company_id: company.id });
    setCalc(Number(v ?? 0));
  }
  useEffect(() => { reload(); }, [company.id]);

  async function addUser() {
    if (!emailNew.trim()) return;
    const { data: prof } = await sb.from("profiles").select("id").ilike("email", emailNew.trim()).maybeSingle();
    if (!prof) return toast.error("Usuário não encontrado. Ele precisa ter conta no ERP.");
    if (users.find(u => u.user_id === prof.id)) return toast.error("Usuário já vinculado");
    const { error } = await sb.from("company_users").insert({ company_id: company.id, user_id: prof.id, is_company_admin: false });
    if (error) return toast.error(error.message);
    toast.success("Usuário vinculado");
    setEmailNew("");
    reload();
    onChanged();
  }

  async function removeUser(uid: string) {
    if (!confirm("Remover este usuário da empresa?")) return;
    const { error } = await sb.from("company_users").delete().eq("company_id", company.id).eq("user_id", uid);
    if (error) return toast.error(error.message);
    await sb.from("company_module_permissions").delete().eq("company_id", company.id).eq("user_id", uid);
    toast.success("Removido");
    reload();
    onChanged();
  }

  async function toggleAdmin(uid: string, val: boolean) {
    const { error } = await sb.from("company_users").update({ is_company_admin: val }).eq("company_id", company.id).eq("user_id", uid);
    if (error) return toast.error(error.message);
    reload();
  }

  async function savePerms() {
    const rows: any[] = [];
    Object.entries(perms).forEach(([user_id, mp]) => {
      Object.entries(mp).forEach(([module_key, v]) => {
        if ((plan?.modules ?? []).includes(module_key)) {
          rows.push({ company_id: company.id, user_id, module_key, can_view: v.v, can_edit: v.e, can_delete: v.d });
        }
      });
    });
    await sb.from("company_module_permissions").delete().eq("company_id", company.id);
    if (rows.length) {
      const { error } = await sb.from("company_module_permissions").insert(rows);
      if (error) return toast.error(error.message);
    }
    toast.success("Permissões salvas");
  }

  async function applyValue() {
    const { data, error } = await sb.rpc("apply_calculated_value", { _company_id: company.id });
    if (error) return toast.error(error.message);
    toast.success(`Plano agora: ${fmt(Number(data))}`);
    reload();
    onChanged();
  }

  const planMods = plan?.modules ?? [];

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{company.nome}</SheetTitle>
          <p className="text-xs text-muted-foreground">{company.cnpj} · {users.length} usuário(s) · {planMods.length} módulo(s)</p>
        </SheetHeader>

        <Tabs defaultValue="users" className="mt-4">
          <TabsList>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" /> Usuários</TabsTrigger>
            <TabsTrigger value="perms"><Shield className="w-4 h-4 mr-1" /> Permissões V/E/D</TabsTrigger>
            <TabsTrigger value="plan"><CreditCard className="w-4 h-4 mr-1" /> Plano & Valor</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="E-mail do usuário existente" value={emailNew} onChange={e => setEmailNew(e.target.value)} />
              <Button onClick={addUser}><UserPlus className="w-4 h-4 mr-1" /> Adicionar</Button>
            </div>
            <p className="text-xs text-muted-foreground">O usuário precisa ter cadastro prévio no ERP. Use a tela de cadastro pública para criar a conta dele primeiro.</p>
            <Table>
              <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>E-mail</TableHead><TableHead className="text-center">Admin</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell className="text-sm">{u.profile?.full_name || "—"}</TableCell>
                    <TableCell className="text-sm">{u.profile?.email}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={u.is_company_admin} onCheckedChange={v => toggleAdmin(u.user_id, !!v)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => removeUser(u.user_id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-sm">Nenhum usuário vinculado.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="perms" className="space-y-3">
            <p className="text-xs text-muted-foreground">Cada empresa autoriza suas permissões por usuário. Marque <b>Ver</b>, <b>Editar</b> ou <b>Excluir</b> em cada módulo.</p>
            <CompanyPermissionsMatrix companyId={company.id} />
          </TabsContent>

          <TabsContent value="plan" className="space-y-3">
            {!plan && <p className="text-sm text-muted-foreground">Sem plano. Use o botão "Plano" na tabela para criar.</p>}
            {plan && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="border rounded p-3">
                    <Label className="text-xs">Valor atual</Label>
                    <div className="text-lg font-bold">{fmt(Number(plan.valor_mensal))}</div>
                  </div>
                  <div className="border rounded p-3">
                    <Label className="text-xs">Valor calculado</Label>
                    <div className="text-lg font-bold text-primary">{fmt(calc)}</div>
                  </div>
                  <div className="border rounded p-3">
                    <Label className="text-xs">Diferença</Label>
                    <div className={`text-lg font-bold ${calc !== Number(plan.valor_mensal) ? "text-orange-600" : "text-muted-foreground"}`}>
                      {fmt(calc - Number(plan.valor_mensal))}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Módulos do plano</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {planMods.map((m: string) => <Badge key={m} variant="secondary">{catalog.find(c => c.key === m)?.label ?? m}</Badge>)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Integrações contratadas</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(plan.integrations || []).map((i: string) => <Badge key={i} variant="outline">{i}</Badge>)}
                    {(plan.integrations || []).length === 0 && <span className="text-xs text-muted-foreground">Nenhuma</span>}
                  </div>
                </div>
                <Button onClick={applyValue}>Aplicar valor calculado ao plano</Button>
                <p className="text-xs text-muted-foreground">Cálculo: nº de usuários × valor por usuário + soma de módulos + integrações (configurar em Calculadora de Pagamentos).</p>
              </>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
