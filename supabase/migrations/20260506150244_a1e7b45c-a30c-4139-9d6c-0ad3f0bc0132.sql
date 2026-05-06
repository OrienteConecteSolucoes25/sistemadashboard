
-- Add fine-grained permission columns
ALTER TABLE public.hrdp_module_permissions
  ADD COLUMN IF NOT EXISTS can_create boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_delete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_import boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_export boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_settings boolean NOT NULL DEFAULT false;

-- hrdp_employees
CREATE TABLE IF NOT EXISTS public.hrdp_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid,
  nome text NOT NULL,
  cpf text,
  rg text,
  email text,
  telefone text,
  cargo text,
  setor text,
  gestor_id uuid REFERENCES public.hrdp_employees(id) ON DELETE SET NULL,
  vinculo text DEFAULT 'CLT',
  data_admissao date,
  data_desligamento date,
  status text NOT NULL DEFAULT 'ativo',
  salario numeric(12,2),
  dados_bancarios jsonb DEFAULT '{}'::jsonb,
  endereco jsonb DEFAULT '{}'::jsonb,
  observacoes text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hrdp_employees_company ON public.hrdp_employees(company_id);
CREATE INDEX IF NOT EXISTS idx_hrdp_employees_user ON public.hrdp_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_hrdp_employees_gestor ON public.hrdp_employees(gestor_id);

ALTER TABLE public.hrdp_employees ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_hrdp_employees_updated ON public.hrdp_employees;
CREATE TRIGGER trg_hrdp_employees_updated
  BEFORE UPDATE ON public.hrdp_employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

-- Helper: is the user a manager of this employee row?
CREATE OR REPLACE FUNCTION public.hrdp_is_manager_of(_uid uuid, _employee_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hrdp_employees mgr
    JOIN public.hrdp_employees emp ON emp.gestor_id = mgr.id
    WHERE mgr.user_id = _uid AND emp.id = _employee_id
  )
$$;

-- RLS: SELECT
DROP POLICY IF EXISTS "hrdp_employees select" ON public.hrdp_employees;
CREATE POLICY "hrdp_employees select" ON public.hrdp_employees
FOR SELECT TO authenticated
USING (
  public.hrdp_can(auth.uid(), company_id, 'colaboradores', 'view')
  OR user_id = auth.uid()
  OR public.hrdp_is_manager_of(auth.uid(), id)
);

-- RLS: INSERT
DROP POLICY IF EXISTS "hrdp_employees insert" ON public.hrdp_employees;
CREATE POLICY "hrdp_employees insert" ON public.hrdp_employees
FOR INSERT TO authenticated
WITH CHECK (public.hrdp_can(auth.uid(), company_id, 'colaboradores', 'edit'));

-- RLS: UPDATE
DROP POLICY IF EXISTS "hrdp_employees update" ON public.hrdp_employees;
CREATE POLICY "hrdp_employees update" ON public.hrdp_employees
FOR UPDATE TO authenticated
USING (public.hrdp_can(auth.uid(), company_id, 'colaboradores', 'edit'))
WITH CHECK (public.hrdp_can(auth.uid(), company_id, 'colaboradores', 'edit'));

-- RLS: DELETE (somente admin OCS — usar soft delete para o resto)
DROP POLICY IF EXISTS "hrdp_employees delete" ON public.hrdp_employees;
CREATE POLICY "hrdp_employees delete" ON public.hrdp_employees
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
