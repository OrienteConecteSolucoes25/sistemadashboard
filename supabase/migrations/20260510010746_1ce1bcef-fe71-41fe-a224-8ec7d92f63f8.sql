
-- =========================================
-- Governança ART · Leva 1 (fundação)
-- =========================================

-- Permissões adicionais
ALTER TABLE public.crea_module_permissions
  ADD COLUMN IF NOT EXISTS can_governance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_governance_finance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_governance_audit boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_governance_import boolean NOT NULL DEFAULT false;

-- Atualiza crea_can para reconhecer permissões de Governança
CREATE OR REPLACE FUNCTION public.crea_can(_uid uuid, _company uuid, _action text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE perm record;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.has_role(_uid,'admin'::app_role) THEN RETURN true; END IF;
  IF public.has_role(_uid,'crea_admin'::app_role) THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _company IS NOT NULL AND public.is_company_admin(_uid, _company) THEN RETURN true; END IF;
  IF public.has_role(_uid,'crea_auditor'::app_role) AND _action IN ('view','view_sensitive','governance','governance_audit') THEN
    IF _company IS NULL OR public.user_company(_uid) = _company THEN RETURN true; END IF;
  END IF;
  IF _company IS NULL THEN RETURN false; END IF;
  SELECT * INTO perm FROM public.crea_module_permissions WHERE user_id=_uid AND company_id=_company LIMIT 1;
  IF perm.id IS NULL THEN RETURN false; END IF;
  RETURN CASE _action
    WHEN 'view' THEN perm.can_view WHEN 'create' THEN perm.can_create
    WHEN 'edit' THEN perm.can_edit WHEN 'delete' THEN perm.can_delete
    WHEN 'import' THEN perm.can_import WHEN 'export' THEN perm.can_export
    WHEN 'view_sensitive' THEN perm.can_view_sensitive
    WHEN 'view_credentials' THEN perm.can_view_credentials
    WHEN 'manage_credentials' THEN perm.can_manage_credentials
    WHEN 'manage_norms' THEN perm.can_manage_norms
    WHEN 'approve_publication' THEN perm.can_approve_publication
    WHEN 'manage_ai_sources' THEN perm.can_manage_ai_sources
    WHEN 'governance' THEN perm.can_governance
    WHEN 'governance_finance' THEN perm.can_governance_finance
    WHEN 'governance_audit' THEN perm.can_governance_audit
    WHEN 'governance_import' THEN perm.can_governance_import
    ELSE false END;
END $function$;

-- Trigger genérica de updated_at já existe (set_updated_at_generic)

-- =====================
-- Cadastros por empresa
-- =====================

CREATE TABLE IF NOT EXISTS public.crea_gov_setores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  nome text NOT NULL,
  descricao text,
  cor text,
  status text NOT NULL DEFAULT 'ativo',
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  UNIQUE (company_id, nome)
);

CREATE TABLE IF NOT EXISTS public.crea_gov_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  nome text NOT NULL,
  cor text,
  regex_sugerido text,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  UNIQUE (company_id, nome)
);

CREATE TABLE IF NOT EXISTS public.crea_gov_escopos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  nome text NOT NULL,
  descricao text,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  UNIQUE (company_id, nome)
);

CREATE TABLE IF NOT EXISTS public.crea_gov_contratantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  nome text NOT NULL,
  cnpj text,
  cidade text, uf text,
  observacoes text,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid
);
CREATE INDEX IF NOT EXISTS idx_crea_gov_contratantes_company ON public.crea_gov_contratantes(company_id);
CREATE INDEX IF NOT EXISTS idx_crea_gov_contratantes_nome ON public.crea_gov_contratantes(company_id, lower(nome));

