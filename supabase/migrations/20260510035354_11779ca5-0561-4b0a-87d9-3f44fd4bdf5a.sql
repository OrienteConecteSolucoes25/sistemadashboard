-- Auto-conciliação
CREATE OR REPLACE FUNCTION public.crea_gov_conciliate_run(_company uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched int := 0;
  divergent int := 0;
  fallback int := 0;
BEGIN
  IF NOT public.crea_can(auth.uid(), _company, 'governance_finance') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  -- 1) Match exato por numero_boleto
  WITH pares AS (
    SELECT p.id AS pid, a.id AS aid,
           CASE WHEN ABS(COALESCE(p.valor,0) - COALESCE(a.valor_taxa,0)) < 0.05 THEN 'ok' ELSE 'divergente' END AS st,
           CASE WHEN ABS(COALESCE(p.valor,0) - COALESCE(a.valor_taxa,0)) < 0.05 THEN 1.0 ELSE 0.7 END AS sc
    FROM public.crea_gov_pagamentos p
    JOIN public.crea_gov_arts a
      ON a.company_id = p.company_id
     AND a.is_deleted = false
     AND a.boleto_numero IS NOT NULL
     AND p.numero_boleto IS NOT NULL
     AND lower(btrim(a.boleto_numero)) = lower(btrim(p.numero_boleto))
    WHERE p.company_id = _company
      AND p.is_deleted = false
      AND p.conciliado_art_id IS NULL
  ), ins AS (
    INSERT INTO public.crea_gov_conciliacoes(company_id, art_id, pagamento_id, origem, score, motivo, status, created_by)
    SELECT _company, aid, pid, 'auto_boleto', sc,
           CASE WHEN st='ok' THEN 'numero_boleto exato' ELSE 'numero_boleto exato (valores divergentes)' END,
           st, auth.uid()
    FROM pares
    ON CONFLICT DO NOTHING
    RETURNING pagamento_id, art_id, status
  ), upd_pag AS (
    UPDATE public.crea_gov_pagamentos p SET conciliado_art_id = i.art_id, status = 'conciliado'
    FROM ins i WHERE p.id = i.pagamento_id
    RETURNING 1
  ), upd_art AS (
    UPDATE public.crea_gov_arts a SET status_financeiro = CASE WHEN i.status='ok' THEN 'Pago' ELSE 'Divergente' END
    FROM ins i WHERE a.id = i.art_id
    RETURNING 1
  )
  SELECT COUNT(*) FILTER (WHERE status='ok'), COUNT(*) FILTER (WHERE status='divergente')
    INTO matched, divergent FROM ins;

  -- 2) Fallback: pagamentos restantes -> match por valor (tol 0.05) + sacado~contratante + janela 30 dias
  WITH cand AS (
    SELECT DISTINCT ON (p.id) p.id AS pid, a.id AS aid
    FROM public.crea_gov_pagamentos p
    JOIN public.crea_gov_arts a ON a.company_id = p.company_id AND a.is_deleted = false
    LEFT JOIN public.crea_gov_contratantes c ON c.id = a.contratante_id
    WHERE p.company_id = _company
      AND p.is_deleted = false
      AND p.conciliado_art_id IS NULL
      AND a.valor_taxa IS NOT NULL AND p.valor IS NOT NULL
      AND ABS(p.valor - a.valor_taxa) < 0.05
      AND (
        p.data_pagamento IS NULL OR a.data_vencimento IS NULL
        OR p.data_pagamento BETWEEN (a.data_vencimento - INTERVAL '30 days') AND (a.data_vencimento + INTERVAL '60 days')
      )
      AND (
        p.sacado IS NULL OR c.nome IS NULL
        OR lower(p.sacado) LIKE '%' || lower(split_part(c.nome,' ',1)) || '%'
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.crea_gov_conciliacoes cn WHERE cn.art_id = a.id
      )
    ORDER BY p.id, ABS(p.valor - a.valor_taxa) ASC
  ), ins2 AS (
    INSERT INTO public.crea_gov_conciliacoes(company_id, art_id, pagamento_id, origem, score, motivo, status, created_by)
    SELECT _company, aid, pid, 'auto_fallback', 0.6, 'valor + janela + sacado~contratante', 'ok', auth.uid()
    FROM cand
    ON CONFLICT DO NOTHING
    RETURNING pagamento_id, art_id
  ), up2 AS (
    UPDATE public.crea_gov_pagamentos p SET conciliado_art_id = i.art_id, status='conciliado'
    FROM ins2 i WHERE p.id = i.pagamento_id RETURNING 1
  ), up3 AS (
    UPDATE public.crea_gov_arts a SET status_financeiro='Pago'
    FROM ins2 i WHERE a.id = i.art_id RETURNING 1
  )
  SELECT COUNT(*) INTO fallback FROM ins2;

  RETURN jsonb_build_object('ok', true, 'matched', matched, 'divergent', divergent, 'fallback', fallback);
