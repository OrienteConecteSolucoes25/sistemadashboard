import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Palette, Save, RotateCcw, Eye, Sparkles, Building2, History, Image as ImageIcon, Upload, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { PRESET_LIST, THEME_PRESETS, ThemePresetKey, ThemeTokens, DEFAULT_PRESET } from "../lib/themePresets";
import { useCompanyTheme } from "../hooks/CompanyThemeProvider";

type Company = { id: string; name: string };

const COLOR_FIELDS: { key: keyof ThemeTokens; label: string; dbCol: string }[] = [
  { key: "primary",         label: "Primária",        dbCol: "primary_color" },
  { key: "secondary",       label: "Secundária",      dbCol: "secondary_color" },
  { key: "accent",          label: "Destaque",        dbCol: "accent_color" },
  { key: "background",      label: "Fundo",           dbCol: "background_color" },
  { key: "card",            label: "Superfície",      dbCol: "surface_color" },
  { key: "foreground",      label: "Texto",           dbCol: "text_color" },
  { key: "mutedForeground", label: "Texto suave",     dbCol: "muted_text_color" },
  { key: "border",          label: "Borda",           dbCol: "border_color" },
  { key: "success",         label: "Sucesso",         dbCol: "success_color" },
  { key: "warn",            label: "Alerta",          dbCol: "warning_color" },
  { key: "destructive",     label: "Perigo",          dbCol: "danger_color" },
];

