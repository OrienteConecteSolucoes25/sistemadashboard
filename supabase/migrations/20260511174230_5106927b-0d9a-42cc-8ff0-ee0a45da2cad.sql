
CREATE TABLE public.crea_gov_arts_todas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  numero text,
  detalhe text,
  analise text,
  baixa text,
  boleto text,
  pagamento text,
  cadastro text,
  empresa text,
  contratante text,
  endereco text,
  observacao text,
  data jsonb,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crea_gov_arts_todas_company ON public.crea_gov_arts_todas (company_id);
CREATE INDEX idx_crea_gov_arts_todas_active ON public.crea_gov_arts_todas (company_id) WHERE is_deleted = false;
CREATE INDEX idx_crea_gov_arts_todas_numero ON public.crea_gov_arts_todas (numero);

ALTER TABLE public.crea_gov_arts_todas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crea_gov_arts_todas_select" ON public.crea_gov_arts_todas
  FOR SELECT USING (public.crea_can(auth.uid(), company_id, 'view'));
CREATE POLICY "crea_gov_arts_todas_insert" ON public.crea_gov_arts_todas
  FOR INSERT WITH CHECK (public.crea_can(auth.uid(), company_id, 'create'));
CREATE POLICY "crea_gov_arts_todas_update" ON public.crea_gov_arts_todas
  FOR UPDATE USING (public.crea_can(auth.uid(), company_id, 'edit'));
CREATE POLICY "crea_gov_arts_todas_delete" ON public.crea_gov_arts_todas
  FOR DELETE USING (public.crea_can(auth.uid(), company_id, 'delete'));

CREATE TRIGGER trg_crea_gov_arts_todas_updated
  BEFORE UPDATE ON public.crea_gov_arts_todas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atualiza whitelist do soft delete
CREATE OR REPLACE FUNCTION public.crea_soft_delete(_table text, _id uuid, _reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE allowed text[] := ARRAY[
  'crea_companies_crea','crea_engineers','crea_responsible_technicians','crea_arts','crea_protocols',
  'crea_certificates','crea_cats','crea_deregistrations','crea_documents','crea_treatments',
  'crea_deadlines','crea_credentials','crea_ai_sources','crea_norms','crea_links_oficiais',
  'crea_gov_arts','crea_gov_setores','crea_gov_tags','crea_gov_escopos','crea_gov_contratantes',
  'crea_gov_pagamentos','crea_gov_alertas','crea_art_obras',
  'crea_gov_servicos','crea_gov_art_bloco','crea_gov_relatorio_crea','crea_gov_arts_todas',
  'crea_anuidades'
];
  before_row jsonb; cid uuid;
BEGIN
  IF NOT (_table = ANY(allowed)) THEN RETURN jsonb_build_object('ok',false,'error','invalid_table'); END IF;
  IF _reason IS NULL OR length(btrim(_reason))<3 THEN RETURN jsonb_build_object('ok',false,'error','reason_required'); END IF;
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1',_table) INTO before_row USING _id;
  IF before_row IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  cid := NULLIF(before_row->>'company_id','')::uuid;
  IF cid IS NOT NULL AND NOT public.crea_can(auth.uid(), cid,'delete') THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  IF cid IS NULL AND NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'crea_admin'::app_role)) THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  EXECUTE format('UPDATE public.%I SET is_deleted=true, deleted_at=now(), deleted_by=$1, delete_reason=$2 WHERE id=$3',_table)
    USING auth.uid(), _reason, _id;
  PERFORM public.crea_log_audit(cid,'soft_delete',_table,_table,_id::text, COALESCE(before_row->>'numero', before_row->>'nome', before_row->>'titulo', before_row->>'obra', _id::text), before_row, _reason);
  RETURN jsonb_build_object('ok',true);
END $function$;
