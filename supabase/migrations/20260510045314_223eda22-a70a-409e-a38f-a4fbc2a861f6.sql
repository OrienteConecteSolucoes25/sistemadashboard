-- Tabela de páginas PDF extraídas
CREATE TABLE IF NOT EXISTS public.crea_gov_pdf_paginas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  importacao_id uuid REFERENCES public.crea_gov_importacoes(id) ON DELETE CASCADE,
  uf text,
  numero_pagina int NOT NULL DEFAULT 1,
  total_paginas int,
  texto text,
  tabelas jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'extraido',
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crea_gov_pdf_paginas_company ON public.crea_gov_pdf_paginas(company_id, importacao_id);
CREATE INDEX IF NOT EXISTS idx_crea_gov_pdf_paginas_uf ON public.crea_gov_pdf_paginas(uf);

ALTER TABLE public.crea_gov_pdf_paginas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crea_gov_pdf_paginas_select"
  ON public.crea_gov_pdf_paginas FOR SELECT
  USING (crea_can(auth.uid(), company_id, 'view'));

CREATE POLICY "crea_gov_pdf_paginas_insert"
  ON public.crea_gov_pdf_paginas FOR INSERT
  WITH CHECK (crea_can(auth.uid(), company_id, 'edit'));

CREATE POLICY "crea_gov_pdf_paginas_update"
  ON public.crea_gov_pdf_paginas FOR UPDATE
  USING (crea_can(auth.uid(), company_id, 'edit'));

CREATE POLICY "crea_gov_pdf_paginas_delete"
  ON public.crea_gov_pdf_paginas FOR DELETE
  USING (crea_can(auth.uid(), company_id, 'delete'));

CREATE TRIGGER trg_pdf_paginas_updated_at
  BEFORE UPDATE ON public.crea_gov_pdf_paginas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_generic();

-- Seed 27 CREAs estaduais (idempotente)
INSERT INTO public.crea_gov_creas_config (uf, nome, taxa_padrao, status, layout_xls, regras_extracao, campos_personalizados) VALUES
  ('AC','CREA-AC — Acre',                 245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('AL','CREA-AL — Alagoas',              245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('AP','CREA-AP — Amapá',                245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('AM','CREA-AM — Amazonas',             245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('BA','CREA-BA — Bahia',                245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('CE','CREA-CE — Ceará',                245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('DF','CREA-DF — Distrito Federal',     245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('ES','CREA-ES — Espírito Santo',       245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('GO','CREA-GO — Goiás',                245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('MA','CREA-MA — Maranhão',             245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('MT','CREA-MT — Mato Grosso',          245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('MS','CREA-MS — Mato Grosso do Sul',   245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('MG','CREA-MG — Minas Gerais',         245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('PA','CREA-PA — Pará',                 245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('PB','CREA-PB — Paraíba',              245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('PR','CREA-PR — Paraná',               245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('PE','CREA-PE — Pernambuco',           245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('PI','CREA-PI — Piauí',                245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('RJ','CREA-RJ — Rio de Janeiro',       245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('RN','CREA-RN — Rio Grande do Norte',  245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('RS','CREA-RS — Rio Grande do Sul',    245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('RO','CREA-RO — Rondônia',             245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('RR','CREA-RR — Roraima',              245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('SC','CREA-SC — Santa Catarina',       245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('SP','CREA-SP — São Paulo',            245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('SE','CREA-SE — Sergipe',              245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb),
  ('TO','CREA-TO — Tocantins',            245.00,'ativo','{}'::jsonb,'{}'::jsonb,'{}'::jsonb)
ON CONFLICT (uf) DO NOTHING;