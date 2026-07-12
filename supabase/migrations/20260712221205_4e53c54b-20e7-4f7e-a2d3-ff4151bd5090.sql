
DROP POLICY IF EXISTS "Users can view external logs" ON public.jarbas_external_logs;
DROP POLICY IF EXISTS "Users can view integrations for their company" ON public.jarbas_integrations;
DROP POLICY IF EXISTS "Users can view webhooks for their company" ON public.jarbas_webhooks;
DROP POLICY IF EXISTS "Users can view analytics for their company" ON public.jarbas_analytics_metrics;
DROP POLICY IF EXISTS "Users can view insights for their company" ON public.jarbas_predictive_insights;
DROP POLICY IF EXISTS "Users can view vision analysis for their company" ON public.jarbas_vision_analysis;
DROP POLICY IF EXISTS "Users can view visual validations" ON public.jarbas_visual_validations;

DROP POLICY IF EXISTS "Users can view productivity logs" ON public.jarbas_productivity_logs;
CREATE POLICY "jarbas_productivity_logs_read"
  ON public.jarbas_productivity_logs
  FOR SELECT
  TO authenticated
  USING (company_id = public._user_company(auth.uid()));