-- ==============================
-- Configuração por CREA (UF)
-- ==============================
CREATE TABLE IF NOT EXISTS public.crea_gov_creas_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uf text NOT NULL UNIQUE,
  nome text NOT NULL,
  layout_xls jsonb NOT NULL DEFAULT '{}'::jsonb,
  regras_extracao jsonb NOT NULL DEFAULT '{}'::jsonb,
  campos_personalizados jsonb NOT NULL DEFAULT '{}'::jsonb,
  taxa_padrao numeric,
  status text NOT NULL DEFAULT 'ativo',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.crea_gov_creas_config (uf, nome) VALUES
  ('AC','CREA-AC'),('AL','CREA-AL'),('AM','CREA-AM'),('AP','CREA-AP'),
  ('BA','CREA-BA'),('CE','CREA-CE'),('DF','CREA-DF'),('ES','CREA-ES'),
  ('GO','CREA-GO'),('MA','CREA-MA'),('MG','CREA-MG'),('MS','CREA-MS'),
  ('MT','CREA-MT'),('PA','CREA-PA'),('PB','CREA-PB'),('PE','CREA-PE'),
  ('PI','CREA-PI'),('PR','CREA-PR'),('RJ','CREA-RJ'),('RN','CREA-RN'),
  ('RO','CREA-RO'),('RR','CREA-RR'),('RS','CREA-RS'),('SC','CREA-SC'),
  ('SE','CREA-SE'),('SP','CREA-SP'),('TO','CREA-TO')
ON CONFLICT (uf) DO NOTHING;

-- =====================
-- Importações (histórico)
-- =====================
CREATE TABLE IF NOT EXISTS public.crea_gov_importacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  uf text,
  kind text NOT NULL,            -- arts_todas | generico | financeiro | profissional | empresa | contratante | pdf
  arquivo_path text,
  arquivo_nome text,
  total_linhas int DEFAULT 0,
  ok int DEFAULT 0,
  falhas int DEFAULT 0,
  mapeamento jsonb DEFAULT '{}'::jsonb,
  log jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pendente',
  ran_by uuid,
  ran_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crea_gov_imp_company ON public.crea_gov_importacoes(company_id, ran_at DESC);

-- =====================
-- ART (fato central)
-- =====================
CREATE TABLE IF NOT EXISTS public.crea_gov_arts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  numero text NOT NULL,
  uf text,
  crea_codigo text,
  tipo text, natureza text, participacao_tecnica text, forma_registro text,

  empresa_id uuid,         -- FK lógica para crea_companies_crea
  contratante_id uuid REFERENCES public.crea_gov_contratantes(id) ON DELETE SET NULL,
  rt_id uuid,              -- FK lógica para crea_responsible_technicians
  proprietario text,

  endereco text, cidade text, uf_obra text, cep text,
  observacao text,
  atividades_texto text,
  codigo_tos text, quantidade numeric, unidade_medida text,

  valor_taxa numeric, valor_pago numeric, valor_contrato numeric,
  centro_custo text,

  data_cadastro date, data_pagamento date, data_vencimento date, data_baixa date,
  ano int GENERATED ALWAYS AS (EXTRACT(YEAR FROM data_cadastro)::int) STORED,
  mes int GENERATED ALWAYS AS (EXTRACT(MONTH FROM data_cadastro)::int) STORED,

  status_analise text, status_baixa text, status_financeiro text, status_governanca text,

  boleto_numero text,
  arquivo_origem_id uuid REFERENCES public.crea_gov_importacoes(id) ON DELETE SET NULL,
  raw jsonb,
  hash_unico text,
  duplicado_de uuid,

  setor_principal_id uuid REFERENCES public.crea_gov_setores(id) ON DELETE SET NULL,
  setor_ia_sugerido_id uuid REFERENCES public.crea_gov_setores(id) ON DELETE SET NULL,
  escopo_id uuid REFERENCES public.crea_gov_escopos(id) ON DELETE SET NULL,
  escopo_ia_sugerido_id uuid REFERENCES public.crea_gov_escopos(id) ON DELETE SET NULL,
  classificado_por uuid,
  classificado_em timestamptz,

  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_crea_gov_arts_hash ON public.crea_gov_arts(hash_unico) WHERE hash_unico IS NOT NULL AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_crea_gov_arts_company_ano ON public.crea_gov_arts(company_id, ano);
