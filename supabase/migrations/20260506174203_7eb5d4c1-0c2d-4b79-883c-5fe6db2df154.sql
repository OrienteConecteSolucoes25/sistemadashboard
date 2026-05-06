
-- ROLES
DO $$ BEGIN ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'comunicacao_admin'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'social_media'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'designer'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'redator'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'aprovador'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'gestor_produto'; EXCEPTION WHEN others THEN NULL; END $$;

-- AUDIT LOGS (first, since functions reference it)
CREATE TABLE IF NOT EXISTS public.comm_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid, user_id uuid, action text NOT NULL, modulo text,
  entidade_tipo text, entidade_id text, nome_entidade text,
  payload jsonb, observacoes text, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_module_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid UNIQUE, enabled boolean NOT NULL DEFAULT true,
  default_locale text DEFAULT 'pt-BR', default_timezone text DEFAULT 'America/Sao_Paulo',
  ai_enabled boolean NOT NULL DEFAULT true, ai_image_enabled boolean NOT NULL DEFAULT true,
  canva_enabled boolean NOT NULL DEFAULT true, config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, company_id uuid NOT NULL,
  can_view boolean NOT NULL DEFAULT true, can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false, can_delete boolean NOT NULL DEFAULT false,
  can_approve boolean NOT NULL DEFAULT false, can_publish boolean NOT NULL DEFAULT false,
  can_generate_content boolean NOT NULL DEFAULT false, can_generate_design boolean NOT NULL DEFAULT false,
  can_generate_image boolean NOT NULL DEFAULT false, can_export boolean NOT NULL DEFAULT false,
  can_manage_brand boolean NOT NULL DEFAULT false, can_manage_templates boolean NOT NULL DEFAULT false,
  can_manage_settings boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

CREATE TABLE IF NOT EXISTS public.comm_admin_config (
  key text PRIMARY KEY, value text, updated_at timestamptz DEFAULT now(), updated_by uuid
);

