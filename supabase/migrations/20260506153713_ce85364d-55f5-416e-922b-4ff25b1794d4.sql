-- ============ Tabelas de Férias e Provisão ============

CREATE TABLE public.hrdp_vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.hrdp_employees(id) ON DELETE CASCADE,
  periodo_aquisitivo_inicio date NOT NULL,
  periodo_aquisitivo_fim date NOT NULL,
  data_inicio date,
  data_fim date,
  dias_programados int DEFAULT 0,
  dias_abono int DEFAULT 0,
  adiantamento_13 boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pendente',
  aprovador_id uuid,
  aprovado_em timestamptz,
  observacoes text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text
);

CREATE INDEX idx_hrdp_vac_employee ON public.hrdp_vacations(employee_id);
CREATE INDEX idx_hrdp_vac_company ON public.hrdp_vacations(company_id);
CREATE INDEX idx_hrdp_vac_status ON public.hrdp_vacations(status);

ALTER TABLE public.hrdp_vacations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vacations select" ON public.hrdp_vacations FOR SELECT TO authenticated
USING (
  hrdp_can(auth.uid(), company_id, 'ferias', 'view')
  OR hrdp_is_manager_of(auth.uid(), employee_id)
  OR EXISTS (SELECT 1 FROM public.hrdp_employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
);

CREATE POLICY "vacations insert" ON public.hrdp_vacations FOR INSERT TO authenticated
WITH CHECK (
  hrdp_can(auth.uid(), company_id, 'ferias', 'edit')
  OR hrdp_is_manager_of(auth.uid(), employee_id)
  OR EXISTS (SELECT 1 FROM public.hrdp_employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
);

CREATE POLICY "vacations update" ON public.hrdp_vacations FOR UPDATE TO authenticated
USING (
  hrdp_can(auth.uid(), company_id, 'ferias', 'edit')
  OR hrdp_can(auth.uid(), company_id, 'ferias', 'approve')
  OR hrdp_is_manager_of(auth.uid(), employee_id)
);

CREATE POLICY "vacations delete" ON public.hrdp_vacations FOR DELETE TO authenticated
USING (hrdp_can(auth.uid(), company_id, 'ferias', 'edit'));

CREATE TRIGGER trg_hrdp_vac_upd BEFORE UPDATE ON public.hrdp_vacations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();


CREATE TABLE public.hrdp_vacation_provisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.hrdp_employees(id) ON DELETE CASCADE,
  competencia text NOT NULL,
  dias_direito numeric DEFAULT 0,
  dias_gozados numeric DEFAULT 0,
  saldo_dias numeric DEFAULT 0,
  salario_base numeric DEFAULT 0,
  valor_estimado numeric DEFAULT 0,
  valor_adicional_um_terco numeric DEFAULT 0,
  observacoes text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, competencia)
);

CREATE INDEX idx_hrdp_vacprov_company ON public.hrdp_vacation_provisions(company_id);
CREATE INDEX idx_hrdp_vacprov_employee ON public.hrdp_vacation_provisions(employee_id);

ALTER TABLE public.hrdp_vacation_provisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vacprov select" ON public.hrdp_vacation_provisions FOR SELECT TO authenticated
USING (
  hrdp_can(auth.uid(), company_id, 'ferias', 'view')
  OR hrdp_can(auth.uid(), company_id, 'ferias', 'view_sensitive')
  OR hrdp_is_manager_of(auth.uid(), employee_id)
);

CREATE POLICY "vacprov write" ON public.hrdp_vacation_provisions FOR ALL TO authenticated
USING (hrdp_can(auth.uid(), company_id, 'ferias', 'edit'))
WITH CHECK (hrdp_can(auth.uid(), company_id, 'ferias', 'edit'));

CREATE TRIGGER trg_hrdp_vacprov_upd BEFORE UPDATE ON public.hrdp_vacation_provisions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();