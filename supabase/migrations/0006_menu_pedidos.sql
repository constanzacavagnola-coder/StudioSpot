-- Studio Spot — Menú de empresa + Pedidos/Ventas + Pago con wallet.
-- Aplicada vía Management API. Contrato de datos para el sistema de menú/pedidos.
-- El saldo de la wallet son créditos internos (sin pasarela real; Webpay = fase futura).

-- ============ Menú ============
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  nombre text not null,
  descripcion text,
  precio_clp integer not null check (precio_clp >= 0),
  stock integer not null default 0 check (stock >= 0),
  imagen_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index menu_items_place_idx on menu_items(place_id);
alter table menu_items enable row level security;

-- Catálogo público: cualquiera ve los items activos (para comprar).
create policy "menu_public_read_active" on menu_items for select using (activo = true);
-- El dueño del espacio ve y administra TODOS sus items (activos o no).
create policy "menu_owner_all" on menu_items for all
  using (exists (select 1 from places p where p.id = menu_items.place_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from places p where p.id = menu_items.place_id and p.owner_id = auth.uid()));

-- ============ Pedidos ============
create type order_estado as enum ('pagado','en_preparacion','listo','retirado','cancelado');
create sequence if not exists order_numero_seq start 1000;

create table orders (
  id uuid primary key default gen_random_uuid(),
  numero bigint not null default nextval('order_numero_seq'),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  estado order_estado not null default 'pagado',
  total_clp integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on orders(user_id);
create index orders_place_idx on orders(place_id);
alter table orders replica identity full; -- para Realtime (updates de estado)

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  nombre text not null,        -- snapshot al momento de la compra
  precio_clp integer not null, -- snapshot
  cantidad integer not null check (cantidad > 0)
);
create index order_items_order_idx on order_items(order_id);

alter table orders enable row level security;
alter table order_items enable row level security;

-- El cliente ve sus pedidos; el dueño ve los pedidos de su espacio.
create policy "orders_select_client" on orders for select using (user_id = auth.uid());
create policy "orders_select_owner" on orders for select
  using (exists (select 1 from places p where p.id = orders.place_id and p.owner_id = auth.uid()));
-- El dueño avanza el estado de los pedidos de su espacio.
create policy "orders_update_owner" on orders for update
  using (exists (select 1 from places p where p.id = orders.place_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from places p where p.id = orders.place_id and p.owner_id = auth.uid()));
-- order_items: visibles si el pedido es visible (cliente dueño del pedido o dueño del espacio).
create policy "order_items_select" on order_items for select
  using (exists (
    select 1 from orders o where o.id = order_items.order_id
    and (o.user_id = auth.uid()
         or exists (select 1 from places p where p.id = o.place_id and p.owner_id = auth.uid()))
  ));
-- NB: insert de orders/order_items NO se permite directo al cliente; va por pagar_pedido().

-- Realtime: el cliente se suscribe a su pedido para ver el estado en vivo.
do $$ begin
  alter publication supabase_realtime add table orders;
exception when duplicate_object then null; end $$;

-- ============ Pago con wallet (atómico) ============
-- p_items: jsonb array [{ "id": "<menu_item_id>", "cantidad": N }, ...]
-- Valida pertenencia/stock, descuenta stock, debita wallet y crea el pedido en UNA
-- transacción (cualquier excepción revierte todo). SECURITY DEFINER porque el cliente
-- tiene revocada la escritura directa a wallet (0004) y a orders.
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
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  insert into orders (user_id, place_id, total_clp, estado)
  values (v_uid, p_place_id, 0, 'pagado')
  returning id, numero into v_order_id, v_numero;

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
    insert into order_items (order_id, menu_item_id, nombre, precio_clp, cantidad)
      values (v_order_id, v_item.id, v_item.nombre, v_item.precio_clp, v_cant);
    v_total := v_total + v_item.precio_clp * v_cant;
  end loop;

  update wallet set saldo_clp = saldo_clp - v_total, updated_at = now()
    where user_id = v_uid and saldo_clp >= v_total
    returning saldo_clp into v_saldo;
  if not found then raise exception 'Saldo insuficiente'; end if;

  update orders set total_clp = v_total, updated_at = now() where id = v_order_id;
  insert into wallet_tx (user_id, monto_clp, tipo, glosa)
    values (v_uid, v_total, 'descuento', 'Pedido #' || v_numero);

  return query select v_order_id, v_numero, v_total, v_saldo;
end; $$;
grant execute on function public.pagar_pedido(uuid, jsonb) to authenticated;

-- ============ Storage: bucket de imágenes del menú ============
insert into storage.buckets (id, name, public) values ('menu','menu',true)
  on conflict (id) do nothing;

drop policy if exists "menu_obj_read" on storage.objects;
create policy "menu_obj_read" on storage.objects for select using (bucket_id = 'menu');
drop policy if exists "menu_obj_insert" on storage.objects;
create policy "menu_obj_insert" on storage.objects for insert to authenticated with check (bucket_id = 'menu');
drop policy if exists "menu_obj_update" on storage.objects;
create policy "menu_obj_update" on storage.objects for update to authenticated using (bucket_id = 'menu');
drop policy if exists "menu_obj_delete" on storage.objects;
create policy "menu_obj_delete" on storage.objects for delete to authenticated using (bucket_id = 'menu');
