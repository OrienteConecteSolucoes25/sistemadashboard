
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'rh_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dp_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor_area';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'colaborador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'auditor_rh';

CREATE TABLE IF NOT EXISTS public.hrdp_submodules_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  nome text NOT NULL,
  area text NOT NULL CHECK (area IN ('rh','dp','bi')),
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hrdp_submodules_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hrdp_catalog_read_all" ON public.hrdp_submodules_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "hrdp_catalog_admin_write" ON public.hrdp_submodules_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_hrdp_catalog_updated BEFORE UPDATE ON public.hrdp_submodules_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.hrdp_module_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE,
  submodulos_ativos text[] NOT NULL DEFAULT '{}',
  jornada_padrao_horas numeric NOT NULL DEFAULT 8,
  regra_he jsonb NOT NULL DEFAULT '{"diurna_pct":50,"noturna_pct":75,"dsr_pct":100}'::jsonb,
  regra_ferias jsonb NOT NULL DEFAULT '{"dias_aquisitivos":30,"abono_max":10,"adiantamento_13":true}'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hrdp_module_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hrdp_settings_admin_all" ON public.hrdp_module_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "hrdp_settings_company_admin" ON public.hrdp_module_settings FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "hrdp_settings_company_read" ON public.hrdp_module_settings FOR SELECT TO authenticated
  USING (public.user_company(auth.uid()) = company_id);
CREATE TRIGGER trg_hrdp_settings_updated BEFORE UPDATE ON public.hrdp_module_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.hrdp_module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  submodule_key text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_approve boolean NOT NULL DEFAULT false,
  can_view_sensitive boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id, submodule_key)
);
ALTER TABLE public.hrdp_module_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hrdp_perm_admin_all" ON public.hrdp_module_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "hrdp_perm_company_admin" ON public.hrdp_module_permissions FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "hrdp_perm_self_read" ON public.hrdp_module_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE TRIGGER trg_hrdp_perm_updated BEFORE UPDATE ON public.hrdp_module_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE OR REPLACE FUNCTION public.hrdp_can(_uid uuid, _company uuid, _submodule text, _action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE perm record;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.has_role(_uid,'admin'::app_role) THEN RETURN true; END IF;
  IF public.has_role(_uid,'rh_admin'::app_role) OR public.has_role(_uid,'dp_admin'::app_role) THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _company IS NOT NULL AND public.is_company_admin(_uid, _company) THEN RETURN true; END IF;
  IF public.has_role(_uid,'auditor_rh'::app_role) AND _action IN ('view','view_sensitive') THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  SELECT * INTO perm FROM public.hrdp_module_permissions
   WHERE user_id=_uid AND company_id=_company AND submodule_key=_submodule LIMIT 1;
  IF perm.id IS NULL THEN RETURN false; END IF;
  RETURN CASE _action
    WHEN 'view' THEN perm.can_view
    WHEN 'edit' THEN perm.can_edit
    WHEN 'approve' THEN perm.can_approve
    WHEN 'view_sensitive' THEN perm.can_view_sensitive
    ELSE false END;
END $$;

INSERT INTO public.hrdp_submodules_catalog (key, nome, area, descricao, ordem) VALUES
  ('rh.colaboradores','Colaboradores','rh','Cadastro de pessoas e vínculos',10),
  ('rh.recrutamento','Recrutamento','rh','Vagas e banco de talentos',20),
  ('rh.beneficios','Benefícios','rh','Gestão e cotações',30),
  ('rh.solicitacoes','Solicitações','rh','Fila de pedidos com SLA',40),
  ('dp.admissao','Admissão & Documentos','dp','Onboarding e checklists',50),
  ('dp.contratos','Contratos','dp','Templates e renovações',60),
  ('dp.ponto','Ponto / HE / BH','dp','Marcações, horas extras, banco',70),
  ('dp.ferias','Férias & Provisão','dp','Aquisitivo e provisões',80),
  ('dp.folha','Folha & Holerite','dp','Fechamento e holerites',90),
  ('bi.indicadores','Indicadores RH/DP','bi','Absenteísmo, turnover',100)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.plan_modules_catalog (key, label, grupo, rota, ativo, ordem)
VALUES ('rhdp.base','RH/DP — Base','rhdp','/app/rh-dp', true, 0)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.plan_modules_catalog (key, label, grupo, rota, ativo, ordem)
SELECT 'rhdp.' || c.key, 'RH/DP — ' || c.nome, 'rhdp', '/app/rh-dp', true, c.ordem
FROM public.hrdp_submodules_catalog c
ON CONFLICT (key) DO NOTHING;
