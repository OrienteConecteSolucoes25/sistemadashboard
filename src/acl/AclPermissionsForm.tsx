import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lock, Search, UserCircle2 } from "lucide-react";
import { useIsInternalOcs } from "@/acl/AclProvider";

const sb: any = supabase;

type CatalogRow = {
  key: string;
  module: string;
  resource: string;
  action: string;
  label: string;
  description?: string | null;
  ordem: number;
};
type Profile = { id: string; email: string | null; full_name: string | null };

type Props = {
  /** Quando definido, todas as permissões salvas são vinculadas a essa empresa. Vazio = global. */
  companyId?: string | null;
};

/** Rótulo amigável por ação (PT-BR). */
const ACTION_LABEL: Record<string, string> = {
  visualizar: "Ver",
  editar: "Editar",
  excluir: "Excluir",
  acessar: "Acessar",
  criar: "Criar",
  aprovar: "Aprovar",
  gerenciar: "Gerenciar",
  exportar: "Exportar",
  importar: "Importar",
  publicar: "Publicar",
  financeiro: "Financeiro",
};

/** Ordem preferida das colunas. */
const ACTION_ORDER = [
  "acessar",
  "visualizar",
  "editar",
  "excluir",
  "criar",
  "aprovar",
  "gerenciar",
  "exportar",
  "importar",
  "publicar",
  "financeiro",
];

/**
 * Formulário de permissões: seleciona um usuário e marca por recurso quais ações ele
 * pode Ver / Editar / Excluir / etc. Substitui a matriz gigante anterior.
 */
