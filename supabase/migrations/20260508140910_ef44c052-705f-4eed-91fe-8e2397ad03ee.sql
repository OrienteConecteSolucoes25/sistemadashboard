-- Estende eng_equipes para suportar o cadastro completo de Fornecedores
ALTER TABLE public.eng_equipes
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS leader_phone text,
  ADD COLUMN IF NOT EXISTS scopes text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS technicians jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS base text,
  ADD COLUMN IF NOT EXISTS uf_base text,
  ADD COLUMN IF NOT EXISTS estados_atuacao text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS quantidade_equipes integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_city text,
  ADD COLUMN IF NOT EXISTS current_site text,
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Backfill: technicians a partir de membros (se vazio)
UPDATE public.eng_equipes
SET technicians = COALESCE(membros, '[]'::jsonb)
WHERE (technicians IS NULL OR technicians = '[]'::jsonb)
  AND membros IS NOT NULL AND membros <> '[]'::jsonb;