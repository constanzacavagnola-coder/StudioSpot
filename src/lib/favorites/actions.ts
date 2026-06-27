"use server";

import { revalidatePath } from "next/cache";

import { getUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action de favoritos (F2): inserta o borra una fila en `favorites`.
 * Se ejecuta SIEMPRE en el servidor y re-verifica la sesión con el DAL (el
 * cliente nunca es fuente de verdad). RLS (`favorites_*_own`) es la última
 * barrera: aunque se manipulara el `place_id`, solo se pueden tocar filas con
 * `user_id = auth.uid()`.
 *
 * El cliente envía el estado OBJETIVO (`makeFavorite`) para soportar UI
 * optimista; la operación es idempotente (un insert duplicado o un delete
 * inexistente no son errores).
 */

export type FavoriteResult =
  | { ok: true; favorite: boolean }
  | { ok: false; error: string };

export async function toggleFavorite(
  placeId: string,
  makeFavorite: boolean,
): Promise<FavoriteResult> {
  if (typeof placeId !== "string" || placeId.length === 0) {
    return { ok: false, error: "Espacio inválido." };
  }

  const user = await getUser();
  if (!user) {
    return { ok: false, error: "Debes iniciar sesión para guardar lugares." };
  }

  const supabase = await createClient();

  if (makeFavorite) {
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, place_id: placeId });
    // 23505 = unique_violation: ya era favorito, lo tratamos como éxito.
    if (error && error.code !== "23505") {
      return { ok: false, error: "No pudimos guardar el lugar. Inténtalo de nuevo." };
    }
  } else {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("place_id", placeId);
    if (error) {
      return { ok: false, error: "No pudimos quitar el lugar. Inténtalo de nuevo." };
    }
  }

  // La página /mis-lugares se renderiza desde estos datos; refrescar su caché.
  revalidatePath("/mis-lugares");
  return { ok: true, favorite: makeFavorite };
}
