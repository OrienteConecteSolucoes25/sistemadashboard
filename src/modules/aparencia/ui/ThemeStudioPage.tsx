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
import {
  Palette, Save, RotateCcw, Eye, Sparkles, Building2, History,
  Image as ImageIcon, Upload, X, BarChart3, AlertCircle
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { PRESET_LIST, THEME_PRESETS, ThemePresetKey, ThemeTokens, DEFAULT_PRESET } from "../lib/themePresets";
import { useCompanyTheme } from "../hooks/CompanyThemeProvider";
import { ColorField } from "./ColorField";
import { SaveThemeConfirmationDialog } from "./SaveThemeConfirmationDialog";
import { ChartPreferencesPanel } from "./ChartPreferencesPanel";
import { ThemePreviewPanel } from "./ThemePreviewPanel";

type ScopeKind = "system_global" | "owner_company" | "client_company";
type EnvOption = { id: string; name: string; scope: ScopeKind; companyId: string | null };

const SYSTEM_GLOBAL_ID = "__system_global__";
const SCOPE_LABEL: Record<ScopeKind, string> = {
  system_global: "Tema Global",
  owner_company: "Ambiente Interno OCS",
  client_company: "Cliente",
};

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

export default function ThemeStudioPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { previewTheme, previewBackground, reloadFromDb } = useCompanyTheme();

  const [environments, setEnvironments] = useState<EnvOption[]>([]);
  const [envId, setEnvId] = useState<string>("");
  const currentEnv = environments.find(e => e.id === envId);
  const companyId = currentEnv?.companyId ?? null;
  const scope: ScopeKind = currentEnv?.scope ?? "client_company";
  const companyName = currentEnv?.name ?? "";

  // Draft state
  const [preset, setPreset] = useState<ThemePresetKey>(DEFAULT_PRESET);
  const [overrides, setOverrides] = useState<Partial<Record<keyof ThemeTokens, string>>>({});
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgAlpha, setBgAlpha] = useState<number>(0.35);

  // Saved snapshot — para detectar diferenças e mostrar "antes"
  const [savedPreset, setSavedPreset] = useState<ThemePresetKey>(DEFAULT_PRESET);
  const [savedOverrides, setSavedOverrides] = useState<Partial<Record<keyof ThemeTokens, string>>>({});
  const [savedBgUrl, setSavedBgUrl] = useState<string | null>(null);
  const [savedBgAlpha, setSavedBgAlpha] = useState<number>(0.35);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [audit, setAudit] = useState<any[]>([]);
  const [chartsDirty, setChartsDirty] = useState(false);

  const baseTokens = THEME_PRESETS[preset].tokens;

  // Lista de ambientes (Global + OCS interno + clientes)
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      const q = await (supabase as any).from("companies").select("id,nome").order("nome");
      const raw = ((q.data as any[]) || []) as { id: string; nome: string }[];
      const isOcs = (n: string) => /erp\s*ocs|oriente\s*conecte/i.test(n);
      const owner = raw.find(c => isOcs(c.nome));
      const clients = raw.filter(c => !isOcs(c.nome)).sort((a, b) => a.nome.localeCompare(b.nome));

      const opts: EnvOption[] = [
        { id: SYSTEM_GLOBAL_ID, name: "ERP OCS — Tema Global", scope: "system_global", companyId: null },
      ];
      if (owner) {
        opts.push({ id: owner.id, name: `${owner.nome} — Ambiente Interno`, scope: "owner_company", companyId: owner.id });
      }
      clients.forEach(c => opts.push({ id: c.id, name: c.nome, scope: "client_company", companyId: c.id }));
      setEnvironments(opts);
    })();
  }, [authLoading]);

  // Carrega tema salvo do ambiente
  useEffect(() => {
    if (!envId) return;
    (async () => {
      const baseQ = (supabase as any).from("company_theme_settings").select("*");
      const q = scope === "system_global"
        ? baseQ.eq("scope", "system_global").is("company_id", null)
        : baseQ.eq("company_id", companyId);
      const { data } = await q.maybeSingle();

      const p = (data?.theme_preset || DEFAULT_PRESET) as ThemePresetKey;
      const ov: any = {};
      if (data) COLOR_FIELDS.forEach(f => { if (data[f.dbCol]) ov[f.key] = data[f.dbCol]; });
      const b = data?.background_image_url ?? null;
      const a = typeof data?.background_overlay_alpha === "number" ? Number(data.background_overlay_alpha) : 0.35;
      setPreset(p); setOverrides(ov); setBgUrl(b); setBgAlpha(a);
      setSavedPreset(p); setSavedOverrides(ov); setSavedBgUrl(b); setSavedBgAlpha(a);

      const logsQ = (supabase as any).from("theme_audit_logs").select("*").order("created_at", { ascending: false }).limit(30);
      const { data: logs } = scope === "system_global"
        ? await logsQ.is("company_id", null)
        : await logsQ.eq("company_id", companyId);
      setAudit(logs || []);
      setChartsDirty(false);
    })();
  }, [envId, scope, companyId]);

  // Aplica preview ao vivo (só na página)
  useEffect(() => {
    if (!envId) return;
    previewTheme(preset, overrides as any);
  }, [preset, overrides, previewTheme, envId]);
  useEffect(() => {
    if (!envId) return;
    previewBackground(bgUrl, bgAlpha);
  }, [bgUrl, bgAlpha, previewBackground, envId]);

  // Restaura tema real ao desmontar
  useEffect(() => {
    return () => { reloadFromDb(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/app" replace />;

  // Diferenças
  const changedColors = COLOR_FIELDS.filter(f => (overrides[f.key] ?? null) !== (savedOverrides[f.key] ?? null)).map(f => f.label);
  const presetChanged = preset !== savedPreset;
  const bgChanged = bgUrl !== savedBgUrl || Math.abs(bgAlpha - savedBgAlpha) > 0.001;
  const isDirty = presetChanged || changedColors.length > 0 || bgChanged || chartsDirty;

  const loadCurrentRow = async () => {
    const baseQ = (supabase as any).from("company_theme_settings").select("*");
    const q = scope === "system_global"
      ? baseQ.eq("scope", "system_global").is("company_id", null)
      : baseQ.eq("company_id", companyId);
    return (await q.maybeSingle()).data;
  };

  const handleConfirmSave = async () => {
    if (!envId) { toast.error("Selecione um ambiente"); return; }
    setSaving(true);
    const prev = await loadCurrentRow();

    const payload: any = {
      company_id: companyId,
      scope,
      theme_preset: preset,
      is_active: true,
      background_image_url: bgUrl,
      background_overlay_alpha: bgAlpha,
    };
    COLOR_FIELDS.forEach(f => { payload[f.dbCol] = overrides[f.key] ?? null; });

    let error: any = null;
    if (prev) {
      const upd = scope === "system_global"
        ? (supabase as any).from("company_theme_settings").update(payload).eq("scope","system_global").is("company_id", null)
        : (supabase as any).from("company_theme_settings").update(payload).eq("company_id", companyId);
      error = (await upd).error;
    } else {
      error = (await (supabase as any).from("company_theme_settings").insert(payload)).error;
    }

    if (error) { toast.error("Erro ao salvar: " + error.message); setSaving(false); return; }

    const actionType =
      scope === "system_global" ? "update_global_theme" :
      scope === "owner_company" ? "update_owner_company_theme" :
      "update_client_company_theme";

    await (supabase as any).from("theme_audit_logs").insert({
      company_id: companyId,
      user_id: user?.id ?? null,
      action_type: `${actionType}:${preset}`,
      before_data: prev ?? null,
      after_data: payload,
    });

    toast.success("Tema salvo e aplicado com sucesso.");
    setSaving(false);
    setConfirmOpen(false);
    setSavedPreset(preset);
    setSavedOverrides({ ...overrides });
    setSavedBgUrl(bgUrl);
    setSavedBgAlpha(bgAlpha);
    setChartsDirty(false);
    await reloadFromDb();
  };

  const handleUploadBg = async (file: File) => {
    if (!envId) { toast.error("Selecione um ambiente primeiro"); return; }
    setUploading(true);
    const folder = scope === "system_global" ? "_global" : (companyId ?? "_global");
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${folder}/bg-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("company-wallpapers").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro no upload: " + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("company-wallpapers").getPublicUrl(path);
    setBgUrl(data.publicUrl);
    setUploading(false);
    toast.success("Imagem aplicada — clique em Salvar para confirmar");
  };

  const handleDiscard = () => {
    setPreset(savedPreset);
    setOverrides({ ...savedOverrides });
    setBgUrl(savedBgUrl);
    setBgAlpha(savedBgAlpha);
    setChartsDirty(false);
    toast.message("Alterações descartadas");
  };

  const handleRestoreDefault = async () => {
    if (!envId) { toast.error("Selecione um ambiente"); return; }
    if (!confirm(`Restaurar o tema padrão OCS para "${companyName}"? Essa ação aplica imediatamente e registra auditoria.`)) return;
    const prev = await loadCurrentRow();
    const del = scope === "system_global"
      ? (supabase as any).from("company_theme_settings").delete().eq("scope","system_global").is("company_id", null)
      : (supabase as any).from("company_theme_settings").delete().eq("company_id", companyId);
    await del;
    await (supabase as any).from("theme_audit_logs").insert({
      company_id: companyId,
      user_id: user?.id ?? null,
      action_type: "restore_default_theme",
      before_data: prev ?? null,
      after_data: null,
    });
    setPreset(DEFAULT_PRESET); setOverrides({}); setBgUrl(null); setBgAlpha(0.35);
    setSavedPreset(DEFAULT_PRESET); setSavedOverrides({}); setSavedBgUrl(null); setSavedBgAlpha(0.35);
    toast.success("Padrão OCS restaurado.");
    await reloadFromDb();
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
            Personalize visualmente o ERP por empresa. As alterações só são aplicadas após confirmar.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {isDirty && (
            <Badge variant="outline" className="border-warn text-warn animate-pulse">
              <AlertCircle className="w-3 h-3 mr-1" /> Alterações não salvas
            </Badge>
          )}
          <Button variant="outline" onClick={handleDiscard} disabled={!isDirty}>
            Descartar
          </Button>
          <Button variant="outline" onClick={handleRestoreDefault} disabled={!envId}>
            <RotateCcw className="w-4 h-4 mr-2" />Restaurar padrão
          </Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={!envId || !isDirty || saving}>
            <Save className="w-4 h-4 mr-2" /> Salvar tema
          </Button>
        </div>
      </div>

      {/* Seletor de Ambiente / Empresa */}
      <Card className="card-elegant">
        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 min-w-0">
            <Label className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4" /> Ambiente / Empresa</Label>
            <Select value={envId} onValueChange={setEnvId}>
              <SelectTrigger><SelectValue placeholder="Selecione o ambiente para editar o tema" /></SelectTrigger>
              <SelectContent>
                {environments.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!envId && (
              <p className="text-xs text-warn mt-1.5">Selecione um ambiente antes de salvar o tema.</p>
            )}
          </div>
          {envId && (
            <div className="flex flex-wrap gap-2">
              <Badge
                className={
                  scope === "system_global" ? "bg-primary text-primary-foreground" :
                  scope === "owner_company" ? "bg-accent text-accent-foreground" :
                  "bg-muted text-foreground"
                }
              >
                {SCOPE_LABEL[scope]}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Salvo: <strong className="ml-1">{THEME_PRESETS[savedPreset].label}</strong>
              </Badge>
              {presetChanged && (
                <Badge className="text-sm">
                  Em pré-visualização: <strong className="ml-1">{THEME_PRESETS[preset].label}</strong>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="presets">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="presets"><Sparkles className="w-4 h-4 mr-1" />Presets</TabsTrigger>
          <TabsTrigger value="cores"><Palette className="w-4 h-4 mr-1" />Cores</TabsTrigger>
          <TabsTrigger value="fundo"><ImageIcon className="w-4 h-4 mr-1" />Fundo</TabsTrigger>
          <TabsTrigger value="graficos"><BarChart3 className="w-4 h-4 mr-1" />Gráficos</TabsTrigger>
          <TabsTrigger value="preview"><Eye className="w-4 h-4 mr-1" />Preview</TabsTrigger>
          <TabsTrigger value="auditoria"><History className="w-4 h-4 mr-1" />Auditoria</TabsTrigger>
        </TabsList>

        {/* PRESETS */}
        <TabsContent value="presets" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRESET_LIST.map(p => {
              const t = p.tokens;
              const isSaved = savedPreset === p.key;
              const isDraft = preset === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => { setPreset(p.key); setOverrides({}); }}
                  className={`text-left rounded-lg border-2 transition-all overflow-hidden ${
                    isDraft ? "border-primary shadow-elegant" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="h-24 relative" style={{ background: t.bgGradient ?? `hsl(${t.background})` }}>
                    <div className="absolute inset-3 flex gap-2">
                      <span className="w-8 h-8 rounded-full" style={{ background: `hsl(${t.primary})` }} />
                      <span className="w-8 h-8 rounded-full" style={{ background: `hsl(${t.accent})` }} />
                      <span className="w-8 h-8 rounded-full" style={{ background: `hsl(${t.secondary})` }} />
                    </div>
                  </div>
                  <div className="p-3 bg-card">
                    <div className="font-display font-semibold flex items-center justify-between gap-2">
                      <span className="truncate">{p.label}</span>
                      <div className="flex gap-1 shrink-0">
                        {isSaved && <Badge className="text-[10px]">Ativo</Badge>}
                        {isDraft && !isSaved && <Badge variant="outline" className="text-[10px] border-warn text-warn">Em pré-visualização</Badge>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </TabsContent>

        {/* CORES */}
        <TabsContent value="cores" className="mt-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="text-lg">Paleta de cores</CardTitle>
              <p className="text-xs text-muted-foreground">
                Use o seletor visual ou edite o código HEX. As alterações aparecem no Preview e nesta página, mas só são aplicadas para a empresa após Salvar.
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {COLOR_FIELDS.map(f => {
                const current = (overrides[f.key] as string) || (baseTokens[f.key] as string);
                return (
                  <ColorField
                    key={f.key as string}
                    label={f.label}
                    hslValue={current}
                    defaultHsl={baseTokens[f.key] as string}
                    onChange={(v) => setOverrides(o => ({ ...o, [f.key]: v }))}
                  />
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FUNDO */}
        <TabsContent value="fundo" className="mt-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="text-lg">Imagem de fundo da empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Defina uma imagem de fundo para realçar o efeito translúcido. A intensidade do véu da cor de fundo é ajustável.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
                <div className="rounded-lg border aspect-video bg-muted overflow-hidden flex items-center justify-center"
                  style={bgUrl ? { backgroundImage: `url("${bgUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
                  {!bgUrl && <span className="text-xs text-muted-foreground">Sem imagem</span>}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex">
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadBg(f); }} />
                      <Button asChild disabled={uploading || !companyId}>
                        <span><Upload className="w-4 h-4 mr-2" /> {uploading ? "Enviando..." : "Enviar imagem"}</span>
                      </Button>
                    </label>
                    {bgUrl && <Button variant="outline" onClick={() => setBgUrl(null)}><X className="w-4 h-4 mr-2" /> Remover</Button>}
                  </div>
                  <div>
                    <Label className="text-xs">Ou cole uma URL pública</Label>
                    <Input placeholder="https://..." value={bgUrl ?? ""} onChange={e => setBgUrl(e.target.value || null)} />
                  </div>
                  <div>
                    <Label className="text-xs">Véu da cor de fundo: <strong>{Math.round(bgAlpha * 100)}%</strong></Label>
                    <Slider min={0} max={100} step={5} value={[Math.round(bgAlpha * 100)]} onValueChange={v => setBgAlpha((v[0] ?? 35) / 100)} />
                    <p className="text-xs text-muted-foreground mt-1">0% = imagem totalmente visível · 100% = só a cor de fundo</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GRÁFICOS */}
        <TabsContent value="graficos" className="mt-4">
          {scope === "system_global" && (
            <div className="mb-3 text-xs text-muted-foreground rounded-md border border-dashed p-2">
              Editando <strong>preferências globais</strong> de gráficos. Valem para qualquer projeto/empresa sem configuração própria.
            </div>
          )}
          <ChartPreferencesPanel companyId={companyId} onDirtyChange={setChartsDirty} />
        </TabsContent>

        {/* PREVIEW */}
        <TabsContent value="preview" className="mt-4">
          <ThemePreviewPanel />
        </TabsContent>

        {/* AUDITORIA */}
        <TabsContent value="auditoria" className="mt-4">
          <Card className="card-elegant">
            <CardHeader><CardTitle className="text-lg">Histórico de alterações</CardTitle></CardHeader>
            <CardContent>
              {audit.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma alteração registrada para esta empresa.</p>}
              <div className="space-y-2">
                {audit.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm border-b py-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="shrink-0">{a.action_type || a.action}</Badge>
                      <span className="truncate">
                        {a.after_data?.theme_preset || a.before_data?.theme_preset || a.summary || "-"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(a.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SaveThemeConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        companyName={companyName}
        presetBefore={THEME_PRESETS[savedPreset].label}
        presetAfter={THEME_PRESETS[preset].label}
        changedColors={changedColors}
        layoutChanged={bgChanged}
        chartsChanged={chartsDirty}
        saving={saving}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
}