export default function AclPermissionsForm({ companyId }: Props) {
  const isInternal = useIsInternalOcs();
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Map<string, boolean>>(new Map());
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carrega catálogo + usuários
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: cat }, { data: profs }] = await Promise.all([
        sb.from("acl_permissions_catalog").select("*").eq("ativo", true).order("module").order("ordem"),
        sb.from("profiles").select("id,email,full_name").order("full_name", { nullsFirst: false }),
      ]);
      setCatalog(cat ?? []);
      setProfiles(profs ?? []);
      setLoading(false);
    })();
  }, []);

  // Carrega permissões do usuário selecionado
  useEffect(() => {
    if (!selectedUser) { setGranted(new Set()); setPending(new Map()); return; }
    (async () => {
      let q = sb.from("acl_user_permissions").select("permission_key,company_id").eq("user_id", selectedUser);
      q = companyId ? q.eq("company_id", companyId) : q.is("company_id", null);
      const { data } = await q;
      const set = new Set<string>((data ?? []).map((r: any) => r.permission_key));
      setGranted(set);
      setPending(new Map());
    })();
  }, [selectedUser, companyId]);

  const filteredProfiles = useMemo(() => {
    const s = userSearch.trim().toLowerCase();
    if (!s) return profiles.slice(0, 50);
    return profiles
      .filter(p => (p.full_name ?? "").toLowerCase().includes(s) || (p.email ?? "").toLowerCase().includes(s))
      .slice(0, 50);
  }, [profiles, userSearch]);

  // Agrupa catálogo por módulo → recurso
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, CatalogRow[]>>();
    for (const c of catalog) {
      if (!map.has(c.module)) map.set(c.module, new Map());
      const sub = map.get(c.module)!;
      const resKey = c.resource || "_modulo";
      if (!sub.has(resKey)) sub.set(resKey, []);
      sub.get(resKey)!.push(c);
    }
    return map;
  }, [catalog]);

  const filterLower = filter.trim().toLowerCase();

  function isOn(key: string) {
    if (pending.has(key)) return pending.get(key)!;
    return granted.has(key);
  }
  function toggle(key: string, val: boolean) {
    const original = granted.has(key);
    const next = new Map(pending);
    if (val === original) next.delete(key); else next.set(key, val);
    setPending(next);
  }

  async function save() {
    if (!isInternal || !selectedUser) return;
    if (pending.size === 0) { toast.info("Nada a salvar"); return; }
    setSaving(true);
    let ok = 0, fail = 0;
    for (const [key, val] of pending.entries()) {
      const reason = val ? "Liberado via ADM > Visibilidade" : "Revogado via ADM > Visibilidade";
      const rpc = val ? "acl_grant" : "acl_revoke";
      const { data, error } = await sb.rpc(rpc, { _target: selectedUser, _company: companyId ?? null, _key: key, _reason: reason });
      if (error || (data && data.ok === false)) fail++; else ok++;
    }
    setSaving(false);
    toast[fail ? "warning" : "success"](`Permissões: ${ok} aplicadas${fail ? `, ${fail} falharam` : ""}`);
    // Recarrega
    let q = sb.from("acl_user_permissions").select("permission_key").eq("user_id", selectedUser);
    q = companyId ? q.eq("company_id", companyId) : q.is("company_id", null);
    const { data } = await q;
    setGranted(new Set<string>((data ?? []).map((r: any) => r.permission_key)));
    setPending(new Map());
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  const selectedProfile = profiles.find(p => p.id === selectedUser);

  return (
    <div className="space-y-4">
      {/* Seleção do usuário */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle2 className="w-4 h-4" /> Selecione o usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-7"
                  placeholder="nome ou e-mail…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Usuário</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger><SelectValue placeholder="Escolha um usuário…" /></SelectTrigger>
                <SelectContent>
                  {filteredProfiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {(p.full_name || p.email || p.id).toString()}
                      {p.full_name && p.email ? <span className="text-muted-foreground"> — {p.email}</span> : null}
                    </SelectItem>
                  ))}
                  {!filteredProfiles.length && <div className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum usuário</div>}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedProfile && (
            <div className="flex items-center justify-between gap-3 pt-1 border-t">
              <div>
                <div className="text-sm font-medium">{selectedProfile.full_name || selectedProfile.email}</div>
                <div className="text-xs text-muted-foreground">{selectedProfile.email}</div>
              </div>
              <div className="flex items-center gap-2">
                {!isInternal && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3" /> somente leitura
                  </span>
                )}
                <Button onClick={save} disabled={!isInternal || saving || pending.size === 0}>
                  {saving ? "Salvando…" : `Salvar (${pending.size})`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário de permissões */}
      {!selectedUser ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          Selecione um usuário acima para configurar suas permissões.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <Label className="text-xs">Filtrar permissão / módulo</Label>
              <Input placeholder="ex.: engenharia, obras, jurídico…" value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Marque o que o usuário pode <strong>Ver</strong>, <strong>Editar</strong>, <strong>Excluir</strong> ou <strong>Acessar</strong>.
              Itens desmarcados ficam negados (Não).
            </p>
          </div>

          <div className="space-y-3">
            {Array.from(grouped.entries()).map(([module, resources]) => {
              // Filtrar dentro do módulo
              const visibleResources = Array.from(resources.entries()).filter(([resKey, rows]) => {
                if (!filterLower) return true;
                if (module.toLowerCase().includes(filterLower)) return true;
                if (resKey.toLowerCase().includes(filterLower)) return true;
                return rows.some(r => r.label.toLowerCase().includes(filterLower) || r.key.toLowerCase().includes(filterLower));
              });
              if (!visibleResources.length) return null;

              const moduleGrants = visibleResources.flatMap(([, rows]) => rows).filter(r => isOn(r.key)).length;

              return (
                <Card key={module}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="capitalize">{module}</span>
                      <Badge variant={moduleGrants ? "default" : "secondary"}>
                        {moduleGrants} ativa{moduleGrants === 1 ? "" : "s"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 divide-y">
                    {visibleResources.map(([resKey, rows]) => {
                      // Ordena ações conforme ACTION_ORDER
                      const sorted = [...rows].sort((a, b) => {
                        const ia = ACTION_ORDER.indexOf(a.action);
                        const ib = ACTION_ORDER.indexOf(b.action);
                        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                      });
                      const resourceLabel = resKey === "_modulo" ? "Acesso ao módulo" : resKey;
                      return (
                        <div key={`${module}-${resKey}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                          <div className="min-w-[180px]">
                            <div className="text-sm font-medium capitalize">{resourceLabel.replace(/_/g, " ")}</div>
                            {sorted[0]?.description && (
                              <div className="text-xs text-muted-foreground">{sorted[0].description}</div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4">
                            {sorted.map(c => (
                              <label key={c.key} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={isOn(c.key)}
                                  disabled={!isInternal}
                                  onCheckedChange={(v) => toggle(c.key, !!v)}
                                />
                                <span className="text-sm">{ACTION_LABEL[c.action] ?? c.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <p className="text-[11px] text-muted-foreground">
        Modelo central de permissões (ADM &gt; Visibilidade). Apenas funcionários internos OCS podem alterar.
        Toda alteração fica registrada na auditoria (<code>acl_audit_logs</code>).
      </p>
    </div>
  );
}
