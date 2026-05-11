CREATE OR REPLACE FUNCTION public.crea_soft_delete_bulk(_table text, _ids uuid[], _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  allowed text[] := ARRAY[
    'crea_companies_crea','crea_engineers','crea_responsible_technicians','crea_arts','crea_protocols',
    'crea_certificates','crea_cats','crea_deregistrations','crea_documents','crea_treatments',
    'crea_deadlines','crea_credentials','crea_ai_sources','crea_norms','crea_links_oficiais',
    'crea_gov_arts','crea_gov_setores','crea_gov_tags','crea_gov_escopos','crea_gov_contratantes',
    'crea_gov_pagamentos','crea_gov_alertas','crea_art_obras',
    'crea_gov_servicos','crea_gov_art_bloco','crea_gov_relatorio_crea','crea_gov_arts_todas',
    'crea_anuidades'
  ];
  uid uuid := auth.uid();
  rec record;
  ok_count int := 0;
  forbid_count int := 0;
  notfound_count int := 0;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  IF NOT (_table = ANY(allowed)) THEN RETURN jsonb_build_object('ok',false,'error','invalid_table'); END IF;
  IF _reason IS NULL OR length(btrim(_reason))<3 THEN RETURN jsonb_build_object('ok',false,'error','reason_required'); END IF;
  IF _ids IS NULL OR array_length(_ids,1) IS NULL THEN RETURN jsonb_build_object('ok',true,'deleted',0); END IF;

  -- Coleta os registros existentes (não excluídos) e verifica permissão por company
  FOR rec IN EXECUTE format(
    'SELECT id, NULLIF((to_jsonb(t)->>''company_id''),'''')::uuid AS cid,
            COALESCE(to_jsonb(t)->>''numero'', to_jsonb(t)->>''nome'', to_jsonb(t)->>''titulo'', to_jsonb(t)->>''obra'', id::text) AS lbl,
            to_jsonb(t) AS before
       FROM public.%I t
      WHERE id = ANY($1) AND COALESCE(is_deleted,false) = false', _table
  ) USING _ids
  LOOP
    IF rec.cid IS NOT NULL AND NOT public.crea_can(uid, rec.cid, 'delete') THEN
      forbid_count := forbid_count + 1;
      CONTINUE;
    END IF;
    IF rec.cid IS NULL AND NOT (public.has_role(uid,'admin'::app_role) OR public.has_role(uid,'crea_admin'::app_role)) THEN
      forbid_count := forbid_count + 1;
      CONTINUE;
    END IF;
    EXECUTE format('UPDATE public.%I SET is_deleted=true, deleted_at=now(), deleted_by=$1, delete_reason=$2 WHERE id=$3', _table)
      USING uid, _reason, rec.id;
    PERFORM public.crea_log_audit(rec.cid,'soft_delete_bulk',_table,_table, rec.id::text, rec.lbl, rec.before, _reason);
    ok_count := ok_count + 1;
  END LOOP;

  notfound_count := COALESCE(array_length(_ids,1),0) - ok_count - forbid_count;
  RETURN jsonb_build_object('ok',true,'deleted',ok_count,'forbidden',forbid_count,'not_found',GREATEST(notfound_count,0));
END $function$;