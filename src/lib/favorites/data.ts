import { cache } from "react";

import { getUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { Place } from "@/lib/types";

/**
 * Lecturas server-side de favoritos (F2). La autorización la garantiza RLS:
 * la política `favorites_select_own` solo devuelve las filas del usuario
 * autenticado, así que no hace falta filtrar por `user_id` en la query.
 *
 * `getFavoriteIds` se memoiza por request con React `cache` para que el listado
 * de /explorar resuelva los corazones con UNA sola consulta (no una por tarjeta).
 */

/** IDs de los espacios que el usuario tiene guardados. Vacío si no hay sesión. */
export const getFavoriteIds = cache(async (): Promise<Set<string>> => {
  const user = await getUser();
  if (!user) return new Set();

  const supabase = await createClient();
  const { data, error } = await supabase.from("favorites").select("place_id");
  if (error || !data) return new Set();

  return new Set(data.map((row) => row.place_id as string));
});

/** ¿El usuario tiene guardado este espacio? Útil para la ficha individual. */
export async function isFavorite(placeId: string): Promise<boolean> {
  const ids = await getFavoriteIds();
  return ids.has(placeId);
}

/**
 * Espacios guardados por el usuario, del más reciente al más antiguo. Usa el
 * join `places(*)` (lectura pública) para traer la ficha completa de cada
 * favorito en una sola consulta. Vacío si no hay sesión.
 */
export async function getFavoritePlaces(): Promise<Place[]> {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("created_at, places(*)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  // El join a-uno devuelve `places` como objeto en runtime, aunque el tipo
  // inferido por supabase-js (sin tipos generados) sea laxo (array); normalizamos.
  return data
    .map((row) => (row.places ?? null) as unknown as Place | null)
    .filter((place): place is Place => place !== null);
}