// Converte HSL "h s% l%" -> hex aproximado para o color picker (e vice-versa)
function hslStrToHex(s: string): string {
  const m = s.match(/^\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (!m) return "#888888";
  const h = +m[1] / 360, sat = +m[2] / 100, l = +m[3] / 100;
  const a = sat * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
function hexToHslStr(hex: string): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16) / 255;
  const g = parseInt(m.substring(2, 4), 16) / 255;
  const b = parseInt(m.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function ThemeStudioPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { previewTheme, previewBackground, reloadFromDb } = useCompanyTheme();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [preset, setPreset] = useState<ThemePresetKey>(DEFAULT_PRESET);
  const [overrides, setOverrides] = useState<Partial<Record<keyof ThemeTokens, string>>>({});
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgAlpha, setBgAlpha] = useState<number>(0.35);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [audit, setAudit] = useState<any[]>([]);

  const baseTokens = THEME_PRESETS[preset].tokens;
  const effective: ThemeTokens = useMemo(
    () => ({ ...baseTokens, ...(overrides as any) }),
    [baseTokens, overrides]
  );

  // Carrega empresas
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      const q = await (supabase as any).from("companies").select("id,name").order("name");
      setCompanies((q.data as Company[]) || []);
    })();
  }, [authLoading]);

  // Carrega tema da empresa selecionada
  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("company_theme_settings").select("*").eq("company_id", companyId).maybeSingle();
      if (data) {
        setPreset((data.theme_preset || DEFAULT_PRESET) as ThemePresetKey);
        const ov: any = {};
        COLOR_FIELDS.forEach(f => { if (data[f.dbCol]) ov[f.key] = data[f.dbCol]; });
        setOverrides(ov);
        setBgUrl(data.background_image_url ?? null);
        setBgAlpha(typeof data.background_overlay_alpha === "number" ? data.background_overlay_alpha : 0.35);
      } else {
        setPreset(DEFAULT_PRESET); setOverrides({});
        setBgUrl(null); setBgAlpha(0.35);
      }
      const { data: logs } = await (supabase as any)
        .from("theme_audit_logs").select("*")
        .eq("company_id", companyId).order("created_at", { ascending: false }).limit(20);
      setAudit(logs || []);
    })();
  }, [companyId]);

  // Aplica preview ao vivo (cores + fundo)
  useEffect(() => {
    previewTheme(preset, overrides as any);
  }, [preset, overrides, previewTheme]);
  useEffect(() => {
    previewBackground(bgUrl, bgAlpha);
  }, [bgUrl, bgAlpha, previewBackground]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/app" replace />;

  const handleSave = async () => {
    if (!companyId) { toast.error("Selecione uma empresa"); return; }
    setSaving(true);
    const { data: prev } = await (supabase as any)
      .from("company_theme_settings").select("*").eq("company_id", companyId).maybeSingle();

    const payload: any = {
      company_id: companyId, theme_preset: preset, is_active: true,
      background_image_url: bgUrl, background_overlay_alpha: bgAlpha,
    };
    COLOR_FIELDS.forEach(f => { payload[f.dbCol] = overrides[f.key] ?? null; });

    const { error } = prev
      ? await (supabase as any).from("company_theme_settings").update(payload).eq("company_id", companyId)
      : await (supabase as any).from("company_theme_settings").insert(payload);

    if (error) { toast.error("Erro ao salvar: " + error.message); setSaving(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).from("theme_audit_logs").insert({
      company_id: companyId,
      user_id: user?.id ?? null,
      action_type: prev ? "update" : "create",
      before_data: prev ?? null,
      after_data: payload,
    });

    toast.success("Tema salvo e aplicado!");
    setSaving(false);
    await reloadFromDb();
  };

  const handleUploadBg = async (file: File) => {
    if (!companyId) { toast.error("Selecione uma empresa primeiro"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${companyId}/bg-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("company-wallpapers").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro no upload: " + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("company-wallpapers").getPublicUrl(path);
    setBgUrl(data.publicUrl);
    setUploading(false);
    toast.success("Imagem aplicada — clique em Salvar para persistir");
  };

  const handleReset = () => {
    setPreset(DEFAULT_PRESET); setOverrides({});
    setBgUrl(null); setBgAlpha(0.35);
    toast.message("Restaurado para o padrão OCS (Glassmorphism)");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display flex items-center gap-2">
            <Palette className="w-7 h-7 text-primary" />
            Aparência & Marca OCS
          </h1>
          <p className="text-muted-foreground text-sm">
            Personalize visualmente o ERP por empresa — temas, cores, fontes e estilo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />Restaurar padrão</Button>
          <Button onClick={handleSave} disabled={saving || !companyId}>
            <Save className="w-4 h-4 mr-2" /> {saving ? "Salvando..." : "Salvar tema"}
          </Button>
        </div>
      </div>

      {/* Seletor de empresa */}
      <Card className="card-elegant">
        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 min-w-0">
            <Label className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4" /> Empresa</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger><SelectValue placeholder="Selecione uma empresa" /></SelectTrigger>
              <SelectContent>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {companyId && (
            <Badge variant="outline" className="text-sm">
              Tema atual: <strong className="ml-1">{THEME_PRESETS[preset].label}</strong>
            </Badge>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="presets">
        <TabsList>
          <TabsTrigger value="presets"><Sparkles className="w-4 h-4 mr-1" />Presets</TabsTrigger>
          <TabsTrigger value="cores">Cores</TabsTrigger>
          <TabsTrigger value="fundo"><ImageIcon className="w-4 h-4 mr-1" />Fundo</TabsTrigger>
          <TabsTrigger value="preview"><Eye className="w-4 h-4 mr-1" />Preview</TabsTrigger>
          <TabsTrigger value="auditoria"><History className="w-4 h-4 mr-1" />Auditoria</TabsTrigger>
        </TabsList>

        {/* PRESETS */}
        <TabsContent value="presets" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRESET_LIST.map(p => {
              const t = p.tokens;
              const active = preset === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => { setPreset(p.key); setOverrides({}); }}
                  className={`text-left rounded-lg border-2 transition-all overflow-hidden ${
                    active ? "border-primary shadow-elegant" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div
                    className="h-24 relative"
                    style={{
                      background: t.bgGradient ?? `hsl(${t.background})`,
                    }}
                  >
                    <div className="absolute inset-3 flex gap-2">
                      <span className="w-8 h-8 rounded-full" style={{ background: `hsl(${t.primary})` }} />
                      <span className="w-8 h-8 rounded-full" style={{ background: `hsl(${t.accent})` }} />
                      <span className="w-8 h-8 rounded-full" style={{ background: `hsl(${t.secondary})` }} />
                    </div>
                  </div>
                  <div className="p-3 bg-card">
                    <div className="font-display font-semibold flex items-center justify-between">
                      {p.label}
                      {active && <Badge className="text-xs">Ativo</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </TabsContent>

        {/* CORES */}
        <TabsContent value="cores" className="mt-4">
          <Card className="card-elegant">
            <CardHeader><CardTitle className="text-lg">Paleta de cores</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COLOR_FIELDS.map(f => {
                const current = (overrides[f.key] as string) || (baseTokens[f.key] as string);
                const hex = hslStrToHex(current);
                return (
                  <div key={f.key as string} className="space-y-1">
                    <Label className="text-xs">{f.label}</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={hex}
                        onChange={e => setOverrides(o => ({ ...o, [f.key]: hexToHslStr(e.target.value) }))}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={current}
                        onChange={e => setOverrides(o => ({ ...o, [f.key]: e.target.value }))}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREVIEW */}
        <TabsContent value="preview" className="mt-4">
          <ThemePreviewPanel tokens={effective} />
        </TabsContent>

        {/* AUDITORIA */}
        <TabsContent value="auditoria" className="mt-4">
          <Card className="card-elegant">
            <CardHeader><CardTitle className="text-lg">Histórico de alterações</CardTitle></CardHeader>
            <CardContent>
              {audit.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma alteração registrada.</p>}
              <div className="space-y-2">
                {audit.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm border-b py-2">
                    <div>
                      <Badge variant="outline" className="mr-2">{a.action_type}</Badge>
                      <span className="font-mono text-xs">{a.after_data?.theme_preset}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ThemePreviewPanel({ tokens }: { tokens: ThemeTokens }) {
  // Renderiza com tokens "ao vivo" — como já aplicamos via previewTheme, basta usar os componentes do app
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: "Receita", value: "R$ 184k", color: "kpi-teal" },
          { label: "Pendências", value: "12", color: "kpi-warn" },
          { label: "Atrasos", value: "3", color: "kpi-danger" },
        ].map(k => (
          <Card key={k.label} className={`card-elegant ${k.color}`}>
            <CardContent className="pt-6">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="text-3xl font-display mt-1">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="card-elegant">
        <CardHeader><CardTitle>Preview de componentes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Perigo</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>default</Badge>
            <Badge variant="secondary">secondary</Badge>
            <Badge variant="outline">outline</Badge>
            <Badge variant="destructive">destructive</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Campo de exemplo" />
            <Input placeholder="Outro campo" />
          </div>
          <div
            className="p-4 rounded-lg border"
            style={{
              background: `hsl(${tokens.card} / ${tokens.glassAlpha})`,
              backdropFilter: `blur(${tokens.glassBlur})`,
              WebkitBackdropFilter: `blur(${tokens.glassBlur})`,
            }}
          >
            <div className="font-display font-semibold">Card translúcido</div>
            <p className="text-sm text-muted-foreground">
              Reflete a intensidade de glass do tema selecionado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
