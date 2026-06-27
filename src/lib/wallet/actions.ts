"use server";

import { revalidatePath } from "next/cache";

import { getUser } from "@/lib/auth/dal";
import { MONTOS_DESCUENTO_CLP, MONTOS_RECARGA_CLP } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action de la wallet (F3): recarga el saldo interno de Studio Spot en CLP
 * (créditos propios de la app, SIN pasarela de pago externa). Se ejecuta SIEMPRE
 * en el servidor y re-verifica la sesión con el DAL; el cliente nunca es fuente de
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

/**
 * Server Action para GASTAR saldo como descuento al consumir en un espacio. Crea
 * un movimiento tipo `descuento` y resta del saldo de forma ATÓMICA vía la función
 * SQL `usar_saldo()` (SECURITY DEFINER, migración 0005): el descuento solo aplica
 * si el saldo alcanza (`saldo_clp >= monto` en el propio UPDATE), evitando saldos
 * negativos y carreras. El cliente no puede escribir wallet/wallet_tx directamente
 * (esos grants se revocaron en 0004); todo pasa por la función.
 *
 * El monto se valida contra la lista cerrada `MONTOS_DESCUENTO_CLP` y la glosa se
 * recorta a un texto corto (no se confía en el input del cliente).
 */
export type UsarSaldoResult =
  | { ok: true; saldo: number }
  | { ok: false; error: string };

export async function usarSaldo(
  monto: number,
  glosa?: string,
): Promise<UsarSaldoResult> {
  if (!MONTOS_DESCUENTO_CLP.includes(monto as (typeof MONTOS_DESCUENTO_CLP)[number])) {
    return { ok: false, error: "Monto de descuento no válido." };
  }

  const user = await getUser();
  if (!user) {
    return { ok: false, error: "Debes iniciar sesión para usar tu saldo." };
  }

  // Glosa controlada: texto corto y sin espacios sobrantes. Null si no viene.
  const glosaLimpia =
    typeof glosa === "string" && glosa.trim().length > 0
      ? glosa.trim().slice(0, 120)
      : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("usar_saldo", {
    p_monto: monto,
    p_glosa: glosaLimpia,
  });
  if (error) {
    // La función lanza 'Saldo insuficiente' cuando el saldo no alcanza; el resto
    // se trata como error genérico para no filtrar detalles internos.
    const insuficiente = error.message?.includes("Saldo insuficiente");
    return {
      ok: false,
      error: insuficiente
        ? "No tienes saldo suficiente para este descuento."
        : "No pudimos usar tu saldo. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/wallet");
  return { ok: true, saldo: (data as number | null) ?? 0 };
}
