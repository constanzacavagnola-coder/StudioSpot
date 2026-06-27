"use server";

import { revalidatePath } from "next/cache";

import { getUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action de checkout (0006). Crea el pedido y cobra con la wallet en UNA
 * transacción atómica vía el RPC `pagar_pedido` (SECURITY DEFINER): valida
 * pertenencia/stock, descuenta stock, debita la wallet y registra el pedido. El
 * cliente NUNCA envía precios ni total: solo `{ id, cantidad }`; los montos los
 * pone la BD desde `menu_items` (snapshot). RLS + el RPC son la frontera real.
 *
 * `pagar_pedido` devuelve `returns table (...)`, así que el resultado llega como
 * un ARRAY de filas: se lee `data[0]` (distinto de los RPC escalares de la wallet).
 */

// Ítem del carrito tal como lo manda el cliente (sin precio: no se confía en él).
export type CarritoItem = { id: string; cantidad: number };

export type CheckoutResult =
  | { ok: true; orderId: string; numero: number; total: number; saldo: number }
  | { ok: false; error: string };

type PagarPedidoRow = {
  order_id: string;
  numero: number;
  total: number;
  saldo: number;
};

/** Traduce el mensaje de excepción del RPC a un texto de UI en español. */
function mensajeError(raw: string | undefined): string {
  const m = raw ?? "";
  if (m.includes("Saldo insuficiente")) {
    return "No tienes saldo suficiente. Recarga tu wallet e inténtalo de nuevo.";
  }
  if (m.includes("Sin stock suficiente")) {
    return "Uno de los productos se quedó sin stock suficiente.";
  }
  if (m.includes("Producto no disponible")) {
    return "Uno de los productos ya no está disponible.";
  }
  if (m.includes("carrito está vacío")) {
    return "Tu carrito está vacío.";
  }
  if (m.includes("Cantidad inválida")) {
    return "Hay una cantidad inválida en el carrito.";
  }
  return "No pudimos completar el pedido. Inténtalo de nuevo.";
}

/**
 * Agrega cantidades por `id` (dedup del carrito) y descarta entradas inválidas.
 * Devuelve el arreglo listo para el RPC: `[{ id, cantidad }]` con cantidad entera > 0.
 */
function normalizarCarrito(items: CarritoItem[]): { id: string; cantidad: number }[] {
  const acc = new Map<string, number>();
  for (const it of items) {
    if (!it || typeof it.id !== "string" || it.id.length === 0) continue;
    const c = Number(it.cantidad);
    if (!Number.isInteger(c) || c <= 0) continue;
    acc.set(it.id, (acc.get(it.id) ?? 0) + c);
  }
  return [...acc.entries()].map(([id, cantidad]) => ({ id, cantidad }));
}

/**
 * Paga un carrito en un espacio. `slug` se usa solo para revalidar la ficha
 * (stock fresco) tras la compra.
 */
export async function pagarPedido(
  placeId: string,
  slug: string,
  items: CarritoItem[],
): Promise<CheckoutResult> {
  const user = await getUser();
  if (!user) {
    return { ok: false, error: "Inicia sesión para realizar tu pedido." };
  }

  if (typeof placeId !== "string" || placeId.length === 0) {
    return { ok: false, error: "Espacio inválido." };
  }

  const carrito = normalizarCarrito(Array.isArray(items) ? items : []);
  if (carrito.length === 0) {
    return { ok: false, error: "Tu carrito está vacío." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pagar_pedido", {
    p_place_id: placeId,
    p_items: carrito,
  });

  if (error) {
    return { ok: false, error: mensajeError(error.message) };
  }

  // `returns table` → array de filas; tomar la primera.
  const row = (data as PagarPedidoRow[] | null)?.[0];
  if (!row) {
    return { ok: false, error: "No pudimos completar el pedido. Inténtalo de nuevo." };
  }

  revalidatePath("/wallet");
  revalidatePath("/mis-pedidos");
  if (typeof slug === "string" && slug.length > 0) {
    revalidatePath(`/espacio/${slug}`);
  }

  return {
    ok: true,
    orderId: row.order_id,
    numero: row.numero,
    total: row.total,
    saldo: row.saldo,
  };
}
