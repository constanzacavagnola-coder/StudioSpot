-- Studio Spot — completar el ciclo de la wallet: GASTAR saldo como descuento.
--
-- PENDIENTE DE APLICAR EN SUPABASE: el esquema lo aplica el humano (PLAN regla 6).
-- Esta migración NO recrea tablas; añade la función `usar_saldo()` (cierre del
-- ciclo recarga→descuento) y recrea `recargar_wallet()` solo para actualizar la
-- glosa (el saldo es interno de la app, no es de demostración).
--
-- El saldo de la wallet son CRÉDITOS INTERNOS de Studio Spot en CLP, sin pasarela
-- de pago externa. Recargas y descuentos se registran en `wallet_tx` y mueven
-- `wallet.saldo_clp` de forma atómica.

-- ============ Descontar saldo (gastar como descuento) ============
-- Resta del saldo e inserta un movimiento tipo 'descuento' en UNA sola
-- transacción. La resta se hace con un UPDATE GUARDADO (`saldo_clp >= p_monto`):
-- si el saldo no alcanza, el UPDATE no afecta filas y se lanza 'Saldo insuficiente'
-- ANTES de insertar el movimiento. Esto evita saldos negativos y el lost-update de
-- dos descuentos concurrentes (el WHERE re-evalúa el saldo bajo el lock de fila).
-- SECURITY DEFINER para poder escribir wallet/wallet_tx pese a que el cliente
-- (anon key) tiene revocados esos INSERT/UPDATE (migración 0004). Valida el monto
-- contra la lista cerrada, igual que recargar_wallet().
create or replace function public.usar_saldo(p_monto integer, p_glosa text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saldo integer;
  v_glosa text;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  if p_monto not in (1000, 2000, 5000) then
    raise exception 'Monto de descuento no válido';
  end if;

  -- Glosa controlada: texto corto; por defecto una etiqueta genérica.
  v_glosa := coalesce(nullif(left(p_glosa, 120), ''), 'Descuento con saldo Studio Spot');

  -- Descuento atómico y race-safe: solo descuenta si el saldo alcanza.
  update public.wallet
    set saldo_clp = saldo_clp - p_monto,
        updated_at = now()
    where user_id = auth.uid() and saldo_clp >= p_monto
  returning saldo_clp into v_saldo;

  if not found then
    raise exception 'Saldo insuficiente';
  end if;

  insert into public.wallet_tx (user_id, monto_clp, tipo, glosa)
  values (auth.uid(), p_monto, 'descuento', v_glosa);

  return v_saldo;
end;
$$;

grant execute on function public.usar_saldo(integer, text) to authenticated;

-- ============ Recarga: glosa sin "demostración" ============
-- Misma lógica atómica de 0004; solo cambia la glosa para que el historial lea el
-- saldo como interno de la app (no de demostración).
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
  values (auth.uid(), p_monto, 'recarga', 'Recarga de saldo');

  insert into public.wallet (user_id, saldo_clp, updated_at)
  values (auth.uid(), p_monto, now())
  on conflict (user_id) do update
    set saldo_clp = public.wallet.saldo_clp + excluded.saldo_clp,
        updated_at = now()
  returning saldo_clp into v_saldo;

  return v_saldo;
end;
$$;
