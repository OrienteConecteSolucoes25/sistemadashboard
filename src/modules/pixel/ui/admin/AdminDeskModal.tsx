import { useEffect, useState } from "react";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePixelAdminLog } from "../../data/usePixelAdminLog";
import type {
  AdminDeskRow,
  AdminWorkspaceRow,
  AdminCharacterRow,
} from "../../data/usePixelAdminData";
import {
  STAGE_HEIGHT_TILES,
  STAGE_WIDTH_TILES,
} from "../../core/constants";

const deskSchema = z.object({
  desk_name: z.string().trim().min(1).max(60),
  desk_type: z.string().trim().min(1).max(20),
  workspace_id: z.string().uuid(),
  position_x: z
    .number()
    .int()
    .min(0)
    .max(STAGE_WIDTH_TILES - 2),
  position_y: z
    .number()
    .int()
    .min(0)
    .max(STAGE_HEIGHT_TILES - 2),
  user_id: z.string().uuid().nullable(),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  desk: AdminDeskRow | null;
  workspaces: AdminWorkspaceRow[];
  characters: AdminCharacterRow[];
  onSaved: () => void;
}

export const AdminDeskModal = ({
  open,
  onOpenChange,
  desk,
  workspaces,
  characters,
  onSaved,
}: Props) => {
  const { log } = usePixelAdminLog();
  const [form, setForm] = useState({
    desk_name: "",
    desk_type: "standard",
    workspace_id: workspaces[0]?.id ?? "",
    position_x: 2,
    position_y: 2,
    user_id: null as string | null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (desk) {
      setForm({
        desk_name: desk.desk_name ?? "",
        desk_type: desk.desk_type,
        workspace_id: desk.workspace_id,
        position_x: desk.position_x,
        position_y: desk.position_y,
        user_id: desk.user_id,
      });
    } else {
      setForm({
        desk_name: "",
        desk_type: "standard",
        workspace_id: workspaces[0]?.id ?? "",
        position_x: 2,
        position_y: 2,
        user_id: null,
      });
    }
  }, [open, desk, workspaces]);

  const handleSave = async () => {
    const parsed = deskSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        desk_name: parsed.data.desk_name,
        desk_type: parsed.data.desk_type,
        workspace_id: parsed.data.workspace_id,
        position_x: parsed.data.position_x,
        position_y: parsed.data.position_y,
        user_id: parsed.data.user_id,
      };
      if (desk) {
        const { error } = await supabase
          .from("pixel_desks")
          .update(payload)
          .eq("id", desk.id);
        if (error) throw error;
        await log("update_desk", {
          description: `Mesa ${payload.desk_name}`,
          metadata: { desk_id: desk.id, ...payload },
        });
      } else {
        const { error } = await supabase.from("pixel_desks").insert(payload);
        if (error) throw error;
        await log("create_desk", {
          description: `Mesa ${payload.desk_name}`,
          metadata: payload,
        });
      }
      toast.success("Mesa salva");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Falha ao salvar mesa", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{desk ? "Editar mesa" : "Nova mesa"}</DialogTitle>
          <DialogDescription>Posição em tiles dentro do workspace.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={form.desk_name}
              onChange={(e) => setForm({ ...form, desk_name: e.target.value })}
              maxLength={60}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Input
                value={form.desk_type}
                onChange={(e) => setForm({ ...form, desk_type: e.target.value })}
                maxLength={20}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Workspace</Label>
              <Select
                value={form.workspace_id}
                onValueChange={(v) => setForm({ ...form, workspace_id: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Posição X (0–{STAGE_WIDTH_TILES - 2})</Label>
              <Input
                type="number"
                value={form.position_x}
                onChange={(e) =>
                  setForm({ ...form, position_x: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Posição Y (0–{STAGE_HEIGHT_TILES - 2})</Label>
              <Input
                type="number"
                value={form.position_y}
                onChange={(e) =>
                  setForm({ ...form, position_y: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Dono</Label>
            <Select
              value={form.user_id ?? "none"}
              onValueChange={(v) => setForm({ ...form, user_id: v === "none" ? null : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem dono</SelectItem>
                {characters.map((c) => (
                  <SelectItem key={c.user_id} value={c.user_id}>
                    {c.display_name ?? c.user_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
