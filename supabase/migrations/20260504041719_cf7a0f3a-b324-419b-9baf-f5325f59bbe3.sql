
-- Helper: pode editar engenharia
CREATE OR REPLACE FUNCTION public.eng_can_edit(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_uid, 'admin'::app_role)
      OR public.has_role(_uid, 'engenharia'::app_role)
      OR public.has_role(_uid, 'planejamento'::app_role)
      OR public.has_role(_uid, 'diretoria'::app_role)
      OR public.has_role(_uid, 'suprimentos'::app_role)
      OR public.has_role(_uid, 'fibra'::app_role)
$$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.eng_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Governança
CREATE TABLE IF NOT EXISTS public.eng_governanca_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  localizador text, data_acionamento date, area_atuacao text, cliente text,
  tipo_atividade text, status text, prazo_final date, termino_real date,
  responsavel text, ofensor text, causa_raiz text, prioridade text,
  valor_inicial numeric DEFAULT 0, faturamento_total numeric DEFAULT 0,
  custo_total_direto_real numeric DEFAULT 0, custos_diversos_total numeric DEFAULT 0,
  resultado_real numeric DEFAULT 0, margem_real numeric DEFAULT 0,
  quantidade_replan_total integer DEFAULT 0, status_bi text,
  pct_conclusao_campo numeric, sla_aprovacao numeric, tempo_execucao_real numeric,
  categoria_on_hold text, categoria_problema_1 text, categoria_problema_2 text,
  categoria_problema_3 text, raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_gov_atividades_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb, imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_gov_faturamento_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb, imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_gov_resultados_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb, imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_gov_action_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semana text, mes integer, ano integer, area text, cliente text,
  ofensor text, causa_raiz text, acao text NOT NULL, resultado_esperado text,
  responsavel text, status text DEFAULT 'aberta', prazo date,
  prioridade text, evidencia text, observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_gov_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  edit_open_to_all boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.eng_gov_settings (id, edit_open_to_all) VALUES (true, false) ON CONFLICT DO NOTHING;

-- Operacional
CREATE TABLE IF NOT EXISTS public.eng_projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL, cliente text, status text DEFAULT 'em_andamento',
  data jsonb DEFAULT '{}'::jsonb, created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text, nome text NOT NULL, cidade text, uf text, status text,
  responsavel text, latitude numeric, longitude numeric,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_demandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL, descricao text, status text DEFAULT 'aberta',
  prioridade text, prazo date, responsavel text,
  site_id uuid REFERENCES public.eng_sites(id) ON DELETE SET NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_rfi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text, assunto text, descricao text, status text DEFAULT 'aberta',
  prazo date, site_id uuid REFERENCES public.eng_sites(id) ON DELETE SET NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL, descricao text, status text, responsavel text,
  prazo date, site_id uuid, projeto_id uuid,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_equipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL, lider text, membros jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'ativa', site_id uuid,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_pendencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL, prioridade text, responsavel text,
  status text DEFAULT 'aberta', prazo date, site_id uuid,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_materiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL, unidade text, estoque numeric DEFAULT 0,
  reservado numeric DEFAULT 0, site_id uuid,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_fibra_obras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL, status text, site_id uuid,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_fibra_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid REFERENCES public.eng_fibra_obras(id) ON DELETE CASCADE,
  itens jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_suprimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text, descricao text, status text DEFAULT 'aberta',
  solicitante text, responsavel text, prazo date,
  itens jsonb DEFAULT '[]'::jsonb, data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_ligacoes_energia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo text, site_id uuid, status text, data_solicitacao date,
  data_ligacao date, concessionaria text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_art (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text, status text, responsavel_tecnico text, site_id uuid,
  data_emissao date, valor numeric, data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acao text NOT NULL, modulo text, observacoes text,
  user_id uuid, payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_emails_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario text, assunto text, status text, payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_integracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text UNIQUE, descricao text, ativa boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_roadmap_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL, descricao text, status text DEFAULT 'idea',
  prioridade text, area text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_relatorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL, tipo text, site_id uuid, data date,
  autor text, payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.eng_field_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key text NOT NULL, value text NOT NULL, label text,
  ordem integer DEFAULT 0, ativo boolean DEFAULT true,
  UNIQUE (field_key, value)
);

-- Triggers updated_at
DO $$ DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'eng_governanca_master','eng_gov_action_plan','eng_gov_settings',
    'eng_projetos','eng_sites','eng_demandas','eng_rfi','eng_atividades',
    'eng_equipes','eng_pendencias','eng_materiais','eng_fibra_obras',
    'eng_fibra_checklists','eng_suprimentos','eng_ligacoes_energia',
    'eng_art','eng_integracoes','eng_roadmap_ia','eng_relatorios'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated ON public.%1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.eng_set_updated_at()', t);
  END LOOP;
END $$;

-- RLS
DO $$ DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'eng_governanca_master','eng_gov_atividades_raw','eng_gov_faturamento_raw',
    'eng_gov_resultados_raw','eng_gov_action_plan','eng_gov_settings',
    'eng_projetos','eng_sites','eng_demandas','eng_rfi','eng_atividades',
    'eng_equipes','eng_pendencias','eng_materiais','eng_fibra_obras',
    'eng_fibra_checklists','eng_suprimentos','eng_ligacoes_energia',
    'eng_art','eng_auditoria','eng_emails_log','eng_integracoes',
    'eng_roadmap_ia','eng_relatorios','eng_field_options'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Policies padrão
DO $$ DECLARE t text; sql text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'eng_governanca_master','eng_gov_atividades_raw','eng_gov_faturamento_raw',
    'eng_gov_resultados_raw','eng_gov_action_plan',
    'eng_projetos','eng_sites','eng_demandas','eng_rfi','eng_atividades',
    'eng_equipes','eng_pendencias','eng_materiais','eng_fibra_obras',
    'eng_fibra_checklists','eng_suprimentos','eng_ligacoes_energia',
    'eng_art','eng_emails_log','eng_integracoes','eng_roadmap_ia',
    'eng_relatorios','eng_field_options'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth read %1$s" ON public.%1$s', t);
    EXECUTE format('CREATE POLICY "auth read %1$s" ON public.%1$s FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "edit %1$s" ON public.%1$s', t);
    EXECUTE format('CREATE POLICY "edit %1$s" ON public.%1$s FOR ALL TO authenticated USING (public.eng_can_edit(auth.uid())) WITH CHECK (public.eng_can_edit(auth.uid()))', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "auth read eng_gov_settings" ON public.eng_gov_settings;
CREATE POLICY "auth read eng_gov_settings" ON public.eng_gov_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin write eng_gov_settings" ON public.eng_gov_settings;
CREATE POLICY "admin write eng_gov_settings" ON public.eng_gov_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "auth insert eng_auditoria" ON public.eng_auditoria;
CREATE POLICY "auth insert eng_auditoria" ON public.eng_auditoria FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admin read eng_auditoria" ON public.eng_auditoria;
CREATE POLICY "admin read eng_auditoria" ON public.eng_auditoria FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
