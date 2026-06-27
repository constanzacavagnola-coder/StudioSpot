// Etiquetas y estilos de presentación compartidos entre componentes.
// Centralizado para mantener coherencia visual y de copy en español.

import type { IconName } from "@/components/icons";
import type {
  Franja,
  Nivel3,
  NivelPrecio,
  NivelRuido,
  OrderEstado,
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

// ===== Pedidos =====

// Etiqueta legible de cada estado del pedido (enum order_estado).
export const ORDER_ESTADO_LABEL: Record<OrderEstado, string> = {
  pagado: "Pagado",
  en_preparacion: "En preparación",
  listo: "Listo",
  retirado: "Retirado",
  cancelado: "Cancelado",
};

// Clases Tailwind del badge de estado, en tonos pastel de la paleta (mismo
// patrón `bg/15 text ring/25` que CONGESTION_CLASES): pagado→lavanda (marca),
// en_preparación→durazno, listo→menta, retirado→tinta secundaria, cancelado→rosa.
export const ORDER_ESTADO_CLASES: Record<OrderEstado, string> = {
  pagado: "bg-brand/15 text-brand ring-brand/25",
  en_preparacion: "bg-peach-ink/15 text-peach-ink ring-peach-ink/25",
  listo: "bg-mint-ink/15 text-mint-ink ring-mint-ink/25",
  retirado: "bg-ink-2/15 text-ink-2 ring-ink-2/25",
  cancelado: "bg-rose-500/15 text-rose-600 ring-rose-500/25",
};

// Transición de estado PERMITIDA hacia adelante (lista cerrada). El dueño solo
// puede avanzar al estado que aquí se indica; `null` = estado terminal. La
// cancelación es una transición aparte (ver cancelarPedido / ESTADOS_CANCELABLES).
export const ORDER_ESTADO_SIGUIENTE: Record<OrderEstado, OrderEstado | null> = {
  pagado: "en_preparacion",
  en_preparacion: "listo",
  listo: "retirado",
  retirado: null,
  cancelado: null,
};

// Estados desde los que el dueño aún puede cancelar el pedido (antes de retirar).
export const ESTADOS_CANCELABLES: readonly OrderEstado[] = [
  "pagado",
  "en_preparacion",
  "listo",
];