CREATE INDEX IF NOT EXISTS idx_crea_gov_arts_numero_uf ON public.crea_gov_arts(numero, uf);
CREATE INDEX IF NOT EXISTS idx_crea_gov_arts_rt ON public.crea_gov_arts(rt_id);
CREATE INDEX IF NOT EXISTS idx_crea_gov_arts_empresa ON public.crea_gov_arts(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crea_gov_arts_contratante ON public.crea_gov_arts(contratante_id);
CREATE INDEX IF NOT EXISTS idx_crea_gov_arts_status ON public.crea_gov_arts(company_id, status_analise, status_financeiro);
CREATE INDEX IF NOT EXISTS idx_crea_gov_arts_raw ON public.crea_gov_arts USING gin(raw);

CREATE TABLE IF NOT EXISTS public.crea_gov_art_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  art_id uuid NOT NULL REFERENCES public.crea_gov_arts(id) ON DELETE CASCADE,
  codigo_tos text, descricao text, quantidade numeric, unidade_medida text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crea_gov_art_at_art ON public.crea_gov_art_atividades(art_id);

CREATE TABLE IF NOT EXISTS public.crea_gov_art_setores_extra (
  art_id uuid NOT NULL REFERENCES public.crea_gov_arts(id) ON DELETE CASCADE,
  setor_id uuid NOT NULL REFERENCES public.crea_gov_setores(id) ON DELETE CASCADE,
  PRIMARY KEY (art_id, setor_id)
);

CREATE TABLE IF NOT EXISTS public.crea_gov_art_tags (
  art_id uuid NOT NULL REFERENCES public.crea_gov_arts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.crea_gov_tags(id) ON DELETE CASCADE,
  origem text NOT NULL DEFAULT 'manual', -- manual | ia
  PRIMARY KEY (art_id, tag_id)
);

-- =====================
-- Pagamentos & conciliação
-- =====================
CREATE TABLE IF NOT EXISTS public.crea_gov_pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  uf text,
  numero_boleto text,
  valor numeric,
  data_pagamento date,
  data_vencimento date,
  sacado text,
  conciliado_art_id uuid REFERENCES public.crea_gov_arts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'aberto', -- aberto | conciliado | divergente | sem_par
  origem_importacao_id uuid REFERENCES public.crea_gov_importacoes(id) ON DELETE SET NULL,
  raw jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crea_gov_pag_company ON public.crea_gov_pagamentos(company_id, status);
CREATE INDEX IF NOT EXISTS idx_crea_gov_pag_boleto ON public.crea_gov_pagamentos(numero_boleto);

CREATE TABLE IF NOT EXISTS public.crea_gov_conciliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  art_id uuid REFERENCES public.crea_gov_arts(id) ON DELETE CASCADE,
  pagamento_id uuid REFERENCES public.crea_gov_pagamentos(id) ON DELETE CASCADE,
  origem text NOT NULL DEFAULT 'auto', -- auto | manual
  score numeric,
  motivo text,
  status text NOT NULL DEFAULT 'ok', -- ok | divergente | desfeito
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- Alertas / Auditoria
-- =====================
CREATE TABLE IF NOT EXISTS public.crea_gov_alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  tipo text NOT NULL,
  criticidade text NOT NULL DEFAULT 'medium', -- low | medium | high
  status text NOT NULL DEFAULT 'aberto',      -- aberto | em_tratativa | resolvido | ignorado
  responsavel_id uuid,
  art_id uuid REFERENCES public.crea_gov_arts(id) ON DELETE CASCADE,
  pagamento_id uuid REFERENCES public.crea_gov_pagamentos(id) ON DELETE SET NULL,
  prazo date,
  observacoes text,
  historico jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz, deleted_by uuid, delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crea_gov_alertas_company ON public.crea_gov_alertas(company_id, status, criticidade);

-- =====================
-- Regras de classificação (motor)
-- =====================
CREATE TABLE IF NOT EXISTS public.crea_gov_classificacao_regras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  palavra text NOT NULL,
  is_regex boolean NOT NULL DEFAULT false,
  setor_id uuid REFERENCES public.crea_gov_setores(id) ON DELETE SET NULL,
  tag_id uuid REFERENCES public.crea_gov_tags(id) ON DELETE SET NULL,
  escopo_id uuid REFERENCES public.crea_gov_escopos(id) ON DELETE SET NULL,
  peso numeric NOT NULL DEFAULT 1,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crea_gov_regras_company ON public.crea_gov_classificacao_regras(company_id, ativa);

-- =====================
-- Filtros por usuário
-- =====================
CREATE TABLE IF NOT EXISTS public.crea_gov_user_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  nome text NOT NULL,
  filtros jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id, nome)
);

