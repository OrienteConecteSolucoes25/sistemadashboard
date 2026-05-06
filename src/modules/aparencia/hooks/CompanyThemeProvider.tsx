import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  THEME_PRESETS, DEFAULT_PRESET, ThemePresetKey, ThemeTokens,
  applyThemeTokens, mergeOverrides, applyBackgroundImage,
} from "../lib/themePresets";

type CompanyThemeRow = {
  id: string;
  company_id: string;
  theme_preset: ThemePresetKey;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  surface_color: string | null;
  text_color: string | null;
  muted_text_color: string | null;
  border_color: string | null;
  success_color: string | null;
  warning_color: string | null;
  danger_color: string | null;
  info_color: string | null;
  background_image_url: string | null;
  background_overlay_alpha: number | null;
};

type Ctx = {
  preset: ThemePresetKey;
  tokens: ThemeTokens;
  companyId: string | null;
  loading: boolean;
  /** preview temporário (não salva) */
  previewTheme: (preset: ThemePresetKey, overrides?: Partial<ThemeTokens>) => void;
  /** restaura do banco */
  reloadFromDb: () => Promise<void>;
};

const ThemeCtx = createContext<Ctx>({
  preset: DEFAULT_PRESET,
  tokens: THEME_PRESETS[DEFAULT_PRESET].tokens,
  companyId: null,
  loading: true,
  previewTheme: () => {},
  reloadFromDb: async () => {},
});

function rowToTokens(row: CompanyThemeRow): { preset: ThemePresetKey; tokens: ThemeTokens } {
  const presetKey = (row.theme_preset || DEFAULT_PRESET) as ThemePresetKey;
  const base = THEME_PRESETS[presetKey]?.tokens ?? THEME_PRESETS[DEFAULT_PRESET].tokens;
  const ov: Partial<ThemeTokens> = {};
  if (row.primary_color) ov.primary = row.primary_color;
  if (row.secondary_color) ov.secondary = row.secondary_color;
  if (row.accent_color) ov.accent = row.accent_color;
  if (row.background_color) ov.background = row.background_color;
  if (row.surface_color) ov.card = row.surface_color;
  if (row.text_color) ov.foreground = row.text_color;
  if (row.muted_text_color) ov.mutedForeground = row.muted_text_color;
  if (row.border_color) ov.border = row.border_color;
  if (row.success_color) ov.success = row.success_color;
  if (row.warning_color) ov.warn = row.warning_color;
  if (row.danger_color) ov.destructive = row.danger_color;
  return { preset: presetKey, tokens: mergeOverrides(base, ov) };
}

export const CompanyThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [preset, setPreset] = useState<ThemePresetKey>(DEFAULT_PRESET);
  const [tokens, setTokens] = useState<ThemeTokens>(THEME_PRESETS[DEFAULT_PRESET].tokens);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data: cu } = await (supabase as any)
      .from("company_users").select("company_id").eq("user_id", user.id).maybeSingle();
    const cid: string | null = cu?.company_id ?? null;
    setCompanyId(cid);
    if (!cid) {
      applyThemeTokens(THEME_PRESETS[DEFAULT_PRESET].tokens, DEFAULT_PRESET);
      setLoading(false);
      return;
    }
    const { data: row } = await (supabase as any)
      .from("company_theme_settings").select("*").eq("company_id", cid).maybeSingle();
    if (row) {
      const { preset: p, tokens: t } = rowToTokens(row as CompanyThemeRow);
      setPreset(p); setTokens(t); applyThemeTokens(t, p);
    } else {
      setPreset(DEFAULT_PRESET);
      setTokens(THEME_PRESETS[DEFAULT_PRESET].tokens);
      applyThemeTokens(THEME_PRESETS[DEFAULT_PRESET].tokens, DEFAULT_PRESET);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  const previewTheme = useCallback((p: ThemePresetKey, overrides?: Partial<ThemeTokens>) => {
    const base = THEME_PRESETS[p]?.tokens ?? THEME_PRESETS[DEFAULT_PRESET].tokens;
    const merged = overrides ? mergeOverrides(base, overrides) : base;
    setPreset(p); setTokens(merged); applyThemeTokens(merged, p);
  }, []);

  return (
    <ThemeCtx.Provider value={{ preset, tokens, companyId, loading, previewTheme, reloadFromDb: load }}>
      {children}
    </ThemeCtx.Provider>
  );
};

export const useCompanyTheme = () => useContext(ThemeCtx);