-- HELPERS
CREATE OR REPLACE FUNCTION public.comm_can(_uid uuid, _company uuid, _action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE perm record;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.has_role(_uid,'admin'::app_role) THEN RETURN true; END IF;
  IF public.has_role(_uid,'comunicacao_admin'::app_role) THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _company IS NOT NULL AND public.is_company_admin(_uid, _company) THEN RETURN true; END IF;
  IF _action IN ('view','create','edit','generate_content','generate_design','export') AND (
       public.has_role(_uid,'social_media'::app_role) OR
       public.has_role(_uid,'redator'::app_role) OR
       public.has_role(_uid,'designer'::app_role) OR
       public.has_role(_uid,'gestor_produto'::app_role)) THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _action = 'generate_image' AND (
       public.has_role(_uid,'social_media'::app_role) OR
       public.has_role(_uid,'designer'::app_role)) THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _action IN ('approve','publish') AND public.has_role(_uid,'aprovador'::app_role) THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _action = 'view' AND _company IS NOT NULL AND public.user_company(_uid) = _company THEN RETURN true; END IF;
  IF _company IS NULL THEN RETURN false; END IF;
  SELECT * INTO perm FROM public.comm_module_permissions WHERE user_id=_uid AND company_id=_company LIMIT 1;
  IF perm.id IS NULL THEN RETURN false; END IF;
  RETURN CASE _action
    WHEN 'view' THEN perm.can_view WHEN 'create' THEN perm.can_create
    WHEN 'edit' THEN perm.can_edit WHEN 'delete' THEN perm.can_delete
    WHEN 'approve' THEN perm.can_approve WHEN 'publish' THEN perm.can_publish
    WHEN 'generate_content' THEN perm.can_generate_content
    WHEN 'generate_design' THEN perm.can_generate_design
    WHEN 'generate_image' THEN perm.can_generate_image
    WHEN 'export' THEN perm.can_export
    WHEN 'manage_brand' THEN perm.can_manage_brand
    WHEN 'manage_templates' THEN perm.can_manage_templates
    WHEN 'manage_settings' THEN perm.can_manage_settings
    ELSE false END;
END $fn$;

CREATE OR REPLACE FUNCTION public.comm_log_audit(
  _company uuid, _action text, _modulo text,
  _entidade_tipo text DEFAULT NULL, _entidade_id text DEFAULT NULL,
  _nome_entidade text DEFAULT NULL, _payload jsonb DEFAULT NULL, _observacoes text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
BEGIN
  INSERT INTO public.comm_audit_logs(company_id,user_id,action,modulo,entidade_tipo,entidade_id,nome_entidade,payload,observacoes)
  VALUES (_company, auth.uid(), _action, _modulo, _entidade_tipo, _entidade_id, _nome_entidade, _payload, _observacoes);
END $fn$;

-- BRAND KITS
CREATE TABLE IF NOT EXISTS public.comm_brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, nome text NOT NULL, slogan text, descricao text,
  publico_alvo text, persona text, tom_de_voz text, proposta_valor text, diferenciais text, cta_padrao text,
  palavras_permitidas text[], palavras_proibidas text[],
  cores_principais jsonb DEFAULT '[]'::jsonb, cores_secundarias jsonb DEFAULT '[]'::jsonb,
  fontes jsonb DEFAULT '[]'::jsonb, estilo_visual text, tipo_linguagem text,
  links jsonb DEFAULT '{}'::jsonb, redes_sociais jsonb DEFAULT '{}'::jsonb, logo_url text,
  is_default boolean DEFAULT false,
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_by uuid, updated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

-- POSTS
CREATE TABLE IF NOT EXISTS public.comm_content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  brand_kit_id uuid REFERENCES public.comm_brand_kits(id) ON DELETE SET NULL,
  campaign_id uuid, titulo text, tema text, objetivo text, publico text, canal text, formato text,
  tom_de_voz text, cta text, palavras_chave text[], produto_relacionado text, data_planejada date,
  legenda text, texto_card text, hashtags text[], roteiro text, descricao_alternativa text,
  briefing_visual text, prompt_visual text,
  status text NOT NULL DEFAULT 'rascunho_ia',
  ai_generated boolean DEFAULT false, ai_model text, ai_prompt text,
  observacoes text, responsavel_id uuid,
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_by uuid, updated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_content_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.comm_content_posts(id) ON DELETE CASCADE,
  tipo text NOT NULL, conteudo text, ordem int DEFAULT 0, created_at timestamptz DEFAULT now()
);

-- CARROSSEL
CREATE TABLE IF NOT EXISTS public.comm_carousels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  brand_kit_id uuid REFERENCES public.comm_brand_kits(id) ON DELETE SET NULL,
  titulo text, tema text, publico text, objetivo text, canal text, tom_de_voz text, cta text,
  legenda text, hashtags text[], status text DEFAULT 'rascunho_ia', ai_generated boolean DEFAULT false,
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_by uuid, updated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_carousel_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carousel_id uuid NOT NULL REFERENCES public.comm_carousels(id) ON DELETE CASCADE,
  ordem int NOT NULL DEFAULT 1, titulo text, texto text, design_sugerido text,
  created_at timestamptz DEFAULT now()
);

-- NEWSLETTERS
CREATE TABLE IF NOT EXISTS public.comm_newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  brand_kit_id uuid REFERENCES public.comm_brand_kits(id) ON DELETE SET NULL,
  assunto text, pre_header text, abertura text, blocos jsonb DEFAULT '[]'::jsonb,
  cta text, rodape text, publico text, versao_html text, versao_texto text,
  status text NOT NULL DEFAULT 'rascunho', ai_generated boolean DEFAULT false,
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_by uuid, updated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

-- INTERNAL
CREATE TABLE IF NOT EXISTS public.comm_internal_comms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  tipo text, titulo text, mensagem_curta text, mensagem_completa text,
  publico_alvo text, prioridade text DEFAULT 'normal', cta text,
  versao_email text, versao_whatsapp text, versao_mural text,
  status text DEFAULT 'rascunho',
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_by uuid, updated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

-- CAMPANHAS
CREATE TABLE IF NOT EXISTS public.comm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  brand_kit_id uuid REFERENCES public.comm_brand_kits(id) ON DELETE SET NULL,
  nome text NOT NULL, tipo text, conceito text, promessa text, objetivo text, publico text, produto text,
  canais text[], pecas jsonb DEFAULT '[]'::jsonb,
  data_inicio date, data_fim date, orcamento numeric, status text DEFAULT 'planejada',
  responsavel_id uuid, cta text,
  metricas_esperadas jsonb DEFAULT '{}'::jsonb, resultados jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_by uuid, updated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

-- PRODUCT
CREATE TABLE IF NOT EXISTS public.comm_product_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  tipo text, titulo text NOT NULL, descricao text, user_story text, criterios_aceite text,
  status text DEFAULT 'ideia', prioridade text, impacto int, esforco int, risco text,
  valor_cliente text, versao_prevista text, modulo_relacionado text, responsavel_id uuid,
  feedback text, release_note text,
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_by uuid, updated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

