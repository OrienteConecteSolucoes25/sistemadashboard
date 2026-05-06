-- hrdp_benefits
CREATE TABLE public.hrdp_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employee_id uuid REFERENCES public.hrdp_employees(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  fornecedor text,
  plano text,
  valor_empresa numeric(12,2) DEFAULT 0,
  valor_colaborador numeric(12,2) DEFAULT 0,
  data_inicio date,
  data_fim date,
  status text NOT NULL DEFAULT 'ativo',
  observacoes text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text
);

CREATE INDEX idx_hrdp_benefits_company ON public.hrdp_benefits(company_id);
CREATE INDEX idx_hrdp_benefits_employee ON public.hrdp_benefits(employee_id);

ALTER TABLE public.hrdp_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hrdp_benefits_view"
ON public.hrdp_benefits FOR SELECT
USING (
  public.hrdp_can(auth.uid(), company_id, 'beneficios', 'view')
  OR public.hrdp_is_self_doc(auth.uid(), employee_id)
  OR public.hrdp_is_manager_of(auth.uid(), employee_id)
);

CREATE POLICY "hrdp_benefits_insert"
ON public.hrdp_benefits FOR INSERT
WITH CHECK (public.hrdp_can(auth.uid(), company_id, 'beneficios', 'edit'));

CREATE POLICY "hrdp_benefits_update"
ON public.hrdp_benefits FOR UPDATE
USING (public.hrdp_can(auth.uid(), company_id, 'beneficios', 'edit'));

CREATE POLICY "hrdp_benefits_delete"
ON public.hrdp_benefits FOR DELETE
USING (public.hrdp_can(auth.uid(), company_id, 'beneficios', 'edit'));

CREATE TRIGGER trg_hrdp_benefits_updated
BEFORE UPDATE ON public.hrdp_benefits
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

-- hrdp_benefit_quotes
CREATE TABLE public.hrdp_benefit_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  titulo text NOT NULL,
  tipo text NOT NULL,
  fornecedor text,
  modalidade text,
  faixa text,
  qtd_estim_colaboradores int DEFAULT 0,
  valor_unitario_estimado numeric(12,2) DEFAULT 0,
  valor_total_estimado numeric(14,2) DEFAULT 0,
  observacoes text,
  link_referencia text,
  status text NOT NULL DEFAULT 'rascunho',
  aprovado_em timestamptz,
  aprovado_por uuid,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text
);

CREATE INDEX idx_hrdp_benefit_quotes_company ON public.hrdp_benefit_quotes(company_id);

ALTER TABLE public.hrdp_benefit_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hrdp_benefit_quotes_view"
ON public.hrdp_benefit_quotes FOR SELECT
USING (public.hrdp_can(auth.uid(), company_id, 'beneficios', 'view'));

CREATE POLICY "hrdp_benefit_quotes_insert"
ON public.hrdp_benefit_quotes FOR INSERT
WITH CHECK (public.hrdp_can(auth.uid(), company_id, 'beneficios', 'edit'));

CREATE POLICY "hrdp_benefit_quotes_update"
ON public.hrdp_benefit_quotes FOR UPDATE
USING (public.hrdp_can(auth.uid(), company_id, 'beneficios', 'edit'));

CREATE POLICY "hrdp_benefit_quotes_delete"
ON public.hrdp_benefit_quotes FOR DELETE
USING (public.hrdp_can(auth.uid(), company_id, 'beneficios', 'edit'));

CREATE TRIGGER trg_hrdp_benefit_quotes_updated
BEFORE UPDATE ON public.hrdp_benefit_quotes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();