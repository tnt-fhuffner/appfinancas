-- Nós — Fase 2: perfis, contas, categorias e transações
-- Rode no SQL Editor do Supabase (uma vez).

create extension if not exists "pgcrypto";

create or replace function public.can_access(owner_id uuid, is_shared boolean)
returns boolean
language sql
stable
as $$
  select auth.uid() is not null
    and (is_shared = true or owner_id = auth.uid());
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('checking', 'savings', 'wallet', 'credit_card')),
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_shared boolean not null default false,
  color text,
  initial_balance numeric(14, 2) not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  color text not null default '#c4785a',
  icon text,
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_shared boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  amount numeric(14, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense', 'transfer')),
  category_id uuid references public.categories (id) on delete set null,
  account_id uuid not null references public.accounts (id) on delete restrict,
  transfer_account_id uuid references public.accounts (id) on delete restrict,
  occurred_on date not null default (timezone('America/Sao_Paulo', now()))::date,
  owner_id uuid not null references auth.users (id) on delete cascade,
  is_shared boolean not null default true,
  payment_method text,
  recurrence text not null default 'once' check (recurrence in ('once', 'monthly', 'installment')),
  installment_count int,
  notes text,
  receipt_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transfer_destination_ok check (
    (
      type = 'transfer'
      and transfer_account_id is not null
      and transfer_account_id <> account_id
    )
    or (type <> 'transfer' and transfer_account_id is null)
  )
);

create index if not exists accounts_owner_id_idx on public.accounts (owner_id);
create index if not exists categories_owner_id_idx on public.categories (owner_id);
create index if not exists categories_kind_idx on public.categories (kind);
create index if not exists transactions_occurred_on_idx on public.transactions (occurred_on desc);
create index if not exists transactions_account_id_idx on public.transactions (account_id);
create index if not exists transactions_owner_id_idx on public.transactions (owner_id);
create index if not exists transactions_category_id_idx on public.transactions (category_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name, avatar_url)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "accounts_select" on public.accounts;
create policy "accounts_select"
on public.accounts for select
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "accounts_insert" on public.accounts;
create policy "accounts_insert"
on public.accounts for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "accounts_update" on public.accounts;
create policy "accounts_update"
on public.accounts for update
to authenticated
using (public.can_access(owner_id, is_shared))
with check (public.can_access(owner_id, is_shared));

drop policy if exists "accounts_delete" on public.accounts;
create policy "accounts_delete"
on public.accounts for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "categories_select" on public.categories;
create policy "categories_select"
on public.categories for select
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "categories_insert" on public.categories;
create policy "categories_insert"
on public.categories for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "categories_update" on public.categories;
create policy "categories_update"
on public.categories for update
to authenticated
using (public.can_access(owner_id, is_shared))
with check (public.can_access(owner_id, is_shared));

drop policy if exists "categories_delete" on public.categories;
create policy "categories_delete"
on public.categories for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "transactions_select" on public.transactions;
create policy "transactions_select"
on public.transactions for select
to authenticated
using (public.can_access(owner_id, is_shared));

drop policy if exists "transactions_insert" on public.transactions;
create policy "transactions_insert"
on public.transactions for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "transactions_update" on public.transactions;
create policy "transactions_update"
on public.transactions for update
to authenticated
using (public.can_access(owner_id, is_shared))
with check (public.can_access(owner_id, is_shared));

drop policy if exists "transactions_delete" on public.transactions;
create policy "transactions_delete"
on public.transactions for delete
to authenticated
using (public.can_access(owner_id, is_shared));

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "receipts_select" on storage.objects;
create policy "receipts_select"
on storage.objects for select
to authenticated
using (bucket_id = 'receipts');

drop policy if exists "receipts_insert" on storage.objects;
create policy "receipts_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "receipts_delete" on storage.objects;
create policy "receipts_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = auth.uid()::text
);
