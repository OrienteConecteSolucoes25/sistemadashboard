
-- TABELAS
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  contato_nome text,
  contato_email text,
  contato_whatsapp text,
  pix_chave text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE,
  is_company_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_users_company ON public.company_users(company_id);

CREATE TABLE IF NOT EXISTS public.plan_modules_catalog (
  key text PRIMARY KEY,
  label text NOT NULL,
  grupo text NOT NULL,
  rota text,
  sempre_obrigatorio boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.plan_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  modules text[] NOT NULL DEFAULT '{}',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  valor_mensal numeric(12,2) NOT NULL DEFAULT 0,
  dia_vencimento integer NOT NULL DEFAULT 10 CHECK (dia_vencimento BETWEEN 1 AND 28),
  modules text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'ativo',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_plan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_plan_id uuid NOT NULL REFERENCES public.company_plans(id) ON DELETE CASCADE,
  competencia text NOT NULL,
  valor_pago numeric(12,2) NOT NULL DEFAULT 0,
  data_pagamento date NOT NULL,
  registrado_por uuid,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_plan_id, competencia)
);
CREATE INDEX IF NOT EXISTS idx_payments_plan ON public.company_plan_payments(company_plan_id);

CREATE TABLE IF NOT EXISTS public.company_module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  module_key text NOT NULL REFERENCES public.plan_modules_catalog(key) ON DELETE CASCADE,
  can_view boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id, module_key)
);
CREATE INDEX IF NOT EXISTS idx_cmp_user ON public.company_module_permissions(user_id);

CREATE TABLE IF NOT EXISTS public.plan_billing_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_plan_id uuid NOT NULL REFERENCES public.company_plans(id) ON DELETE CASCADE,
  competencia text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('d-3','d0','manual')),
  enviado_em timestamptz NOT NULL DEFAULT now(),
  canal text NOT NULL DEFAULT 'interno',
  payload jsonb,
  UNIQUE(company_plan_id, competencia, tipo, canal)
);

-- FUNÇÕES
CREATE OR REPLACE FUNCTION public.is_financeiro_ocs(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid,'admin'::app_role) OR public.has_role(_uid,'financeiro_ocs'::app_role)
$$;

