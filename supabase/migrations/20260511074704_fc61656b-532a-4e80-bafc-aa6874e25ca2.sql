
create table if not exists public.crea_rts_pessoas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  nome text not null,
  cpf text not null default '',
  status text not null default 'ativo',
  data_inicio date,
  data_termino date,
  termino_indefinido boolean not null default false,
  modelo_contrato text not null default 'clt',
  visto text not null default '',
  rnp text not null default '',
  registro text not null default '',
  observacao text not null default '',
  anuidade text not null default 'nao_paga',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text
);

create index if not exists idx_crea_rts_pessoas_company on public.crea_rts_pessoas(company_id, is_deleted);
create index if not exists idx_crea_rts_pessoas_status on public.crea_rts_pessoas(company_id, status);

alter table public.crea_rts_pessoas enable row level security;

drop policy if exists "crea_rts_pessoas_select" on public.crea_rts_pessoas;
create policy "crea_rts_pessoas_select" on public.crea_rts_pessoas
  for select to authenticated
  using (
    public.has_role(auth.uid(),'admin'::app_role)
    or public.crea_can(auth.uid(), company_id, 'view')
    or company_id = public.user_company(auth.uid())
  );

drop policy if exists "crea_rts_pessoas_insert" on public.crea_rts_pessoas;
create policy "crea_rts_pessoas_insert" on public.crea_rts_pessoas
  for insert to authenticated
  with check (public.crea_can(auth.uid(), company_id, 'create'));

drop policy if exists "crea_rts_pessoas_update" on public.crea_rts_pessoas;
create policy "crea_rts_pessoas_update" on public.crea_rts_pessoas
  for update to authenticated
  using (public.crea_can(auth.uid(), company_id, 'edit'))
  with check (public.crea_can(auth.uid(), company_id, 'edit'));

drop policy if exists "crea_rts_pessoas_delete" on public.crea_rts_pessoas;
create policy "crea_rts_pessoas_delete" on public.crea_rts_pessoas
  for delete to authenticated
  using (public.crea_can(auth.uid(), company_id, 'delete'));

drop trigger if exists trg_crea_rts_pessoas_upd on public.crea_rts_pessoas;
create trigger trg_crea_rts_pessoas_upd
  before update on public.crea_rts_pessoas
  for each row execute function public.update_updated_at_column();

create or replace function public.crea_soft_delete(_table text, _id uuid, _reason text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
DECLARE allowed text[] := ARRAY[
  'crea_companies_crea','crea_engineers','crea_responsible_technicians','crea_arts','crea_protocols',
  'crea_certificates','crea_cats','crea_deregistrations','crea_documents','crea_treatments',
  'crea_deadlines','crea_credentials','crea_ai_sources','crea_norms','crea_links_oficiais',
  'crea_gov_arts','crea_gov_setores','crea_gov_tags','crea_gov_escopos','crea_gov_contratantes',
  'crea_gov_pagamentos','crea_gov_alertas',
  'crea_art_obras','crea_rts_pessoas'
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
