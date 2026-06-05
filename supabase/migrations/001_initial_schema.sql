-- Finanzas Pareja — schema inicial con RLS

create extension if not exists "pgcrypto";

-- Perfiles (extiende auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

-- Parejas
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index couples_invite_code_idx on public.couples (invite_code);

-- Miembros de pareja (exactamente dos roles por pareja)
create table public.couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('personA', 'personB')),
  joined_at timestamptz not null default now(),
  unique (couple_id, user_id),
  unique (couple_id, role),
  unique (user_id)
);

create index couple_members_couple_id_idx on public.couple_members (couple_id);

-- Categorías por pareja
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text
);

create index categories_couple_id_idx on public.categories (couple_id);

-- Movimientos
create table public.movements (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'settlement')),
  amount numeric not null,
  currency text not null check (currency in ('ARS', 'USD')),
  date date not null,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  paid_by text not null check (paid_by in ('personA', 'personB', 'both')),
  share_person_a numeric not null default 0,
  share_person_b numeric not null default 0,
  is_shared boolean not null default false,
  source text not null check (source in ('manual', 'imported')) default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index movements_couple_id_date_idx on public.movements (couple_id, date desc);
create index movements_couple_id_type_idx on public.movements (couple_id, type);

-- Configuración por pareja
create table public.couple_settings (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  person_a_name text not null default 'Persona A',
  person_b_name text not null default 'Persona B',
  display_currency text not null default 'ARS' check (display_currency in ('ARS', 'USD')),
  default_exchange_rate_usd numeric not null default 1200
);

-- Importaciones
create table public.imports (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  account_type text not null check (account_type in ('credit', 'debit')),
  file_name text not null,
  imported_at timestamptz not null default now(),
  detected_count integer not null default 0,
  confirmed_count integer not null default 0,
  status text not null check (status in ('pending', 'completed', 'cancelled'))
);

create index imports_couple_id_idx on public.imports (couple_id);

-- Movimientos pendientes de importación
create table public.pending_import_movements (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  import_id uuid not null references public.imports(id) on delete cascade,
  date date not null,
  original_description text not null,
  amount numeric not null,
  currency text not null check (currency in ('ARS', 'USD')),
  merchant text,
  suggested_category_id uuid references public.categories(id) on delete set null,
  possible_duplicate boolean not null default false,
  duplicate_movement_id uuid references public.movements(id) on delete set null,
  status text not null check (status in ('pending', 'confirmed', 'ignored'))
);

create index pending_import_movements_import_id_idx on public.pending_import_movements (import_id);

-- Helper: couple_id del usuario autenticado
create or replace function public.get_my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.couple_members where user_id = auth.uid() limit 1;
$$;

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.categories enable row level security;
alter table public.movements enable row level security;
alter table public.couple_settings enable row level security;
alter table public.imports enable row level security;
alter table public.pending_import_movements enable row level security;

-- Profiles
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Couples
create policy "Members can read their couple"
  on public.couples for select
  using (id = public.get_my_couple_id());

create policy "Authenticated users can create couples"
  on public.couples for insert
  with check (auth.uid() = created_by);

-- Couple members
create policy "Members can read couple members"
  on public.couple_members for select
  using (couple_id = public.get_my_couple_id());

create policy "Users can join couples"
  on public.couple_members for insert
  with check (auth.uid() = user_id);

-- Categories
create policy "Members manage categories"
  on public.categories for all
  using (couple_id = public.get_my_couple_id())
  with check (couple_id = public.get_my_couple_id());

-- Movements
create policy "Members manage movements"
  on public.movements for all
  using (couple_id = public.get_my_couple_id())
  with check (couple_id = public.get_my_couple_id());

-- Settings
create policy "Members manage settings"
  on public.couple_settings for all
  using (couple_id = public.get_my_couple_id())
  with check (couple_id = public.get_my_couple_id());

-- Imports
create policy "Members manage imports"
  on public.imports for all
  using (couple_id = public.get_my_couple_id())
  with check (couple_id = public.get_my_couple_id());

-- Pending imports
create policy "Members manage pending imports"
  on public.pending_import_movements for all
  using (couple_id = public.get_my_couple_id())
  with check (couple_id = public.get_my_couple_id());

-- Realtime (opcional, habilitar en dashboard si hace falta)
alter publication supabase_realtime add table public.movements;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.couple_settings;