CREATE OR REPLACE FUNCTION public.user_company(_uid uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.company_users WHERE user_id = _uid LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(_uid uuid, _company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.company_users
    WHERE user_id = _uid AND company_id = _company AND is_company_admin = true
  )
$$;

CREATE OR REPLACE FUNCTION public.current_user_modules(_uid uuid)
RETURNS SETOF text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid;
BEGIN
  IF public.has_role(_uid,'admin'::app_role) THEN
    RETURN QUERY SELECT key FROM public.plan_modules_catalog WHERE ativo = true;
    RETURN;
  END IF;
  cid := public.user_company(_uid);
  IF cid IS NULL THEN
    RETURN QUERY SELECT key FROM public.plan_modules_catalog WHERE sempre_obrigatorio = true AND ativo = true;
    RETURN;
  END IF;
  IF public.is_company_admin(_uid, cid) THEN
    RETURN QUERY
      SELECT m FROM public.company_plans cp, unnest(cp.modules) AS m WHERE cp.company_id = cid
      UNION
      SELECT key FROM public.plan_modules_catalog WHERE sempre_obrigatorio = true;
    RETURN;
  END IF;
  RETURN QUERY
    SELECT m FROM public.company_plans cp, unnest(cp.modules) AS m
    WHERE cp.company_id = cid
      AND (
        m IN (SELECT module_key FROM public.company_module_permissions
              WHERE user_id = _uid AND company_id = cid AND can_view = true)
        OR EXISTS (SELECT 1 FROM public.plan_modules_catalog c WHERE c.key = m AND c.sempre_obrigatorio = true)
      );
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at_generic()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_companies_updated ON public.companies;
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
DROP TRIGGER IF EXISTS trg_company_plans_updated ON public.company_plans;
CREATE TRIGGER trg_company_plans_updated BEFORE UPDATE ON public.company_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
DROP TRIGGER IF EXISTS trg_cmp_updated ON public.company_module_permissions;
CREATE TRIGGER trg_cmp_updated BEFORE UPDATE ON public.company_module_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE OR REPLACE FUNCTION public.company_users_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total int;
BEGIN
  SELECT COUNT(*) INTO total FROM public.company_users WHERE company_id = NEW.company_id;
  IF total = 0 THEN NEW.is_company_admin := true; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_company_users_first ON public.company_users;
CREATE TRIGGER trg_company_users_first BEFORE INSERT ON public.company_users
  FOR EACH ROW EXECUTE FUNCTION public.company_users_first_admin();

-- RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_modules_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_plan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_billing_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ocs manage companies" ON public.companies FOR ALL TO authenticated
  USING (public.is_financeiro_ocs(auth.uid())) WITH CHECK (public.is_financeiro_ocs(auth.uid()));
CREATE POLICY "company members read company" ON public.companies FOR SELECT TO authenticated
  USING (id = public.user_company(auth.uid()) OR public.is_financeiro_ocs(auth.uid()));

CREATE POLICY "ocs manage company_users" ON public.company_users FOR ALL TO authenticated
  USING (public.is_financeiro_ocs(auth.uid())) WITH CHECK (public.is_financeiro_ocs(auth.uid()));
CREATE POLICY "company admin manage own users" ON public.company_users FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "members read own company users" ON public.company_users FOR SELECT TO authenticated
  USING (company_id = public.user_company(auth.uid()));

CREATE POLICY "auth read catalog" ON public.plan_modules_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "ocs write catalog" ON public.plan_modules_catalog FOR ALL TO authenticated
  USING (public.is_financeiro_ocs(auth.uid())) WITH CHECK (public.is_financeiro_ocs(auth.uid()));
CREATE POLICY "auth read packages" ON public.plan_packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "ocs write packages" ON public.plan_packages FOR ALL TO authenticated
  USING (public.is_financeiro_ocs(auth.uid())) WITH CHECK (public.is_financeiro_ocs(auth.uid()));

CREATE POLICY "ocs manage plans" ON public.company_plans FOR ALL TO authenticated
  USING (public.is_financeiro_ocs(auth.uid())) WITH CHECK (public.is_financeiro_ocs(auth.uid()));
CREATE POLICY "company members read plan" ON public.company_plans FOR SELECT TO authenticated
  USING (company_id = public.user_company(auth.uid()));

CREATE POLICY "ocs manage payments" ON public.company_plan_payments FOR ALL TO authenticated
  USING (public.is_financeiro_ocs(auth.uid())) WITH CHECK (public.is_financeiro_ocs(auth.uid()));
CREATE POLICY "company members read payments" ON public.company_plan_payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.company_plans cp
                 WHERE cp.id = company_plan_payments.company_plan_id
                   AND cp.company_id = public.user_company(auth.uid())));

CREATE POLICY "ocs manage permissions" ON public.company_module_permissions FOR ALL TO authenticated
  USING (public.is_financeiro_ocs(auth.uid())) WITH CHECK (public.is_financeiro_ocs(auth.uid()));
CREATE POLICY "company admin manage permissions" ON public.company_module_permissions FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (
    public.is_company_admin(auth.uid(), company_id)
    AND module_key IN (SELECT m FROM public.company_plans cp, unnest(cp.modules) m WHERE cp.company_id = company_id)
  );
CREATE POLICY "user read own permissions" ON public.company_module_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "ocs manage billing" ON public.plan_billing_runs FOR ALL TO authenticated
  USING (public.is_financeiro_ocs(auth.uid())) WITH CHECK (public.is_financeiro_ocs(auth.uid()));
CREATE POLICY "company members read billing" ON public.plan_billing_runs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.company_plans cp
                 WHERE cp.id = plan_billing_runs.company_plan_id
                   AND cp.company_id = public.user_company(auth.uid())));

