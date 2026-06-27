import { cache } from "react";

import { getUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { WalletTx } from "@/lib/types";

/**
 * Lecturas server-side de la wallet de DEMO (F3). La autorización la garantiza
 * RLS: las políticas `wallet_select_own` / `wallettx_select_own` solo devuelven
 * las filas del usuario autenticado, así que no hace falta filtrar por
 * `user_id` en la query.
 *
 * Se memoizan por request con React `cache` para no repetir la consulta entre
 * la página y sus partes.
 */

/**
 * Saldo actual de la wallet en CLP (créditos ficticios). Si el usuario aún no
 * tiene fila en `wallet` (no ha recargado nunca), el saldo es 0. Por eso se usa
 * `.maybeSingle()` y no `.single()` (que lanzaría sin fila).
 */
export const getWalletSaldo = cache(async (): Promise<number> => {
  const user = await getUser();
  if (!user) return 0;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wallet")
    .select("saldo_clp")
    .maybeSingle();

  if (error || !data) return 0;
  return data.saldo_clp as number;
});

/**
 * Historial de movimientos de la wallet, del más reciente al más antiguo.
 * Vacío si no hay sesión o si nunca hubo movimientos.
 */
export const getWalletTransactions = cache(async (): Promise<WalletTx[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wallet_tx")
    .select("id, user_id, monto_clp, tipo, glosa, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as WalletTx[];
});
