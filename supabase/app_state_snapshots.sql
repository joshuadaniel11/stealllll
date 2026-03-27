create table if not exists public.app_state_snapshots (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_state_snapshots replica identity full;

create index if not exists app_state_snapshots_updated_at_idx
  on public.app_state_snapshots (updated_at desc);

alter table public.app_state_snapshots enable row level security;

drop policy if exists "app_state_snapshots_select_shared_state" on public.app_state_snapshots;
drop policy if exists "app_state_snapshots_insert_shared_state" on public.app_state_snapshots;
drop policy if exists "app_state_snapshots_update_shared_state" on public.app_state_snapshots;

create policy "app_state_snapshots_select_shared_state"
  on public.app_state_snapshots
  for select
  to anon, authenticated
  using (id = 'steal-shared-state');

create policy "app_state_snapshots_insert_shared_state"
  on public.app_state_snapshots
  for insert
  to anon, authenticated
  with check (id = 'steal-shared-state');

create policy "app_state_snapshots_update_shared_state"
  on public.app_state_snapshots
  for update
  to anon, authenticated
  using (id = 'steal-shared-state')
  with check (id = 'steal-shared-state');
