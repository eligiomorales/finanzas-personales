-- Reglas persistentes de categorización por pareja (keyword → categoría)

create table public.category_rules (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  keyword text not null,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (couple_id, keyword)
);

create index category_rules_couple_idx on public.category_rules (couple_id);

alter table public.category_rules enable row level security;

create policy "Members manage category rules"
  on public.category_rules for all
  using (couple_id = public.get_my_couple_id())
  with check (couple_id = public.get_my_couple_id());

alter publication supabase_realtime add table public.category_rules;
