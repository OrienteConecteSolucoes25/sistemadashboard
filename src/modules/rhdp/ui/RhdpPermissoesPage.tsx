import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { useHrdpCompany } from "../hooks/useHrdpCompany";

const sb: any = supabase;

type Profile = { id: string; full_name: string | null; email: string };
type Catalog = { key: string; nome: string; area: string };
type Perm = {
  id?: string;
  user_id: string;
  company_id: string;
  submodule_key: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_view_sensitive: boolean;
  can_import: boolean;
  can_export: boolean;
  can_manage_settings: boolean;
};

const ACTIONS: { key: keyof Perm; label: string }[] = [
  { key: "can_view", label: "Ver" },
  { key: "can_create", label: "Criar" },
  { key: "can_edit", label: "Editar" },
  { key: "can_delete", label: "Excluir" },
  { key: "can_approve", label: "Aprovar" },
  { key: "can_view_sensitive", label: "Ver sensíveis" },
  { key: "can_import", label: "Importar" },
  { key: "can_export", label: "Exportar" },
];

export default function RhdpPermissoesPage() {
  const { companyId, companyName, companies, isAdmin, selectCompany } = useHrdpCompany();
  const [users, setUsers] = useState<Profile[]>([]);
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [perms, setPerms] = useState<Record<string, Perm>>({});

  useEffect(() => {
    (async () => {
      const { data: cat } = await sb.from("hrdp_submodules_catalog").select("key, nome, area").eq("ativo", true).order("ordem");
      setCatalog(cat ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const { data } = await sb
        .from("company_users")
        .select("user_id, profiles:profiles!inner(id, full_name, email)")
        .eq("company_id", companyId);
      const list: Profile[] = (data ?? []).map((r: any) => r.profiles).filter(Boolean);
      setUsers(list);
    })();
  }, [companyId]);

  useEffect(() => {
    if (!userId || !companyId) { setPerms({}); return; }
    (async () => {
      const { data } = await sb
        .from("hrdp_module_permissions")
        .select("*")
        .eq("user_id", userId)
        .eq("company_id", companyId);
      const map: Record<string, Perm> = {};
      (data ?? []).forEach((p: any) => { map[p.submodule_key] = p; });
      setPerms(map);
    })();
  }, [userId, companyId]);

  function getPerm(key: string): Perm {
    return perms[key] ?? {
      user_id: userId, company_id: companyId!, submodule_key: key,
      can_view: false, can_create: false, can_edit: false, can_delete: false,
      can_approve: false, can_view_sensitive: false, can_import: false, can_export: false,
      can_manage_settings: false,
    };
  }

  function toggle(key: string, action: keyof Perm) {
    const p = getPerm(key);
    setPerms({ ...perms, [key]: { ...p, [action]: !(p[action] as boolean) } });
  }

  async function save() {
    if (!userId || !companyId) return;
    const rows = Object.values(perms);
    if (rows.length === 0) { toast.warning("Nada para salvar"); return; }
    const { error } = await sb.from("hrdp_module_permissions").upsert(rows, { onConflict: "user_id,company_id,submodule_key" });
    if (error) { toast.error(error.message); return; }
    toast.success("Permissões salvas");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" /> Permissões finas RH/DP
        </h1>
        <p className="text-sm text-muted-foreground">Configure por usuário e submódulo. Aplica-se em {companyName ?? "—"}.</p>
      </div>

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {isAdmin && companies.length > 1 && (
            <div className="space-y-1">
              <Label className="text-xs">Empresa</Label>
              <Select value={companyId ?? ""} onValueChange={selectCompany}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Usuário</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
              <SelectContent>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name ?? u.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {userId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Matriz de permissões</CardTitle>
            <Button size="sm" onClick={save}><Save className="w-4 h-4 mr-1" /> Salvar</Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submódulo</TableHead>
                  {ACTIONS.map(a => <TableHead key={a.key as string} className="text-center text-xs">{a.label}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog.map(c => {
                  const p = getPerm(c.key);
                  return (
                    <TableRow key={c.key}>
                      <TableCell className="text-sm">
                        <div className="font-medium">{c.nome}</div>
                        <div className="text-[10px] uppercase text-muted-foreground">{c.area}</div>
                      </TableCell>
                      {ACTIONS.map(a => (
                        <TableCell key={a.key as string} className="text-center">
                          <Checkbox
                            checked={!!p[a.key]}
                            onCheckedChange={() => toggle(c.key, a.key)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
