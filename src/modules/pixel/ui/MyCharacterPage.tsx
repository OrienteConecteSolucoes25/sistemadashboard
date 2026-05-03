import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AVATAR_SPRITES } from "../core/sprites";
import { AvatarBuilder } from "./AvatarBuilder";
import {
  AVATAR_CUSTOMIZATION_COLUMNS,
  customizationFromProfile,
} from "../core/avatarMapping";
import { DEFAULT_CUSTOMIZATION, type AvatarCustomization } from "../core/avatarOptions";

const STATUS_OPTIONS = ["online", "offline", "working", "meeting", "away", "busy"] as const;

const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Nome obrigatório").max(80),
  job_title: z.string().trim().max(120).optional().or(z.literal("")),
  age: z
    .union([z.number().int().min(14, "Mínimo 14").max(120, "Máximo 120"), z.nan()])
    .optional(),
  show_age: z.boolean(),
  linkedin_url: z
    .string()
    .trim()
    .max(255)
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(v),
      "URL do LinkedIn inválida (ex.: https://linkedin.com/in/seu-perfil)",
    ),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  sector_description: z.string().trim().max(500).optional().or(z.literal("")),
  avatar_sprite_key: z.string().min(1, "Escolha um avatar"),
  status: z.enum(STATUS_OPTIONS),
});

type ProfileForm = z.infer<typeof profileSchema>;

const emptyForm: ProfileForm = {
  display_name: "",
  job_title: "",
  age: undefined,
  show_age: false,
  linkedin_url: "",
  department: "",
  sector_description: "",
  avatar_sprite_key: AVATAR_SPRITES[0]?.key ?? "",
  status: "online",
};

export default function MyCharacterPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carrega ou cria pixel_profile
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: existing, error } = await supabase
        .from("pixel_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        toast.error("Erro ao carregar perfil: " + error.message);
        setLoading(false);
        return;
      }

      if (existing) {
        setForm({
          display_name: existing.display_name ?? "",
          job_title: existing.job_title ?? "",
          age: existing.age ?? undefined,
          show_age: existing.show_age ?? false,
          linkedin_url: existing.linkedin_url ?? "",
          department: existing.department ?? "",
          sector_description: existing.sector_description ?? "",
          avatar_sprite_key: existing.avatar_sprite_key ?? AVATAR_SPRITES[0]?.key ?? "",
          status: (existing.status as ProfileForm["status"]) ?? "online",
        });
        setLoading(false);
        return;
      }

      // Cria perfil básico vinculado ao primeiro grupo do usuário (se houver)
      const { data: groups } = await supabase
        .from("user_visibility_groups")
        .select("group_id")
        .eq("user_id", user.id)
        .limit(1);
      const groupId = groups?.[0]?.group_id ?? null;

      const { error: insErr } = await supabase.from("pixel_profiles").insert({
        user_id: user.id,
        visibility_group_id: groupId,
        display_name: user.email?.split("@")[0] ?? "Usuário",
        avatar_sprite_key: AVATAR_SPRITES[0]?.key ?? null,
        status: "online",
      });
      if (insErr) toast.error("Não foi possível criar o perfil: " + insErr.message);

      if (!cancelled) {
        setForm({
          ...emptyForm,
          display_name: user.email?.split("@")[0] ?? "Usuário",
        });
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const setField = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const previewSprite = useMemo(
    () => AVATAR_SPRITES.find((s) => s.key === form.avatar_sprite_key) ?? AVATAR_SPRITES[0],
    [form.avatar_sprite_key],
  );

  const handleSave = async () => {
    if (!user) return;
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path.join(".")] = i.message;
      });
      setErrors(errs);
      toast.error("Corrija os campos destacados");
      return;
    }
    setErrors({});
    setSaving(true);
    const v = parsed.data;
    const { error } = await supabase
      .from("pixel_profiles")
      .update({
        display_name: v.display_name,
        job_title: v.job_title || null,
        age: v.age && !Number.isNaN(v.age) ? v.age : null,
        show_age: v.show_age,
        linkedin_url: v.linkedin_url || null,
        department: v.department || null,
        sector_description: v.sector_description || null,
        avatar_sprite_key: v.avatar_sprite_key,
        status: v.status,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Perfil salvo");
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Personagem</h1>
        <p className="text-sm text-muted-foreground">
          Configure como você aparece no Pixel Office.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Preview + Avatar Picker */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>Escolha seu personagem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <PixelSprite spriteKey={previewSprite?.key} size={160} />
            </div>
            <div className="text-center text-sm font-medium">{previewSprite?.label}</div>
            <div className="grid grid-cols-3 gap-2">
              {AVATAR_SPRITES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setField("avatar_sprite_key", s.key)}
                  className={`flex items-center justify-center p-2 rounded-md border transition-colors ${
                    form.avatar_sprite_key === s.key
                      ? "border-primary bg-accent"
                      : "border-border hover:bg-accent"
                  }`}
                  aria-label={s.label}
                >
                  <PixelSprite spriteKey={s.key} size={48} />
                </button>
              ))}
            </div>
            {errors.avatar_sprite_key && (
              <p className="text-xs text-destructive">{errors.avatar_sprite_key}</p>
            )}
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Personagem</CardTitle>
            <CardDescription>Visíveis para os colegas do seu grupo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display_name">Nome de exibição *</Label>
                <Input
                  id="display_name"
                  value={form.display_name}
                  onChange={(e) => setField("display_name", e.target.value)}
                  maxLength={80}
                />
                {errors.display_name && (
                  <p className="text-xs text-destructive mt-1">{errors.display_name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="job_title">Cargo</Label>
                <Input
                  id="job_title"
                  value={form.job_title}
                  onChange={(e) => setField("job_title", e.target.value)}
                  maxLength={120}
                />
              </div>

              <div>
                <Label htmlFor="department">Setor</Label>
                <Input
                  id="department"
                  value={form.department}
                  onChange={(e) => setField("department", e.target.value)}
                  maxLength={120}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v as any)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="age">Idade (opcional)</Label>
                <Input
                  id="age"
                  type="number"
                  min={14}
                  max={120}
                  value={form.age ?? ""}
                  onChange={(e) =>
                    setField("age", e.target.value === "" ? undefined : Number(e.target.value))
                  }
                />
                {errors.age && <p className="text-xs text-destructive mt-1">{errors.age}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    id="show_age"
                    checked={form.show_age}
                    onCheckedChange={(v) => setField("show_age", v)}
                  />
                  <Label htmlFor="show_age" className="text-sm font-normal cursor-pointer">
                    Mostrar idade para os colegas
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="linkedin_url">LinkedIn</Label>
                <Input
                  id="linkedin_url"
                  placeholder="https://linkedin.com/in/seu-perfil"
                  value={form.linkedin_url}
                  onChange={(e) => setField("linkedin_url", e.target.value)}
                  maxLength={255}
                />
                {errors.linkedin_url && (
                  <p className="text-xs text-destructive mt-1">{errors.linkedin_url}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="sector_description">O que você faz no setor</Label>
              <Textarea
                id="sector_description"
                rows={4}
                maxLength={500}
                value={form.sector_description}
                onChange={(e) => setField("sector_description", e.target.value)}
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {form.sector_description?.length ?? 0}/500
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