-- CALENDAR
CREATE TABLE IF NOT EXISTS public.comm_editorial_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, data_planejada date NOT NULL, hora_planejada time,
  canal text, formato text, tema text, cta text, prioridade text,
  status text DEFAULT 'planejado', responsavel_id uuid,
  campaign_id uuid REFERENCES public.comm_campaigns(id) ON DELETE SET NULL,
  post_id uuid REFERENCES public.comm_content_posts(id) ON DELETE SET NULL,
  newsletter_id uuid REFERENCES public.comm_newsletters(id) ON DELETE SET NULL,
  internal_id uuid REFERENCES public.comm_internal_comms(id) ON DELETE SET NULL,
  notas text,
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_by uuid, updated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

-- APROVACOES
CREATE TABLE IF NOT EXISTS public.comm_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, entidade_tipo text NOT NULL, entidade_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'em_revisao', comentario text, motivo_reprovacao text,
  aprovado_por uuid, aprovado_em timestamptz, versao int DEFAULT 1, snapshot jsonb,
  created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

-- DESIGN STUDIO
CREATE TABLE IF NOT EXISTS public.comm_design_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid, nome text NOT NULL, categoria text, formato text NOT NULL,
  largura int NOT NULL, altura int NOT NULL, schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  thumbnail_url text, is_global boolean DEFAULT false,
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_generated_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  brand_kit_id uuid REFERENCES public.comm_brand_kits(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.comm_design_templates(id) ON DELETE SET NULL,
  nome text, formato text, largura int, altura int,
  conteudo jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview_url text, export_url text, parent_design_id uuid,
  status text DEFAULT 'rascunho', approval_status text DEFAULT 'rascunho',
  linked_post_id uuid REFERENCES public.comm_content_posts(id) ON DELETE SET NULL,
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_by uuid, updated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

-- AI IMAGES + USAGE + QUOTAS
CREATE TABLE IF NOT EXISTS public.comm_generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  brand_kit_id uuid REFERENCES public.comm_brand_kits(id) ON DELETE SET NULL,
  prompt text NOT NULL, prompt_revisado text,
  provider text DEFAULT 'lovable', model text, format text,
  storage_path text, public_url text,
  cost_credits numeric DEFAULT 0, tokens_in int DEFAULT 0, tokens_out int DEFAULT 0,
  status text DEFAULT 'ready', approval_status text DEFAULT 'rascunho',
  approved_by uuid, approved_at timestamptz, parent_image_id uuid,
  linked_post_id uuid REFERENCES public.comm_content_posts(id) ON DELETE SET NULL,
  linked_design_id uuid REFERENCES public.comm_generated_designs(id) ON DELETE SET NULL,
  rejection_reason text,
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  generated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, user_id uuid, provider text, model text, kind text NOT NULL,
  tokens_in int DEFAULT 0, tokens_out int DEFAULT 0, cost_credits numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_ai_quotas (
  company_id uuid PRIMARY KEY,
  monthly_image_limit int NOT NULL DEFAULT 200,
  monthly_text_limit int NOT NULL DEFAULT 5000,
  daily_image_limit int NOT NULL DEFAULT 50,
  blocklist text[] DEFAULT ARRAY[]::text[],
  updated_at timestamptz DEFAULT now()
);

-- CANVA
CREATE TABLE IF NOT EXISTS public.comm_canva_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  brand_kit_id uuid REFERENCES public.comm_brand_kits(id) ON DELETE SET NULL,
  briefing_id uuid, briefing_tipo text, titulo text, prompt_briefing text, formato text,
  canva_url text, canva_design_id text, exported_file_path text, exported_url text,
  status text DEFAULT 'em_canva', approval_status text DEFAULT 'rascunho',
  linked_post_id uuid REFERENCES public.comm_content_posts(id) ON DELETE SET NULL,
  linked_calendar_id uuid REFERENCES public.comm_editorial_calendar(id) ON DELETE SET NULL,
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_by uuid, updated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

-- PROMPT LIBRARY / IDEA / METRICS / PUBS
CREATE TABLE IF NOT EXISTS public.comm_prompt_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, nome text NOT NULL, categoria text, objetivo text, canal text,
  texto text NOT NULL, variaveis jsonb DEFAULT '[]'::jsonb,
  brand_kit_id uuid REFERENCES public.comm_brand_kits(id) ON DELETE SET NULL,
  status text DEFAULT 'ativo',
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_idea_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, ideia text NOT NULL, categoria text, origem text,
  campaign_id uuid REFERENCES public.comm_campaigns(id) ON DELETE SET NULL,
  prioridade text, status text DEFAULT 'novo', responsavel_id uuid, tags text[],
  observacoes text, votos int DEFAULT 0,
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  post_id uuid REFERENCES public.comm_content_posts(id) ON DELETE SET NULL,
  canal text, data_planejada timestamptz, data_publicada timestamptz, responsavel_id uuid,
  link_publicacao text, status text DEFAULT 'planejado', metricas jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean DEFAULT false, deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  publication_id uuid REFERENCES public.comm_publications(id) ON DELETE CASCADE,
  alcance int, impressoes int, curtidas int, comentarios int, compartilhamentos int,
  cliques int, leads int, inscricoes int, conversoes int, custo numeric,
  origem text, periodo_inicio date, periodo_fim date,
  created_at timestamptz DEFAULT now()
);

