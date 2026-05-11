
CREATE TABLE IF NOT EXISTS public.crea_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  regiao text NOT NULL,
  rt_nome text NOT NULL,
  senha text,
  observacoes text,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crea_logins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crea_logins_select" ON public.crea_logins
  FOR SELECT TO authenticated
  USING (public.crea_can(auth.uid(), company_id, 'view'));

CREATE POLICY "crea_logins_insert" ON public.crea_logins
  FOR INSERT TO authenticated
  WITH CHECK (public.crea_can(auth.uid(), company_id, 'create'));

CREATE POLICY "crea_logins_update" ON public.crea_logins
  FOR UPDATE TO authenticated
  USING (public.crea_can(auth.uid(), company_id, 'edit'))
  WITH CHECK (public.crea_can(auth.uid(), company_id, 'edit'));

CREATE POLICY "crea_logins_delete" ON public.crea_logins
  FOR DELETE TO authenticated
  USING (public.crea_can(auth.uid(), company_id, 'delete'));

CREATE TRIGGER trg_crea_logins_updated_at
  BEFORE UPDATE ON public.crea_logins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

CREATE INDEX IF NOT EXISTS idx_crea_logins_company ON public.crea_logins(company_id) WHERE is_deleted = false;
