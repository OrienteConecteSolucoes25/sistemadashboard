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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePixelAdminLog } from "../data/usePixelAdminLog";
import type {
  AdminCharacterRow,
  AdminDeskRow,
  AdminGroupRow,
} from "../data/usePixelAdminData";
import { STATUS_LABEL, type PixelStatus } from "../core/constants";

const editSchema = z.object({
  display_name: z.string().trim().min(1, "Nome obrigatório").max(80),
  job_title: z.string().trim().max(80).optional().nullable(),
  department: z.string().trim().max(80).optional().nullable(),
  sector_description: z.string().trim().max(500).optional().nullable(),
  visibility_group_id: z.string().uuid().nullable(),
  status: z.string().max(20),
  is_visible: z.boolean(),
  is_blocked: z.boolean(),
  desk_id: z.string().uuid().nullable(),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  character: AdminCharacterRow | null;
  groups: AdminGroupRow[];
  desks: AdminDeskRow[];
  onSaved: () => void;
}

const STATUSES: PixelStatus[] = ["online", "offline", "working", "meeting", "away", "busy"];

export const AdminCharacterEditModal = ({
  open,
  onOpenChange,
  character,
  groups,
  desks,
  onSaved,
}: Props) => {
  const { log } = usePixelAdminLog();
  const [form, setForm] = useState({
    display_name: "",
    job_title: "",
    department: "",
    sector_description: "",
    visibility_group_id: null as string | null,
    status: "offline",
    is_visible: true,
    is_blocked: false,
    desk_id: null as string | null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!character) return;
    setForm({
      display_name: character.display_name ?? "",
      job_title: character.job_title ?? "",
      department: character.department ?? "",
      sector_description: "",
      visibility_group_id: character.visibility_group_id,
      status: character.status,
      is_visible: character.is_visible,
      is_blocked: character.is_blocked,
      desk_id: character.desk_id ?? null,
    });
  }, [character]);

  const handleSave = async () => {
    if (!character) return;
    const parsed = editSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      // 1) Atualizar perfil
      const { error: pErr } = await supabase
        .from("pixel_profiles")
        .update({
          display_name: parsed.data.display_name,
          job_title: parsed.data.job_title || null,
          department: parsed.data.department || null,
          sector_description: parsed.data.sector_description || null,
          visibility_group_id: parsed.data.visibility_group_id,
          status: parsed.data.status,
          is_visible: parsed.data.is_visible,
          is_blocked: parsed.data.is_blocked,
        })
        .eq("user_id", character.user_id);
      if (pErr) throw pErr;

      // 2) Atribuir/remover mesa
      if (parsed.data.desk_id !== character.desk_id) {
        // libera mesa antiga se houver
        if (character.desk_id) {
          await supabase
            .from("pixel_desks")
            .update({ user_id: null })
            .eq("id", character.desk_id);
        }
        if (parsed.data.desk_id) {
          await supabase
            .from("pixel_desks")
            .update({ user_id: character.user_id })
            .eq("id", parsed.data.desk_id);
        }
      }

      await log("update_character", {
        target_user_id: character.user_id,
        description: `Editou perfil de ${parsed.data.display_name}`,
        metadata: parsed.data,
      });

      toast.success("Personagem atualizado");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Falha ao salvar", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  // Mesas disponíveis: livres + a do próprio usuário
  const availableDesks = desks.filter(
    (d) => d.is_active && (!d.user_id || d.user_id === character?.user_id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar personagem</DialogTitle>
          <DialogDescription>{character?.display_name ?? "—"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome de exibição</Label>
            <Input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              maxLength={80}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Input
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Setor</Label>
              <Input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                maxLength={80}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descrição do setor</Label>
            <Textarea
              rows={2}
              maxLength={500}
              value={form.sector_description}
              onChange={(e) => setForm({ ...form, sector_description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Grupo</Label>
              <Select
                value={form.visibility_group_id ?? "none"}
                onValueChange={(v) =>
                  setForm({ ...form, visibility_group_id: v === "none" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem grupo</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Mesa atribuída</Label>
            <Select
              value={form.desk_id ?? "none"}
              onValueChange={(v) => setForm({ ...form, desk_id: v === "none" ? null : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem mesa</SelectItem>
                {availableDesks.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.desk_name ?? d.id.slice(0, 6)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center justify-between rounded-md border p-2">
              <Label className="cursor-pointer">Ativo (visível)</Label>
              <Switch
                checked={form.is_visible}
                onCheckedChange={(v) => setForm({ ...form, is_visible: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-2">
              <Label className="cursor-pointer">Bloqueado</Label>
              <Switch
                checked={form.is_blocked}
                onCheckedChange={(v) => setForm({ ...form, is_blocked: v })}
              />
            </div>
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
