-- Studio Spot — Endurecimiento de Menú + Pedidos (sobre 0006, ya aplicado).
-- NO recrea tablas: solo ajusta policies de Storage, agrega un trigger de
-- integridad en `orders` y reescribe `pagar_pedido` para que conviva con él.
--
-- Motivación (auditoría):
--  1) Las policies del bucket `menu` eran cross-tenant: cualquier `authenticated`
--     podía subir/sobrescribir/borrar imágenes de CUALQUIER empresa. Se acotan al
--     dueño del `place` cuyo id es el primer segmento del path (`{place_id}/...`).
--  2) `orders_update_owner` dejaba al dueño cambiar CUALQUIER columna a CUALQUIER
--     valor (saltar estados, reescribir total_clp/numero/user_id...). La máquina de
--     estados vivía solo en la Server Action. Se agrega un trigger BEFORE UPDATE
--     que valida la transición y congela las columnas inmutables.

-- ============ 1) Storage: bucket `menu` acotado al dueño del place ============
-- El path es `{place_id}/{uuid}.{ext}`; `(storage.foldername(name))[1]` es el
-- place_id. Se compara como texto para no fallar ante paths sin folder/uuid raro.
-- La lectura sigue pública (no se toca `menu_obj_read`).

drop policy if exists "menu_obj_insert" on storage.objects;
create policy "menu_obj_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'menu'
    and exists (
      select 1 from public.places p
      where p.owner_id = auth.uid()
        and p.id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "menu_obj_update" on storage.objects;
create policy "menu_obj_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'menu'
    and exists (
      select 1 from public.places p
      where p.owner_id = auth.uid()
        and p.id::text = (storage.foldername(name))[1]
    )
  )
  with check (
    bucket_id = 'menu'
    and exists (
      select 1 from public.places p
      where p.owner_id = auth.uid()
        and p.id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "menu_obj_delete" on storage.objects;
create policy "menu_obj_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'menu'
    and exists (
      select 1 from public.places p
      where p.owner_id = auth.uid()
        and p.id::text = (storage.foldername(name))[1]
    )
  );

-- ============ 2) Trigger de integridad de `orders` (defensa en profundidad) ====
-- La RLS `orders_update_owner` autoriza al dueño a UPDATEar sus pedidos, pero no
-- limita QUÉ cambia. Este trigger congela las columnas inmutables y obliga a que
-- el cambio de `estado` siga la máquina de estados (mismo grafo que
-- ORDER_ESTADO_SIGUIENTE + ESTADOS_CANCELABLES de src/lib/display.ts).
create or replace function public.orders_guard_update()
returns trigger language plpgsql as $$
begin
  -- Columnas inmutables tras la creación del pedido.
  if new.numero     is distinct from old.numero
     or new.user_id    is distinct from old.user_id
     or new.place_id   is distinct from old.place_id
     or new.total_clp  is distinct from old.total_clp
     or new.created_at is distinct from old.created_at then
    raise exception 'No se permite modificar columnas inmutables del pedido';
  end if;

  -- Transición de estado válida: avance lineal o cancelación desde un estado
  -- cancelable. retirado/cancelado son terminales.
  if new.estado is distinct from old.estado then
    if not (
         (old.estado = 'pagado'         and new.estado in ('en_preparacion','cancelado'))
      or (old.estado = 'en_preparacion' and new.estado in ('listo','cancelado'))
      or (old.estado = 'listo'          and new.estado in ('retirado','cancelado'))
    ) then
      raise exception 'Transición de estado no permitida: % -> %', old.estado, new.estado;
    end if;
  end if;

  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists orders_guard_update_trg on orders;
create trigger orders_guard_update_trg
  before update on orders
  for each row execute function public.orders_guard_update();

-- ============ 3) pagar_pedido: calcular el total ANTES de insertar el pedido ===
-- El trigger anterior congela `total_clp`, así que el pedido debe nacer con su
-- total final (la versión 0006 insertaba con total 0 y lo UPDATEaba después, lo
-- que el trigger ahora rechazaría). De paso, mover el INSERT del pedido al final
-- evita huecos en `numero` cuando el pago falla por stock/saldo (la secuencia ya
-- no se consume en intentos fallidos). Sigue siendo atómico y con `for update`.
create or replace function public.pagar_pedido(p_place_id uuid, p_items jsonb)
returns table (order_id uuid, numero bigint, total integer, saldo integer)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_total integer := 0;
  v_order_id uuid;
  v_numero bigint;
  v_saldo integer;
  it jsonb;
  v_item menu_items%rowtype;
  v_cant integer;
  v_lines jsonb := '[]'::jsonb;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  -- 1) Validar/lockear/descontar stock y acumular las líneas (snapshot) + total.
  for it in select * from jsonb_array_elements(p_items) loop
    v_cant := nullif(it->>'cantidad','')::int;
    if v_cant is null or v_cant <= 0 then raise exception 'Cantidad inválida'; end if;

    select * into v_item from menu_items
      where id = (it->>'id')::uuid and place_id = p_place_id and activo = true
      for update;
    if not found then raise exception 'Producto no disponible'; end if;
    if v_item.stock < v_cant then
      raise exception 'Sin stock suficiente de %', v_item.nombre;
    end if;

    update menu_items set stock = stock - v_cant, updated_at = now() where id = v_item.id;
    v_total := v_total + v_item.precio_clp * v_cant;
    v_lines := v_lines || jsonb_build_object(
      'menu_item_id', v_item.id, 'nombre', v_item.nombre,
      'precio_clp', v_item.precio_clp, 'cantidad', v_cant);
  end loop;

  -- 2) Debitar la wallet con guard atómico (evita saldo negativo en carrera).
  update wallet set saldo_clp = saldo_clp - v_total, updated_at = now()
    where user_id = v_uid and saldo_clp >= v_total
    returning saldo_clp into v_saldo;
  if not found then raise exception 'Saldo insuficiente'; end if;

  -- 3) Crear el pedido ya con su total final (sin UPDATE posterior).
  insert into orders (user_id, place_id, total_clp, estado)
    values (v_uid, p_place_id, v_total, 'pagado')
    returning id, numero into v_order_id, v_numero;

  insert into order_items (order_id, menu_item_id, nombre, precio_clp, cantidad)
    select v_order_id, (l->>'menu_item_id')::uuid, l->>'nombre',
           (l->>'precio_clp')::int, (l->>'cantidad')::int
    from jsonb_array_elements(v_lines) l;

  insert into wallet_tx (user_id, monto_clp, tipo, glosa)
    values (v_uid, v_total, 'descuento', 'Pedido #' || v_numero);

  return query select v_order_id, v_numero, v_total, v_saldo;
end; $$;
grant execute on function public.pagar_pedido(uuid, jsonb) to authenticated;
