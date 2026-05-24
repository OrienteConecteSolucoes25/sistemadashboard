
-- ============ helpers ============
CREATE OR REPLACE FUNCTION public._user_company(_uid uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE id = _uid
$$;

CREATE OR REPLACE FUNCTION public._folder_company(_name text)
RETURNS uuid LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF((storage.foldername(_name))[1], '')::uuid
$$;

-- ============ fin_credit_cards ============
ALTER TABLE public.fin_credit_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fin_credit_cards_own" ON public.fin_credit_cards;
CREATE POLICY "fin_credit_cards_own" ON public.fin_credit_cards
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ============ fin_debts ============
ALTER TABLE public.fin_debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fin_debts_own" ON public.fin_debts;
CREATE POLICY "fin_debts_own" ON public.fin_debts
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ============ fin_categories ============
ALTER TABLE public.fin_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fin_categories_read" ON public.fin_categories;
DROP POLICY IF EXISTS "fin_categories_write_own" ON public.fin_categories;
CREATE POLICY "fin_categories_read" ON public.fin_categories
  FOR SELECT TO authenticated
  USING (is_system = true OR profile_id IS NULL OR profile_id = auth.uid());
CREATE POLICY "fin_categories_write_own" ON public.fin_categories
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ============ fin_cost_centers ============
ALTER TABLE public.fin_cost_centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fin_cost_centers_company" ON public.fin_cost_centers;
CREATE POLICY "fin_cost_centers_company" ON public.fin_cost_centers
  FOR ALL TO authenticated
  USING (company_id = public._user_company(auth.uid()))
  WITH CHECK (company_id = public._user_company(auth.uid()));

-- ============ it_sla_config ============
ALTER TABLE public.it_sla_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "it_sla_config_company" ON public.it_sla_config;
CREATE POLICY "it_sla_config_company" ON public.it_sla_config
  FOR ALL TO authenticated
  USING (company_id IS NULL OR company_id = public._user_company(auth.uid()))
  WITH CHECK (company_id = public._user_company(auth.uid()));

-- ============ ti_ticket_history ============
ALTER TABLE public.ti_ticket_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ti_ticket_history_via_ticket" ON public.ti_ticket_history;
CREATE POLICY "ti_ticket_history_via_ticket" ON public.ti_ticket_history
  FOR SELECT TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.ti_tickets
      WHERE company_id = public._user_company(auth.uid())
    )
  );
DROP POLICY IF EXISTS "ti_ticket_history_insert" ON public.ti_ticket_history;
CREATE POLICY "ti_ticket_history_insert" ON public.ti_ticket_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============ Jarbas tables ============
-- jarbas_integrations
DROP POLICY IF EXISTS "Jarbas integrations viewable by all" ON public.jarbas_integrations;
DROP POLICY IF EXISTS "jarbas_integrations_read" ON public.jarbas_integrations;
CREATE POLICY "jarbas_integrations_read" ON public.jarbas_integrations
  FOR SELECT TO authenticated
  USING (company_id = public._user_company(auth.uid()));

-- jarbas_webhooks
DROP POLICY IF EXISTS "Jarbas webhooks viewable by all" ON public.jarbas_webhooks;
DROP POLICY IF EXISTS "jarbas_webhooks_read" ON public.jarbas_webhooks;
CREATE POLICY "jarbas_webhooks_read" ON public.jarbas_webhooks
  FOR SELECT TO authenticated
  USING (company_id = public._user_company(auth.uid()));

-- jarbas_external_logs
DROP POLICY IF EXISTS "Jarbas external logs viewable by all" ON public.jarbas_external_logs;
DROP POLICY IF EXISTS "jarbas_external_logs_read" ON public.jarbas_external_logs;
CREATE POLICY "jarbas_external_logs_read" ON public.jarbas_external_logs
  FOR SELECT TO authenticated
  USING (company_id = public._user_company(auth.uid()));

-- jarbas_predictive_insights
DROP POLICY IF EXISTS "Jarbas predictive insights viewable by all" ON public.jarbas_predictive_insights;
DROP POLICY IF EXISTS "jarbas_predictive_insights_read" ON public.jarbas_predictive_insights;
CREATE POLICY "jarbas_predictive_insights_read" ON public.jarbas_predictive_insights
  FOR SELECT TO authenticated
  USING (company_id = public._user_company(auth.uid()));

-- jarbas_vision_analysis
DROP POLICY IF EXISTS "Jarbas vision analysis viewable by all" ON public.jarbas_vision_analysis;
DROP POLICY IF EXISTS "jarbas_vision_analysis_read" ON public.jarbas_vision_analysis;
CREATE POLICY "jarbas_vision_analysis_read" ON public.jarbas_vision_analysis
  FOR SELECT TO authenticated
  USING (company_id = public._user_company(auth.uid()));

