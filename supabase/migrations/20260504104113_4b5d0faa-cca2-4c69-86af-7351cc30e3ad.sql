
-- module_permissions
CREATE TABLE IF NOT EXISTS public.eng_module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module)
);
ALTER TABLE public.eng_module_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user read own perms" ON public.eng_module_permissions;
CREATE POLICY "user read own perms" ON public.eng_module_permissions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));
DROP POLICY IF EXISTS "admin manage perms" ON public.eng_module_permissions;
CREATE POLICY "admin manage perms" ON public.eng_module_permissions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- sync_runs
CREATE TABLE IF NOT EXISTS public.eng_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  file_name text,
  sheet_name text,
  mode text,
  status text NOT NULL,
  message text,
  row_count integer,
  ran_by uuid,
  ran_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eng_sync_runs_kind ON public.eng_sync_runs(kind, ran_at DESC);
ALTER TABLE public.eng_sync_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read sync_runs" ON public.eng_sync_runs;
CREATE POLICY "auth read sync_runs" ON public.eng_sync_runs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "edit sync_runs" ON public.eng_sync_runs;
CREATE POLICY "edit sync_runs" ON public.eng_sync_runs FOR ALL TO authenticated
  USING (public.eng_can_edit(auth.uid())) WITH CHECK (public.eng_can_edit(auth.uid()));

-- ui_overrides
CREATE TABLE IF NOT EXISTS public.eng_ui_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escopo text NOT NULL,
  alvo text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eng_ui_overrides_alvo ON public.eng_ui_overrides(escopo, alvo);
ALTER TABLE public.eng_ui_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read ui_overrides" ON public.eng_ui_overrides;
CREATE POLICY "auth read ui_overrides" ON public.eng_ui_overrides FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "edit ui_overrides" ON public.eng_ui_overrides;
CREATE POLICY "edit ui_overrides" ON public.eng_ui_overrides FOR ALL TO authenticated
  USING (public.eng_can_edit(auth.uid())) WITH CHECK (public.eng_can_edit(auth.uid()));
DROP TRIGGER IF EXISTS trg_eng_ui_overrides_updated_at ON public.eng_ui_overrides;
CREATE TRIGGER trg_eng_ui_overrides_updated_at BEFORE UPDATE ON public.eng_ui_overrides
  FOR EACH ROW EXECUTE FUNCTION public.eng_set_updated_at();

-- site_costs
CREATE TABLE IF NOT EXISTS public.eng_site_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid,
  site_name text,
  categoria text NOT NULL,
  descricao text,
  valor numeric NOT NULL DEFAULT 0,
  data_lancamento date,
  origem text,
  origem_id text,
  observacao text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eng_site_costs_site ON public.eng_site_costs(site_id, site_name);
ALTER TABLE public.eng_site_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read site_costs" ON public.eng_site_costs;
CREATE POLICY "auth read site_costs" ON public.eng_site_costs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "edit site_costs" ON public.eng_site_costs;
CREATE POLICY "edit site_costs" ON public.eng_site_costs FOR ALL TO authenticated
  USING (public.eng_can_edit(auth.uid())) WITH CHECK (public.eng_can_edit(auth.uid()));

-- fibra_checklist_items
CREATE TABLE IF NOT EXISTS public.eng_fibra_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL,
  padrao text NOT NULL,
  processo text NOT NULL,
  data_inicio date,
  data_final date,
  responsavel text,
  entrega_final text DEFAULT '-',
  observacao text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eng_fibra_items_checklist ON public.eng_fibra_checklist_items(checklist_id, ordem);
ALTER TABLE public.eng_fibra_checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read fibra_items" ON public.eng_fibra_checklist_items;
CREATE POLICY "auth read fibra_items" ON public.eng_fibra_checklist_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "edit fibra_items" ON public.eng_fibra_checklist_items;
CREATE POLICY "edit fibra_items" ON public.eng_fibra_checklist_items FOR ALL TO authenticated
  USING (public.eng_can_edit(auth.uid())) WITH CHECK (public.eng_can_edit(auth.uid()));
DROP TRIGGER IF EXISTS trg_eng_fibra_items_updated_at ON public.eng_fibra_checklist_items;
CREATE TRIGGER trg_eng_fibra_items_updated_at BEFORE UPDATE ON public.eng_fibra_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.eng_set_updated_at();

-- Adiciona colunas faltantes a eng_fibra_checklists
ALTER TABLE public.eng_fibra_checklists 
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS km text,
  ADD COLUMN IF NOT EXISTS cliente text,
  ADD COLUMN IF NOT EXISTS uf text,
  ADD COLUMN IF NOT EXISTS responsavel_geral text,
  ADD COLUMN IF NOT EXISTS status_geral text,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- projetos_elaboracao (estrutura completa)
CREATE TABLE IF NOT EXISTS public.eng_projetos_elaboracao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente text,
  site text,
  cidade text,
  uf text,
  responsavel_solicitante text,
  projetista text,
  local_elaboracao text DEFAULT 'INTERNO',
  escopo_generico text,
  escopo text,
  descricao text,
  status text DEFAULT 'NÃO INICIADA',
  data_solicitacao date,
  prazo_conclusao date,
  prioridade text,
  tempo_previsto text,
  data_inicio_real date,
  data_termino_real date,
  tempo_real text,
  dentro_prazo text,
  tempo_resposta_previsto numeric,
  tempo_resposta_real numeric,
  diferenca_tempo numeric,
  peso numeric,
  conta text,
  delta_horas numeric,
  observacao text,
  link_pasta text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.eng_projetos_elaboracao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read projetos_elab" ON public.eng_projetos_elaboracao;
CREATE POLICY "auth read projetos_elab" ON public.eng_projetos_elaboracao FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "edit projetos_elab" ON public.eng_projetos_elaboracao;
CREATE POLICY "edit projetos_elab" ON public.eng_projetos_elaboracao FOR ALL TO authenticated
  USING (public.eng_can_edit(auth.uid())) WITH CHECK (public.eng_can_edit(auth.uid()));
DROP TRIGGER IF EXISTS trg_eng_projetos_elab_updated_at ON public.eng_projetos_elaboracao;
CREATE TRIGGER trg_eng_projetos_elab_updated_at BEFORE UPDATE ON public.eng_projetos_elaboracao
  FOR EACH ROW EXECUTE FUNCTION public.eng_set_updated_at();

-- Seed singleton para eng_gov_settings
INSERT INTO public.eng_gov_settings (id, edit_open_to_all)
VALUES (true, false)
ON CONFLICT (id) DO NOTHING;
