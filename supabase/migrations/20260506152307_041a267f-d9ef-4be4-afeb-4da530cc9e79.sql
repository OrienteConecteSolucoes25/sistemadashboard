
-- ============= F5: Ponto / HE / Banco de Horas =============

CREATE TABLE IF NOT EXISTS public.hrdp_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.hrdp_employees(id) ON DELETE CASCADE,
  data_ref date NOT NULL,
  tipo text NOT NULL,                       -- entrada, almoco_saida, almoco_retorno, saida, ajuste
  hora time NOT NULL,
  origem text DEFAULT 'manual',             -- manual, web, gestor, importacao
  latitude numeric,
  longitude numeric,
  justificativa text,
  ajuste_de uuid REFERENCES public.hrdp_time_entries(id) ON DELETE SET NULL,
  ajuste_aprovado_por uuid,
  ajuste_aprovado_em timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hrdp_time_emp_data ON public.hrdp_time_entries(employee_id, data_ref);
CREATE INDEX IF NOT EXISTS idx_hrdp_time_company ON public.hrdp_time_entries(company_id);

ALTER TABLE public.hrdp_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rhdp time read"
ON public.hrdp_time_entries FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'view')
  OR EXISTS (SELECT 1 FROM public.hrdp_employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
  OR public.hrdp_is_manager_of(auth.uid(), employee_id)
);

CREATE POLICY "rhdp time insert self"
ON public.hrdp_time_entries FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'edit')
  OR EXISTS (SELECT 1 FROM public.hrdp_employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
);

CREATE POLICY "rhdp time update admin"
ON public.hrdp_time_entries FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'edit')
)
WITH CHECK (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'edit')
);

CREATE POLICY "rhdp time delete admin"
ON public.hrdp_time_entries FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'edit')
);

-- ----- Hora Extra -----
CREATE TABLE IF NOT EXISTS public.hrdp_overtime_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.hrdp_employees(id) ON DELETE CASCADE,
  data_ref date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  total_horas numeric,                       -- calculado em UI/trigger
  tipo text NOT NULL DEFAULT 'dia_util',     -- dia_util, fim_de_semana, feriado, noturno
  motivo text,
  destino text NOT NULL DEFAULT 'pagar',     -- pagar, banco_horas
  status text NOT NULL DEFAULT 'pendente',   -- pendente, aprovada, recusada
  aprovador_id uuid,
  aprovado_em timestamptz,
  obs_aprovador text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hrdp_he_emp ON public.hrdp_overtime_requests(employee_id, data_ref);
CREATE INDEX IF NOT EXISTS idx_hrdp_he_status ON public.hrdp_overtime_requests(status);

CREATE TRIGGER trg_hrdp_he_updated
  BEFORE UPDATE ON public.hrdp_overtime_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

ALTER TABLE public.hrdp_overtime_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rhdp he read"
ON public.hrdp_overtime_requests FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'view')
  OR EXISTS (SELECT 1 FROM public.hrdp_employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
  OR public.hrdp_is_manager_of(auth.uid(), employee_id)
);

CREATE POLICY "rhdp he insert"
ON public.hrdp_overtime_requests FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'edit')
  OR EXISTS (SELECT 1 FROM public.hrdp_employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
  OR public.hrdp_is_manager_of(auth.uid(), employee_id)
);

CREATE POLICY "rhdp he update approver"
ON public.hrdp_overtime_requests FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'approve')
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'edit')
  OR public.hrdp_is_manager_of(auth.uid(), employee_id)
)
WITH CHECK (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'approve')
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'edit')
  OR public.hrdp_is_manager_of(auth.uid(), employee_id)
);

-- ----- Banco de Horas -----
CREATE TABLE IF NOT EXISTS public.hrdp_time_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.hrdp_employees(id) ON DELETE CASCADE,
  data_ref date NOT NULL,
  horas numeric NOT NULL,                    -- positivo = crédito, negativo = débito/compensação
  tipo text NOT NULL DEFAULT 'credito',      -- credito, compensacao, ajuste, expirado
  origem_he uuid REFERENCES public.hrdp_overtime_requests(id) ON DELETE SET NULL,
  descricao text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hrdp_bank_emp ON public.hrdp_time_bank(employee_id, data_ref);

ALTER TABLE public.hrdp_time_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rhdp bank read"
ON public.hrdp_time_bank FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'view')
  OR EXISTS (SELECT 1 FROM public.hrdp_employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
  OR public.hrdp_is_manager_of(auth.uid(), employee_id)
);

CREATE POLICY "rhdp bank write admin"
ON public.hrdp_time_bank FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'edit')
)
WITH CHECK (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'ponto', 'edit')
);
