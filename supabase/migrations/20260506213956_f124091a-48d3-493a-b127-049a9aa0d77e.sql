
CREATE TABLE IF NOT EXISTS public.crea_ai_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  pergunta text NOT NULL,
  resposta text,
  fontes_citadas jsonb DEFAULT '[]'::jsonb,
  uf text,
  modelo text DEFAULT 'google/gemini-2.5-flash',
  duracao_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crea_ai_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crea_ai_questions_select" ON public.crea_ai_questions;
CREATE POLICY "crea_ai_questions_select" ON public.crea_ai_questions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::app_role) OR
    public.has_role(auth.uid(),'crea_admin'::app_role) OR
    user_id = auth.uid() OR
    (company_id IS NOT NULL AND public.crea_can(auth.uid(), company_id, 'view'))
  );

DROP POLICY IF EXISTS "crea_ai_questions_insert" ON public.crea_ai_questions;
CREATE POLICY "crea_ai_questions_insert" ON public.crea_ai_questions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_crea_ai_sources_uf_tipo
  ON public.crea_ai_sources(uf, tipo)
  WHERE is_deleted = false AND ativo = true;

CREATE INDEX IF NOT EXISTS idx_crea_ai_questions_user
  ON public.crea_ai_questions(user_id, created_at DESC);
