
-- Fechamentos mensais
CREATE TABLE public.hrdp_payroll_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  competencia text NOT NULL, -- AAAA-MM
  status text NOT NULL DEFAULT 'aberto', -- aberto | em_conferencia | fechado | reaberto
  total_proventos numeric(14,2) NOT NULL DEFAULT 0,
  total_descontos numeric(14,2) NOT NULL DEFAULT 0,
  total_liquido numeric(14,2) NOT NULL DEFAULT 0,
  qtd_colaboradores integer NOT NULL DEFAULT 0,
  observacoes text,
  fechado_em timestamptz,
  fechado_por uuid,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, competencia)
);

CREATE INDEX idx_hrdp_payroll_closings_company ON public.hrdp_payroll_closings(company_id, competencia);

ALTER TABLE public.hrdp_payroll_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_closings_view"
  ON public.hrdp_payroll_closings FOR SELECT TO authenticated
  USING (public.hrdp_can(auth.uid(), company_id, 'folha', 'view'));

CREATE POLICY "payroll_closings_insert"
  ON public.hrdp_payroll_closings FOR INSERT TO authenticated
  WITH CHECK (public.hrdp_can(auth.uid(), company_id, 'folha', 'edit'));

CREATE POLICY "payroll_closings_update"
  ON public.hrdp_payroll_closings FOR UPDATE TO authenticated
  USING (public.hrdp_can(auth.uid(), company_id, 'folha', 'edit'));

CREATE TRIGGER trg_hrdp_payroll_closings_updated_at
  BEFORE UPDATE ON public.hrdp_payroll_closings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

-- Holerites individuais
CREATE TABLE public.hrdp_payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  closing_id uuid REFERENCES public.hrdp_payroll_closings(id) ON DELETE SET NULL,
  employee_id uuid NOT NULL,
  competencia text NOT NULL,
  salario_base numeric(14,2) NOT NULL DEFAULT 0,
  proventos numeric(14,2) NOT NULL DEFAULT 0,
  descontos numeric(14,2) NOT NULL DEFAULT 0,
  liquido numeric(14,2) NOT NULL DEFAULT 0,
  rubricas jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{tipo, codigo, descricao, valor}]
  pdf_path text, -- bucket hrdp-private
  status text NOT NULL DEFAULT 'rascunho', -- rascunho | conferido | publicado
  publicado_em timestamptz,
  observacoes text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, employee_id, competencia)
);

CREATE INDEX idx_hrdp_payslips_company ON public.hrdp_payslips(company_id, competencia);
CREATE INDEX idx_hrdp_payslips_employee ON public.hrdp_payslips(employee_id, competencia);

ALTER TABLE public.hrdp_payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payslips_view"
  ON public.hrdp_payslips FOR SELECT TO authenticated
  USING (
    public.hrdp_can(auth.uid(), company_id, 'folha', 'view')
    OR public.hrdp_is_self_doc(auth.uid(), employee_id)
    OR public.hrdp_is_manager_of(auth.uid(), employee_id)
  );

CREATE POLICY "payslips_insert"
  ON public.hrdp_payslips FOR INSERT TO authenticated
  WITH CHECK (public.hrdp_can(auth.uid(), company_id, 'folha', 'edit'));

CREATE POLICY "payslips_update"
  ON public.hrdp_payslips FOR UPDATE TO authenticated
  USING (public.hrdp_can(auth.uid(), company_id, 'folha', 'edit'));

CREATE TRIGGER trg_hrdp_payslips_updated_at
  BEFORE UPDATE ON public.hrdp_payslips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
