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

// Tipo de movimiento de la wallet de DEMO (créditos ficticios, no dinero real).
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
