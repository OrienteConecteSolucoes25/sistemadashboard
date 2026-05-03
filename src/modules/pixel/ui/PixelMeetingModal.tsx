import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { PixelCharacter, RoomLite } from "../data/usePixelWorkspaceData";
import type { usePixelMeetings } from "../data/usePixelMeetings";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: string | null;
  visibilityGroupId: string | null;
  rooms: RoomLite[];
  /** Personagens já carregados do workspace ativo (usuário comum). */
  workspaceCharacters: PixelCharacter[];
  meetings: ReturnType<typeof usePixelMeetings>;
  /** Personagem pré-selecionado (vindo do botão "Chamar para reunião"). */
  preselectUserId?: string | null;
}

interface InvitableUser {
  user_id: string;
  display_name: string | null;
  visibility_group_id: string | null;
}

export const PixelMeetingModal = ({
  open,
  onOpenChange,
  workspaceId,
  visibilityGroupId,
  rooms,
  workspaceCharacters,
  meetings,
  preselectUserId,
}: Props) => {
  const { user, isAdmin } = useAuth();
  const [title, setTitle] = useState("Reunião rápida");
  const [description, setDescription] = useState("");
  const [roomId, setRoomId] = useState<string>("none");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [adminUsers, setAdminUsers] = useState<InvitableUser[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Reset ao abrir + preselect
  useEffect(() => {
    if (!open) return;
    setTitle("Reunião rápida");
    setDescription("");
    setRoomId(rooms[0]?.id ?? "none");
    setSelectedIds(new Set(preselectUserId ? [preselectUserId] : []));
  }, [open, preselectUserId, rooms]);

  // Admin: carregar todos os perfis para poder convidar de qualquer grupo
  useEffect(() => {
    if (!open || !isAdmin) return;
    (async () => {
      const { data } = await supabase
        .from("pixel_profiles")
        .select("user_id, display_name, visibility_group_id")
        .eq("is_visible", true)
        .eq("is_blocked", false);
      setAdminUsers((data ?? []) as InvitableUser[]);
    })();
  }, [open, isAdmin]);

  const candidates: InvitableUser[] = useMemo(() => {
    const base = isAdmin
      ? adminUsers
      : workspaceCharacters.map((c) => ({
          user_id: c.user_id,
          display_name: c.display_name,
          visibility_group_id: visibilityGroupId,
        }));
    return base.filter((u) => u.user_id !== user?.id);
  }, [isAdmin, adminUsers, workspaceCharacters, user?.id, visibilityGroupId]);

  const toggle = (uid: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });

  const handleCreate = async () => {
    if (!workspaceId) return;
    if (!title.trim()) {
      toast.error("Informe um título");
      return;
    }
    setSubmitting(true);
    try {
      await meetings.createMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        roomId: roomId === "none" ? null : roomId,
        participantUserIds: Array.from(selectedIds),
      });
      toast.success("Reunião criada", {
        description: `${selectedIds.size} convite(s) enviados.`,
      });
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Falha ao criar reunião", { description: e?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova reunião</DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Como admin, você pode convidar qualquer usuário."
              : "Selecione participantes do seu grupo."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="meet-title">Título</Label>
            <Input id="meet-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meet-desc">Descrição (opcional)</Label>
            <Textarea
              id="meet-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Sala</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma sala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem sala específica</SelectItem>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Participantes ({selectedIds.size})</Label>
            <ScrollArea className="h-44 rounded border">
              <div className="p-2 space-y-1">
                {candidates.length === 0 && (
                  <p className="text-sm text-muted-foreground p-2">Sem usuários disponíveis.</p>
                )}
                {candidates.map((u) => (
                  <label
                    key={u.user_id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedIds.has(u.user_id)}
                      onCheckedChange={() => toggle(u.user_id)}
                    />
                    <span className="flex-1 truncate text-sm">{u.display_name ?? u.user_id}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting ? "Criando…" : "Criar reunião"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
