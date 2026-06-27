import { cache } from "react";

import { getUser } from "@/lib/auth/dal";
import { getOwnedPlaceById } from "@/lib/business/data";
import { createClient } from "@/lib/supabase/server";
import type {
  OrderConItemsYEspacio,
  OrderEstado,
  PedidoEmpresa,
} from "@/lib/types";

/**
 * Lecturas server-side de pedidos (0006). La autorización la garantiza RLS, pero
 * NO se delega el alcance en ella:
 *  - Cliente (`getMisPedidos`): se filtra explícito por `user_id`. Las policies de
 *    `orders` se combinan con OR (`orders_select_client` OR `orders_select_owner`),
 *    así que una cuenta `empresa` dueña de espacios vería también los pedidos de
 *    SUS clientes; el filtro evita mezclarlos como "míos".
 *  - Empresa: `orders_select_owner` deja ver los pedidos de su espacio; igual se
 *    verifica la propiedad con `getOwnedPlaceById` (defensa en profundidad y para
 *    devolver [] limpio si el id no es del dueño).
 *
 * El join trae las líneas (`order_items`) bajo el alias `items` para encajar con
 * el tipo OrderConItems. Se memoiza por request con React `cache`.
 */

const ORDER_SELECT =
  "id, numero, user_id, place_id, estado, total_clp, created_at, updated_at, " +
  "items:order_items(id, order_id, menu_item_id, nombre, precio_clp, cantidad)";

// Para /mis-pedidos se añade el espacio (to-one): así el cliente ve el nombre y
// puede volver a la ficha, sin exponer solo el place_id. `places` tiene lectura
// pública por RLS, así que el join no abre nada de más.
const MIS_PEDIDOS_SELECT = ORDER_SELECT + ", place:places(nombre, slug)";

/** Pedidos del usuario autenticado (historial completo), del más reciente al más antiguo. */
export const getMisPedidos = cache(async (): Promise<OrderConItemsYEspacio[]> => {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(MIS_PEDIDOS_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as OrderConItemsYEspacio[];
});

/** Pedidos de un espacio del dueño (cola/tablero), del más reciente al más antiguo. */
export const getPedidosDeEspacio = cache(
  async (placeId: string): Promise<PedidoEmpresa[]> => {
    const place = await getOwnedPlaceById(placeId);
    if (!place) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as unknown as PedidoEmpresa[];
  },
);

/**
 * Historial de ventas de un espacio: pedidos ya `retirado` (las ventas
 * efectivas), del más reciente al más antiguo. Misma autorización que el resto
 * (RLS `orders_select_owner` + filtro de propiedad con `getOwnedPlaceById`).
 */
export const getHistorialVentas = cache(
  async (placeId: string): Promise<PedidoEmpresa[]> => {
    const place = await getOwnedPlaceById(placeId);
    if (!place) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("place_id", placeId)
      .eq("estado", "retirado")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as unknown as PedidoEmpresa[];
  },
);

/** Resumen de ventas de un espacio: total vendido (retirados) y conteo por estado. */
export interface ResumenVentas {
  totalVendido: number; // suma de total_clp de pedidos `retirado`
  conteoPorEstado: Record<OrderEstado, number>;
  totalPedidos: number;
}

const ESTADO_ZERO: Record<OrderEstado, number> = {
  pagado: 0,
  en_preparacion: 0,
  listo: 0,
  retirado: 0,
  cancelado: 0,
};

export const getResumenVentas = cache(
  async (placeId: string): Promise<ResumenVentas> => {
    const place = await getOwnedPlaceById(placeId);
    if (!place) {
      return { totalVendido: 0, conteoPorEstado: { ...ESTADO_ZERO }, totalPedidos: 0 };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("estado, total_clp")
      .eq("place_id", placeId);

    if (error || !data) {
      return { totalVendido: 0, conteoPorEstado: { ...ESTADO_ZERO }, totalPedidos: 0 };
    }

    const conteoPorEstado: Record<OrderEstado, number> = { ...ESTADO_ZERO };
    let totalVendido = 0;
    for (const row of data as { estado: OrderEstado; total_clp: number }[]) {
      conteoPorEstado[row.estado] += 1;
      // El ingreso efectivo es el de los pedidos ya retirados.
      if (row.estado === "retirado") totalVendido += row.total_clp;
    }

    return { totalVendido, conteoPorEstado, totalPedidos: data.length };
  },
);
