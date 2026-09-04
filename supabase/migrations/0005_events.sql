-- Nós — Fase 6: eventos, dates e surpresas
-- Rode no SQL Editor do Supabase (uma vez).

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  occurs_on date not null,
  kind text not null default 'date' check (kind in ('date', 'event', 'birthday', 'anniversary')),
  status text not null default 'planned' check (status in ('idea', 'planned', 'done')),
  place text,
  planned_amount numeric(14, 2) not null default 0 check (planned_amount >= 0),
  notes text,
  is_surprise boolean not null default false,
  repeats_yearly boolean not null default false,
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_shared boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists events_occurs_on_idx on public.events (occurs_on);
create index if not exists events_owner_id_idx on public.events (owner_id);
create index if not exists events_kind_idx on public.events (kind);

alter table public.events enable row level security;

-- Surpresa compartilhada: só o autor vê até o dia chegar.
-- Pessoal (is_shared = false): só o autor vê sempre.
drop policy if exists "events_select" on public.events;
create policy "events_select"
on public.events for select
to authenticated
using (
  auth.uid() is not null
  and (
    owner_id = auth.uid()
    or (
      is_shared = true
      and (
        is_surprise = false
        or occurs_on <= (timezone('America/Sao_Paulo', now()))::date
      )
    )
  )
);

drop policy if exists "events_insert" on public.events;
create policy "events_insert"
on public.events for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "events_update" on public.events;
create policy "events_update"
on public.events for update
to authenticated
using (
  auth.uid() is not null
  and (
    owner_id = auth.uid()
    or (
      is_shared = true
      and (
        is_surprise = false
        or occurs_on <= (timezone('America/Sao_Paulo', now()))::date
      )
    )
  )
)
with check (
  auth.uid() is not null
  and (
    owner_id = auth.uid()
    or (
      is_shared = true
      and (
        is_surprise = false
        or occurs_on <= (timezone('America/Sao_Paulo', now()))::date
      )
    )
  )
);

drop policy if exists "events_delete" on public.events;
create policy "events_delete"
on public.events for delete
to authenticated
using (
  owner_id = auth.uid()
  or (
    is_shared = true
    and is_surprise = false
  )
);
