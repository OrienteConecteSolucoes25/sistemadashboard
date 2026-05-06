
-- =========================
-- Phase 4: Contratos
-- =========================

CREATE TABLE IF NOT EXISTS public.hrdp_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.hrdp_employees(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'CLT',          -- CLT, PJ, Estagio, Temporario, Aprendiz, Autonomo
  modelo text,                                -- referência ao template usado
  numero text,
  data_inicio date NOT NULL,
  data_fim date,                              -- nulo = indeterminado
  experiencia_dias integer,                   -- 45+45 etc
  data_fim_experiencia date,
  jornada_horas numeric DEFAULT 220,
  salario numeric,
  status text NOT NULL DEFAULT 'ativo',       -- ativo, encerrado, suspenso, em_renovacao, vencido
  observacoes text,
  arquivo_path text,                          -- bucket hrdp-private
  data jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text
);
CREATE INDEX IF NOT EXISTS idx_hrdp_contracts_company ON public.hrdp_contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_hrdp_contracts_employee ON public.hrdp_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_hrdp_contracts_status ON public.hrdp_contracts(status);
CREATE INDEX IF NOT EXISTS idx_hrdp_contracts_fim ON public.hrdp_contracts(data_fim);

CREATE TRIGGER trg_hrdp_contracts_updated
  BEFORE UPDATE ON public.hrdp_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

ALTER TABLE public.hrdp_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rhdp contracts read"
ON public.hrdp_contracts FOR SELECT TO authenticated
USING (
  is_deleted = false AND (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.hrdp_can(auth.uid(), company_id, 'contratos', 'view')
    OR EXISTS (SELECT 1 FROM public.hrdp_employees e
               WHERE e.id = employee_id AND e.user_id = auth.uid())
    OR public.hrdp_is_manager_of(auth.uid(), employee_id)
  )
);

CREATE POLICY "rhdp contracts write"
ON public.hrdp_contracts FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'contratos', 'edit')
)
WITH CHECK (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'contratos', 'edit')
);

-- ----- Aditivos -----
CREATE TABLE IF NOT EXISTS public.hrdp_contract_amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  contract_id uuid NOT NULL REFERENCES public.hrdp_contracts(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'prorrogacao',   -- prorrogacao, alteracao_salarial, jornada, funcao, encerramento, outro
  descricao text NOT NULL,
  data_vigencia date NOT NULL,
  novo_salario numeric,
  nova_jornada numeric,
  arquivo_path text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hrdp_amendments_contract ON public.hrdp_contract_amendments(contract_id);

ALTER TABLE public.hrdp_contract_amendments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rhdp amendments read"
ON public.hrdp_contract_amendments FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'contratos', 'view')
  OR EXISTS (
    SELECT 1 FROM public.hrdp_contracts c
    JOIN public.hrdp_employees e ON e.id = c.employee_id
    WHERE c.id = contract_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "rhdp amendments write"
ON public.hrdp_contract_amendments FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'contratos', 'edit')
)
WITH CHECK (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.hrdp_can(auth.uid(), company_id, 'contratos', 'edit')
);
