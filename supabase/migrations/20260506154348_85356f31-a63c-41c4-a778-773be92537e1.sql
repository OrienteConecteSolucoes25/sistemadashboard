CREATE TABLE public.hrdp_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  nome text NOT NULL,
  email text,
  telefone text,
  vaga text,
  area text,
  origem text,
  status text NOT NULL DEFAULT 'novo',
  etapa text,
  score numeric DEFAULT 0,
  pretensao_salarial numeric,
  curriculo_path text,
  linkedin_url text,
  tags text[] DEFAULT '{}',
  observacoes text,
  consentimento_lgpd boolean DEFAULT false,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text
);
CREATE INDEX idx_hrdp_cand_company ON public.hrdp_candidates(company_id);
CREATE INDEX idx_hrdp_cand_status ON public.hrdp_candidates(status);

ALTER TABLE public.hrdp_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cand select" ON public.hrdp_candidates FOR SELECT TO authenticated
USING (hrdp_can(auth.uid(), company_id, 'recrutamento', 'view'));
CREATE POLICY "cand write" ON public.hrdp_candidates FOR ALL TO authenticated
USING (hrdp_can(auth.uid(), company_id, 'recrutamento', 'edit'))
WITH CHECK (hrdp_can(auth.uid(), company_id, 'recrutamento', 'edit'));
CREATE TRIGGER trg_hrdp_cand_upd BEFORE UPDATE ON public.hrdp_candidates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();


CREATE TABLE public.hrdp_interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  area text,
  vaga text,
  categoria text,
  pergunta text NOT NULL,
  peso int NOT NULL DEFAULT 1,
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hrdp_iq_company ON public.hrdp_interview_questions(company_id);

ALTER TABLE public.hrdp_interview_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iq select" ON public.hrdp_interview_questions FOR SELECT TO authenticated
USING (hrdp_can(auth.uid(), company_id, 'recrutamento', 'view'));
CREATE POLICY "iq write" ON public.hrdp_interview_questions FOR ALL TO authenticated
USING (hrdp_can(auth.uid(), company_id, 'recrutamento', 'edit'))
WITH CHECK (hrdp_can(auth.uid(), company_id, 'recrutamento', 'edit'));
CREATE TRIGGER trg_hrdp_iq_upd BEFORE UPDATE ON public.hrdp_interview_questions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();


CREATE TABLE public.hrdp_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.hrdp_candidates(id) ON DELETE CASCADE,
  entrevistador_id uuid,
  entrevistador_nome text,
  etapa text,
  data_agendada timestamptz,
  status text NOT NULL DEFAULT 'agendada',
  parecer text,
  recomendacao text,
  score_final numeric DEFAULT 0,
  respostas jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hrdp_iv_company ON public.hrdp_interviews(company_id);
CREATE INDEX idx_hrdp_iv_candidate ON public.hrdp_interviews(candidate_id);

ALTER TABLE public.hrdp_interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iv select" ON public.hrdp_interviews FOR SELECT TO authenticated
USING (hrdp_can(auth.uid(), company_id, 'recrutamento', 'view'));
CREATE POLICY "iv write" ON public.hrdp_interviews FOR ALL TO authenticated
USING (hrdp_can(auth.uid(), company_id, 'recrutamento', 'edit'))
WITH CHECK (hrdp_can(auth.uid(), company_id, 'recrutamento', 'edit'));
CREATE TRIGGER trg_hrdp_iv_upd BEFORE UPDATE ON public.hrdp_interviews
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();