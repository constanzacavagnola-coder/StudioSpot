-- Studio Spot — endurecimiento de seguridad y atomicidad sobre 0003.
--
-- PENDIENTE DE APLICAR EN SUPABASE: el esquema lo aplica el humano (PLAN regla 6).
-- Esta migración NO recrea tablas; solo añade funciones/políticas/triggers que
-- mueven a la BD reglas que hoy solo viven en los Server Actions (capa de app),
-- donde un cliente con la anon key podría saltárselas hablando directo con
-- Supabase (supabase.from / supabase.rpc).
--
-- Cubre los hallazgos de la auditoría:
--   A1  · recarga de wallet atómica y transaccional (antes era read-modify-write).
--   M1  · cerrar la escritura directa del cliente sobre wallet / wallet_tx.
--   H1/A2 · gate de rol 'empresa' en la BD (claim_place y policies de places).
--   M2  · profiles.rol inmutable vía cliente (no auto-elevable a empresa).

-- ============ Helper de rol ============
-- ¿El usuario autenticado tiene rol 'empresa'? SECURITY DEFINER para poder leer
-- profiles desde dentro de políticas/funciones sin depender de la RLS de lectura.
create or replace function public.is_empresa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'empresa'
  );
$$;

-- ============ A1 · Recarga de wallet atómica ============
-- Inserta el movimiento e incrementa el saldo en UNA sola transacción, con un
-- upsert atómico (saldo = saldo + monto). Elimina el lost-update y la divergencia
-- saldo/historial del patrón anterior. Valida el monto contra la lista cerrada.
create or replace function public.recargar_wallet(p_monto integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saldo integer;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  if p_monto not in (5000, 10000, 20000, 50000) then
    raise exception 'Monto de recarga no válido';
  end if;

  insert into public.wallet_tx (user_id, monto_clp, tipo, glosa)
  values (auth.uid(), p_monto, 'recarga', 'Recarga de saldo de demostración');

  insert into public.wallet (user_id, saldo_clp, updated_at)
  values (auth.uid(), p_monto, now())
  on conflict (user_id) do update
    set saldo_clp = public.wallet.saldo_clp + excluded.saldo_clp,
        updated_at = now()
  returning saldo_clp into v_saldo;

  return v_saldo;
end;
$$;

-- M1 · La integridad del saldo la garantiza ahora la función SECURITY DEFINER.
-- Cerramos la escritura directa del cliente (anon key): solo lectura sobre el
-- propio saldo/historial; toda recarga pasa por recargar_wallet().
revoke insert, update on public.wallet from authenticated;
revoke insert on public.wallet_tx from authenticated;
grant execute on function public.recargar_wallet(integer) to authenticated;

-- ============ H1/A2 · Gate de rol 'empresa' en la BD ============
-- claim_place: además de exigir que el espacio no tenga dueño, exige rol empresa.
create or replace function public.claim_place(p_place_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_empresa() then
    raise exception 'Solo las cuentas de empresa pueden reclamar espacios';
  end if;
  update places set owner_id = auth.uid()
    where id = p_place_id and owner_id is null;
  if not found then
    raise exception 'El espacio no existe o ya tiene dueño';
  end if;
  insert into place_claims (place_id, user_id) values (p_place_id, auth.uid())
    on conflict (place_id) do nothing;
end;
$$;

-- Crear/editar espacios: exigir propiedad Y rol empresa (antes solo propiedad),
-- para que un usuario rol 'usuario' no pueda insertar/desfigurar el catálogo
-- público directamente con la anon key.
drop policy if exists places_insert_owner on places;
create policy "places_insert_owner" on places for insert
  with check (auth.uid() = owner_id and public.is_empresa());

drop policy if exists places_update_owner on places;
create policy "places_update_owner" on places for update
  using (auth.uid() = owner_id and public.is_empresa())
  with check (auth.uid() = owner_id and public.is_empresa());

-- ============ M2 · profiles.rol inmutable vía cliente ============
-- profiles_update_own deja al usuario editar su fila (p. ej. el nombre), pero el
-- rol no debe ser auto-elevable a 'empresa' con un UPDATE directo. Trigger que
-- rechaza cualquier cambio de rol. (El rol se fija una vez en el signup.)
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol is distinct from old.rol then
    raise exception 'No puedes cambiar el rol de tu cuenta';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_no_role_change on public.profiles;
create trigger profiles_no_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();
