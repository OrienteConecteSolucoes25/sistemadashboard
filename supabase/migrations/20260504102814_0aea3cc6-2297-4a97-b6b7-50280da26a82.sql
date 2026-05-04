
-- 1) shared_records jsonb (espelho do Oriente)
CREATE TABLE IF NOT EXISTS public.eng_shared_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eng_shared_records_kind ON public.eng_shared_records(kind);
CREATE INDEX IF NOT EXISTS idx_eng_shared_records_created_at ON public.eng_shared_records(created_at DESC);

ALTER TABLE public.eng_shared_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read eng_shared_records" ON public.eng_shared_records;
CREATE POLICY "auth read eng_shared_records" ON public.eng_shared_records
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "edit eng_shared_records" ON public.eng_shared_records;
CREATE POLICY "edit eng_shared_records" ON public.eng_shared_records
  FOR ALL TO authenticated
  USING (public.eng_can_edit(auth.uid()))
  WITH CHECK (public.eng_can_edit(auth.uid()));

DROP TRIGGER IF EXISTS trg_eng_shared_records_updated_at ON public.eng_shared_records;
CREATE TRIGGER trg_eng_shared_records_updated_at
  BEFORE UPDATE ON public.eng_shared_records
  FOR EACH ROW EXECUTE FUNCTION public.eng_set_updated_at();

-- 2) solicitacao_sc_rc (tabela tipada do Oriente)
CREATE TABLE IF NOT EXISTS public.eng_solicitacao_sc_rc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicit_id uuid NOT NULL,
  tipo_documento text NOT NULL,
  numero_documento text NOT NULL,
  categoria text,
  conta_financeira text,
  centro_custo text,
  observacao text,
  status text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eng_scrc_solicit ON public.eng_solicitacao_sc_rc(solicit_id);

ALTER TABLE public.eng_solicitacao_sc_rc ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read eng_scrc" ON public.eng_solicitacao_sc_rc;
CREATE POLICY "auth read eng_scrc" ON public.eng_solicitacao_sc_rc
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "edit eng_scrc" ON public.eng_solicitacao_sc_rc;
CREATE POLICY "edit eng_scrc" ON public.eng_solicitacao_sc_rc
  FOR ALL TO authenticated
  USING (public.eng_can_edit(auth.uid()))
  WITH CHECK (public.eng_can_edit(auth.uid()));

DROP TRIGGER IF EXISTS trg_eng_scrc_updated_at ON public.eng_solicitacao_sc_rc;
CREATE TRIGGER trg_eng_scrc_updated_at
  BEFORE UPDATE ON public.eng_solicitacao_sc_rc
  FOR EACH ROW EXECUTE FUNCTION public.eng_set_updated_at();

-- 3) RPC log_audit (compat com lib/audit.ts do Oriente)
CREATE OR REPLACE FUNCTION public.eng_log_audit(
  _acao text,
  _modulo text,
  _entidade_tipo text DEFAULT NULL,
  _entidade_id text DEFAULT NULL,
  _nome_entidade text DEFAULT NULL,
  _dados_antes jsonb DEFAULT NULL,
  _dados_depois jsonb DEFAULT NULL,
  _ip_origem text DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _observacoes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.eng_auditoria (acao, modulo, observacoes, user_id, payload)
  VALUES (
    _acao,
    _modulo,
    _observacoes,
    auth.uid(),
    jsonb_build_object(
      'entidade_tipo', _entidade_tipo,
      'entidade_id', _entidade_id,
      'nome_entidade', _nome_entidade,
      'dados_antes', _dados_antes,
      'dados_depois', _dados_depois,
      'ip_origem', _ip_origem,
      'user_agent', _user_agent
    )
  );
END $$;
