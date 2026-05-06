import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, ShieldAlert, RefreshCw } from "lucide-react";

interface AuditRow {
  id: string;
  acao: string;
  modulo: string | null;
  observacoes: string | null;
  user_id: string | null;
  payload: any;
  created_at: string;
}

const ACTIONS = ["soft_delete", "soft_delete_failed", "automation:notify", "automation:create_followup", "automation:link_scrc", "automation:site_autocreate"];

export default function EngRastreabilidadePage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [detail, setDetail] = useState<AuditRow | null>(null);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; email: string | null }>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("eng_auditoria")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data ?? []) as any);
    const userIds = Array.from(new Set((data ?? []).map((r: any) => r.user_id).filter(Boolean)));
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      const map: Record<string, any> = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = { full_name: p.full_name, email: p.email }; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const modulos = useMemo(() => Array.from(new Set(rows.map((r) => r.modulo).filter(Boolean))) as string[], [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (action !== "all" && r.acao !== action) return false;
      if (moduleFilter !== "all" && r.modulo !== moduleFilter) return false;
      if (!q) return true;
      const p = profiles[r.user_id ?? ""];
      const hay = [
        r.acao, r.modulo, r.observacoes,
        p?.full_name, p?.email,
        r.payload?.nome_entidade, r.payload?.entidade_tipo, r.payload?.entidade_id,
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, action, moduleFilter, profiles]);

  const isDelete = (a: string) => a === "soft_delete" || a === "soft_delete_failed";

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" /> Rastreabilidade da Engenharia
        </h2>
        <p className="text-xs text-muted-foreground">
          Histórico completo de exclusões, automações e eventos auditados.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar usuário, registro, módulo..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Módulo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            {modulos.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filtered.length} eventos</Badge>
        <Button size="sm" variant="outline" onClick={load} className="ml-auto">
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2">Data/Hora</th>
              <th className="text-left px-3 py-2">Usuário</th>
              <th className="text-left px-3 py-2">Módulo</th>
              <th className="text-left px-3 py-2">Registro</th>
              <th className="text-left px-3 py-2">Ação</th>
              <th className="text-left px-3 py-2">Motivo / Observação</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Nenhum evento.</td></tr>
            ) : filtered.map((r) => {
              const p = profiles[r.user_id ?? ""];
              return (
                <tr key={r.id} className="border-t hover:bg-accent/40 cursor-pointer" onClick={() => setDetail(r)}>
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2">{p?.full_name ?? p?.email ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-2">{r.modulo ?? "—"}</td>
                  <td className="px-3 py-2">{r.payload?.nome_entidade ?? r.payload?.entidade_id ?? "—"}</td>
                  <td className="px-3 py-2">
                    {isDelete(r.acao) ? (
                      <Badge variant={r.acao === "soft_delete" ? "destructive" : "secondary"}>
                        {r.acao === "soft_delete" ? "Excluído" : "Tentativa inválida"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{r.acao}</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 max-w-[280px] truncate">{r.observacoes ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetail(r); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhe do evento</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Data:</strong> {new Date(detail.created_at).toLocaleString("pt-BR")}</div>
                <div><strong>Ação:</strong> {detail.acao}</div>
                <div><strong>Módulo:</strong> {detail.modulo ?? "—"}</div>
                <div><strong>Usuário:</strong> {profiles[detail.user_id ?? ""]?.full_name ?? profiles[detail.user_id ?? ""]?.email ?? "—"}</div>
                <div className="col-span-2"><strong>Motivo:</strong> {detail.observacoes ?? "—"}</div>
              </div>
              <div>
                <div className="font-semibold mb-1">Snapshot do registro</div>
                <pre className="bg-muted/50 p-3 rounded text-xs overflow-auto max-h-64">
{JSON.stringify(detail.payload?.dados_antes ?? detail.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
