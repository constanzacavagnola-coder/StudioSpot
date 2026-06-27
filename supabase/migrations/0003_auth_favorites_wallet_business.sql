-- Studio Spot — auth/perfiles, favoritos, wallet (demo) y empresa.
-- Aplicada en Supabase el 2026-06-26 vía Management API. Contrato de datos para las features.

-- ============ Perfiles + rol ============
create type user_role as enum ('usuario','empresa');
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol user_role not null default 'usuario',
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (auth.uid()=id);
create policy "profiles_update_own" on profiles for update using (auth.uid()=id) with check (auth.uid()=id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid()=id);

-- Crea el profile al registrarse, tomando nombre y rol del user_metadata del signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id, nombre, rol)
  values (new.id, new.raw_user_meta_data->>'nombre',
          coalesce((new.raw_user_meta_data->>'rol')::user_role,'usuario'));
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Favoritos (free) ============
create table favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);
alter table favorites enable row level security;
create policy "favorites_select_own" on favorites for select using (auth.uid()=user_id);
create policy "favorites_insert_own" on favorites for insert with check (auth.uid()=user_id);
create policy "favorites_delete_own" on favorites for delete using (auth.uid()=user_id);

-- ============ Wallet (saldo de DEMO, sin dinero real) ============
create table wallet (
  user_id uuid primary key references auth.users(id) on delete cascade,
  saldo_clp integer not null default 0,
  updated_at timestamptz not null default now()
);
create type tx_tipo as enum ('recarga','descuento','ajuste');
create table wallet_tx (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monto_clp integer not null,
  tipo tx_tipo not null,
  glosa text,
  created_at timestamptz not null default now()
);
alter table wallet enable row level security;
alter table wallet_tx enable row level security;
create policy "wallet_select_own" on wallet for select using (auth.uid()=user_id);
create policy "wallet_insert_own" on wallet for insert with check (auth.uid()=user_id);
create policy "wallet_update_own" on wallet for update using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "wallettx_select_own" on wallet_tx for select using (auth.uid()=user_id);
create policy "wallettx_insert_own" on wallet_tx for insert with check (auth.uid()=user_id);

-- ============ Empresa: ownership, reclamar y crear espacios ============
alter table places add column if not exists owner_id uuid references auth.users(id) on delete set null;
-- El dueño puede editar / crear su propio espacio (lectura pública ya existe en 0001).
create policy "places_update_owner" on places for update using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "places_insert_owner" on places for insert with check (auth.uid()=owner_id);

create table place_claims (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  estado text not null default 'aprobado',
  created_at timestamptz not null default now()
);
alter table place_claims enable row level security;
create policy "claims_select_own" on place_claims for select using (auth.uid()=user_id);
create policy "claims_insert_own" on place_claims for insert with check (auth.uid()=user_id);

-- Reclamar un espacio sin dueño (auto-aprobado para el demo). SECURITY DEFINER para
-- poder setear owner_id saltando la RLS, pero solo si el espacio no tiene dueño.
create or replace function public.claim_place(p_place_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  update places set owner_id=auth.uid() where id=p_place_id and owner_id is null;
  if not found then raise exception 'El espacio no existe o ya tiene dueño'; end if;
  insert into place_claims (place_id, user_id) values (p_place_id, auth.uid())
    on conflict (place_id) do nothing;
end; $$;