-- SEED
INSERT INTO public.plan_modules_catalog (key, label, grupo, rota, sempre_obrigatorio, ordem) VALUES
  ('geral.visao',          'Visão Geral',          'Geral',      '/app',                              true,  0),
  ('eng.dashboard',        'Dashboard',            'Engenharia', '/app/engenharia',                   false, 10),
  ('eng.governanca',       'Governança',           'Engenharia', '/app/engenharia/governanca',        false, 11),
  ('eng.sites',            'Sites',                'Engenharia', '/app/engenharia/sites',             false, 12),
  ('eng.projetos',         'Projetos',             'Engenharia', '/app/engenharia/projetos',          false, 13),
  ('eng.demandas',         'Demandas',             'Engenharia', '/app/engenharia/demandas',          false, 14),
  ('eng.atividades',       'Atividades',           'Engenharia', '/app/engenharia/atividades',        false, 15),
  ('eng.rfi',              'RFI',                  'Engenharia', '/app/engenharia/rfi',               false, 16),
  ('eng.pendencias',       'Pendências',           'Engenharia', '/app/engenharia/pendencias',        false, 17),
  ('eng.equipes',          'Equipes',              'Engenharia', '/app/engenharia/equipes',           false, 18),
  ('eng.fibra',            'Fibra (obras)',        'Engenharia', '/app/engenharia/fibra',             false, 19),
  ('eng.energia',          'Ligações de Energia',  'Engenharia', '/app/engenharia/energia',           false, 20),
  ('eng.materiais',        'Materiais',            'Engenharia', '/app/engenharia/materiais',         false, 21),
  ('eng.suprimentos',      'Suprimentos',          'Engenharia', '/app/engenharia/suprimentos',       false, 22),
  ('eng.art',              'ART',                  'Engenharia', '/app/engenharia/art',               false, 23),
  ('eng.relatorios',       'Relatórios',           'Engenharia', '/app/engenharia/relatorios',        false, 24),
  ('eng.emails',           'E-mails (log)',        'Engenharia', '/app/engenharia/emails',            false, 25),
  ('jur.dashboard',        'Dashboard Jurídico',   'Jurídico',   '/app/juridico',                     false, 50),
  ('jur.processos',        'Processos',            'Jurídico',   '/app/juridico/processos',           false, 51),
  ('jur.prazos',           'Prazos',               'Jurídico',   '/app/juridico/prazos',              false, 52),
  ('jur.documentos',       'Documentos',           'Jurídico',   '/app/juridico/documentos',          false, 53),
  ('jur.responsaveis',     'Responsáveis',         'Jurídico',   '/app/juridico/responsaveis',        false, 54),
  ('jur.tarefas',          'Tarefas',              'Jurídico',   '/app/juridico/tarefas',             false, 55),
  ('jur.relatorios',       'Relatórios Jurídicos', 'Jurídico',   '/app/juridico/relatorios',          false, 56)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.plan_packages (nome, descricao, modules)
SELECT 'Engenharia Completo', 'Todas as abas de Engenharia + Visão Geral',
  ARRAY['geral.visao','eng.dashboard','eng.governanca','eng.sites','eng.projetos','eng.demandas','eng.atividades','eng.rfi','eng.pendencias','eng.equipes','eng.fibra','eng.energia','eng.materiais','eng.suprimentos','eng.art','eng.relatorios','eng.emails']
WHERE NOT EXISTS (SELECT 1 FROM public.plan_packages WHERE nome = 'Engenharia Completo');

INSERT INTO public.plan_packages (nome, descricao, modules)
SELECT 'Jurídico Completo', 'Todas as abas de Jurídico + Visão Geral',
  ARRAY['geral.visao','jur.dashboard','jur.processos','jur.prazos','jur.documentos','jur.responsaveis','jur.tarefas','jur.relatorios']
WHERE NOT EXISTS (SELECT 1 FROM public.plan_packages WHERE nome = 'Jurídico Completo');

INSERT INTO public.plan_packages (nome, descricao, modules)
SELECT 'Starter', 'Visão Geral + Sites + Projetos',
  ARRAY['geral.visao','eng.sites','eng.projetos']
WHERE NOT EXISTS (SELECT 1 FROM public.plan_packages WHERE nome = 'Starter');
