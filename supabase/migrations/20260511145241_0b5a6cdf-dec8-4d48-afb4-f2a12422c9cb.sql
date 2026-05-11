
-- =========================================================
-- LEVA 2 · Governança ART · 3 tabelas operacionais
-- =========================================================

-- 1) crea_gov_servicos -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.crea_gov_servicos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL,
  numero        TEXT,
  detalhe       TEXT,
  analise       TEXT,
  baixa         TEXT,
  boleto        TEXT,
  pagamento     TEXT,
  cadastro      TEXT,
  empresa       TEXT,
  contratante   TEXT,
  endereco      TEXT,
  observacao    TEXT,
  is_deleted    BOOLEAN NOT NULL DEFAULT false,
  deleted_at    TIMESTAMPTZ,
  deleted_by    UUID,
  delete_reason TEXT,
  created_by    UUID,
  updated_by    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crea_gov_servicos_company  ON public.crea_gov_servicos(company_id);
CREATE INDEX IF NOT EXISTS idx_crea_gov_servicos_numero   ON public.crea_gov_servicos(numero);
CREATE INDEX IF NOT EXISTS idx_crea_gov_servicos_active   ON public.crea_gov_servicos(company_id) WHERE is_deleted = false;

ALTER TABLE public.crea_gov_servicos ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_crea_gov_servicos_updated ON public.crea_gov_servicos;
CREATE TRIGGER trg_crea_gov_servicos_updated
  BEFORE UPDATE ON public.crea_gov_servicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "crea_gov_servicos_select"
  ON public.crea_gov_servicos FOR SELECT
  USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY "crea_gov_servicos_insert"
  ON public.crea_gov_servicos FOR INSERT
  WITH CHECK (public.crea_can(auth.uid(), company_id, 'create'));
