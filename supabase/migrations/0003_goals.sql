-- Nós — Fase 4: metas e sonhos
-- Rode no SQL Editor do Supabase (uma vez).

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  initial_amount numeric(14, 2) not null default 0 check (initial_amount >= 0),
  target_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  kind text not null default 'other' check (kind in ('travel', 'home', 'vehicle', 'emergency', 'other')),
  color text not null default '#c4785a',
  monthly_plan numeric(14, 2) not null default 0 check (monthly_plan >= 0),
  notes text,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_shared boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  contributed_on date not null default (timezone('America/Sao_Paulo', now()))::date,
  notes text,
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_shared boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists goals_status_idx on public.goals (status);
create index if not exists goals_target_date_idx on public.goals (target_date);
create index if not exists goals_owner_id_idx on public.goals (owner_id);
create index if not exists goal_contributions_goal_id_idx on public.goal_contributions (goal_id);
create index if not exists goal_contributions_owner_id_idx on public.goal_contributions (owner_id);

alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;

drop policy if exists "goals_select" on public.goals;
create policy "goals_select"
on public.goals for select
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "goals_insert" on public.goals;
create policy "goals_insert"
on public.goals for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "goals_update" on public.goals;
create policy "goals_update"
on public.goals for update
to authenticated
using (public.can_access(owner_id, is_shared))
with check (public.can_access(owner_id, is_shared));

drop policy if exists "goals_delete" on public.goals;
create policy "goals_delete"
on public.goals for delete
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "goal_contributions_select" on public.goal_contributions;
create policy "goal_contributions_select"
on public.goal_contributions for select
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "goal_contributions_insert" on public.goal_contributions;
create policy "goal_contributions_insert"
on public.goal_contributions for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "goal_contributions_delete" on public.goal_contributions;
create policy "goal_contributions_delete"
on public.goal_contributions for delete
to authenticated
using (public.can_access(owner_id, is_shared));
