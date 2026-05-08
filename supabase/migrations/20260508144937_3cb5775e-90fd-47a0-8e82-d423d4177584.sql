ALTER TABLE public.eng_solicitacao_sc_rc
  ADD COLUMN IF NOT EXISTS auxiliar text,
  ADD COLUMN IF NOT EXISTS responsavel text,
  ADD COLUMN IF NOT EXISTS coordenador text,
  ADD COLUMN IF NOT EXISTS data_finalizacao_compra date,
  ADD COLUMN IF NOT EXISTS data_finalizacao_logistica date;