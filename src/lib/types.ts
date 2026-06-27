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
  created_at: string;
}
