ALTER TABLE public.comm_brand_kits
  ADD COLUMN IF NOT EXISTS segmento text,
  ADD COLUMN IF NOT EXISTS missao text,
  ADD COLUMN IF NOT EXISTS visao text,
  ADD COLUMN IF NOT EXISTS valores text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS observacoes text;

ALTER TABLE public.comm_product_items
  ADD COLUMN IF NOT EXISTS posicionamento jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS metricas jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pesquisa jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS data_lancamento date,
  ADD COLUMN IF NOT EXISTS status_kanban text DEFAULT 'backlog';