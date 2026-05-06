
-- Tabela: processos de admissão
CREATE TABLE IF NOT EXISTS public.hrdp_admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employee_id uuid REFERENCES public.hrdp_employees(id) ON DELETE CASCADE,
  candidato_nome text,
  candidato_email text,
  cargo text,
  setor text,
  data_inicio_prevista date,
  data_admissao_efetiva date,
  responsavel_id uuid,
  etapa text NOT NULL DEFAULT 'documentacao',
  status text NOT NULL DEFAULT 'em_andamento',
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
CREATE INDEX IF NOT EXISTS idx_hrdp_adm_company ON public.hrdp_admissions(company_id);
CREATE INDEX IF NOT EXISTS idx_hrdp_adm_employee ON public.hrdp_admissions(employee_id);
ALTER TABLE public.hrdp_admissions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_hrdp_adm_updated ON public.hrdp_admissions;
CREATE TRIGGER trg_hrdp_adm_updated BEFORE UPDATE ON public.hrdp_admissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

DROP POLICY IF EXISTS "hrdp_admissions select" ON public.hrdp_admissions;
CREATE POLICY "hrdp_admissions select" ON public.hrdp_admissions
FOR SELECT TO authenticated
USING (public.hrdp_can(auth.uid(), company_id, 'admissao', 'view'));

DROP POLICY IF EXISTS "hrdp_admissions write" ON public.hrdp_admissions;
CREATE POLICY "hrdp_admissions write" ON public.hrdp_admissions
FOR ALL TO authenticated
USING (public.hrdp_can(auth.uid(), company_id, 'admissao', 'edit'))
WITH CHECK (public.hrdp_can(auth.uid(), company_id, 'admissao', 'edit'));

-- Tabela: itens do checklist
CREATE TABLE IF NOT EXISTS public.hrdp_admission_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid NOT NULL REFERENCES public.hrdp_admissions(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  categoria text NOT NULL DEFAULT 'documentacao',
  titulo text NOT NULL,
  descricao text,
  obrigatorio boolean NOT NULL DEFAULT true,
  concluido boolean NOT NULL DEFAULT false,
  concluido_em timestamptz,
  concluido_por uuid,
  anexo_path text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hrdp_chk_adm ON public.hrdp_admission_checklist_items(admission_id);
ALTER TABLE public.hrdp_admission_checklist_items ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_hrdp_chk_updated ON public.hrdp_admission_checklist_items;
CREATE TRIGGER trg_hrdp_chk_updated BEFORE UPDATE ON public.hrdp_admission_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

DROP POLICY IF EXISTS "hrdp_chk select" ON public.hrdp_admission_checklist_items;
CREATE POLICY "hrdp_chk select" ON public.hrdp_admission_checklist_items
FOR SELECT TO authenticated
USING (public.hrdp_can(auth.uid(), company_id, 'admissao', 'view'));

DROP POLICY IF EXISTS "hrdp_chk write" ON public.hrdp_admission_checklist_items;
CREATE POLICY "hrdp_chk write" ON public.hrdp_admission_checklist_items
FOR ALL TO authenticated
USING (public.hrdp_can(auth.uid(), company_id, 'admissao', 'edit'))
WITH CHECK (public.hrdp_can(auth.uid(), company_id, 'admissao', 'edit'));

-- Tabela: documentos do colaborador
CREATE TABLE IF NOT EXISTS public.hrdp_employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  employee_id uuid REFERENCES public.hrdp_employees(id) ON DELETE CASCADE,
  admission_id uuid REFERENCES public.hrdp_admissions(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  storage_path text NOT NULL,
  mime_type text,
  tamanho_bytes bigint,
  data_emissao date,
  data_vencimento date,
  sensivel boolean NOT NULL DEFAULT false,
  uploaded_by uuid,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hrdp_docs_company ON public.hrdp_employee_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_hrdp_docs_employee ON public.hrdp_employee_documents(employee_id);
ALTER TABLE public.hrdp_employee_documents ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_hrdp_docs_updated ON public.hrdp_employee_documents;
CREATE TRIGGER trg_hrdp_docs_updated BEFORE UPDATE ON public.hrdp_employee_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();

-- Helper: usuário é o colaborador desse documento?
CREATE OR REPLACE FUNCTION public.hrdp_is_self_doc(_uid uuid, _employee_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.hrdp_employees WHERE id = _employee_id AND user_id = _uid)
$$;

DROP POLICY IF EXISTS "hrdp_docs select" ON public.hrdp_employee_documents;
CREATE POLICY "hrdp_docs select" ON public.hrdp_employee_documents
FOR SELECT TO authenticated
USING (
  public.hrdp_can(auth.uid(), company_id, 'colaboradores', 'view')
  OR (sensivel = false AND public.hrdp_is_self_doc(auth.uid(), employee_id))
  OR (sensivel = true AND public.hrdp_can(auth.uid(), company_id, 'colaboradores', 'view_sensitive'))
);

DROP POLICY IF EXISTS "hrdp_docs write" ON public.hrdp_employee_documents;
CREATE POLICY "hrdp_docs write" ON public.hrdp_employee_documents
FOR ALL TO authenticated
USING (public.hrdp_can(auth.uid(), company_id, 'colaboradores', 'edit'))
WITH CHECK (public.hrdp_can(auth.uid(), company_id, 'colaboradores', 'edit'));

-- Bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('hrdp-private', 'hrdp-private', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: caminho = company_id/employee_id/...
DROP POLICY IF EXISTS "hrdp-private read" ON storage.objects;
CREATE POLICY "hrdp-private read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'hrdp-private'
  AND public.hrdp_can(auth.uid(), ((storage.foldername(name))[1])::uuid, 'colaboradores', 'view')
);

DROP POLICY IF EXISTS "hrdp-private write" ON storage.objects;
CREATE POLICY "hrdp-private write" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'hrdp-private'
  AND public.hrdp_can(auth.uid(), ((storage.foldername(name))[1])::uuid, 'colaboradores', 'edit')
);

DROP POLICY IF EXISTS "hrdp-private update" ON storage.objects;
CREATE POLICY "hrdp-private update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'hrdp-private'
  AND public.hrdp_can(auth.uid(), ((storage.foldername(name))[1])::uuid, 'colaboradores', 'edit')
);

DROP POLICY IF EXISTS "hrdp-private delete" ON storage.objects;
CREATE POLICY "hrdp-private delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'hrdp-private'
  AND public.hrdp_can(auth.uid(), ((storage.foldername(name))[1])::uuid, 'colaboradores', 'edit')
);
