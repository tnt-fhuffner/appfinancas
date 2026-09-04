-- Nós — Fase 5: viagens
-- Rode no SQL Editor do Supabase (uma vez).

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  destination text not null,
  start_on date not null,
  end_on date not null,
  planned_amount numeric(14, 2) not null default 0 check (planned_amount >= 0),
  status text not null default 'planning' check (status in ('planning', 'confirmed', 'completed')),
  notes text,
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_shared boolean not null default true,
  created_at timestamptz not null default now(),
  constraint trip_dates_ok check (end_on >= start_on)
);

create table if not exists public.trip_budget_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  kind text not null check (kind in ('flight', 'lodging', 'food', 'tours', 'shopping', 'other')),
  planned_amount numeric(14, 2) not null default 0 check (planned_amount >= 0),
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_shared boolean not null default true,
  unique (trip_id, kind)
);

create table if not exists public.trip_checklist (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  sort_order int not null default 0,
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_shared boolean not null default true
);

create table if not exists public.trip_itinerary (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  occurs_on date not null,
  title text not null,
  place text,
  notes text,
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_shared boolean not null default true
);

alter table public.transactions
  add column if not exists trip_id uuid references public.trips (id) on delete set null;

alter table public.transactions
  add column if not exists trip_budget_item_id uuid references public.trip_budget_items (id) on delete set null;

create index if not exists trips_start_on_idx on public.trips (start_on);
create index if not exists trips_owner_id_idx on public.trips (owner_id);
create index if not exists trip_budget_items_trip_id_idx on public.trip_budget_items (trip_id);
create index if not exists trip_checklist_trip_id_idx on public.trip_checklist (trip_id);
create index if not exists trip_itinerary_trip_id_idx on public.trip_itinerary (trip_id, occurs_on);
create index if not exists transactions_trip_id_idx on public.transactions (trip_id);

alter table public.trips enable row level security;
alter table public.trip_budget_items enable row level security;
alter table public.trip_checklist enable row level security;
alter table public.trip_itinerary enable row level security;

drop policy if exists "trips_select" on public.trips;
create policy "trips_select"
on public.trips for select
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "trips_insert" on public.trips;
create policy "trips_insert"
on public.trips for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "trips_update" on public.trips;
create policy "trips_update"
on public.trips for update
to authenticated
using (public.can_access(owner_id, is_shared))
with check (public.can_access(owner_id, is_shared));

drop policy if exists "trips_delete" on public.trips;
create policy "trips_delete"
on public.trips for delete
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "trip_budget_items_select" on public.trip_budget_items;
create policy "trip_budget_items_select"
on public.trip_budget_items for select
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "trip_budget_items_insert" on public.trip_budget_items;
create policy "trip_budget_items_insert"
on public.trip_budget_items for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "trip_budget_items_update" on public.trip_budget_items;
create policy "trip_budget_items_update"
on public.trip_budget_items for update
to authenticated
using (public.can_access(owner_id, is_shared))
with check (public.can_access(owner_id, is_shared));

drop policy if exists "trip_budget_items_delete" on public.trip_budget_items;
create policy "trip_budget_items_delete"
on public.trip_budget_items for delete
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "trip_checklist_select" on public.trip_checklist;
create policy "trip_checklist_select"
on public.trip_checklist for select
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "trip_checklist_insert" on public.trip_checklist;
create policy "trip_checklist_insert"
on public.trip_checklist for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "trip_checklist_update" on public.trip_checklist;
create policy "trip_checklist_update"
on public.trip_checklist for update
to authenticated
using (public.can_access(owner_id, is_shared))
with check (public.can_access(owner_id, is_shared));

drop policy if exists "trip_checklist_delete" on public.trip_checklist;
create policy "trip_checklist_delete"
on public.trip_checklist for delete
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "trip_itinerary_select" on public.trip_itinerary;
create policy "trip_itinerary_select"
on public.trip_itinerary for select
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "trip_itinerary_insert" on public.trip_itinerary;
create policy "trip_itinerary_insert"
on public.trip_itinerary for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "trip_itinerary_update" on public.trip_itinerary;
create policy "trip_itinerary_update"
on public.trip_itinerary for update
to authenticated
using (public.can_access(owner_id, is_shared))
with check (public.can_access(owner_id, is_shared));

drop policy if exists "trip_itinerary_delete" on public.trip_itinerary;
create policy "trip_itinerary_delete"
on public.trip_itinerary for delete
to authenticated
using (public.can_access(owner_id, is_shared));