CREATE POLICY "crea_gov_servicos_update"
  ON public.crea_gov_servicos FOR UPDATE
  USING (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE POLICY "crea_gov_servicos_delete"
  ON public.crea_gov_servicos FOR DELETE
  USING (public.crea_can(auth.uid(), company_id, 'delete'));

-- 2) crea_gov_art_bloco ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.crea_gov_art_bloco (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                  UUID NOT NULL,
  numero_art                  TEXT,
  valor_art                   NUMERIC(14,2),
  valor_pago                  NUMERIC(14,2),
  nosso_numero                TEXT,
  registrada_em               TEXT,
  paginas_pdf                 TEXT,
  tipo_status_documento       TEXT,
  responsavel_tecnico         TEXT,
  titulo_profissional         TEXT,
  rnp                         TEXT,
  registro                    TEXT,
  contratante                 TEXT,
  cpf_cnpj_contratante        TEXT,
  endereco_contrato           TEXT,
  num_contrato_endereco       TEXT,
  complemento_contrato        TEXT,
  cidade_contrato             TEXT,
  bairro_contrato             TEXT,
  uf_contrato                 TEXT,
  cep_contrato                TEXT,
  contrato                    TEXT,
  celebrado_em                TEXT,
  valor_contrato              NUMERIC(14,2),
  tipo_contratante            TEXT,
  acao_institucional          TEXT,
  situacao                    TEXT,
  atendido                    TEXT,
  data_solicitacao            TEXT,
  data_atendimento            TEXT,
  motivo                      TEXT,
  endereco_obra               TEXT,
  num_obra                    TEXT,
  complemento_obra            TEXT,
  cidade_obra                 TEXT,
  bairro_obra                 TEXT,
  uf_obra                     TEXT,
  cep_obra                    TEXT,
  data_inicio                 TEXT,
  previsao_termino            TEXT,
  coordenadas                 TEXT,
  codigo                      TEXT,
  cnpj_cpf_proprietario       TEXT,
  finalidade                  TEXT,
  proprietario                TEXT,
  ativ_tec_numeros_atos       TEXT,
  ativ_tec_quantidade         TEXT,
  ativ_tec_unidade            TEXT,
  ativ_tec_descricao          TEXT,
  observacoes                 TEXT,
  declaracoes                 TEXT,
  entidade_classe             TEXT,
  assinaturas                 TEXT,
  informacoes                 TEXT,
  is_deleted                  BOOLEAN NOT NULL DEFAULT false,
  deleted_at                  TIMESTAMPTZ,
  deleted_by                  UUID,
  delete_reason               TEXT,
  created_by                  UUID,
  updated_by                  UUID,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crea_gov_art_bloco_company   ON public.crea_gov_art_bloco(company_id);
CREATE INDEX IF NOT EXISTS idx_crea_gov_art_bloco_numero    ON public.crea_gov_art_bloco(numero_art);
CREATE INDEX IF NOT EXISTS idx_crea_gov_art_bloco_uf_obra   ON public.crea_gov_art_bloco(uf_obra);
CREATE INDEX IF NOT EXISTS idx_crea_gov_art_bloco_rt        ON public.crea_gov_art_bloco(responsavel_tecnico);
CREATE INDEX IF NOT EXISTS idx_crea_gov_art_bloco_active    ON public.crea_gov_art_bloco(company_id) WHERE is_deleted = false;

ALTER TABLE public.crea_gov_art_bloco ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_crea_gov_art_bloco_updated ON public.crea_gov_art_bloco;
CREATE TRIGGER trg_crea_gov_art_bloco_updated
  BEFORE UPDATE ON public.crea_gov_art_bloco
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "crea_gov_art_bloco_select"
  ON public.crea_gov_art_bloco FOR SELECT
  USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY "crea_gov_art_bloco_insert"
  ON public.crea_gov_art_bloco FOR INSERT
  WITH CHECK (public.crea_can(auth.uid(), company_id, 'create'));
CREATE POLICY "crea_gov_art_bloco_update"
  ON public.crea_gov_art_bloco FOR UPDATE
  USING (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE POLICY "crea_gov_art_bloco_delete"
  ON public.crea_gov_art_bloco FOR DELETE
  USING (public.crea_can(auth.uid(), company_id, 'delete'));

-- 3) crea_gov_relatorio_crea -----------------------------------------
CREATE TABLE IF NOT EXISTS public.crea_gov_relatorio_crea (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id               UUID NOT NULL,
  art                      TEXT,
  tipo                     TEXT,
  participacao_tecnica     TEXT,
  forma_registro           TEXT,
  pagamento                TEXT,
  taxa_paga                TEXT,
  cadastro                 TEXT,
  observacao               TEXT,
  contratante              TEXT,
  cnpj_contratante         TEXT,
  proprietario             TEXT,
  cnpj_proprietario        TEXT,
  numero                   TEXT,
  valor_contrato           NUMERIC(14,2),
  data_inicio              TEXT,
  data_fim                 TEXT,
  enderecos                TEXT,
  atividades               TEXT,
  nivel                    TEXT,
  atividade_subordinada    TEXT,
  atividade_servico        TEXT,
  quantidade               TEXT,
  unidade_medida           TEXT,
  is_deleted               BOOLEAN NOT NULL DEFAULT false,
  deleted_at               TIMESTAMPTZ,
  deleted_by               UUID,
  delete_reason            TEXT,
  created_by               UUID,
  updated_by               UUID,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crea_gov_rel_company   ON public.crea_gov_relatorio_crea(company_id);
CREATE INDEX IF NOT EXISTS idx_crea_gov_rel_art       ON public.crea_gov_relatorio_crea(art);
CREATE INDEX IF NOT EXISTS idx_crea_gov_rel_active    ON public.crea_gov_relatorio_crea(company_id) WHERE is_deleted = false;

ALTER TABLE public.crea_gov_relatorio_crea ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_crea_gov_rel_updated ON public.crea_gov_relatorio_crea;
CREATE TRIGGER trg_crea_gov_rel_updated
  BEFORE UPDATE ON public.crea_gov_relatorio_crea
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "crea_gov_relatorio_crea_select"
  ON public.crea_gov_relatorio_crea FOR SELECT
  USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY "crea_gov_relatorio_crea_insert"
  ON public.crea_gov_relatorio_crea FOR INSERT
  WITH CHECK (public.crea_can(auth.uid(), company_id, 'create'));
CREATE POLICY "crea_gov_relatorio_crea_update"
  ON public.crea_gov_relatorio_crea FOR UPDATE
  USING (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE POLICY "crea_gov_relatorio_crea_delete"
  ON public.crea_gov_relatorio_crea FOR DELETE
  USING (public.crea_can(auth.uid(), company_id, 'delete'));
