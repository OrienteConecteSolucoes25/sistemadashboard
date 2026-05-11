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
import { Lock, Search, UserCircle2, ChevronRight } from "lucide-react";
import { useIsInternalOcs } from "@/acl/AclProvider";
import { MODULES, DEFAULT_TAB_ACTIONS, buildCatalog, type TabDef, type SubTabDef } from "@/acl/catalog";

const sb: any = supabase;

type Profile = { id: string; email: string | null; full_name: string | null };

type Props = {
  /** Quando definido, todas as permissões salvas são vinculadas a essa empresa. Vazio = global. */
  companyId?: string | null;
};

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

const ACTION_ORDER = [
  "acessar","visualizar","editar","excluir","criar","aprovar","gerenciar","exportar","importar","publicar","financeiro",
];

function sortActions(actions: string[]) {
  return [...actions].sort((a, b) => {
    const ia = ACTION_ORDER.indexOf(a);
    const ib = ACTION_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

/**
 * Formulário de permissões hierárquico.
 *
 * Layout: Módulo → Acessar | Aba(s) → Sub-aba(s).
 * A estrutura é renderizada diretamente a partir de `MODULES` em
 * `src/acl/catalog.ts`, garantindo que toda nova aba/sub-aba apareça
 * automaticamente na tela após o sync do catálogo.
 */
export default function AclPermissionsForm({ companyId }: Props) {
  const isInternal = useIsInternalOcs();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Map<string, boolean>>(new Map());
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Catálogo esperado pelo código (fonte da verdade do layout)
  const expectedKeys = useMemo(() => new Set(buildCatalog().map(c => c.key)), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: profs } = await sb
        .from("profiles")
        .select("id,email,full_name")
        .order("full_name", { nullsFirst: false });
      setProfiles(profs ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedUser) { setGranted(new Set()); setPending(new Map()); return; }
    (async () => {
      let q = sb.from("acl_user_permissions").select("permission_key,company_id").eq("user_id", selectedUser);
      q = companyId ? q.eq("company_id", companyId) : q.is("company_id", null);
      const { data } = await q;
      setGranted(new Set<string>((data ?? []).map((r: any) => r.permission_key)));
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
    let q = sb.from("acl_user_permissions").select("permission_key").eq("user_id", selectedUser);
    q = companyId ? q.eq("company_id", companyId) : q.is("company_id", null);
    const { data } = await q;
    setGranted(new Set<string>((data ?? []).map((r: any) => r.permission_key)));
    setPending(new Map());
  }

  // Helpers de filtro por texto (módulo / aba / sub-aba)
  function tabMatches(moduleLabel: string, t: TabDef): boolean {
    if (!filterLower) return true;
    if (moduleLabel.toLowerCase().includes(filterLower)) return true;
    if (t.label.toLowerCase().includes(filterLower)) return true;
    if (t.key.toLowerCase().includes(filterLower)) return true;
    if (t.subTabs?.some(st => st.label.toLowerCase().includes(filterLower) || st.key.toLowerCase().includes(filterLower))) return true;
    return false;
  }

  function ActionRow({ pkey, actions, label, indent = 0, hint }: { pkey: string; actions: string[]; label: string; indent?: number; hint?: string }) {
    const visibleActions = sortActions(actions).filter(a => expectedKeys.has(`${pkey}.${a}`));
    if (!visibleActions.length) return null;
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 py-2"
        style={{ paddingLeft: indent * 18 }}
      >
        <div className="min-w-[200px] flex items-center gap-1.5">
          {indent > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          <div>
            <div className="text-sm font-medium">{label}</div>
            {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {visibleActions.map(action => {
            const k = `${pkey}.${action}`;
            return (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={isOn(k)}
                  disabled={!isInternal}
                  onCheckedChange={(v) => toggle(k, !!v)}
                />
                <span className="text-sm">{ACTION_LABEL[action] ?? action}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
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

      {!selectedUser ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          Selecione um usuário acima para configurar suas permissões.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <Label className="text-xs">Filtrar módulo / aba / sub-aba</Label>
              <Input placeholder="ex.: crea, engenharia, obras…" value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Marque o que o usuário pode <strong>Acessar</strong>, <strong>Ver</strong>, <strong>Editar</strong> ou <strong>Excluir</strong>.
              Sub-abas aparecem indentadas abaixo da aba pai.
            </p>
          </div>

          <div className="space-y-3">
            {MODULES.map((m) => {
              const moduleKey = `${m.module}.acessar`;
              const matchesModule = !filterLower || m.label.toLowerCase().includes(filterLower) || m.module.toLowerCase().includes(filterLower);
              const visibleTabs = m.tabs.filter(t => matchesModule || tabMatches(m.label, t));
              if (!matchesModule && !visibleTabs.length) return null;

              // Conta grants ativos no módulo
              let grantCount = 0;
              if (isOn(moduleKey)) grantCount++;
              for (const t of m.tabs) {
                for (const a of (t.actions ?? DEFAULT_TAB_ACTIONS)) {
                  if (isOn(`${m.module}.${t.key}.${a}`)) grantCount++;
                }
                for (const st of t.subTabs ?? []) {
                  for (const a of (st.actions ?? DEFAULT_TAB_ACTIONS)) {
                    if (isOn(`${m.module}.${t.key}.${st.key}.${a}`)) grantCount++;
                  }
                }
              }

              return (
                <Card key={m.module}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{m.label} <span className="text-muted-foreground font-normal">({m.module})</span></span>
                      <Badge variant={grantCount ? "default" : "secondary"}>
                        {grantCount} ativa{grantCount === 1 ? "" : "s"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 divide-y">
                    {/* Acessar módulo */}
                    <ActionRow
                      pkey={m.module}
                      actions={["acessar"]}
                      label="Acesso ao módulo"
                      hint={m.tabs.length === 0 ? "Módulo sem abas declaradas — apenas o acesso geral é configurável." : undefined}
                    />
                    {/* Abas */}
                    {visibleTabs.map((t) => (
                      <div key={t.key}>
                        <ActionRow
                          pkey={`${m.module}.${t.key}`}
                          actions={t.actions ?? DEFAULT_TAB_ACTIONS}
                          label={t.label}
                        />
                        {(t.subTabs ?? []).map((st: SubTabDef) => (
                          <ActionRow
                            key={st.key}
                            pkey={`${m.module}.${t.key}.${st.key}`}
                            actions={st.actions ?? DEFAULT_TAB_ACTIONS}
                            label={st.label}
                            indent={1}
                          />
                        ))}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <p className="text-[11px] text-muted-foreground">
        Modelo central de permissões (ADM &gt; Visibilidade). A estrutura (módulos, abas e sub-abas) é lida de
        <code> src/acl/catalog.ts</code> — basta sincronizar o catálogo para qualquer item novo aparecer aqui.
        Apenas funcionários internos OCS podem alterar. Toda alteração fica registrada em <code>acl_audit_logs</code>.
      </p>
    </div>
  );
}
