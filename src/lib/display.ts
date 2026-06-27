// Etiquetas y estilos de presentación compartidos entre componentes.
// Centralizado para mantener coherencia visual y de copy en español.

import type { IconName } from "@/components/icons";
import type {
  Franja,
  Nivel3,
  NivelPrecio,
  NivelRuido,
  PlaceType,
  TxTipo,
  UserRole,
} from "@/lib/types";

export const TIPO_LABEL: Record<PlaceType, string> = {
  cafe: "Café",
  coworking: "Coworking",
  biblioteca: "Biblioteca",
};

// Ícono SVG por tipo de espacio (reemplaza los antiguos emojis; regla de UI:
// nada de emojis, solo íconos del set en src/components/icons).
export const TIPO_ICON: Record<PlaceType, IconName> = {
  cafe: "cafe",
  coworking: "coworking",
  biblioteca: "biblioteca",
};

export const NIVEL3_LABEL: Record<Nivel3, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
};

export const RUIDO_LABEL: Record<NivelRuido, string> = {
  silencioso: "Silencioso",
  moderado: "Moderado",
  animado: "Animado",
};

export const PRECIO_LABEL: Record<NivelPrecio, string> = {
  gratis: "Gratis",
  $: "Económico ($)",
  $$: "Medio ($$)",
  $$$: "Alto ($$$)",
};

export const FRANJA_LABEL: Record<Franja, string> = {
  mañana: "Mañana",
  mediodia: "Mediodía",
  tarde: "Tarde",
  noche: "Noche",
};

export const FRANJA_HORARIO: Record<Franja, string> = {
  mañana: "06–12 h",
  mediodia: "12–15 h",
  tarde: "15–19 h",
  noche: "19–06 h",
};

export const FRANJAS_ORDEN: Franja[] = ["mañana", "mediodia", "tarde", "noche"];

// Clases Tailwind para el nivel de congestión, en tonos pastel de la paleta:
// bajo→menta, medio→durazno, alto→terracota suave (semántica conservada).
export const CONGESTION_CLASES: Record<Nivel3, string> = {
  bajo: "bg-cong-bajo/15 text-cong-bajo ring-cong-bajo/25",
  medio: "bg-cong-medio/15 text-cong-medio ring-cong-medio/25",
  alto: "bg-cong-alto/15 text-cong-alto ring-cong-alto/25",
};

// Color sólido (para barras/puntos) por nivel de congestión.
export const CONGESTION_PUNTO: Record<Nivel3, string> = {
  bajo: "bg-cong-bajo",
  medio: "bg-cong-medio",
  alto: "bg-cong-alto",
};

export const CONGESTION_LABEL: Record<Nivel3, string> = {
  bajo: "Tranquilo",
  medio: "Moderado",
  alto: "Lleno",
};

// ===== Cuentas =====

export const ROL_LABEL: Record<UserRole, string> = {
  usuario: "Usuario",
  empresa: "Empresa",
};

// Etiquetas de los movimientos de la wallet.
export const TX_TIPO_LABEL: Record<TxTipo, string> = {
  recarga: "Recarga",
  descuento: "Descuento",
  ajuste: "Ajuste",
};
