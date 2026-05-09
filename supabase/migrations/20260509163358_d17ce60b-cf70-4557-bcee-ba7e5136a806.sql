-- Workflow de aprovação para Comunicação
-- Entidades suportadas: comm_content_posts, comm_carousels, comm_newsletters,
-- comm_internal_comms, comm_campaigns, comm_generated_designs

CREATE OR REPLACE FUNCTION public.comm_workflow_transition(
  _entidade_tipo text,
  _entidade_id uuid,
  _action text,         -- 'submit' | 'approve' | 'reject' | 'publish' | 'comment' | 'revise'
  _comentario text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  allowed text[] := ARRAY['comm_content_posts','comm_carousels','comm_newsletters',
                          'comm_internal_comms','comm_campaigns','comm_generated_designs'];
  cid uuid;
  cur_status text;
  next_status text;
  next_entity_status text;
  needs_perm text;
  v int;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  IF NOT (_entidade_tipo = ANY(allowed)) THEN
    RETURN jsonb_build_object('ok',false,'error','invalid_entity');
  END IF;

  EXECUTE format('SELECT company_id, status FROM public.%I WHERE id = $1', _entidade_tipo)
    INTO cid, cur_status USING _entidade_id;
  IF cid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;

  -- Define transição
  CASE _action
    WHEN 'submit'  THEN next_status := 'em_revisao';   next_entity_status := 'em_revisao';   needs_perm := 'edit';
    WHEN 'approve' THEN next_status := 'aprovado';     next_entity_status := 'aprovado';     needs_perm := 'approve';
    WHEN 'reject'  THEN next_status := 'reprovado';    next_entity_status := 'rascunho';     needs_perm := 'approve';
    WHEN 'publish' THEN next_status := 'publicado';    next_entity_status := 'publicado';    needs_perm := 'publish';
    WHEN 'revise'  THEN next_status := 'em_revisao';   next_entity_status := 'em_revisao';   needs_perm := 'edit';
    WHEN 'comment' THEN next_status := COALESCE(cur_status,'rascunho'); next_entity_status := NULL; needs_perm := 'view';
    ELSE RETURN jsonb_build_object('ok',false,'error','invalid_action');
  END CASE;

  IF NOT public.comm_can(uid, cid, needs_perm) THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;

  IF _action IN ('approve','reject') AND COALESCE(cur_status,'') NOT IN ('em_revisao','rascunho_ia','rascunho') THEN
    -- permitir aprovar diretamente de rascunho também
    NULL;
  END IF;
  IF _action = 'publish' AND COALESCE(cur_status,'') NOT IN ('aprovado','agendado') THEN
    RETURN jsonb_build_object('ok',false,'error','must_approve_first');
  END IF;
  IF _action IN ('reject','comment') AND (_comentario IS NULL OR length(btrim(_comentario)) < 1) THEN
    RETURN jsonb_build_object('ok',false,'error','comment_required');
  END IF;

  SELECT COALESCE(MAX(versao),0)+1 INTO v FROM public.comm_approvals
   WHERE entidade_tipo=_entidade_tipo AND entidade_id=_entidade_id;

  INSERT INTO public.comm_approvals(company_id, entidade_tipo, entidade_id, status, comentario,
    motivo_reprovacao, aprovado_por, aprovado_em, versao, created_by)
  VALUES (cid, _entidade_tipo, _entidade_id, next_status, _comentario,
    CASE WHEN _action='reject' THEN _comentario END,
    CASE WHEN _action IN ('approve','publish') THEN uid END,
    CASE WHEN _action IN ('approve','publish') THEN now() END,
    v, uid);

  IF next_entity_status IS NOT NULL THEN
    EXECUTE format('UPDATE public.%I SET status=$1, updated_at=now() WHERE id=$2', _entidade_tipo)
      USING next_entity_status, _entidade_id;
  END IF;

  PERFORM public.comm_log_audit(cid, 'workflow.'||_action, _entidade_tipo, _entidade_tipo,
    _entidade_id::text, NULL, jsonb_build_object('from',cur_status,'to',next_status), _comentario);

  RETURN jsonb_build_object('ok',true,'status',next_status,'versao',v);
END $$;

GRANT EXECUTE ON FUNCTION public.comm_workflow_transition(text,uuid,text,text) TO authenticated;