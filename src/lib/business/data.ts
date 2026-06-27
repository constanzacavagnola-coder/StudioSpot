import { cache } from "react";

import { getUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { Place } from "@/lib/types";

/**
 * Lecturas server-side del dashboard de empresa (F4). La autorización se apoya
 * en RLS + en el filtro explícito por `owner_id`:
 *  - `places` tiene lectura pública (`places_public_read`), así que para los
 *    espacios del dueño se filtra siempre por `owner_id = user.id`.
 *  - La escritura (crear/editar) la cubren `places_insert_owner` /
 *    `places_update_owner`; aquí solo leemos.
 *
 * Se memoizan por request con React `cache` para no repetir consultas entre la
 * página y sus partes.
 */

/** Espacios cuyo dueño es el usuario autenticado, ordenados por nombre. */
export const getOwnedPlaces = cache(async (): Promise<Place[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("owner_id", user.id)
    .order("nombre");

  if (error || !data) return [];
  return data as Place[];
});

/**
 * Un espacio del dueño por su id, o null si no existe o no le pertenece. El
 * filtro por `owner_id` evita que una empresa abra el editor de un espacio
 * ajeno aunque adivine el id (defensa en profundidad junto a la RLS de update).
 */
export const getOwnedPlaceById = cache(
  async (id: string): Promise<Place | null> => {
    const user = await getUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Place;
  },
);

/**
 * Espacios sin dueño (candidatos a reclamar). Lectura pública vía RLS; el
 * filtro `owner_id is null` deja solo los que `claim_place()` permitiría tomar.
 */
export const getClaimablePlaces = cache(async (): Promise<Place[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .is("owner_id", null)
    .order("nombre");

  if (error || !data) return [];
  return data as Place[];
});
