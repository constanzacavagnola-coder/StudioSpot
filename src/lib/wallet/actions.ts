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
 * El esquema no trae una función transaccional, así que la recarga se hace en
 * dos pasos (ver PLAN F3: "insert en wallet_tx + update de wallet.saldo_clp").
 * Se inserta primero el movimiento en el historial y, solo si tiene éxito, se
 * actualiza el saldo; así un fallo no infla el saldo sin dejar registro.
 */

export type RecargaResult =
  | { ok: true; saldo: number }
  | { ok: false; error: string };

export async function recargar(monto: number): Promise<RecargaResult> {
  // Validación: el monto debe ser uno de los montos fijos ofrecidos.
  if (!MONTOS_RECARGA_CLP.includes(monto as (typeof MONTOS_RECARGA_CLP)[number])) {
    return { ok: false, error: "Monto de recarga no válido." };
  }

  const user = await getUser();
  if (!user) {
    return { ok: false, error: "Debes iniciar sesión para recargar tu wallet." };
  }

  const supabase = await createClient();

  // 1) Saldo actual (0 si aún no existe la fila de wallet).
  const { data: walletRow, error: readError } = await supabase
    .from("wallet")
    .select("saldo_clp")
    .maybeSingle();
  if (readError) {
    return { ok: false, error: "No pudimos leer tu saldo. Inténtalo de nuevo." };
  }
  const saldoActual = (walletRow?.saldo_clp as number | undefined) ?? 0;
  const nuevoSaldo = saldoActual + monto;

  // 2) Registrar el movimiento en el historial.
  const { error: txError } = await supabase.from("wallet_tx").insert({
    user_id: user.id,
    monto_clp: monto,
    tipo: "recarga",
    glosa: "Recarga de saldo de demostración",
  });
  if (txError) {
    return { ok: false, error: "No pudimos registrar la recarga. Inténtalo de nuevo." };
  }

  // 3) Actualizar el saldo (upsert: crea la fila si es la primera recarga).
  const { error: upsertError } = await supabase
    .from("wallet")
    .upsert({
      user_id: user.id,
      saldo_clp: nuevoSaldo,
      updated_at: new Date().toISOString(),
    });
  if (upsertError) {
    return { ok: false, error: "No pudimos actualizar tu saldo. Inténtalo de nuevo." };
  }

  // La página /wallet se renderiza desde estos datos; refrescar su caché.
  revalidatePath("/wallet");
  return { ok: true, saldo: nuevoSaldo };
}
