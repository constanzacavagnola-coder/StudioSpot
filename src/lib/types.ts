// Tipos del dominio de Studio Spot. Deben mantenerse en sync con supabase/migrations/0001_init.sql

export type PlaceType = "cafe" | "coworking" | "biblioteca";
export type Nivel3 = "bajo" | "medio" | "alto";
export type NivelRuido = "silencioso" | "moderado" | "animado";
export type NivelPrecio = "gratis" | "$" | "$$" | "$$$";
export type Franja = "mañana" | "mediodia" | "tarde" | "noche";

export type Congestion = Partial<Record<Franja, Nivel3>>;

export interface Place {
  id: string;
  slug: string;
  nombre: string;
  tipo: PlaceType;
  comuna: string;
  direccion: string;
  lat: number;
  lng: number;
  descripcion: string | null;
  enchufes: Nivel3;
  wifi: Nivel3;
  ruido: NivelRuido;
  ambiente: string | null;
  precio: NivelPrecio;
  tiene_banos: boolean;
  horario: string | null;
  congestion: Congestion;
  fuente: string | null;
  // Dueño (empresa) del espacio. Null = sin reclamar. Lectura pública; lo
  // setean claim_place() o el alta de un espacio (ver migración 0003).
  owner_id?: string | null;
  created_at: string;
}

// ===== Cuentas (migración 0003_auth_favorites_wallet_business.sql) =====

// Rol de la cuenta. Viaja en user_metadata.rol al registrarse y el trigger
// handle_new_user() lo persiste en profiles.rol.
export type UserRole = "usuario" | "empresa";

export interface Profile {
  id: string;
  nombre: string | null;
  rol: UserRole;
}

// Tipo de movimiento de la wallet: recarga (suma saldo), descuento (gasta saldo
// al consumir en un espacio) o ajuste. Saldo interno de Studio Spot en CLP.
export type TxTipo = "recarga" | "descuento" | "ajuste";

export interface WalletTx {
  id: string;
  user_id: string;
  monto_clp: number;
  tipo: TxTipo;
  glosa: string | null;
  created_at: string;
}

export interface Wallet {
  user_id: string;
  saldo_clp: number;
  updated_at: string;
}

export interface Favorite {
  user_id: string;
  place_id: string;
  created_at: string;
}

// ===== Menú + Pedidos (migración 0006_menu_pedidos.sql) =====
// Mantener en sync con 0006: tipos `integer` del esquema → `number`; `numero`
// es `bigint` pero la secuencia parte en 1000, así que cabe sobrado en `number`.

export interface MenuItem {
  id: string;
  place_id: string;
  nombre: string;
  descripcion: string | null;
  precio_clp: number;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Estados del pedido (enum order_estado). El flujo del dueño avanza en este orden;
// `cancelado` es terminal alternativo. Ver ORDER_ESTADO_SIGUIENTE en display.ts.
export type OrderEstado =
  | "pagado"
  | "en_preparacion"
  | "listo"
  | "retirado"
  | "cancelado";

export interface Order {
  id: string;
  numero: number; // bigint en BD; visible para el cliente como "Pedido #numero".
  user_id: string;
  place_id: string;
  estado: OrderEstado;
  total_clp: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null; // ON DELETE SET NULL: el ítem pudo borrarse luego.
  nombre: string; // snapshot al momento de la compra
  precio_clp: number; // snapshot
  cantidad: number;
}

// Pedido con sus líneas, tal como lo leen las páginas de cliente y de empresa
// (join de orders + order_items).
export interface OrderConItems extends Order {
  items: OrderItem[];
}

// Vista de la empresa para un pedido de su espacio. Hoy coincide con
// OrderConItems (el espacio ya está acotado por la ruta/propiedad); se nombra
// aparte para poder añadir datos del cliente sin tocar el tipo del cliente.
export type PedidoEmpresa = OrderConItems;
