
ALTER TABLE public.eng_sites
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS maps_url text,
  ADD COLUMN IF NOT EXISTS trigger_date date,
  ADD COLUMN IF NOT EXISTS delivery_date date,
  ADD COLUMN IF NOT EXISTS total_value numeric NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS eng_sites_nome_lower_uniq
  ON public.eng_sites (LOWER(nome))
  WHERE is_deleted = false;
