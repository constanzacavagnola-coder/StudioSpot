// Capa de acceso a datos de Studio Spot.
//
// Si están definidas las variables de entorno de Supabase, los datos se leen desde
// la tabla `places` (lectura pública vía RLS, usando la anon key). Si NO lo están
// —o si la query falla— se cae con elegancia al dataset local `src/data/places.json`,
// de modo que la app siempre funciona (en build y en runtime).
//
// Se usa un cliente liviano de solo-lectura (sin cookies) para que también funcione
// en build time, p. ej. dentro de generateStaticParams.

import { createClient } from "@supabase/supabase-js";
import placesData from "@/data/places.json";
import type { Nivel3, NivelPrecio, NivelRuido, Place, PlaceType, Franja } from "@/lib/types";

const PLACES = placesData as Place[];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_ANON ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

/** ¿La app está leyendo desde Supabase (true) o desde el JSON local (false)? */
export const usingSupabase = supabase !== null;

/** Devuelve todos los espacios, ordenados por nombre. */
export async function getAllPlaces(): Promise<Place[]> {
  if (!supabase) return PLACES;
  const { data, error } = await supabase.from("places").select("*").order("nombre");
  if (error || !data) {
    console.error("[places] Supabase getAllPlaces falló, usando JSON:", error?.message);
    return PLACES;
  }
  return data as Place[];
}

/** Devuelve un espacio por su slug, o `undefined` si no existe. */
export async function getPlaceBySlug(slug: string): Promise<Place | undefined> {
  if (!supabase) return PLACES.find((p) => p.slug === slug);
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[places] Supabase getPlaceBySlug falló, usando JSON:", error.message);
    return PLACES.find((p) => p.slug === slug);
  }
  return (data as Place | null) ?? undefined;
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
 *
 * La hora se calcula SIEMPRE en la zona horaria de Chile (America/Santiago), no
 * en la del entorno donde corre el código. Así el dashboard renderizado en el
 * servidor (UTC en Vercel) coincide con /explorar y /mis-lugares y con la hora
 * local del usuario chileno.
 */
const HORA_CHILE_FMT = new Intl.DateTimeFormat("es-CL", {
  hour: "2-digit",
  hour12: false,
  timeZone: "America/Santiago",
});

export function getFranjaActual(date: Date = new Date()): Franja {
  const horaStr = HORA_CHILE_FMT.formatToParts(date).find(
    (p) => p.type === "hour",
  )?.value;
  // "24" puede aparecer para medianoche en algunos entornos; normalizar a 0-23.
  const h = Number(horaStr ?? "0") % 24;
  if (h >= 6 && h < 12) return "mañana";
  if (h >= 12 && h < 15) return "mediodia";
  if (h >= 15 && h < 19) return "tarde";
  return "noche";
}