-- TRIGGERS updated_at
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'comm_module_settings','comm_module_permissions','comm_brand_kits','comm_content_posts',
    'comm_carousels','comm_newsletters','comm_internal_comms','comm_campaigns',
    'comm_product_items','comm_editorial_calendar','comm_approvals','comm_design_templates',
    'comm_generated_designs','comm_generated_images','comm_canva_designs',
    'comm_prompt_library','comm_idea_bank','comm_publications','comm_ai_quotas'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic()', t, t);
  END LOOP;
END $$;

-- SOFT DELETE
CREATE OR REPLACE FUNCTION public.comm_soft_delete(_table text, _id uuid, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE allowed text[] := ARRAY[
  'comm_brand_kits','comm_content_posts','comm_carousels','comm_newsletters',
  'comm_internal_comms','comm_campaigns','comm_product_items','comm_editorial_calendar',
  'comm_design_templates','comm_generated_designs','comm_generated_images',
  'comm_canva_designs','comm_prompt_library','comm_idea_bank','comm_publications'
];
  before_row jsonb; cid uuid;
BEGIN
  IF NOT (_table = ANY(allowed)) THEN RETURN jsonb_build_object('ok',false,'error','invalid_table'); END IF;
  IF _reason IS NULL OR length(btrim(_reason))<3 THEN RETURN jsonb_build_object('ok',false,'error','reason_required'); END IF;
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1',_table) INTO before_row USING _id;
  IF before_row IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  cid := NULLIF(before_row->>'company_id','')::uuid;
  IF cid IS NOT NULL AND NOT public.comm_can(auth.uid(), cid,'delete') THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  IF cid IS NULL AND NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'comunicacao_admin'::app_role)) THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  EXECUTE format('UPDATE public.%I SET is_deleted=true, deleted_at=now(), deleted_by=$1, delete_reason=$2 WHERE id=$3',_table)
    USING auth.uid(), _reason, _id;
  PERFORM public.comm_log_audit(cid,'soft_delete',_table,_table,_id::text,
    COALESCE(before_row->>'titulo', before_row->>'nome', before_row->>'assunto', _id::text), before_row, _reason);
  RETURN jsonb_build_object('ok',true);
END $fn$;

-- ENABLE RLS
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'comm_module_settings','comm_module_permissions','comm_admin_config','comm_audit_logs',
    'comm_brand_kits','comm_content_posts','comm_content_variants','comm_carousels','comm_carousel_slides',
    'comm_newsletters','comm_internal_comms','comm_campaigns','comm_product_items',
    'comm_editorial_calendar','comm_approvals','comm_design_templates','comm_generated_designs',
    'comm_generated_images','comm_ai_usage','comm_ai_quotas','comm_canva_designs',
    'comm_prompt_library','comm_idea_bank','comm_publications','comm_metrics'
  ]) LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t); END LOOP;
END $$;

