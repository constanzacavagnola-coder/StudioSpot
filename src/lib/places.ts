// Capa de acceso a datos de Studio Spot.
//
// Para el MVP la app lee directamente desde `src/data/places.json` (dataset real de
// 32 lugares de Santiago), así corre de inmediato sin base de datos ni variables de
// entorno. A futuro, estas funciones se reemplazarían por queries a Supabase contra
// la tabla `places` (p. ej. `supabase.from("places").select("*")`), manteniendo la
// misma firma para no tocar las páginas que las consumen.

import placesData from "@/data/places.json";
import type { Franja, Nivel3, NivelPrecio, NivelRuido, Place, PlaceType } from "@/lib/types";

// El JSON está tipado de forma laxa al importarse; lo afirmamos al tipo del dominio.
const PLACES = placesData as Place[];

/** Devuelve todos los espacios del dataset. */
export function getAllPlaces(): Place[] {
  // A futuro: const { data } = await supabase.from("places").select("*");
  return PLACES;
}

/** Devuelve un espacio por su slug, o `undefined` si no existe. */
export function getPlaceBySlug(slug: string): Place | undefined {
  // A futuro: supabase.from("places").select("*").eq("slug", slug).single();
  return PLACES.find((p) => p.slug === slug);
}

/** Lista de comunas únicas presentes en el dataset, ordenadas alfabéticamente. */
export function getComunas(): string[] {
  return [...new Set(PLACES.map((p) => p.comuna))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

/** Lista de tipos únicos presentes en el dataset. */
export function getTipos(): PlaceType[] {
  return [...new Set(PLACES.map((p) => p.tipo))];
}

// --- Filtros (se aplican en cliente sobre el dataset ya cargado) ---

export interface PlaceFilters {
  tipo?: PlaceType | "todos";
  comuna?: string | "todas";
  enchufesMin?: Nivel3 | "cualquiera";
  wifiMin?: Nivel3 | "cualquiera";
  ruido?: NivelRuido | "cualquiera";
  precio?: NivelPrecio | "cualquiera";
}

// Orden de menor a mayor para comparar niveles "al menos X".
const ORDEN_NIVEL3: Record<Nivel3, number> = { bajo: 0, medio: 1, alto: 2 };

/** Filtra una lista de espacios según los criterios entregados. */
export function filterPlaces(places: Place[], filtros: PlaceFilters): Place[] {
  return places.filter((p) => {
    if (filtros.tipo && filtros.tipo !== "todos" && p.tipo !== filtros.tipo) {
      return false;
    }
    if (filtros.comuna && filtros.comuna !== "todas" && p.comuna !== filtros.comuna) {
      return false;
    }
    if (
      filtros.enchufesMin &&
      filtros.enchufesMin !== "cualquiera" &&
      ORDEN_NIVEL3[p.enchufes] < ORDEN_NIVEL3[filtros.enchufesMin]
    ) {
      return false;
    }
    if (
      filtros.wifiMin &&
      filtros.wifiMin !== "cualquiera" &&
      ORDEN_NIVEL3[p.wifi] < ORDEN_NIVEL3[filtros.wifiMin]
    ) {
      return false;
    }
    if (filtros.ruido && filtros.ruido !== "cualquiera" && p.ruido !== filtros.ruido) {
      return false;
    }
    if (filtros.precio && filtros.precio !== "cualquiera" && p.precio !== filtros.precio) {
      return false;
    }
    return true;
  });
}

// --- Utilidades de congestión por franja horaria ---

/**
 * Devuelve la franja horaria correspondiente a una hora del día.
 *   mañana   06:00–11:59
 *   mediodia 12:00–14:59
 *   tarde    15:00–18:59
 *   noche    19:00–05:59
 */
export function getFranjaActual(date: Date = new Date()): Franja {
  const h = date.getHours();
  if (h >= 6 && h < 12) return "mañana";
  if (h >= 12 && h < 15) return "mediodia";
  if (h >= 15 && h < 19) return "tarde";
  return "noche";
}