END $$;

-- Conciliação manual
CREATE OR REPLACE FUNCTION public.crea_gov_conciliate_manual(_pagamento uuid, _art uuid, _motivo text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE p record; a record; st text; sc numeric;
BEGIN
  SELECT * INTO p FROM public.crea_gov_pagamentos WHERE id = _pagamento;
  SELECT * INTO a FROM public.crea_gov_arts WHERE id = _art;
  IF p.id IS NULL OR a.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF p.company_id <> a.company_id THEN RETURN jsonb_build_object('ok', false, 'error', 'company_mismatch'); END IF;
  IF NOT public.crea_can(auth.uid(), p.company_id, 'governance_finance') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF _motivo IS NULL OR length(btrim(_motivo)) < 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'reason_required');
  END IF;
  st := CASE WHEN ABS(COALESCE(p.valor,0) - COALESCE(a.valor_taxa,0)) < 0.05 THEN 'ok' ELSE 'divergente' END;
  sc := CASE WHEN st='ok' THEN 0.95 ELSE 0.5 END;
  INSERT INTO public.crea_gov_conciliacoes(company_id, art_id, pagamento_id, origem, score, motivo, status, created_by)
    VALUES (p.company_id, _art, _pagamento, 'manual', sc, _motivo, st, auth.uid());
  UPDATE public.crea_gov_pagamentos SET conciliado_art_id = _art, status='conciliado' WHERE id = _pagamento;
  UPDATE public.crea_gov_arts SET status_financeiro = CASE WHEN st='ok' THEN 'Pago' ELSE 'Divergente' END WHERE id = _art;
  PERFORM public.crea_log_audit(p.company_id, 'gov_conciliate_manual', 'crea.governanca', 'crea_gov_conciliacoes', _pagamento::text, NULL, jsonb_build_object('art', _art, 'pagamento', _pagamento, 'status', st), _motivo);
  RETURN jsonb_build_object('ok', true, 'status', st, 'score', sc);
END $$;

-- Desfazer conciliação
CREATE OR REPLACE FUNCTION public.crea_gov_conciliate_unlink(_conciliacao uuid, _motivo text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE c record;
BEGIN
  SELECT * INTO c FROM public.crea_gov_conciliacoes WHERE id = _conciliacao;
  IF c.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF NOT public.crea_can(auth.uid(), c.company_id, 'governance_finance') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF _motivo IS NULL OR length(btrim(_motivo)) < 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'reason_required');
  END IF;
  UPDATE public.crea_gov_pagamentos SET conciliado_art_id = NULL, status='aberto' WHERE id = c.pagamento_id;
  DELETE FROM public.crea_gov_conciliacoes WHERE id = _conciliacao;
  PERFORM public.crea_log_audit(c.company_id, 'gov_conciliate_unlink', 'crea.governanca', 'crea_gov_conciliacoes', _conciliacao::text, NULL, jsonb_build_object('art', c.art_id, 'pagamento', c.pagamento_id), _motivo);
  RETURN jsonb_build_object('ok', true);
END $$;