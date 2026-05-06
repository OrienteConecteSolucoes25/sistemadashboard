CREATE TABLE public.hrdp_employee_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.hrdp_employees(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  prioridade text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'aberta',
  data_abertura timestamptz NOT NULL DEFAULT now(),
  prazo_sla timestamptz,
  sla_dias int DEFAULT 3,
  aprovador_id uuid,
  aprovado_em timestamptz,
  concluido_em timestamptz,
  resposta text,
  anexo_path text,
  comentarios jsonb DEFAULT '[]'::jsonb,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text
);

CREATE INDEX idx_hrdp_req_company ON public.hrdp_employee_requests(company_id);
CREATE INDEX idx_hrdp_req_employee ON public.hrdp_employee_requests(employee_id);
CREATE INDEX idx_hrdp_req_status ON public.hrdp_employee_requests(status);
CREATE INDEX idx_hrdp_req_sla ON public.hrdp_employee_requests(prazo_sla);

ALTER TABLE public.hrdp_employee_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "req select" ON public.hrdp_employee_requests FOR SELECT TO authenticated
USING (
  hrdp_can(auth.uid(), company_id, 'solicitacoes', 'view')
  OR hrdp_is_manager_of(auth.uid(), employee_id)
  OR EXISTS (SELECT 1 FROM public.hrdp_employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
);

CREATE POLICY "req insert" ON public.hrdp_employee_requests FOR INSERT TO authenticated
WITH CHECK (
  hrdp_can(auth.uid(), company_id, 'solicitacoes', 'edit')
  OR EXISTS (SELECT 1 FROM public.hrdp_employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
);

CREATE POLICY "req update" ON public.hrdp_employee_requests FOR UPDATE TO authenticated
USING (
  hrdp_can(auth.uid(), company_id, 'solicitacoes', 'edit')
  OR hrdp_can(auth.uid(), company_id, 'solicitacoes', 'approve')
  OR hrdp_is_manager_of(auth.uid(), employee_id)
);

CREATE POLICY "req delete" ON public.hrdp_employee_requests FOR DELETE TO authenticated
USING (hrdp_can(auth.uid(), company_id, 'solicitacoes', 'edit'));

CREATE OR REPLACE FUNCTION public.hrdp_request_set_sla()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.prazo_sla IS NULL THEN
    NEW.prazo_sla := COALESCE(NEW.data_abertura, now()) + (COALESCE(NEW.sla_dias, 3) || ' days')::interval;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_hrdp_req_sla BEFORE INSERT ON public.hrdp_employee_requests
FOR EACH ROW EXECUTE FUNCTION public.hrdp_request_set_sla();

CREATE TRIGGER trg_hrdp_req_upd BEFORE UPDATE ON public.hrdp_employee_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();