create table if not exists public.app_state_snapshots (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_state_snapshots replica identity full;

create index if not exists app_state_snapshots_updated_at_idx
  on public.app_state_snapshots (updated_at desc);

alter table public.app_state_snapshots disable row level security;
