# Plan — Menú de empresa + Pedidos/Ventas + Pago con wallet

> Contrato para el loop. Construir contra el esquema YA APLICADO en Supabase
> (`supabase/migrations/0006_menu_pedidos.sql`). No recrear el esquema.

## Esquema disponible (aplicado)
- `menu_items(id, place_id, nombre, descripcion, precio_clp, stock, imagen_url, activo, ...)`
  - RLS: lectura pública de `activo=true`; el dueño del `place` (places.owner_id) administra TODOS sus items.
- `orders(id, numero, user_id, place_id, estado, total_clp, ...)` — estado enum: `pagado | en_preparacion | listo | retirado | cancelado`. Realtime activado.
- `order_items(id, order_id, menu_item_id, nombre, precio_clp, cantidad)` (nombre/precio son snapshot).
  - RLS: el cliente ve sus pedidos; el dueño ve los de su espacio y **actualiza el estado**. Inserts solo vía RPC.
- **RPC `pagar_pedido(p_place_id uuid, p_items jsonb)`** → `{order_id, numero, total, saldo}`. `p_items = [{ "id": "<menu_item_id>", "cantidad": N }]`. Valida pertenencia/stock, descuenta stock, **debita la wallet** y crea el pedido atómicamente. Lanza `Saldo insuficiente` / `Sin stock suficiente de X` / `Producto no disponible`.
- Storage: bucket público `menu` (subir imágenes; `authenticated` puede insert/update/delete, lectura pública).

## Decisiones
- **Carrito multi-ítem** por espacio. Checkout con **confirmación** antes de pagar.
- **Pago**: con saldo wallet (créditos internos). Webpay = fase futura (solo se reemplaza el paso de pago).
- **Aviso en la app**: el cliente ve número + estado **en vivo** vía Supabase **Realtime** (suscripción a su `orders`). Sin push al teléfono.
- **Imágenes**: subir a Storage `menu` (path sugerido `{place_id}/{uuid}.{ext}`), guardar `imagen_url` (getPublicUrl).

## Features a construir

### A. Dashboard empresa — Menú
- `/dashboard/[id]/menu` (solo dueño): listar items del espacio (activos e inactivos), crear/editar/eliminar item con **nombre, descripción, precio, stock, imagen (upload a Storage), activo on/off**. Administración completa.

### B. Cliente — Ver menú y comprar
- En la ficha del espacio `/espacio/[slug]`: sección **Menú** con los items `activo=true` (imagen, nombre, desc, precio, stock/agotado).
- **Carrito** (por espacio) + botón comprar. **Pantalla/diálogo de confirmación** mostrando ítems, total y saldo wallet, y advertencia si no alcanza. Confirmar → llama `pagar_pedido` (Server Action). Requiere sesión.
- Tras pagar: mostrar **número de pedido** + estado inicial, y enlace a "Mis pedidos".

### C. Pedidos / estados
- Cliente `/mis-pedidos`: lista de sus pedidos con número, espacio, ítems, total, **estado en vivo (Realtime)**. Historial completo.
- Empresa `/dashboard/[id]/pedidos` (ventas): pedidos del espacio, con acciones para **avanzar estado** (`pagado`→`en_preparacion`→`listo`→`retirado`, y `cancelar`). Vista tipo cola/tablero.

### D. Historial de ventas
- Empresa: apartado de **ventas** (pedidos retirados/históricos, total vendido). Cliente: su historial de pedidos (en /mis-pedidos).

## Reglas (igual que el resto del proyecto)
- Next 16 (Proxy, no middleware), `@supabase/ssr`, server actions re-verifican sesión/rol con el DAL (`src/lib/auth/dal.ts`); el cliente nunca es fuente de verdad. RLS es la red de seguridad.
- Toda mutación de pedidos/stock/wallet pasa por `pagar_pedido` o por las policies (estado lo cambia el dueño).
- UI en **español**, **paleta pastel** y **íconos SVG** existentes (`src/components/icons/`) — **NADA de emojis**. Sin "demo"/"Beta".
- No instalar dependencias sin vetar (SECURITY.md §6). Subida de imágenes con el cliente de Supabase ya instalado.
- `pnpm typecheck && pnpm lint && pnpm build` verdes por fase. Commits técnicos **sin co-autor**.
- Integrar accesos en Navbar/dashboard según rol (cliente: Mis pedidos; empresa: Menú y Pedidos de su espacio).
