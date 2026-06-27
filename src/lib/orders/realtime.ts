// Helper de Realtime de CLIENTE para pedidos (0006). Se usa SOLO desde Client
// Components (dentro de un `useEffect`): abre un canal de Supabase Realtime y
// devuelve una función de limpieza que hace `removeChannel` (obligatorio: en dev
// StrictMode monta dos veces y, sin cleanup, quedan canales duplicados).
//
// El `filter` es transporte (a quién enruta el WS), NO autorización: la frontera
// real es la RLS (`orders_select_client` / `orders_select_owner`). Por eso el
// `userId`/`placeId` deben venir resueltos del servidor, no del cliente.

import type {
  RealtimePostgresChangesPayload,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

/** Función para cerrar la suscripción (llamar en el cleanup del efecto). */
export type Desuscribir = () => void;

/**
 * Suscribe a los cambios de estado (UPDATE) de los pedidos del usuario. Devuelve
 * la función de limpieza. El estado inicial debe venir del servidor; Realtime
 * solo entrega las actualizaciones posteriores.
 */
export function suscribirsePedidosUsuario(
  userId: string,
  onUpdate: (pedido: Order) => void,
): Desuscribir {
  const supabase = createClient();
  const channel = supabase
    .channel(`orders:user:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresUpdatePayload<Order>) => {
        onUpdate(payload.new);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Suscribe a TODOS los cambios (INSERT/UPDATE/DELETE) de los pedidos de un
 * espacio, para el tablero del dueño (ver pedidos nuevos y avances en vivo).
 * Devuelve la función de limpieza.
 */
export function suscribirsePedidosEspacio(
  placeId: string,
  onChange: (payload: RealtimePostgresChangesPayload<Order>) => void,
): Desuscribir {
  const supabase = createClient();
  const channel = supabase
    .channel(`orders:place:${placeId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `place_id=eq.${placeId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
