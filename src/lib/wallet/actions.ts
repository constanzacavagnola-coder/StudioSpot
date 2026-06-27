"use server";

import { revalidatePath } from "next/cache";

import { getUser } from "@/lib/auth/dal";
import { MONTOS_RECARGA_CLP } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action de la wallet de DEMO (F3): simula una recarga de créditos
 * ficticios (NO hay dinero real ni pasarela de pago). Se ejecuta SIEMPRE en el
 * servidor y re-verifica la sesión con el DAL; el cliente nunca es fuente de
 * verdad. RLS (`wallet_*_own`, `wallettx_*_own`) es la última barrera: solo se
 * pueden tocar filas con `user_id = auth.uid()`.
 *
 * El monto se valida contra la lista cerrada `MONTOS_RECARGA_CLP`: aunque el
 * cliente envíe otro valor, se rechaza (no se confía en el input).
 *
 * La recarga se delega a la función SQL `recargar_wallet()` (SECURITY DEFINER,
 * migración 0004), que inserta el movimiento e incrementa el saldo de forma
 * ATÓMICA en una sola transacción. Esto elimina el lost-update de dos recargas
 * concurrentes y la divergencia saldo/historial del antiguo read-modify-write.
 * La función revalida el monto en la BD, así que es la frontera real aunque el
 * cliente llame al RPC directamente.
 */

export type RecargaResult =
  | { ok: true; saldo: number }
  | { ok: false; error: string };

export async function recargar(monto: number): Promise<RecargaResult> {
  // Validación (UX): el monto debe ser uno de los montos fijos ofrecidos. La BD
  // lo revalida dentro de recargar_wallet() como frontera real.
  if (!MONTOS_RECARGA_CLP.includes(monto as (typeof MONTOS_RECARGA_CLP)[number])) {
    return { ok: false, error: "Monto de recarga no válido." };
  }

  const user = await getUser();
  if (!user) {
    return { ok: false, error: "Debes iniciar sesión para recargar tu wallet." };
  }

  const supabase = await createClient();

  // Recarga atómica: inserta el tx y suma al saldo en una sola transacción,
  // devolviendo el nuevo saldo.
  const { data, error } = await supabase.rpc("recargar_wallet", { p_monto: monto });
  if (error) {
    return { ok: false, error: "No pudimos completar la recarga. Inténtalo de nuevo." };
  }

  // La página /wallet se renderiza desde estos datos; refrescar su caché.
  revalidatePath("/wallet");
  return { ok: true, saldo: (data as number | null) ?? 0 };
}
