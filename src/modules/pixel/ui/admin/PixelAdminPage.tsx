import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Pencil,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Activity,
  Users,
  Briefcase,
  Video,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  usePixelAdminData,
  type AdminCharacterRow,
  type AdminDeskRow,
} from "../../data/usePixelAdminData";
import { usePixelAdminLog } from "../../data/usePixelAdminLog";
import { STATUS_COLOR, STATUS_LABEL, type PixelStatus } from "../../core/constants";
import { PixelSprite } from "../../renderer/PixelSprite";
import { AdminCharacterEditModal } from "./AdminCharacterEditModal";
import { AdminDeskModal } from "./AdminDeskModal";

export default function PixelAdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { log } = usePixelAdminLog();
  const data = usePixelAdminData();

  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editChar, setEditChar] = useState<AdminCharacterRow | null>(null);
  const [editDesk, setEditDesk] = useState<AdminDeskRow | null>(null);
  const [deskModalOpen, setDeskModalOpen] = useState(false);

  // ----- Bloqueio de acesso (frontend); RLS protege no backend -----
  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/app" replace />;

  const filtered = useMemo(() => {
    return data.characters.filter((c) => {
      if (filterGroup !== "all" && c.visibility_group_id !== filterGroup) return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${c.display_name ?? ""} ${c.job_title ?? ""} ${c.department ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [data.characters, filterGroup, filterStatus, search]);

  const stats = useMemo(() => {
    const active = data.characters.filter((c) => c.is_visible && !c.is_blocked).length;
    const online = data.characters.filter((c) => c.status === "online").length;
    const meeting = data.characters.filter((c) => c.status === "meeting").length;
    const working = data.characters.filter((c) => c.status === "working").length;
    return { active, online, meeting, working };
  }, [data.characters]);

  const toggleVisibility = async (c: AdminCharacterRow) => {
    const next = !c.is_visible;
    const { error } = await supabase
      .from("pixel_profiles")
      .update({ is_visible: next })
      .eq("user_id", c.user_id);
    if (error) return toast.error("Falha", { description: error.message });
    await log(next ? "activate_character" : "deactivate_character", {
      target_user_id: c.user_id,
    });
    toast.success(next ? "Personagem ativado" : "Personagem desativado");
    data.refresh();
  };

  const toggleBlock = async (c: AdminCharacterRow) => {
    const next = !c.is_blocked;
    const { error } = await supabase
      .from("pixel_profiles")
      .update({ is_blocked: next })
      .eq("user_id", c.user_id);
    if (error) return toast.error("Falha", { description: error.message });
    await log(next ? "block_character" : "unblock_character", {
      target_user_id: c.user_id,
    });
    toast.success(next ? "Personagem bloqueado" : "Personagem desbloqueado");
    data.refresh();
  };

  const moderateMessage = async (msgId: string) => {
    const { error } = await supabase
      .from("pixel_messages")
      .update({ is_deleted: true })
      .eq("id", msgId);
    if (error) return toast.error("Falha", { description: error.message });
    await log("moderate_message", { description: `Apagou mensagem ${msgId}` });
    toast.success("Mensagem moderada");
    data.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel Admin — Pixel Office</h1>
        <p className="text-sm text-muted-foreground">
          Gestão completa de personagens, mesas, reuniões e moderação.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Ativos" value={stats.active} icon={Users} />
        <StatCard label="Online" value={stats.online} icon={Activity} />
        <StatCard label="Em reunião" value={stats.meeting} icon={Video} />
        <StatCard label="Trabalhando" value={stats.working} icon={Briefcase} />
      </div>

      {/* Personagens */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Personagens ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-xs"
              placeholder="Buscar nome/cargo/setor"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos</SelectItem>
                {data.groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {(["online", "offline", "working", "meeting", "away", "busy"] as PixelStatus[]).map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const status = (c.status as PixelStatus) ?? "offline";
                  return (
                    <TableRow key={c.user_id}>
                      <TableCell>
                        <PixelSprite spriteKey={c.avatar_sprite_key} size={28} />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{c.display_name ?? "—"}</div>
                        {c.is_blocked && (
                          <Badge variant="destructive" className="text-[10px] h-4">
                            bloqueado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.job_title ?? "—"}
                        <div className="text-xs text-muted-foreground">{c.department ?? ""}</div>
                      </TableCell>
                      <TableCell>
                        {c.group_name ? (
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: c.group_color ?? undefined,
                              color: c.group_color ?? undefined,
                            }}
                          >
                            {c.group_name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: STATUS_COLOR[status] }}
                          />
                          {STATUS_LABEL[status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{c.desk_name ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Editar"
                            onClick={() => setEditChar(c)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title={c.is_visible ? "Desativar" : "Ativar"}
                            onClick={() => toggleVisibility(c)}
                          >
                            {c.is_visible ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title={c.is_blocked ? "Desbloquear" : "Bloquear"}
                            onClick={() => toggleBlock(c)}
                          >
                            {c.is_blocked ? (
                              <Unlock className="w-3.5 h-3.5" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      Nenhum personagem encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mesas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Mesas ({data.desks.length})
          </CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditDesk(null);
              setDeskModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Nova mesa
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Dono</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.desks.map((d) => {
                  const ws = data.workspaces.find((w) => w.id === d.workspace_id);
                  const owner = data.characters.find((c) => c.user_id === d.user_id);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.desk_name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{ws?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm font-mono">
                        {d.position_x}, {d.position_y}
                      </TableCell>
                      <TableCell className="text-sm">{owner?.display_name ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditDesk(d);
                            setDeskModalOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mensagens recentes para moderação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Mensagens recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 max-h-72 overflow-y-auto">
            {data.messages.map((m) => (
              <li
                key={m.id}
                className={`flex items-start gap-2 text-sm p-2 rounded ${
                  m.is_deleted ? "opacity-50 line-through" : "hover:bg-muted/40"
                }`}
              >
                <span className="font-medium min-w-[120px] truncate">
                  {m.sender_display_name ?? m.sender_user_id.slice(0, 6)}
                </span>
                <span className="flex-1 break-words">{m.message}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(m.created_at).toLocaleString("pt-BR")}
                </span>
                {!m.is_deleted && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => moderateMessage(m.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </li>
            ))}
            {data.messages.length === 0 && (
              <li className="text-sm text-muted-foreground py-4 text-center">
                Sem mensagens recentes.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logs administrativos (últimos 50)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.actions.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-sm">{a.admin_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{a.action_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.description ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {data.actions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      Nenhuma ação registrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AdminCharacterEditModal
        open={editChar !== null}
        onOpenChange={(v) => !v && setEditChar(null)}
        character={editChar}
        groups={data.groups}
        desks={data.desks}
        onSaved={data.refresh}
      />

      <AdminDeskModal
        open={deskModalOpen}
        onOpenChange={setDeskModalOpen}
        desk={editDesk}
        workspaces={data.workspaces}
        characters={data.characters}
        onSaved={data.refresh}
      />
    </div>
  );
}

const StatCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: any;
}) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 rounded-md bg-primary/15 text-primary">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </CardContent>
  </Card>
);
