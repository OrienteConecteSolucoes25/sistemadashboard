-- Add meta jsonb to eng_field_options and seed legacy lists (clientes excluded per user)
ALTER TABLE public.eng_field_options
  ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Seed Categorias (com SLA e Comprador padrão)
INSERT INTO public.eng_field_options (field_key, value, meta) VALUES
  ('categoria','MATERIAL ELÉTRICO',     jsonb_build_object('comprador','Sabrina Reis','sla_dias',10)),
  ('categoria','ELÉTRICO',               jsonb_build_object('comprador','Sabrina Reis','sla_dias',10)),
  ('categoria','FERRO E AÇO',            jsonb_build_object('comprador','Sabrina Reis','sla_dias',12)),
  ('categoria','PINTURA',                jsonb_build_object('comprador','Sabrina Reis','sla_dias',20)),
  ('categoria','CORTE E DOBRA',          jsonb_build_object('comprador','Sabrina Reis','sla_dias',12)),
  ('categoria','IMPERMEABILIZANTE',      jsonb_build_object('comprador','Sabrina Reis','sla_dias',17)),
  ('categoria','SERVIÇO DE CONTROLE TECNOLÓGICO', jsonb_build_object('comprador','Sabrina Reis','sla_dias',10)),
  ('categoria','COMPRA DE CONCRETO USINADO',      jsonb_build_object('comprador','Sabrina Reis','sla_dias',10)),
  ('categoria','CONCRETAGEM',            jsonb_build_object('comprador','Sabrina Reis','sla_dias',10)),
  ('categoria','ATERRAMENTO',            jsonb_build_object('comprador','Sabrina Reis','sla_dias',8)),
  ('categoria','FERRAGENS',              jsonb_build_object('comprador','Sabrina Reis','sla_dias',20)),
  ('categoria','METÁLICO GALVANIZADO',   jsonb_build_object('comprador','Matheus Souza','sla_dias',25)),
  ('categoria','METÁLICO',               jsonb_build_object('comprador','Matheus Souza','sla_dias',25)),
  ('categoria','MATERIAL CIVIL',         jsonb_build_object('comprador','Matheus Souza','sla_dias',8)),
  ('categoria','CIVIL',                  jsonb_build_object('comprador','Matheus Souza','sla_dias',8)),
  ('categoria','HIDRAULICO',             jsonb_build_object('comprador','Matheus Souza','sla_dias',8)),
  ('categoria','EPI E EPC',              jsonb_build_object('comprador','Matheus Souza','sla_dias',5)),
  ('categoria','EPI',                    jsonb_build_object('comprador','Matheus Souza','sla_dias',5)),
  ('categoria','FERRAMENTAL DE CONSUMO', jsonb_build_object('comprador','Matheus Souza','sla_dias',7)),
  ('categoria','FERRAMENTAS',            jsonb_build_object('comprador','Matheus Souza','sla_dias',7)),
  ('categoria','ALUGUEL DE MÁQUINAS E EQUIPAMENTOS', jsonb_build_object('comprador','Matheus Souza','sla_dias',7)),
  ('categoria','ITENS DE ESCRITÓRIO (MATERIAIS DE LIMPEZA, PAPELARIA E INSUMOS)', jsonb_build_object('comprador','Tawana de Jesus','sla_dias',7)),
  ('categoria','MÁQUINAS E EQUIPAMENTOS (ADM-IMOBILIZADO)', jsonb_build_object('comprador','Tawana de Jesus','sla_dias',15)),
  ('categoria','SERVIÇOS GRÁFICOS',      jsonb_build_object('comprador','Tawana de Jesus','sla_dias',7)),
  ('categoria','FRETES E REQUISIÇÕES DE MATERIAIS DO ALMOXARIFADO', jsonb_build_object('comprador','Vitor Pinto','sla_dias',5)),
  ('categoria','FRETE',                  jsonb_build_object('comprador','Vitor Pinto','sla_dias',5)),
  ('categoria','ESTOQUE',                jsonb_build_object('comprador','Vitor Pinto','sla_dias',5)),
  ('categoria','DIVERSOS',               jsonb_build_object('comprador','Vitor Pinto','sla_dias',7)),
  ('categoria','ALMOXARIFADO',           jsonb_build_object('comprador','Vitor Pinto','sla_dias',5))
