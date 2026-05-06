-- Configuração global de preços (Calculadora de Pagamentos)
CREATE TABLE IF NOT EXISTS public.plan_pricing_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  valor_por_usuario numeric NOT NULL DEFAULT 0,
  precos_por_modulo jsonb NOT NULL DEFAULT '{}'::jsonb,
  precos_por_integracao jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.plan_pricing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read pricing" ON public.plan_pricing_config;
CREATE POLICY "auth read pricing" ON public.plan_pricing_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ocs manage pricing" ON public.plan_pricing_config;
CREATE POLICY "ocs manage pricing" ON public.plan_pricing_config
  FOR ALL TO authenticated
  USING (public.is_financeiro_ocs(auth.uid()))
  WITH CHECK (public.is_financeiro_ocs(auth.uid()));

INSERT INTO public.plan_pricing_config (id, valor_por_usuario, precos_por_modulo, precos_por_integracao)
VALUES (true, 0, '{}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Catálogo de integrações (com preço)
CREATE TABLE IF NOT EXISTS public.plan_integrations_catalog (
  key text PRIMARY KEY,
  label text NOT NULL,
  descricao text,
  preco_mensal numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  ordem int NOT NULL DEFAULT 0
);

ALTER TABLE public.plan_integrations_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read integrations" ON public.plan_integrations_catalog;
CREATE POLICY "auth read integrations" ON public.plan_integrations_catalog
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ocs manage integrations" ON public.plan_integrations_catalog;
CREATE POLICY "ocs manage integrations" ON public.plan_integrations_catalog
  FOR ALL TO authenticated
  USING (public.is_financeiro_ocs(auth.uid()))
  WITH CHECK (public.is_financeiro_ocs(auth.uid()));

INSERT INTO public.plan_integrations_catalog (key, label, descricao, preco_mensal, ordem) VALUES
  ('outlook', 'Outlook / E-mail', 'Notificações por e-mail via Outlook', 0, 10),
  ('whatsapp', 'WhatsApp Business API', 'Envio automatizado pela API oficial', 0, 20),
  ('powerbi', 'Power BI', 'Export para Power BI', 0, 30),
  ('ai-assist', 'Assistente IA', 'Copiloto Oriente (IA)', 0, 40)
ON CONFLICT (key) DO NOTHING;

-- Coluna integrações nos planos das empresas
ALTER TABLE public.company_plans
  ADD COLUMN IF NOT EXISTS integrations text[] NOT NULL DEFAULT '{}'::text[];

-- Função: calcular valor mensal do plano de uma empresa
CREATE OR REPLACE FUNCTION public.calc_company_plan_value(_company_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cfg record;
  plan record;
  n_users int;
  total numeric := 0;
  m text;
  i text;
BEGIN
  SELECT * INTO cfg FROM public.plan_pricing_config WHERE id = true LIMIT 1;
  SELECT * INTO plan FROM public.company_plans WHERE company_id = _company_id LIMIT 1;
  IF plan.id IS NULL THEN RETURN 0; END IF;
  SELECT COUNT(*) INTO n_users FROM public.company_users WHERE company_id = _company_id;
  total := COALESCE(cfg.valor_por_usuario, 0) * COALESCE(n_users, 0);
  IF plan.modules IS NOT NULL THEN
    FOREACH m IN ARRAY plan.modules LOOP
      total := total + COALESCE((cfg.precos_por_modulo ->> m)::numeric, 0);
    END LOOP;
  END IF;
  IF plan.integrations IS NOT NULL THEN
    FOREACH i IN ARRAY plan.integrations LOOP
      total := total + COALESCE((cfg.precos_por_integracao ->> i)::numeric, 0);
    END LOOP;
  END IF;
  RETURN total;
END $$;

-- Função: aplicar valor calculado a uma empresa (atualiza valor_mensal)
CREATE OR REPLACE FUNCTION public.apply_calculated_value(_company_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v numeric;
BEGIN
  IF NOT public.is_financeiro_ocs(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  v := public.calc_company_plan_value(_company_id);
  UPDATE public.company_plans SET valor_mensal = v, updated_at = now() WHERE company_id = _company_id;
  RETURN v;
END $$;