-- jarbas_visual_validations (sem company_id; usa analysis_id -> jarbas_vision_analysis)
DROP POLICY IF EXISTS "Jarbas visual validations viewable by all" ON public.jarbas_visual_validations;
DROP POLICY IF EXISTS "jarbas_visual_validations_read" ON public.jarbas_visual_validations;
CREATE POLICY "jarbas_visual_validations_read" ON public.jarbas_visual_validations
  FOR SELECT TO authenticated
  USING (
    analysis_id IN (
      SELECT id FROM public.jarbas_vision_analysis
      WHERE company_id = public._user_company(auth.uid())
    )
  );

-- jarbas_analytics_metrics
DROP POLICY IF EXISTS "Jarbas analytics metrics viewable by all" ON public.jarbas_analytics_metrics;
DROP POLICY IF EXISTS "jarbas_analytics_metrics_read" ON public.jarbas_analytics_metrics;
CREATE POLICY "jarbas_analytics_metrics_read" ON public.jarbas_analytics_metrics
  FOR SELECT TO authenticated
  USING (company_id = public._user_company(auth.uid()));

-- jarbas_checklists / jarbas_instruction_documents (sem company_id; restringir a autenticados)
DROP POLICY IF EXISTS "Jarbas checklists viewable by all" ON public.jarbas_checklists;
DROP POLICY IF EXISTS "jarbas_checklists_read" ON public.jarbas_checklists;
CREATE POLICY "jarbas_checklists_read" ON public.jarbas_checklists
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Jarbas instruction documents viewable by all" ON public.jarbas_instruction_documents;
DROP POLICY IF EXISTS "jarbas_instruction_documents_read" ON public.jarbas_instruction_documents;
CREATE POLICY "jarbas_instruction_documents_read" ON public.jarbas_instruction_documents
  FOR SELECT TO authenticated
  USING (true);

-- ============ ti_knowledge_base ============
DROP POLICY IF EXISTS "Knowledge base viewable by all" ON public.ti_knowledge_base;
DROP POLICY IF EXISTS "ti_knowledge_base_read" ON public.ti_knowledge_base;
CREATE POLICY "ti_knowledge_base_read" ON public.ti_knowledge_base
  FOR SELECT TO authenticated
  USING (true);

-- ============ STORAGE ============
-- comm-brand-assets: escopar por pasta da empresa
DROP POLICY IF EXISTS "comm_brand_assets_insert" ON storage.objects;
DROP POLICY IF EXISTS "comm_brand_assets_update" ON storage.objects;
DROP POLICY IF EXISTS "comm_brand_assets_delete" ON storage.objects;
CREATE POLICY "comm_brand_assets_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'comm-brand-assets'
    AND public._folder_company(name) = public._user_company(auth.uid())
  );
CREATE POLICY "comm_brand_assets_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'comm-brand-assets'
    AND public._folder_company(name) = public._user_company(auth.uid())
  );
CREATE POLICY "comm_brand_assets_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'comm-brand-assets'
    AND public._folder_company(name) = public._user_company(auth.uid())
  );

-- comm-generated-images / comm-design-exports: escopar select+insert
DROP POLICY IF EXISTS "comm_imgs_sel" ON storage.objects;
DROP POLICY IF EXISTS "comm_imgs_ins" ON storage.objects;
CREATE POLICY "comm_imgs_sel" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = ANY (ARRAY['comm-generated-images','comm-design-exports'])
    AND public._folder_company(name) = public._user_company(auth.uid())
  );
CREATE POLICY "comm_imgs_ins" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = ANY (ARRAY['comm-generated-images','comm-design-exports'])
    AND public._folder_company(name) = public._user_company(auth.uid())
  );

-- company-wallpapers: escopar escrita por pasta da empresa
DROP POLICY IF EXISTS "wallpapers_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "wallpapers_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "wallpapers_auth_delete" ON storage.objects;
CREATE POLICY "wallpapers_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'company-wallpapers'
    AND public._folder_company(name) = public._user_company(auth.uid())
  );
CREATE POLICY "wallpapers_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'company-wallpapers'
    AND public._folder_company(name) = public._user_company(auth.uid())
  );
CREATE POLICY "wallpapers_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'company-wallpapers'
    AND public._folder_company(name) = public._user_company(auth.uid())
  );

-- eng-suprimentos: leitura escopada por pasta da empresa
DROP POLICY IF EXISTS "eng_suprimentos_read" ON storage.objects;
CREATE POLICY "eng_suprimentos_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'eng-suprimentos'
    AND public._folder_company(name) = public._user_company(auth.uid())
  );
