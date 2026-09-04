-- Nós — visibilidade conjunta do casal
-- Rode no SQL Editor do Supabase (uma vez).
-- Os dois passam a ver as mesmas contas, lançamentos e painéis.

create or replace function public.can_access(owner_id uuid, is_shared boolean)
returns boolean
language sql
stable
as $$
  select auth.uid() is not null;
$$;

alter table public.accounts alter column is_shared set default true;

update public.accounts set is_shared = true where is_shared = false;
update public.categories set is_shared = true where is_shared = false;
update public.transactions set is_shared = true where is_shared = false;

do $$
begin
  if to_regclass('public.budgets') is not null then
    update public.budgets set is_shared = true where is_shared = false;
  end if;
  if to_regclass('public.bills') is not null then
    update public.bills set is_shared = true where is_shared = false;
  end if;
end $$;

create table if not exists public.app_meta (
  key text primary key
);

alter table public.app_meta enable row level security;

drop policy if exists "app_meta_select" on public.app_meta;
create policy "app_meta_select"
on public.app_meta for select
to authenticated
using (true);

insert into public.app_meta (key) values ('household_select')
on conflict (key) do nothing;
