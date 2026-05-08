import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const sb: any = supabase;

type Props = {
  companyId: string;
  /** Quando exibido dentro do ADM global, liberamos todos os módulos do catálogo (não apenas os do plano). */
  allModulesOverride?: boolean;
};

/**
 * Matriz "estilo planilha" de permissões por usuário × módulo.
 * Cada célula mostra 3 switches verticais (Ver / Editar / Excluir) — igual ao mock do ADM.
 * Empresa autoriza suas permissões por usuário.
 */
export default function CompanyPermissionsMatrix({ companyId, allModulesOverride }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [planMods, setPlanMods] = useState<string[]>([]);
  const [perms, setPerms] = useState<Record<string, Record<string, { v: boolean; e: boolean; d: boolean }>>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: cu }, { data: cat }, { data: pl }] = await Promise.all([
      sb.from("company_users").select("*").eq("company_id", companyId),
      sb.from("plan_modules_catalog").select("*").eq("ativo", true).order("ordem"),
      sb.from("company_plans").select("modules").eq("company_id", companyId).maybeSingle(),
    ]);
    const linkedIds = new Set((cu ?? []).map((x: any) => x.user_id));

    // Em modo admin global, mostra todos os perfis (mesmo que ainda não estejam vinculados à empresa).
    let profs: any[] = [];
    if (allModulesOverride) {
      const { data } = await sb.from("profiles").select("id, email, full_name");
      profs = data ?? [];
    } else if (linkedIds.size) {
      const { data } = await sb.from("profiles").select("id, email, full_name").in("id", Array.from(linkedIds));
      profs = data ?? [];
    }

    const usrs = profs.map((p: any) => ({
      user_id: p.id,
      profile: p,
      _linked: linkedIds.has(p.id),
    }));
    usrs.sort((a: any, b: any) => (a.profile?.full_name ?? a.profile?.email ?? "").localeCompare(b.profile?.full_name ?? b.profile?.email ?? ""));
    setUsers(usrs);
    setCatalog(cat ?? []);
    setPlanMods(pl?.modules ?? []);
    const { data: pm } = await sb.from("company_module_permissions").select("*").eq("company_id", companyId);
    const map: any = {};
    (pm ?? []).forEach((p: any) => {
      map[p.user_id] ??= {};
      map[p.user_id][p.module_key] = { v: p.can_view, e: p.can_edit, d: p.can_delete };
    });
    setPerms(map);
    setLoading(false);
  }
  useEffect(() => { load(); }, [companyId]);

  const visibleMods = allModulesOverride
    ? catalog
    : catalog.filter(c => planMods.includes(c.key));

  function setCell(uid: string, mod: string, patch: Partial<{ v: boolean; e: boolean; d: boolean }>) {
    const cur = perms[uid]?.[mod] ?? { v: false, e: false, d: false };
    setPerms({ ...perms, [uid]: { ...(perms[uid] ?? {}), [mod]: { ...cur, ...patch } } });
  }

  async function save() {
    const rows: any[] = [];
    const usersToLink = new Set<string>();
    Object.entries(perms).forEach(([user_id, mp]) => {
      Object.entries(mp).forEach(([module_key, v]) => {
        if (allModulesOverride || planMods.includes(module_key)) {
          rows.push({ company_id: companyId, user_id, module_key, can_view: v.v, can_edit: v.e, can_delete: v.d });
          if (v.v || v.e || v.d) usersToLink.add(user_id);
        }
      });
    });

    // Auto-vincula à empresa qualquer usuário que tenha pelo menos uma permissão
    if (usersToLink.size) {
      const linkedExisting = new Set(users.filter((u: any) => u._linked).map((u: any) => u.user_id));
      const toInsert = Array.from(usersToLink)
        .filter((uid) => !linkedExisting.has(uid))
        .map((user_id) => ({ company_id: companyId, user_id }));
      if (toInsert.length) {
        await sb.from("company_users").insert(toInsert);
      }
    }

    await sb.from("company_module_permissions").delete().eq("company_id", companyId);
    if (rows.length) {
      const { error } = await sb.from("company_module_permissions").insert(rows);
      if (error) return toast.error(error.message);
    }
    toast.success("Permissões salvas");
    load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!users.length) return <p className="text-sm text-muted-foreground">Nenhum usuário vinculado a esta empresa.</p>;
  if (!visibleMods.length) return <p className="text-sm text-muted-foreground">{allModulesOverride ? "Catálogo de módulos vazio." : "O plano da empresa não possui módulos. Edite o plano antes de definir permissões."}</p>;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="bg-muted/40 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-muted/40 z-10 min-w-[220px] border-b">Usuário</th>
              {visibleMods.map(m => (
                <th key={m.key} className="text-center px-4 py-3 font-semibold border-b min-w-[110px]">
                  <div>{m.label}</div>
                  {m.descricao && <div className="text-[11px] font-normal text-muted-foreground line-clamp-1">{m.descricao}</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id} className="hover:bg-muted/20">
                <td className="px-4 py-3 sticky left-0 bg-background z-10 border-b align-top">
                  <div className="font-medium text-sm flex items-center gap-1.5">
                    {u.profile?.full_name || "—"}
                    {!u._linked && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">não vinculado</span>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">{u.profile?.email}</div>
                </td>
                {visibleMods.map(m => {
                  const p = perms[u.user_id]?.[m.key] ?? { v: false, e: false, d: false };
                  return (
                    <td key={m.key} className="px-3 py-3 text-center border-b align-top">
                      <div className="flex flex-col gap-1.5 items-stretch">
                        <label className="flex items-center justify-between gap-2 text-xs">
                          <Switch checked={p.v} onCheckedChange={v => setCell(u.user_id, m.key, { v })} />
                          <span>Ver</span>
                        </label>
                        <label className="flex items-center justify-between gap-2 text-xs">
                          <Switch checked={p.e} onCheckedChange={v => setCell(u.user_id, m.key, { e: v })} />
                          <span>Editar</span>
                        </label>
                        <label className="flex items-center justify-between gap-2 text-xs">
                          <Switch checked={p.d} onCheckedChange={v => setCell(u.user_id, m.key, { d: v })} />
                          <span>Excluir</span>
                        </label>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Button onClick={save}>Salvar permissões</Button>
      </div>
    </div>
  );
}