ON CONFLICT (field_key, value) DO NOTHING;

-- Coordenadores
INSERT INTO public.eng_field_options (field_key, value) VALUES
  ('coordenador','MIRLA CALDAS'),('coordenador','MARIANA PEREIRA'),('coordenador','REINAN IBRAIM'),
  ('coordenador','RAIANE SANTIAGO'),('coordenador','ANA PAULA'),('coordenador','ARTHUR SAMPAIO'),
  ('coordenador','ANA VALÉRIA'),('coordenador','BRUNO VASCONCELLOS'),('coordenador','JECILENY PEIXOTO'),
  ('coordenador','ERICK DIEGO'),('coordenador','THAINE LIMA')
ON CONFLICT (field_key, value) DO NOTHING;

-- Compradores
INSERT INTO public.eng_field_options (field_key, value) VALUES
  ('comprador','Carmelio Ramanho'),('comprador','Sabrina Reis'),('comprador','Matheus Souza'),
  ('comprador','Tawana de Jesus'),('comprador','Vitor Pinto')
ON CONFLICT (field_key, value) DO NOTHING;

-- Tipo de solicitação
INSERT INTO public.eng_field_options (field_key, value) VALUES
  ('tipo','Solicitação de compra'),('tipo','Solicitação de frete'),
  ('tipo','Requisição de material'),('tipo','Solicitação de serviço')
ON CONFLICT (field_key, value) DO NOTHING;

-- Escopo
INSERT INTO public.eng_field_options (field_key, value) VALUES
  ('escopo','REFORÇO'),('escopo','CONST. DE ESTRADA'),('escopo','RECUPERAÇÃO ESTRUTURAL'),
  ('escopo','CORRETIVA PESADA'),('escopo','MONTAGEM/SUBST. DE EV'),('escopo','AMPLIAÇÃO'),
  ('escopo','IMPLANTAÇÃO'),('escopo','EXECUÇÃO DE FUNDAÇÃO'),('escopo','DESMOBILIZAÇÃO'),
  ('escopo','IMPERMEABILIZAÇÃO'),('escopo','COLLO'),('escopo','RF/MW'),('escopo','FIBRA'),
  ('escopo','MANUTENÇÃO DE TORRE'),('escopo','SHELTER'),('escopo','REMANEJAMENTO'),
  ('escopo','DESMONTAGEM'),('escopo','VISTORIA')
ON CONFLICT (field_key, value) DO NOTHING;

-- SLA catálogo (rótulos por dias)
INSERT INTO public.eng_field_options (field_key, value, meta) VALUES
  ('sla','5 dias úteis',  jsonb_build_object('dias',5)),
  ('sla','7 dias úteis',  jsonb_build_object('dias',7)),
  ('sla','8 dias úteis',  jsonb_build_object('dias',8)),
  ('sla','10 dias úteis', jsonb_build_object('dias',10)),
  ('sla','12 dias úteis', jsonb_build_object('dias',12)),
  ('sla','15 dias úteis', jsonb_build_object('dias',15)),
  ('sla','17 dias úteis', jsonb_build_object('dias',17)),
  ('sla','20 dias úteis', jsonb_build_object('dias',20)),
  ('sla','25 dias úteis', jsonb_build_object('dias',25))
ON CONFLICT (field_key, value) DO NOTHING;

-- Storage bucket para anexos das solicitações
INSERT INTO storage.buckets (id, name, public) VALUES ('eng-suprimentos', 'eng-suprimentos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas do bucket
DROP POLICY IF EXISTS "eng_suprimentos_read" ON storage.objects;
CREATE POLICY "eng_suprimentos_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'eng-suprimentos');
DROP POLICY IF EXISTS "eng_suprimentos_write" ON storage.objects;
CREATE POLICY "eng_suprimentos_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'eng-suprimentos' AND public.eng_can_edit(auth.uid()));
DROP POLICY IF EXISTS "eng_suprimentos_update" ON storage.objects;
CREATE POLICY "eng_suprimentos_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'eng-suprimentos' AND public.eng_can_edit(auth.uid()));
DROP POLICY IF EXISTS "eng_suprimentos_delete" ON storage.objects;
CREATE POLICY "eng_suprimentos_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'eng-suprimentos' AND public.eng_can_edit(auth.uid()));