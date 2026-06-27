"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CartIcon, PinIcon, RelojIcon } from "@/components/icons";
import { formatCLP } from "@/lib/constants";
import { ORDER_ESTADO_CLASES, ORDER_ESTADO_LABEL } from "@/lib/display";
import { suscribirsePedidosUsuario } from "@/lib/orders/realtime";
import type { OrderConItemsYEspacio, OrderEstado } from "@/lib/types";

// Estados que el cliente ve como "en curso" (aún se preparan o esperan retiro);
// el resto (retirado, cancelado) forma su historial.
const ESTADOS_EN_CURSO: readonly OrderEstado[] = [
  "pagado",
  "en_preparacion",
  "listo",
];

/**
 * Feature C (cliente): lista de "Mis pedidos" con el ESTADO EN VIVO. Client
 * Component que recibe los pedidos ya resueltos en el servidor (fuente de verdad)
 * y se suscribe a Supabase Realtime para los pedidos del usuario: cuando el dueño
 * del espacio avanza un estado, llega un UPDATE y se refresca la ruta con
 * `router.refresh()` (re-render del Server Component, sin perder estado de UI).
 *
 * El `userId` viene resuelto del servidor: el filtro de Realtime es solo
 * transporte; la frontera real es la RLS `orders_select_client`.
 */
export default function MisPedidos({
  pedidos,
  userId,
}: {
  pedidos: OrderConItemsYEspacio[];
  userId: string;
}) {
  const router = useRouter();
  // Marca de "en vivo": pasa a true en cuanto entra un cambio por Realtime, solo
  // para dar feedback visible de que la lista se mantiene al día.
  const [enVivo, setEnVivo] = useState(false);

  useEffect(() => {
    const desuscribir = suscribirsePedidosUsuario(userId, () => {
      setEnVivo(true);
      router.refresh();
    });
    return desuscribir;
  }, [userId, router]);

  // Separa los pedidos en curso (se actualizan en vivo) del historial (retirados
  // y cancelados). El servidor ya los entrega del más reciente al más antiguo.
  const { enCurso, historial } = useMemo(() => {
    const enCurso: OrderConItemsYEspacio[] = [];
    const historial: OrderConItemsYEspacio[] = [];
    for (const p of pedidos) {
      if (ESTADOS_EN_CURSO.includes(p.estado)) enCurso.push(p);
      else historial.push(p);
    }
    return { enCurso, historial };
  }, [pedidos]);

  if (pedidos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-warm bg-surface p-10 text-center">
        <CartIcon className="mx-auto h-12 w-12 text-ink-3" />
        <h3 className="mt-3 text-lg font-semibold text-ink">
          Aún no tienes pedidos
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-2">
          Explora los espacios, arma tu pedido desde su menú y págalo con tu
          saldo Studio Spot. Aquí verás el estado de cada pedido en vivo.
        </p>
        <Link
          href="/explorar"
          className="mt-5 inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Explorar espacios
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-label="Pedidos en curso" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-ink">
            En curso{" "}
            <span className="text-sm font-normal text-ink-2">
              ({enCurso.length})
            </span>
          </h2>
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                enVivo ? "bg-mint-ink" : "bg-ink-3"
              }`}
              aria-hidden
            />
            Estado actualizado en vivo
          </p>
        </div>

        {enCurso.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border-warm bg-surface px-4 py-6 text-center text-sm text-ink-2">
            No tienes pedidos en curso. Cuando hagas uno, verás aquí su estado en
            vivo.
          </p>
        ) : (
          <ul className="space-y-4">
            {enCurso.map((pedido) => (
              <li key={pedido.id}>
                <PedidoCard pedido={pedido} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {historial.length > 0 ? (
        <section aria-label="Historial de pedidos" className="space-y-4">
          <h2 className="text-lg font-semibold text-ink">
            Historial{" "}
            <span className="text-sm font-normal text-ink-2">
              ({historial.length})
            </span>
          </h2>
          <ul className="space-y-4">
            {historial.map((pedido) => (
              <li key={pedido.id}>
                <PedidoCard pedido={pedido} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function PedidoCard({ pedido }: { pedido: OrderConItemsYEspacio }) {
  const fecha = new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(pedido.created_at));

  return (
    <article className="rounded-2xl border border-border-warm bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-ink">Pedido #{pedido.numero}</h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${ORDER_ESTADO_CLASES[pedido.estado]}`}
            >
              {ORDER_ESTADO_LABEL[pedido.estado]}
            </span>
          </div>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-2">
            <PinIcon className="h-3.5 w-3.5 shrink-0" />
            {pedido.place ? (
              <Link
                href={`/espacio/${pedido.place.slug}`}
                className="hover:text-brand"
              >
                {pedido.place.nombre}
              </Link>
            ) : (
              "Espacio no disponible"
            )}
          </p>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-ink-2">
          <RelojIcon className="h-3.5 w-3.5" /> {fecha}
        </p>
      </div>

      <ul className="mt-3 divide-y divide-border-soft border-t border-border-soft">
        {pedido.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 py-2 text-sm"
          >
            <span className="min-w-0 text-ink">
              <span className="font-medium text-ink-2">{item.cantidad}×</span>{" "}
              {item.nombre}
            </span>
            <span className="shrink-0 font-medium text-ink">
              {formatCLP(item.precio_clp * item.cantidad)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t border-border-soft pt-3 text-sm">
        <span className="text-ink-2">Total</span>
        <span className="text-base font-bold text-ink">
          {formatCLP(pedido.total_clp)}
        </span>
      </div>
    </article>
  );
}
