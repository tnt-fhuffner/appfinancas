-- Nós — Fase 3: orçamentos e contas a pagar/receber
-- Rode no SQL Editor do Supabase (uma vez).

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  month_start date not null,
  planned_amount numeric(14, 2) not null check (planned_amount >= 0),
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_shared boolean not null default true,
  created_at timestamptz not null default now(),
  unique (category_id, month_start)
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount numeric(14, 2) not null check (amount > 0),
  kind text not null check (kind in ('payable', 'receivable')),
  due_on date not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  category_id uuid references public.categories (id) on delete set null,
  account_id uuid references public.accounts (id) on delete set null,
  paid_transaction_id uuid references public.transactions (id) on delete set null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_shared boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists budgets_month_start_idx on public.budgets (month_start);
create index if not exists budgets_owner_id_idx on public.budgets (owner_id);
create index if not exists bills_due_on_idx on public.bills (due_on);
create index if not exists bills_status_idx on public.bills (status);
create index if not exists bills_owner_id_idx on public.bills (owner_id);

alter table public.budgets enable row level security;
alter table public.bills enable row level security;

drop policy if exists "budgets_select" on public.budgets;
create policy "budgets_select"
on public.budgets for select
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "budgets_insert" on public.budgets;
create policy "budgets_insert"
on public.budgets for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "budgets_update" on public.budgets;
create policy "budgets_update"
on public.budgets for update
to authenticated
using (public.can_access(owner_id, is_shared))
with check (public.can_access(owner_id, is_shared));

drop policy if exists "budgets_delete" on public.budgets;
create policy "budgets_delete"
on public.budgets for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "bills_select" on public.bills;
create policy "bills_select"
on public.bills for select
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "bills_insert" on public.bills;
create policy "bills_insert"
on public.bills for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "bills_update" on public.bills;
create policy "bills_update"
on public.bills for update
to authenticated
using (public.can_access(owner_id, is_shared))
with check (public.can_access(owner_id, is_shared));

drop policy if exists "bills_delete" on public.bills;
create policy "bills_delete"
on public.bills for delete
to authenticated
using (public.can_access(owner_id, is_shared));
