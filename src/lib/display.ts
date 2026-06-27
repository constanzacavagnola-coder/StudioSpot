// Etiquetas y estilos de presentación compartidos entre componentes.
// Centralizado para mantener coherencia visual y de copy en español.

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

export const TIPO_EMOJI: Record<PlaceType, string> = {
  cafe: "☕",
  coworking: "💼",
  biblioteca: "📚",
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

// Clases Tailwind para el nivel de congestión (bajo=verde, medio=amarillo, alto=rojo).
export const CONGESTION_CLASES: Record<Nivel3, string> = {
  bajo: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  medio: "bg-amber-100 text-amber-800 ring-amber-200",
  alto: "bg-rose-100 text-rose-800 ring-rose-200",
};

// Color sólido (para barras/puntos) por nivel de congestión.
export const CONGESTION_PUNTO: Record<Nivel3, string> = {
  bajo: "bg-emerald-500",
  medio: "bg-amber-500",
  alto: "bg-rose-500",
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

// Etiquetas de los movimientos de la wallet de demostración.
export const TX_TIPO_LABEL: Record<TxTipo, string> = {
  recarga: "Recarga",
  descuento: "Descuento",
  ajuste: "Ajuste",
};
