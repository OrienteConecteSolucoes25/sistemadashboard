// Aparência & Marca OCS — Presets visuais por empresa
// Tokens são valores HSL puros (sem "hsl(...)") para casarem com index.css

export type ThemePresetKey =
  | "glassmorphism"
  | "neo-brutalism"
  | "corporate-clean"
  | "minimal-tech"
  | "dark-premium"
  | "soft-saas"
  | "industrial-ops";

export type ThemeTokens = {
  // cores em HSL "h s% l%"
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  destructive: string;
  warn: string;
  success: string;
  // estilo
  radius: string; // ex: "0.5rem"
  shadowCard: string;
  shadowElegant: string;
  fontMain: string;
  fontDisplay: string;
  // efeitos
  glassBlur: string; // ex: "12px"
  glassAlpha: number; // 0-1
  // gradiente de fundo opcional
  bgGradient?: string;
};

export type ThemePreset = {
  key: ThemePresetKey;
  label: string;
  description: string;
  tokens: ThemeTokens;
};

const fontInter = "'Inter', system-ui, sans-serif";
const fontRajdhani = "'Rajdhani', system-ui, sans-serif";

export const THEME_PRESETS: Record<ThemePresetKey, ThemePreset> = {
  glassmorphism: {
    key: "glassmorphism",
    label: "Glassmorphism",
    description: "Premium, translúcido, gradientes suaves — padrão OCS.",
    tokens: {
      background: "210 40% 98%",
      foreground: "217 30% 15%",
      card: "0 0% 100%",
      cardForeground: "217 30% 15%",
      primary: "217 91% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "210 40% 96%",
      secondaryForeground: "217 30% 15%",
      accent: "330 81% 60%",
      accentForeground: "0 0% 100%",
      muted: "210 30% 94%",
      mutedForeground: "217 15% 45%",
      border: "210 30% 88%",
      destructive: "0 75% 60%",
      warn: "25 95% 55%",
      success: "158 64% 42%",
      radius: "1rem",
      shadowCard: "0 8px 32px -8px hsl(217 91% 55% / 0.15)",
      shadowElegant: "0 20px 60px -20px hsl(217 91% 55% / 0.35)",
      fontMain: fontInter,
      fontDisplay: fontRajdhani,
      glassBlur: "16px",
      glassAlpha: 0.65,
      bgGradient:
        "linear-gradient(135deg, hsl(210 100% 97%) 0%, hsl(330 100% 97%) 50%, hsl(25 100% 97%) 100%)",
    },
  },
  "neo-brutalism": {
    key: "neo-brutalism",
    label: "Neo-Brutalism",
    description: "Bordas grossas, sombras duras, cores fortes.",
    tokens: {
      background: "55 100% 92%",
      foreground: "0 0% 8%",
      card: "0 0% 100%",
      cardForeground: "0 0% 8%",
      primary: "260 90% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "55 100% 70%",
      secondaryForeground: "0 0% 8%",
      accent: "0 90% 60%",
      accentForeground: "0 0% 100%",
      muted: "55 60% 88%",
      mutedForeground: "0 0% 25%",
      border: "0 0% 8%",
      destructive: "0 90% 50%",
      warn: "30 100% 50%",
      success: "140 80% 40%",
      radius: "0.25rem",
      shadowCard: "4px 4px 0 0 hsl(0 0% 8%)",
      shadowElegant: "8px 8px 0 0 hsl(0 0% 8%)",
      fontMain: fontInter,
      fontDisplay: fontRajdhani,
      glassBlur: "0px",
      glassAlpha: 1,
    },
  },
  "corporate-clean": {
    key: "corporate-clean",
    label: "Corporate Clean",
    description: "Branco, cinza, azul institucional — formal e legível.",
    tokens: {
      background: "0 0% 100%",
      foreground: "215 25% 18%",
      card: "0 0% 100%",
      cardForeground: "215 25% 18%",
      primary: "215 80% 38%",
      primaryForeground: "0 0% 100%",
      secondary: "215 15% 95%",
      secondaryForeground: "215 25% 18%",
      accent: "215 70% 50%",
      accentForeground: "0 0% 100%",
      muted: "215 15% 95%",
      mutedForeground: "215 12% 45%",
      border: "215 15% 88%",
      destructive: "0 65% 50%",
      warn: "38 90% 50%",
      success: "150 55% 38%",
      radius: "0.375rem",
      shadowCard: "0 1px 2px hsl(215 25% 18% / 0.06)",
      shadowElegant: "0 4px 12px hsl(215 25% 18% / 0.1)",
      fontMain: fontInter,
      fontDisplay: fontInter,
      glassBlur: "0px",
      glassAlpha: 1,
    },
  },
  "minimal-tech": {
    key: "minimal-tech",
    label: "Minimal Tech",
    description: "Limpo, espaçoso, foco em produtividade.",
    tokens: {
      background: "0 0% 99%",
      foreground: "0 0% 10%",
      card: "0 0% 100%",
      cardForeground: "0 0% 10%",
      primary: "0 0% 12%",
      primaryForeground: "0 0% 100%",
      secondary: "0 0% 96%",
      secondaryForeground: "0 0% 10%",
      accent: "200 90% 50%",
      accentForeground: "0 0% 100%",
      muted: "0 0% 96%",
      mutedForeground: "0 0% 45%",
      border: "0 0% 92%",
      destructive: "0 70% 55%",
      warn: "40 95% 55%",
      success: "150 60% 40%",
      radius: "0.5rem",
      shadowCard: "0 1px 3px hsl(0 0% 0% / 0.05)",
      shadowElegant: "0 8px 24px hsl(0 0% 0% / 0.08)",
      fontMain: fontInter,
      fontDisplay: fontInter,
      glassBlur: "0px",
      glassAlpha: 1,
    },
  },
  "dark-premium": {
    key: "dark-premium",
    label: "Dark Premium",
    description: "Escuro, executivo, destaques em roxo/rosa.",
    tokens: {
      background: "240 15% 8%",
      foreground: "0 0% 96%",
      card: "240 15% 12%",
      cardForeground: "0 0% 96%",
      primary: "270 90% 65%",
      primaryForeground: "0 0% 100%",
      secondary: "240 15% 16%",
      secondaryForeground: "0 0% 96%",
      accent: "320 90% 60%",
      accentForeground: "0 0% 100%",
      muted: "240 15% 16%",
      mutedForeground: "240 10% 65%",
      border: "240 15% 20%",
      destructive: "0 75% 60%",
      warn: "40 95% 60%",
      success: "150 65% 50%",
      radius: "0.75rem",
      shadowCard: "0 4px 16px hsl(270 90% 30% / 0.25)",
      shadowElegant: "0 20px 60px -10px hsl(270 90% 50% / 0.5)",
      fontMain: fontInter,
      fontDisplay: fontRajdhani,
      glassBlur: "12px",
      glassAlpha: 0.5,
      bgGradient:
        "radial-gradient(ellipse at top left, hsl(270 60% 15%) 0%, hsl(240 15% 8%) 50%, hsl(320 60% 12%) 100%)",
    },
  },
  "soft-saas": {
    key: "soft-saas",
    label: "Soft SaaS",
    description: "Suave, arredondado, amigável e moderno.",
    tokens: {
      background: "260 30% 98%",
      foreground: "260 20% 20%",
      card: "0 0% 100%",
      cardForeground: "260 20% 20%",
      primary: "260 70% 60%",
      primaryForeground: "0 0% 100%",
      secondary: "260 30% 95%",
      secondaryForeground: "260 20% 20%",
      accent: "180 60% 50%",
      accentForeground: "0 0% 100%",
      muted: "260 30% 95%",
      mutedForeground: "260 15% 50%",
      border: "260 30% 90%",
      destructive: "0 70% 60%",
      warn: "35 95% 55%",
      success: "160 60% 45%",
      radius: "1.25rem",
      shadowCard: "0 4px 20px hsl(260 70% 60% / 0.1)",
      shadowElegant: "0 12px 40px hsl(260 70% 60% / 0.2)",
      fontMain: fontInter,
      fontDisplay: fontInter,
      glassBlur: "0px",
      glassAlpha: 1,
    },
  },
  "industrial-ops": {
    key: "industrial-ops",
    label: "Industrial Ops",
    description: "Técnico, azul/cinza/laranja — engenharia e campo.",
    tokens: {
      background: "210 15% 96%",
      foreground: "210 20% 15%",
      card: "0 0% 100%",
      cardForeground: "210 20% 15%",
      primary: "210 70% 35%",
      primaryForeground: "0 0% 100%",
      secondary: "210 15% 92%",
      secondaryForeground: "210 20% 15%",
      accent: "25 90% 50%",
      accentForeground: "0 0% 100%",
      muted: "210 15% 92%",
      mutedForeground: "210 12% 40%",
      border: "210 15% 82%",
      destructive: "0 75% 50%",
      warn: "25 95% 50%",
      success: "150 60% 38%",
      radius: "0.25rem",
      shadowCard: "0 2px 4px hsl(210 20% 15% / 0.1)",
      shadowElegant: "0 6px 16px hsl(210 20% 15% / 0.15)",
      fontMain: fontInter,
      fontDisplay: fontRajdhani,
      glassBlur: "0px",
      glassAlpha: 1,
    },
  },
};

