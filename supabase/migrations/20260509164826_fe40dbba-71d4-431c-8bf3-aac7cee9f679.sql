-- Admin config table (if not exists) for comm module
CREATE TABLE IF NOT EXISTS public.comm_admin_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.comm_admin_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comm_admin_config admin only" ON public.comm_admin_config;
CREATE POLICY "comm_admin_config admin only" ON public.comm_admin_config
  FOR ALL USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'comunicacao_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'comunicacao_admin'::app_role));

-- Social accounts
CREATE TABLE IF NOT EXISTS public.comm_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_brand_id uuid,
  provider text NOT NULL CHECK (provider IN ('instagram','facebook','linkedin','tiktok','x','youtube')),
  account_name text NOT NULL,
  account_handle text,
  external_id text,
  page_id text,
  scopes text[],
  token_enc bytea,
  token_expires_at timestamptz,
  refresh_token_enc bytea,
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','expired','revoked','error')),
  last_error text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text
);
ALTER TABLE public.comm_social_accounts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_comm_social_accounts_company ON public.comm_social_accounts(company_id) WHERE is_deleted = false;

DROP POLICY IF EXISTS "social_accounts view" ON public.comm_social_accounts;
CREATE POLICY "social_accounts view" ON public.comm_social_accounts
  FOR SELECT USING (public.comm_can(auth.uid(), company_id, 'view'));
DROP POLICY IF EXISTS "social_accounts manage" ON public.comm_social_accounts;
CREATE POLICY "social_accounts manage" ON public.comm_social_accounts
  FOR ALL USING (public.comm_can(auth.uid(), company_id, 'manage_settings'))
  WITH CHECK (public.comm_can(auth.uid(), company_id, 'manage_settings'));

-- Publish queue
CREATE TABLE IF NOT EXISTS public.comm_social_publish_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_brand_id uuid,
  social_account_id uuid REFERENCES public.comm_social_accounts(id) ON DELETE CASCADE,
  entidade_tipo text NOT NULL,
  entidade_id uuid NOT NULL,
  caption text,
  media_urls text[],
  scheduled_for timestamptz,
  status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado','enviando','publicado','erro','cancelado')),
  external_post_id text,
  external_url text,
  last_error text,
  attempts int NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
ALTER TABLE public.comm_social_publish_queue ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_comm_social_queue_company ON public.comm_social_publish_queue(company_id, status);
CREATE INDEX IF NOT EXISTS idx_comm_social_queue_scheduled ON public.comm_social_publish_queue(scheduled_for) WHERE status = 'agendado';

DROP POLICY IF EXISTS "social_queue view" ON public.comm_social_publish_queue;
CREATE POLICY "social_queue view" ON public.comm_social_publish_queue
  FOR SELECT USING (public.comm_can(auth.uid(), company_id, 'view'));
DROP POLICY IF EXISTS "social_queue manage" ON public.comm_social_publish_queue;
CREATE POLICY "social_queue manage" ON public.comm_social_publish_queue
  FOR ALL USING (public.comm_can(auth.uid(), company_id, 'publish'))
  WITH CHECK (public.comm_can(auth.uid(), company_id, 'publish'));

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_comm_social_accounts_updated ON public.comm_social_accounts;
CREATE TRIGGER trg_comm_social_accounts_updated BEFORE UPDATE ON public.comm_social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
DROP TRIGGER IF EXISTS trg_comm_social_queue_updated ON public.comm_social_publish_queue;
CREATE TRIGGER trg_comm_social_queue_updated BEFORE UPDATE ON public.comm_social_publish_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

-- Save (encrypt) social account token
CREATE OR REPLACE FUNCTION public.comm_social_save_account(
  _id uuid, _company uuid, _client_brand uuid, _provider text,
  _account_name text, _account_handle text, _external_id text, _page_id text,
  _scopes text[], _token text, _refresh_token text, _expires_at timestamptz,
  _metadata jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE mk text; tok bytea; rtok bytea; new_id uuid;
BEGIN
  IF NOT public.comm_can(auth.uid(), _company, 'manage_settings') THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  SELECT value INTO mk FROM public.comm_admin_config WHERE key='social_master_key';
  IF mk IS NULL THEN RETURN jsonb_build_object('ok',false,'error','master_key_missing'); END IF;
  IF _token IS NOT NULL AND length(_token) > 0 THEN tok := pgp_sym_encrypt(_token, mk); END IF;
  IF _refresh_token IS NOT NULL AND length(_refresh_token) > 0 THEN rtok := pgp_sym_encrypt(_refresh_token, mk); END IF;

  IF _id IS NULL THEN
    INSERT INTO public.comm_social_accounts(
      company_id, client_brand_id, provider, account_name, account_handle, external_id, page_id,
      scopes, token_enc, refresh_token_enc, token_expires_at, metadata, status, created_by, updated_by
    ) VALUES (
      _company, _client_brand, _provider, _account_name, _account_handle, _external_id, _page_id,
      _scopes, tok, rtok, _expires_at, COALESCE(_metadata,'{}'::jsonb), 'connected', auth.uid(), auth.uid()
    ) RETURNING id INTO new_id;
    PERFORM public.comm_log_audit(_company,'social_connect','comm.integracoes','comm_social_accounts', new_id::text, _account_name, jsonb_build_object('provider',_provider), NULL);
    RETURN jsonb_build_object('ok',true,'id',new_id);
  ELSE
    UPDATE public.comm_social_accounts SET
      client_brand_id = _client_brand, provider = _provider, account_name = _account_name,
      account_handle = _account_handle, external_id = _external_id, page_id = _page_id, scopes = _scopes,
      token_enc = COALESCE(tok, token_enc), refresh_token_enc = COALESCE(rtok, refresh_token_enc),
      token_expires_at = COALESCE(_expires_at, token_expires_at),
      metadata = COALESCE(_metadata, metadata), status = 'connected', last_error = NULL,
      updated_by = auth.uid(), updated_at = now()
    WHERE id = _id;
    PERFORM public.comm_log_audit(_company,'social_update','comm.integracoes','comm_social_accounts', _id::text, _account_name, jsonb_build_object('provider',_provider), NULL);
    RETURN jsonb_build_object('ok',true,'id',_id);
  END IF;
END $$;

-- Set master key (admin only)
CREATE OR REPLACE FUNCTION public.comm_social_set_master_key(_pwd text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin'::app_role) THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  IF _pwd IS NULL OR length(_pwd) < 12 THEN RETURN jsonb_build_object('ok',false,'error','key_too_short'); END IF;
  INSERT INTO public.comm_admin_config(key,value,updated_at,updated_by)
    VALUES('social_master_key', _pwd, now(), auth.uid())
    ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=now(), updated_by=auth.uid();
  RETURN jsonb_build_object('ok',true);
END $$;