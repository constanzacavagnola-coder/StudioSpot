import { cache } from "react";

import { getOwnedPlaceById } from "@/lib/business/data";
import { createClient } from "@/lib/supabase/server";
import type { MenuItem } from "@/lib/types";

/**
 * Lecturas server-side del catálogo de menú (0006). Dos vistas:
 *  - Dueño: TODOS sus ítems (activos e inactivos), para administrar. La RLS
 *    `menu_owner_all` ya restringe por `place.owner_id`, pero además se verifica
 *    la propiedad del espacio con `getOwnedPlaceById` (defensa en profundidad y
 *    para devolver [] limpio si el id no es del dueño).
 *  - Público: solo `activo = true`, para que el cliente compre desde la ficha.
 *    La RLS `menu_public_read_active` ya filtra; el `.eq("activo", true)` es
 *    explícito y permite usar la ANON key sin sesión.
 *
 * Se memoizan por request con React `cache`.
 */

const SELECT =
  "id, place_id, nombre, descripcion, precio_clp, stock, imagen_url, activo, created_at, updated_at";

/** Ítems del menú de un espacio del dueño (todos). [] si no es su espacio. */
export const getMenuItemsDeDueño = cache(
  async (placeId: string): Promise<MenuItem[]> => {
    const place = await getOwnedPlaceById(placeId);
    if (!place) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("menu_items")
      .select(SELECT)
      .eq("place_id", placeId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as MenuItem[];
  },
);

/** Ítems activos de un espacio (catálogo público para comprar). */
export const getMenuPublico = cache(
  async (placeId: string): Promise<MenuItem[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("menu_items")
      .select(SELECT)
      .eq("place_id", placeId)
      .eq("activo", true)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as MenuItem[];
  },
);
