
-- ============ SETTINGS ============
CREATE TABLE IF NOT EXISTS public.governance_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  edit_open_to_all boolean NOT NULL DEFAULT false,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.governance_settings (id) VALUES (true) ON CONFLICT DO NOTHING;
ALTER TABLE public.governance_settings ENABLE ROW LEVEL SECURITY;

-- ============ PLANO DE AÇÃO ============
CREATE TABLE IF NOT EXISTS public.governance_action_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL DEFAULT 'geral',
  titulo text NOT NULL,
  descricao text,
  semana text, mes int, ano int,
  area text, cliente text,
  ofensor text, causa_raiz text,
  acao text, resultado_esperado text,
  responsavel text, prazo date,
  prioridade text NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta','critica')),
  status text NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada','em_andamento','concluida','atrasada','cancelada')),
  evidencia text, observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.governance_action_plan ENABLE ROW LEVEL SECURITY;

-- ============ DATASETS DINÂMICOS ============
CREATE TABLE IF NOT EXISTS public.gov_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL DEFAULT 'geral',
  name text NOT NULL,
  description text,
  source_filename text,
  uploaded_by uuid,
  is_active boolean NOT NULL DEFAULT true,
  sheet_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gov_datasets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gov_dataset_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.gov_datasets(id) ON DELETE CASCADE,
  sheet_name text NOT NULL,
  sheet_order int DEFAULT 0,
  header_row_index int DEFAULT 0,
  row_count int DEFAULT 0,
  col_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gov_dataset_sheets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gov_dataset_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id uuid NOT NULL REFERENCES public.gov_dataset_sheets(id) ON DELETE CASCADE,
  col_index int NOT NULL,
  col_letter text NOT NULL,
  header text NOT NULL,
  key_normalized text,
  data_type text NOT NULL DEFAULT 'text',
  format_hint text,
  is_formula boolean NOT NULL DEFAULT false,
  formula_excel text,
  formula_js text,
  formula_purpose text,
  ignored boolean NOT NULL DEFAULT false,
  width int DEFAULT 160,
  UNIQUE(sheet_id, col_index)
);
ALTER TABLE public.gov_dataset_columns ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gov_dataset_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id uuid NOT NULL REFERENCES public.gov_dataset_sheets(id) ON DELETE CASCADE,
  row_index int NOT NULL,
  values jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gov_dataset_rows_sheet_idx ON public.gov_dataset_rows(sheet_id, row_index);
CREATE INDEX IF NOT EXISTS gov_dataset_rows_values_idx ON public.gov_dataset_rows USING gin (values);
ALTER TABLE public.gov_dataset_rows ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER gd_uat  BEFORE UPDATE ON public.gov_datasets       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
CREATE TRIGGER gap_uat BEFORE UPDATE ON public.governance_action_plan FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
CREATE TRIGGER gdr_uat BEFORE UPDATE ON public.gov_dataset_rows   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

-- ============ FUNÇÕES (após tabelas) ============
CREATE OR REPLACE FUNCTION public.gov_edit_open()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT edit_open_to_all FROM public.governance_settings WHERE id=true LIMIT 1), false)
$$;

CREATE OR REPLACE FUNCTION public.gov_can_edit(_uid uuid, _module text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.has_role(_uid,'admin'::app_role) THEN RETURN true; END IF;
  IF public.gov_edit_open() THEN RETURN true; END IF;
  IF public.has_role(_uid,'planejamento'::app_role) OR public.has_role(_uid,'diretoria'::app_role) THEN RETURN true; END IF;
  IF _module = 'engenharia' AND public.eng_can_edit(_uid) THEN RETURN true; END IF;
  IF _module = 'juridico'  AND public.has_role(_uid,'juridico'::app_role) THEN RETURN true; END IF;
  IF _module = 'crea'      AND public.crea_can(_uid, NULL,'edit') THEN RETURN true; END IF;
  IF _module = 'rhdp'      AND (public.has_role(_uid,'rh_admin'::app_role) OR public.has_role(_uid,'dp_admin'::app_role)) THEN RETURN true; END IF;
  IF _module = 'comunicacao' AND public.has_role(_uid,'comunicacao_admin'::app_role) THEN RETURN true; END IF;
  RETURN false;
END $$;

CREATE OR REPLACE FUNCTION public.gov_module_for_sheet(_sheet uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT d.module_key FROM public.gov_dataset_sheets s
   JOIN public.gov_datasets d ON d.id = s.dataset_id WHERE s.id = _sheet
$$;

-- ============ POLÍTICAS ============
CREATE POLICY "gset_read"  ON public.governance_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gset_write" ON public.governance_settings FOR ALL
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "gap_read"   ON public.governance_action_plan FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gap_insert" ON public.governance_action_plan FOR INSERT WITH CHECK (public.gov_can_edit(auth.uid(), module_key));
CREATE POLICY "gap_update" ON public.governance_action_plan FOR UPDATE USING (public.gov_can_edit(auth.uid(), module_key));
CREATE POLICY "gap_delete" ON public.governance_action_plan FOR DELETE USING (public.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "gd_read"  ON public.gov_datasets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gd_write" ON public.gov_datasets FOR ALL
  USING (public.gov_can_edit(auth.uid(), module_key))
  WITH CHECK (public.gov_can_edit(auth.uid(), module_key));

CREATE POLICY "gs_read"  ON public.gov_dataset_sheets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gs_write" ON public.gov_dataset_sheets FOR ALL
  USING (public.gov_can_edit(auth.uid(), (SELECT module_key FROM public.gov_datasets WHERE id = dataset_id)))
  WITH CHECK (public.gov_can_edit(auth.uid(), (SELECT module_key FROM public.gov_datasets WHERE id = dataset_id)));

CREATE POLICY "gc_read"  ON public.gov_dataset_columns FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gc_write" ON public.gov_dataset_columns FOR ALL
  USING (public.gov_can_edit(auth.uid(), public.gov_module_for_sheet(sheet_id)))
  WITH CHECK (public.gov_can_edit(auth.uid(), public.gov_module_for_sheet(sheet_id)));

CREATE POLICY "gr_read"  ON public.gov_dataset_rows FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gr_write" ON public.gov_dataset_rows FOR ALL
  USING (public.gov_can_edit(auth.uid(), public.gov_module_for_sheet(sheet_id)))
  WITH CHECK (public.gov_can_edit(auth.uid(), public.gov_module_for_sheet(sheet_id)));

ALTER PUBLICATION supabase_realtime ADD TABLE public.gov_datasets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gov_dataset_sheets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gov_dataset_columns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gov_dataset_rows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.governance_action_plan;