DO $$
DECLARE
  ts text[] := ARRAY[
    'comm_brand_kits','comm_content_posts','comm_carousels','comm_newsletters',
    'comm_internal_comms','comm_campaigns','comm_product_items','comm_editorial_calendar',
    'comm_approvals','comm_generated_designs','comm_generated_images',
    'comm_canva_designs','comm_prompt_library','comm_idea_bank','comm_publications',
    'comm_metrics','comm_ai_usage','comm_module_settings','comm_module_permissions'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY ts LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_sel ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_ins ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_upd ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_del ON public.%I', t, t);
    EXECUTE format($f$CREATE POLICY %I_sel ON public.%I FOR SELECT TO authenticated USING (public.comm_can(auth.uid(), company_id, 'view'))$f$, t, t);
    EXECUTE format($f$CREATE POLICY %I_ins ON public.%I FOR INSERT TO authenticated WITH CHECK (public.comm_can(auth.uid(), company_id, 'create'))$f$, t, t);
    EXECUTE format($f$CREATE POLICY %I_upd ON public.%I FOR UPDATE TO authenticated USING (public.comm_can(auth.uid(), company_id, 'edit'))$f$, t, t);
    EXECUTE format($f$CREATE POLICY %I_del ON public.%I FOR DELETE TO authenticated USING (public.comm_can(auth.uid(), company_id, 'delete'))$f$, t, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS comm_content_variants_all ON public.comm_content_variants;
CREATE POLICY comm_content_variants_all ON public.comm_content_variants FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.comm_content_posts p WHERE p.id = post_id AND public.comm_can(auth.uid(), p.company_id, 'view')))
  WITH CHECK (EXISTS(SELECT 1 FROM public.comm_content_posts p WHERE p.id = post_id AND public.comm_can(auth.uid(), p.company_id, 'edit')));

DROP POLICY IF EXISTS comm_carousel_slides_all ON public.comm_carousel_slides;
CREATE POLICY comm_carousel_slides_all ON public.comm_carousel_slides FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.comm_carousels c WHERE c.id = carousel_id AND public.comm_can(auth.uid(), c.company_id, 'view')))
  WITH CHECK (EXISTS(SELECT 1 FROM public.comm_carousels c WHERE c.id = carousel_id AND public.comm_can(auth.uid(), c.company_id, 'edit')));

DROP POLICY IF EXISTS comm_design_templates_sel ON public.comm_design_templates;
CREATE POLICY comm_design_templates_sel ON public.comm_design_templates FOR SELECT TO authenticated
  USING (is_global = true OR public.comm_can(auth.uid(), company_id, 'view'));
DROP POLICY IF EXISTS comm_design_templates_mod ON public.comm_design_templates;
CREATE POLICY comm_design_templates_mod ON public.comm_design_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.comm_can(auth.uid(), company_id, 'manage_templates'))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.comm_can(auth.uid(), company_id, 'manage_templates'));

DROP POLICY IF EXISTS comm_audit_logs_sel ON public.comm_audit_logs;
CREATE POLICY comm_audit_logs_sel ON public.comm_audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.comm_can(auth.uid(), company_id, 'view'));

DROP POLICY IF EXISTS comm_ai_quotas_sel ON public.comm_ai_quotas;
CREATE POLICY comm_ai_quotas_sel ON public.comm_ai_quotas FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.comm_can(auth.uid(), company_id, 'manage_settings'));
DROP POLICY IF EXISTS comm_ai_quotas_mod ON public.comm_ai_quotas;
CREATE POLICY comm_ai_quotas_mod ON public.comm_ai_quotas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.comm_can(auth.uid(), company_id, 'manage_settings'))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.comm_can(auth.uid(), company_id, 'manage_settings'));

DROP POLICY IF EXISTS comm_admin_config_all ON public.comm_admin_config;
CREATE POLICY comm_admin_config_all ON public.comm_admin_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('comm-generated-images','comm-generated-images', false)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('comm-design-exports','comm-design-exports', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS comm_imgs_sel ON storage.objects;
CREATE POLICY comm_imgs_sel ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('comm-generated-images','comm-design-exports'));
DROP POLICY IF EXISTS comm_imgs_ins ON storage.objects;
CREATE POLICY comm_imgs_ins ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('comm-generated-images','comm-design-exports'));
DROP POLICY IF EXISTS comm_imgs_del ON storage.objects;
CREATE POLICY comm_imgs_del ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('comm-generated-images','comm-design-exports') AND public.has_role(auth.uid(),'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_comm_posts_company ON public.comm_content_posts(company_id, status);
CREATE INDEX IF NOT EXISTS idx_comm_calendar_data ON public.comm_editorial_calendar(company_id, data_planejada);
CREATE INDEX IF NOT EXISTS idx_comm_imgs_company ON public.comm_generated_images(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_audit_company ON public.comm_audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_ai_usage ON public.comm_ai_usage(company_id, created_at DESC);
