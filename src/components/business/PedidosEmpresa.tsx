"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  CartIcon,
  CheckIcon,
  EquisIcon,
  FlechaDerechaIcon,
  RelojIcon,
} from "@/components/icons";
import { formatCLP } from "@/lib/constants";
import {
  ESTADOS_CANCELABLES,
  ORDER_ESTADO_CLASES,
  ORDER_ESTADO_LABEL,
  ORDER_ESTADO_SIGUIENTE,
} from "@/lib/display";
import { avanzarEstado, cancelarPedido } from "@/lib/orders/estado";
import { suscribirsePedidosEspacio } from "@/lib/orders/realtime";
import type { OrderEstado, PedidoEmpresa } from "@/lib/types";

/**
 * Feature C (empresa): cola/tablero de pedidos de un espacio. Client Component que
 * recibe los pedidos resueltos en el servidor (fuente de verdad) y se suscribe a
 * Realtime para los pedidos del espacio: ante cualquier cambio (pedido nuevo o
 * avance de estado) refresca la ruta con `router.refresh()`.
 *
 * Las acciones de avanzar/cancelar pasan por las Server Actions `avanzarEstado` /
 * `cancelarPedido`, que re-verifican rol y propiedad del espacio y validan la
 * transición; la RLS `orders_update_owner` es la última barrera. El cliente nunca
 * decide el estado: solo propone el avance permitido.
 */

// Columnas activas del tablero, en el orden del flujo de trabajo.
const COLUMNAS: { estado: OrderEstado; titulo: string }[] = [
  { estado: "pagado", titulo: "Nuevos" },
  { estado: "en_preparacion", titulo: "En preparación" },
  { estado: "listo", titulo: "Listos para retirar" },
];

