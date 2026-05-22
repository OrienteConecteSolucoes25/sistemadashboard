
create table if not exists public.comm_flows (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  nome text not null,
  descricao text default '',
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  ativo boolean not null default true,
  is_deleted boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comm_flow_runs (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.comm_flows(id) on delete cascade,
  company_id uuid not null,
  status text not null default 'running',
  log jsonb not null default '[]'::jsonb,
  result jsonb,
  started_by uuid,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.comm_flows enable row level security;
alter table public.comm_flow_runs enable row level security;

drop policy if exists "comm_flows_select" on public.comm_flows;
create policy "comm_flows_select" on public.comm_flows for select to authenticated
  using (public.comm_can(auth.uid(), company_id, 'view_module'));

drop policy if exists "comm_flows_insert" on public.comm_flows;
create policy "comm_flows_insert" on public.comm_flows for insert to authenticated
  with check (public.comm_can(auth.uid(), company_id, 'manage_flows') or public.comm_can(auth.uid(), company_id, 'generate_content'));

drop policy if exists "comm_flows_update" on public.comm_flows;
create policy "comm_flows_update" on public.comm_flows for update to authenticated
  using (public.comm_can(auth.uid(), company_id, 'manage_flows') or public.comm_can(auth.uid(), company_id, 'generate_content'));

drop policy if exists "comm_flows_delete" on public.comm_flows;
create policy "comm_flows_delete" on public.comm_flows for delete to authenticated
  using (public.comm_can(auth.uid(), company_id, 'manage_flows') or public.comm_can(auth.uid(), company_id, 'generate_content'));

drop policy if exists "comm_flow_runs_select" on public.comm_flow_runs;
create policy "comm_flow_runs_select" on public.comm_flow_runs for select to authenticated
  using (public.comm_can(auth.uid(), company_id, 'view_module'));

drop policy if exists "comm_flow_runs_insert" on public.comm_flow_runs;
create policy "comm_flow_runs_insert" on public.comm_flow_runs for insert to authenticated
  with check (public.comm_can(auth.uid(), company_id, 'view_module'));