export const PRESET_LIST: ThemePreset[] = Object.values(THEME_PRESETS);
export const DEFAULT_PRESET: ThemePresetKey = "glassmorphism";

/** Aplica tokens em CSS variables no :root (não persiste). */
export function applyThemeTokens(tokens: ThemeTokens, presetKey?: ThemePresetKey) {
  const r = document.documentElement;
  const set = (k: string, v: string) => r.style.setProperty(k, v);
  if (presetKey) r.setAttribute("data-theme", presetKey);

  set("--background", tokens.background);
  set("--foreground", tokens.foreground);
  set("--card", tokens.card);
  set("--card-foreground", tokens.cardForeground);
  set("--popover", tokens.card);
  set("--popover-foreground", tokens.cardForeground);
  set("--primary", tokens.primary);
  set("--primary-foreground", tokens.primaryForeground);
  set("--secondary", tokens.secondary);
  set("--secondary-foreground", tokens.secondaryForeground);
  set("--accent", tokens.accent);
  set("--accent-foreground", tokens.accentForeground);
  set("--muted", tokens.muted);
  set("--muted-foreground", tokens.mutedForeground);
  set("--border", tokens.border);
  set("--input", tokens.border);
  set("--ring", tokens.primary);
  set("--destructive", tokens.destructive);
  set("--destructive-foreground", "0 0% 100%");
  set("--warn", tokens.warn);
  set("--warn-foreground", "0 0% 100%");
  set("--success", tokens.success);
  set("--success-foreground", "0 0% 100%");
  set("--radius", tokens.radius);

  r.style.setProperty("--shadow-card", tokens.shadowCard);
  r.style.setProperty("--shadow-elegant", tokens.shadowElegant);
  r.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, hsl(${tokens.primary}), hsl(${tokens.accent}))`
  );
  r.style.setProperty("--font-main", tokens.fontMain);
  r.style.setProperty("--font-display", tokens.fontDisplay);
  r.style.setProperty("--glass-blur", tokens.glassBlur);
  r.style.setProperty("--glass-alpha", String(tokens.glassAlpha));
  if (tokens.bgGradient) {
    document.body.style.backgroundImage = tokens.bgGradient;
    document.body.style.backgroundAttachment = "fixed";
  } else {
    document.body.style.backgroundImage = "";
  }
}

/** Reseta para o tema OCS padrão (limpa overrides). */
export function resetThemeTokens() {
  applyThemeTokens(THEME_PRESETS[DEFAULT_PRESET].tokens);
}

/** Mescla overrides de cores HSL na paleta do preset. */
export function mergeOverrides(
  base: ThemeTokens,
  overrides: Partial<Record<keyof ThemeTokens, string | number>>
): ThemeTokens {
  return { ...base, ...(overrides as any) };
}