-- =====================
-- Triggers updated_at
-- =====================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'crea_gov_setores','crea_gov_tags','crea_gov_escopos','crea_gov_contratantes',
    'crea_gov_creas_config','crea_gov_importacoes','crea_gov_arts',
    'crea_gov_pagamentos','crea_gov_alertas','crea_gov_classificacao_regras','crea_gov_user_filters'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic()', t);
  END LOOP;
END $$;

-- =====================
-- RLS
-- =====================
ALTER TABLE public.crea_gov_setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_escopos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_contratantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_creas_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_importacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_arts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_art_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_art_setores_extra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_art_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_conciliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_classificacao_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crea_gov_user_filters ENABLE ROW LEVEL SECURITY;

-- Tabelas multiempresa: SELECT/INSERT/UPDATE/DELETE controlados por crea_can
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'crea_gov_setores','crea_gov_tags','crea_gov_escopos','crea_gov_contratantes',
    'crea_gov_importacoes','crea_gov_arts','crea_gov_pagamentos','crea_gov_alertas',
    'crea_gov_classificacao_regras'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_select" ON public.%1$s', t);
    EXECUTE format('CREATE POLICY "%1$s_select" ON public.%1$s FOR SELECT USING (public.crea_can(auth.uid(), company_id, ''view''))', t);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_insert" ON public.%1$s', t);
    EXECUTE format('CREATE POLICY "%1$s_insert" ON public.%1$s FOR INSERT WITH CHECK (public.crea_can(auth.uid(), company_id, ''create''))', t);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_update" ON public.%1$s', t);
    EXECUTE format('CREATE POLICY "%1$s_update" ON public.%1$s FOR UPDATE USING (public.crea_can(auth.uid(), company_id, ''edit'')) WITH CHECK (public.crea_can(auth.uid(), company_id, ''edit''))', t);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_delete" ON public.%1$s', t);
    EXECUTE format('CREATE POLICY "%1$s_delete" ON public.%1$s FOR DELETE USING (public.crea_can(auth.uid(), company_id, ''delete''))', t);
  END LOOP;
END $$;

-- Tabelas filhas (por art_id) — herda da ART
DROP POLICY IF EXISTS "crea_gov_art_atividades_all" ON public.crea_gov_art_atividades;
CREATE POLICY "crea_gov_art_atividades_all" ON public.crea_gov_art_atividades
  FOR ALL USING (EXISTS (SELECT 1 FROM public.crea_gov_arts a WHERE a.id = art_id AND public.crea_can(auth.uid(), a.company_id, 'view')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.crea_gov_arts a WHERE a.id = art_id AND public.crea_can(auth.uid(), a.company_id, 'edit')));

DROP POLICY IF EXISTS "crea_gov_art_setores_extra_all" ON public.crea_gov_art_setores_extra;
CREATE POLICY "crea_gov_art_setores_extra_all" ON public.crea_gov_art_setores_extra
  FOR ALL USING (EXISTS (SELECT 1 FROM public.crea_gov_arts a WHERE a.id = art_id AND public.crea_can(auth.uid(), a.company_id, 'view')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.crea_gov_arts a WHERE a.id = art_id AND public.crea_can(auth.uid(), a.company_id, 'edit')));