export default function PedidosEmpresa({
  pedidos,
  placeId,
}: {
  pedidos: PedidoEmpresa[];
  placeId: string;
}) {
  const router = useRouter();
  // Refleja la conexión REAL del canal de Realtime (no se asume "en vivo").
  const [enVivo, setEnVivo] = useState(false);

  useEffect(() => {
    const desuscribir = suscribirsePedidosEspacio(
      placeId,
      () => router.refresh(),
      (activo) => setEnVivo(activo),
    );
    return desuscribir;
  }, [placeId, router]);

  // Agrupa los pedidos por estado una sola vez por render.
  const porEstado = useMemo(() => {
    const map: Record<OrderEstado, PedidoEmpresa[]> = {
      pagado: [],
      en_preparacion: [],
      listo: [],
      retirado: [],
      cancelado: [],
    };
    for (const p of pedidos) map[p.estado].push(p);
    return map;
  }, [pedidos]);

  const activos =
    porEstado.pagado.length +
    porEstado.en_preparacion.length +
    porEstado.listo.length;
  const historial = [...porEstado.retirado, ...porEstado.cancelado].sort(
    (a, b) => (a.created_at < b.created_at ? 1 : -1),
  );

  return (
    <div className="space-y-8">
      <p className="flex items-center gap-2 text-sm text-ink-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            enVivo ? "bg-mint-ink" : "bg-ink-3"
          }`}
          aria-hidden
        />
        <span className="font-semibold text-ink">{activos}</span> pedido
        {activos === 1 ? "" : "s"} en curso ·{" "}
        {enVivo ? "se actualiza en vivo" : "conectando…"}
      </p>

      <div className="grid gap-5 lg:grid-cols-3">
        {COLUMNAS.map((col) => {
          const lista = porEstado[col.estado];
          return (
            <section
              key={col.estado}
              aria-label={col.titulo}
              className="rounded-2xl border border-border-warm bg-background-alt/50 p-3"
            >
              <header className="mb-3 flex items-center justify-between gap-2 px-1">
                <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${ORDER_ESTADO_CLASES[col.estado]}`}
                  >
                    {ORDER_ESTADO_LABEL[col.estado]}
                  </span>
                  {col.titulo}
                </h2>
                <span className="text-xs font-medium text-ink-2">
                  {lista.length}
                </span>
              </header>

              {lista.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border-warm px-3 py-6 text-center text-xs text-ink-3">
                  Sin pedidos aquí
                </p>
              ) : (
                <ul className="space-y-3">
                  {lista.map((pedido) => (
                    <li key={pedido.id}>
                      <PedidoCard pedido={pedido} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <section aria-label="Historial de pedidos">
        <h2 className="mb-3 text-lg font-semibold text-ink">Historial</h2>
        {historial.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border-warm bg-surface px-4 py-6 text-center text-sm text-ink-2">
            Aún no hay pedidos retirados ni cancelados.
          </p>
        ) : (
          <ul className="space-y-2">
            {historial.map((pedido) => (
              <li key={pedido.id}>
                <PedidoHistorialRow pedido={pedido} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PedidoCard({ pedido }: { pedido: PedidoEmpresa }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const siguiente = ORDER_ESTADO_SIGUIENTE[pedido.estado];
  const cancelable = ESTADOS_CANCELABLES.includes(pedido.estado);

  const hora = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(pedido.created_at));

  function onAvanzar() {
    if (!siguiente) return;
    setError(null);
    startTransition(async () => {
      const res = await avanzarEstado(pedido.id, siguiente);
      if (!res.ok) setError(res.error);
    });
  }

  function onCancelar() {
    setError(null);
    const ok = window.confirm(
      `¿Cancelar el pedido #${pedido.numero}? No se reembolsa el saldo en esta fase.`,
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await cancelarPedido(pedido.id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <article
      className={`rounded-xl border border-border-warm bg-surface p-3 shadow-sm transition-opacity ${
        pending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-ink">Pedido #{pedido.numero}</h3>
        <span className="inline-flex items-center gap-1 text-xs text-ink-2">
          <RelojIcon className="h-3.5 w-3.5" /> {hora}
        </span>
      </div>

      <ul className="mt-2 space-y-1 text-sm">
        {pedido.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2">
            <span className="min-w-0 text-ink">
              <span className="font-medium text-ink-2">{item.cantidad}×</span>{" "}
              {item.nombre}
            </span>
            <span className="shrink-0 text-ink-2">
              {formatCLP(item.precio_clp * item.cantidad)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t border-border-soft pt-2 text-sm">
        <span className="text-ink-2">Total</span>
        <span className="font-bold text-ink">{formatCLP(pedido.total_clp)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {siguiente ? (
          <button
            type="button"
            onClick={onAvanzar}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {siguiente === "retirado" ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <FlechaDerechaIcon className="h-4 w-4" />
            )}
            Marcar {ORDER_ESTADO_LABEL[siguiente].toLowerCase()}
          </button>
        ) : null}
        {cancelable ? (
          <button
            type="button"
            onClick={onCancelar}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <EquisIcon className="h-4 w-4" /> Cancelar
          </button>
        ) : null}
      </div>

      <div aria-live="polite" className="mt-1 min-h-[1rem]">
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>
    </article>
  );
}

function PedidoHistorialRow({ pedido }: { pedido: PedidoEmpresa }) {
  const fecha = new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(pedido.created_at));
  const unidades = pedido.items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-border-soft bg-surface px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-ink">Pedido #{pedido.numero}</span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${ORDER_ESTADO_CLASES[pedido.estado]}`}
        >
          {ORDER_ESTADO_LABEL[pedido.estado]}
        </span>
      </div>
      <div className="flex items-center gap-3 text-ink-2">
        <span className="inline-flex items-center gap-1">
          <CartIcon className="h-3.5 w-3.5" /> {unidades}
        </span>
        <span className="font-medium text-ink">{formatCLP(pedido.total_clp)}</span>
        <span className="inline-flex items-center gap-1 text-xs">
          <RelojIcon className="h-3.5 w-3.5" /> {fecha}
        </span>
      </div>
    </div>
  );
}
