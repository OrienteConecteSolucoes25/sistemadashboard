
ALTER TABLE public.eng_solicitacao_sc_rc
  ADD COLUMN IF NOT EXISTS data_solicitacao date;

-- Permitir company_id NULL para preferências globais
ALTER TABLE public.company_chart_preferences
  ALTER COLUMN company_id DROP NOT NULL;

-- Índices únicos: um para empresa, outro para global
DROP INDEX IF EXISTS company_chart_preferences_company_id_module_key_tab_key_su_key;
CREATE UNIQUE INDEX IF NOT EXISTS ux_chart_prefs_company
  ON public.company_chart_preferences (company_id, module_key, tab_key, subtab_key, metric_key)
  WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_chart_prefs_global
  ON public.company_chart_preferences (module_key, tab_key, subtab_key, metric_key)
  WHERE company_id IS NULL;
