CREATE TABLE IF NOT EXISTS public.comm_post_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_brand_id uuid,
  social_account_id uuid REFERENCES public.comm_social_accounts(id) ON DELETE SET NULL,
  publish_queue_id uuid REFERENCES public.comm_social_publish_queue(id) ON DELETE SET NULL,
  entidade_tipo text,
  entidade_id uuid,
  external_post_id text,
  external_url text,
  provider text,
  caption text,
  collected_at timestamptz NOT NULL DEFAULT now(),
  impressions int DEFAULT 0,
  reach int DEFAULT 0,
  likes int DEFAULT 0,
  comments int DEFAULT 0,
  shares int DEFAULT 0,
  saves int DEFAULT 0,
  clicks int DEFAULT 0,
  views int DEFAULT 0,
  engagement_rate numeric(6,3) DEFAULT 0,
  raw jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
ALTER TABLE public.comm_post_metrics ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_comm_post_metrics_company ON public.comm_post_metrics(company_id, collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_post_metrics_provider ON public.comm_post_metrics(provider);

DROP POLICY IF EXISTS "metrics view" ON public.comm_post_metrics;
CREATE POLICY "metrics view" ON public.comm_post_metrics FOR SELECT USING (public.comm_can(auth.uid(), company_id, 'view'));
DROP POLICY IF EXISTS "metrics manage" ON public.comm_post_metrics;
CREATE POLICY "metrics manage" ON public.comm_post_metrics FOR ALL USING (public.comm_can(auth.uid(), company_id, 'edit')) WITH CHECK (public.comm_can(auth.uid(), company_id, 'edit'));

DROP TRIGGER IF EXISTS trg_comm_post_metrics_updated ON public.comm_post_metrics;
CREATE TRIGGER trg_comm_post_metrics_updated BEFORE UPDATE ON public.comm_post_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE TABLE IF NOT EXISTS public.comm_ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_brand_id uuid,
  scope text NOT NULL DEFAULT 'geral' CHECK (scope IN ('geral','conta','post','periodo')),
  ref_id uuid,
  periodo_de timestamptz,
  periodo_ate timestamptz,
  resumo text NOT NULL,
  recomendacoes jsonb DEFAULT '[]'::jsonb,
  pontos_fortes jsonb DEFAULT '[]'::jsonb,
  pontos_fracos jsonb DEFAULT '[]'::jsonb,
  metrica_base jsonb DEFAULT '{}'::jsonb,
  modelo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
ALTER TABLE public.comm_ai_insights ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_comm_ai_insights_company ON public.comm_ai_insights(company_id, created_at DESC);

DROP POLICY IF EXISTS "insights view" ON public.comm_ai_insights;
CREATE POLICY "insights view" ON public.comm_ai_insights FOR SELECT USING (public.comm_can(auth.uid(), company_id, 'view'));
DROP POLICY IF EXISTS "insights manage" ON public.comm_ai_insights;
CREATE POLICY "insights manage" ON public.comm_ai_insights FOR ALL USING (public.comm_can(auth.uid(), company_id, 'edit')) WITH CHECK (public.comm_can(auth.uid(), company_id, 'edit'));