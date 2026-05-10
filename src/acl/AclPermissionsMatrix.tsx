import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Lock, Search } from "lucide-react";
import { useIsInternalOcs } from "@/acl/AclProvider";

const sb: any = supabase;

type CatalogRow = { key: string; module: string; resource: string; action: string; label: string; description?: string | null; ordem: number };
type Profile = { id: string; email: string | null; full_name: string | null };

type Props = {
  /** Quando definido, todas as permissões salvas são vinculadas a essa empresa. Vazio = global. */
  companyId?: string | null;
  /** Pré-filtra para um único módulo (ex: "engenharia"). */
  moduleFilter?: string;
};

/**
 * Matriz central de permissões (modelo ADM > Visibilidade).
 * Lê do catálogo `acl_permissions_catalog` e grava via RPCs `acl_grant` / `acl_revoke`.
 * Apenas equipe interna OCS pode editar.
 */
export default function AclPermissionsMatrix({ companyId, moduleFilter }: Props) {
  const isInternal = useIsInternalOcs();
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [granted, setGranted] = useState<Set<string>>(new Set()); // `${user_id}::${key}`
  const [pending, setPending] = useState<Map<string, boolean>>(new Map()); // mesma chave → next state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [moduleSel, setModuleSel] = useState<string>(moduleFilter ?? "all");

  async function load() {
    setLoading(true);
    const [{ data: cat }, { data: profs }] = await Promise.all([
      sb.from("acl_permissions_catalog").select("*").eq("ativo", true).order("module").order("ordem"),
      sb.from("profiles").select("id,email,full_name").order("full_name", { nullsFirst: false }),
    ]);
    let q = sb.from("acl_user_permissions").select("user_id,permission_key,company_id");
    q = companyId ? q.eq("company_id", companyId) : q.is("company_id", null);
    const { data: ups } = await q;
    const set = new Set<string>();
    (ups ?? []).forEach((r: any) => set.add(`${r.user_id}::${r.permission_key}`));
    setCatalog(cat ?? []);
    setProfiles(profs ?? []);
    setGranted(set);
    setPending(new Map());
    setLoading(false);
  }
  useEffect(() => { load(); }, [companyId]);

  const modules = useMemo(() => Array.from(new Set(catalog.map(c => c.module))).sort(), [catalog]);
  const filteredCatalog = useMemo(() => {
    let arr = catalog;
    if (moduleSel !== "all") arr = arr.filter(c => c.module === moduleSel);
    return arr;
  }, [catalog, moduleSel]);
  const filteredProfiles = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return profiles;
    return profiles.filter(p => (p.full_name ?? "").toLowerCase().includes(s) || (p.email ?? "").toLowerCase().includes(s));
  }, [profiles, search]);

  function isOn(uid: string, key: string) {
    const k = `${uid}::${key}`;
    if (pending.has(k)) return pending.get(k)!;
    return granted.has(k);
  }
  function toggle(uid: string, key: string, val: boolean) {
    const k = `${uid}::${key}`;
    const original = granted.has(k);
    const next = new Map(pending);
    if (val === original) next.delete(k); else next.set(k, val);
    setPending(next);
  }

  async function save() {
    if (!isInternal) return;
    if (pending.size === 0) { toast.info("Nada a salvar"); return; }
    setSaving(true);
    let ok = 0, fail = 0;
    for (const [k, val] of pending.entries()) {
      const [user_id, permission_key] = k.split("::");
      const reason = val ? "Liberado via ADM > Visibilidade" : "Revogado via ADM > Visibilidade";
      const rpc = val ? "acl_grant" : "acl_revoke";
      const { data, error } = await sb.rpc(rpc, { _target: user_id, _company: companyId ?? null, _key: permission_key, _reason: reason });
      if (error || (data && data.ok === false)) { fail++; } else { ok++; }
    }
    setSaving(false);
    toast[fail ? "warning" : "success"](`Permissões: ${ok} aplicadas${fail ? `, ${fail} falharam` : ""}`);
    await load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!filteredCatalog.length) return <p className="text-sm text-muted-foreground">Catálogo de permissões vazio.</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[220px]">
          <Label className="text-xs">Módulo</Label>
          <Select value={moduleSel} onValueChange={setModuleSel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os módulos</SelectItem>
              {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[260px]">
          <Label className="text-xs">Buscar usuário</Label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-7" placeholder="nome ou e-mail" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!isInternal && (
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" /> somente leitura</span>
          )}
          <Button onClick={save} disabled={!isInternal || saving || pending.size === 0}>
            {saving ? "Salvando…" : `Salvar (${pending.size})`}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="bg-muted/40 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-muted/40 z-10 min-w-[220px] border-b">Usuário</th>
              {filteredCatalog.map(c => (
                <th key={c.key} className="text-center px-3 py-3 font-medium border-b min-w-[120px]">
                  <div className="text-[11px] uppercase text-muted-foreground">{c.module}</div>
                  <div className="text-xs">{c.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map(p => (
              <tr key={p.id} className="hover:bg-muted/20">
                <td className="px-4 py-2 sticky left-0 bg-background z-10 border-b align-top">
                  <div className="font-medium text-sm">{p.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[220px]">{p.email}</div>
                </td>
                {filteredCatalog.map(c => (
                  <td key={c.key} className="px-3 py-2 text-center border-b">
                    <Switch
                      checked={isOn(p.id, c.key)}
                      disabled={!isInternal}
                      onCheckedChange={v => toggle(p.id, c.key, v)}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {!filteredProfiles.length && (
              <tr><td colSpan={filteredCatalog.length + 1} className="text-center text-muted-foreground py-6 text-sm">Nenhum usuário encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Modelo central de permissões (ADM &gt; Visibilidade). Apenas funcionários internos OCS podem liberar/revogar.
        Toda alteração fica registrada na auditoria (<code>acl_audit_logs</code>).
      </p>
    </div>
  );
}
