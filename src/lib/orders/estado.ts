"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/dal";
import { getOwnedPlaceById } from "@/lib/business/data";
import { ESTADOS_CANCELABLES, ORDER_ESTADO_SIGUIENTE } from "@/lib/display";
import { createClient } from "@/lib/supabase/server";
import type { OrderEstado } from "@/lib/types";

/**
 * Server Actions de avance de estado de pedidos (0006). Solo el dueño del espacio
 * puede cambiar el estado. Antes de escribir:
 *  1) re-verifica el rol (`requireRole("empresa")`),
 *  2) lee el pedido (RLS `orders_select_owner` solo deja ver los de su espacio),
 *  3) re-verifica la propiedad del espacio con `getOwnedPlaceById`, y
 *  4) valida la transición contra la lista cerrada `ORDER_ESTADO_SIGUIENTE`
 *     (avance) o `ESTADOS_CANCELABLES` (cancelación).
 *
 * La RLS `orders_update_owner` es la última barrera. El cambio de estado no
 * mueve stock ni wallet (el pago ya fue atómico en `pagar_pedido`); cancelar aquí
 * NO reembolsa (no hay flujo de reembolso en esta fase).
 */

export type EstadoResult = { ok: true } | { ok: false; error: string };

/** Lee estado + place_id de un pedido visible para el usuario, o null. */
async function leerPedido(
  orderId: string,
): Promise<{ estado: OrderEstado; place_id: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("estado, place_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!data) return null;
  return { estado: data.estado as OrderEstado, place_id: data.place_id as string };
}

/** Escribe el nuevo estado y revalida la ruta de pedidos del dueño. */
async function escribirEstado(
  orderId: string,
  placeId: string,
  nuevo: OrderEstado,
): Promise<EstadoResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ estado: nuevo })
    .eq("id", orderId);
  if (error) return { ok: false, error: "No pudimos actualizar el pedido." };

  revalidatePath(`/dashboard/${placeId}/pedidos`);
  revalidatePath(`/dashboard/${placeId}/ventas`);
  return { ok: true };
}

/**
 * Avanza el pedido al SIGUIENTE estado permitido. `nuevoEstado` debe coincidir
 * exactamente con `ORDER_ESTADO_SIGUIENTE[actual]`; cualquier otra transición se
 * rechaza en el servidor.
 */
export async function avanzarEstado(
  orderId: string,
  nuevoEstado: OrderEstado,
): Promise<EstadoResult> {
  await requireRole("empresa");
  if (typeof orderId !== "string" || orderId.length === 0) {
    return { ok: false, error: "Pedido inválido." };
  }

  const pedido = await leerPedido(orderId);
  if (!pedido) return { ok: false, error: "No encontramos el pedido." };

  const place = await getOwnedPlaceById(pedido.place_id);
  if (!place) return { ok: false, error: "No eres dueño de este espacio." };

  const esperado = ORDER_ESTADO_SIGUIENTE[pedido.estado];
  if (!esperado || esperado !== nuevoEstado) {
    return { ok: false, error: "Esa transición de estado no está permitida." };
  }

  return escribirEstado(orderId, pedido.place_id, nuevoEstado);
}

/**
 * Cancela un pedido (solo desde un estado cancelable: antes de retirarlo). No
 * reembolsa la wallet ni repone stock en esta fase.
 */
export async function cancelarPedido(orderId: string): Promise<EstadoResult> {
  await requireRole("empresa");
  if (typeof orderId !== "string" || orderId.length === 0) {
    return { ok: false, error: "Pedido inválido." };
  }

  const pedido = await leerPedido(orderId);
  if (!pedido) return { ok: false, error: "No encontramos el pedido." };

  const place = await getOwnedPlaceById(pedido.place_id);
  if (!place) return { ok: false, error: "No eres dueño de este espacio." };

  if (!ESTADOS_CANCELABLES.includes(pedido.estado)) {
    return { ok: false, error: "Este pedido ya no se puede cancelar." };
  }

  return escribirEstado(orderId, pedido.place_id, "cancelado");
}
