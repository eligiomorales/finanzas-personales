-- Presupuestos mensuales por categoría (colaborativos por pareja)

create table public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  year_month text not null check (year_month ~ '^\d{4}-\d{2}$'),
  amount numeric not null check (amount >= 0),
  currency text not null check (currency in ('ARS', 'USD')),
  scope text not null default 'couple' check (scope in ('couple')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, category_id, year_month, scope)
);

create index category_budgets_couple_month_idx on public.category_budgets (couple_id, year_month);

alter table public.category_budgets enable row level security;

create policy "Members manage category budgets"
  on public.category_budgets for all
  using (couple_id = public.get_my_couple_id())
  with check (couple_id = public.get_my_couple_id());

alter publication supabase_realtime add table public.category_budgets;