DROP POLICY IF EXISTS "crea_gov_art_tags_all" ON public.crea_gov_art_tags;
CREATE POLICY "crea_gov_art_tags_all" ON public.crea_gov_art_tags
  FOR ALL USING (EXISTS (SELECT 1 FROM public.crea_gov_arts a WHERE a.id = art_id AND public.crea_can(auth.uid(), a.company_id, 'view')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.crea_gov_arts a WHERE a.id = art_id AND public.crea_can(auth.uid(), a.company_id, 'edit')));

-- Conciliações
DROP POLICY IF EXISTS "crea_gov_conciliacoes_select" ON public.crea_gov_conciliacoes;
CREATE POLICY "crea_gov_conciliacoes_select" ON public.crea_gov_conciliacoes FOR SELECT USING (public.crea_can(auth.uid(), company_id, 'view'));
DROP POLICY IF EXISTS "crea_gov_conciliacoes_write" ON public.crea_gov_conciliacoes;
CREATE POLICY "crea_gov_conciliacoes_write" ON public.crea_gov_conciliacoes FOR ALL USING (public.crea_can(auth.uid(), company_id, 'governance_finance')) WITH CHECK (public.crea_can(auth.uid(), company_id, 'governance_finance'));

-- CREAs config: leitura para qualquer autenticado, escrita só admin
DROP POLICY IF EXISTS "crea_gov_creas_config_select" ON public.crea_gov_creas_config;
CREATE POLICY "crea_gov_creas_config_select" ON public.crea_gov_creas_config FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "crea_gov_creas_config_write" ON public.crea_gov_creas_config;
CREATE POLICY "crea_gov_creas_config_write" ON public.crea_gov_creas_config FOR ALL USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'crea_admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'crea_admin'::app_role));

-- Filtros do usuário: cada um vê e edita os seus
DROP POLICY IF EXISTS "crea_gov_user_filters_self" ON public.crea_gov_user_filters;
CREATE POLICY "crea_gov_user_filters_self" ON public.crea_gov_user_filters FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================
-- crea_soft_delete: aceitar novas tabelas
-- =====================
CREATE OR REPLACE FUNCTION public.crea_soft_delete(_table text, _id uuid, _reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE allowed text[] := ARRAY[
  'crea_companies_crea','crea_engineers','crea_responsible_technicians','crea_arts','crea_protocols',
  'crea_certificates','crea_cats','crea_deregistrations','crea_documents','crea_treatments',
  'crea_deadlines','crea_credentials','crea_ai_sources','crea_norms','crea_links_oficiais',
  'crea_gov_arts','crea_gov_setores','crea_gov_tags','crea_gov_escopos','crea_gov_contratantes',
  'crea_gov_pagamentos','crea_gov_alertas'
];
  before_row jsonb; cid uuid;
BEGIN
  IF NOT (_table = ANY(allowed)) THEN RETURN jsonb_build_object('ok',false,'error','invalid_table'); END IF;
  IF _reason IS NULL OR length(btrim(_reason))<3 THEN RETURN jsonb_build_object('ok',false,'error','reason_required'); END IF;
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1',_table) INTO before_row USING _id;
  IF before_row IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  cid := NULLIF(before_row->>'company_id','')::uuid;
  IF cid IS NOT NULL AND NOT public.crea_can(auth.uid(), cid,'delete') THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  IF cid IS NULL AND NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'crea_admin'::app_role)) THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  EXECUTE format('UPDATE public.%I SET is_deleted=true, deleted_at=now(), deleted_by=$1, delete_reason=$2 WHERE id=$3',_table)
    USING auth.uid(), _reason, _id;
  PERFORM public.crea_log_audit(cid,'soft_delete',_table,_table,_id::text, COALESCE(before_row->>'numero', before_row->>'nome', before_row->>'titulo', _id::text), before_row, _reason);
  RETURN jsonb_build_object('ok',true);
END $function$;
