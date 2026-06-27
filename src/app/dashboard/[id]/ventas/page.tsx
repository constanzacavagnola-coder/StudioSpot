import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  CartIcon,
  FlechaIzquierdaIcon,
  GraficoIcon,
  RelojIcon,
} from "@/components/icons";
import { requireRole } from "@/lib/auth/dal";
import { getOwnedPlaceById } from "@/lib/business/data";
import { formatCLP } from "@/lib/constants";
import { ORDER_ESTADO_CLASES, ORDER_ESTADO_LABEL } from "@/lib/display";
import { getHistorialVentas, getResumenVentas } from "@/lib/orders/data";
import type { PedidoEmpresa } from "@/lib/types";

export const metadata: Metadata = {
  title: "Ventas del espacio · Studio Spot",
  description:
    "Resumen de ventas de tu espacio: total vendido, pedidos retirados, en curso y cancelados, con el historial de pedidos retirados.",
};

type Props = { params: Promise<{ id: string }> };

/**
 * Feature D (empresa): apartado de VENTAS de un espacio propio (0006). Ruta
 * privada por rol empresa; solo carga si el espacio pertenece al usuario
 * (`getOwnedPlaceById`), si no, 404. El resumen (`getResumenVentas`) y el
 * historial de pedidos retirados (`getHistorialVentas`) los resuelve el servidor,
 * autorizados por RLS `orders_select_owner` + filtro de propiedad. Vista solo de
 * lectura: la gestión de la cola y el avance de estados vive en /pedidos.
 */
export default async function VentasEspacioPage({ params }: Props) {
  await requireRole("empresa");
  const { id } = await params;
  const place = await getOwnedPlaceById(id);

  if (!place) notFound();

  const [resumen, historial] = await Promise.all([
    getResumenVentas(id),
    getHistorialVentas(id),
  ]);

  const enCurso =
    resumen.conteoPorEstado.pagado +
    resumen.conteoPorEstado.en_preparacion +
    resumen.conteoPorEstado.listo;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-2 hover:text-brand"
      >
        <FlechaIzquierdaIcon className="h-4 w-4" /> Volver al dashboard
      </Link>

      <header className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <GraficoIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              Ventas de {place.nombre}
            </h1>
            <p className="mt-1 text-ink-2">
              Lo que ya vendiste en este espacio. El total vendido cuenta los
              pedidos retirados; los demás aún están en curso.
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/${place.id}/pedidos`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-warm px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-brand/40 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <CartIcon className="h-4 w-4" /> Ir a la cola de pedidos
        </Link>
      </header>

      <section
        aria-label="Resumen de ventas"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Tarjeta
          destacada
          etiqueta="Total vendido"
          valor={formatCLP(resumen.totalVendido)}
          detalle="Pedidos retirados"
        />
        <Tarjeta
          etiqueta="Pedidos retirados"
          valor={String(resumen.conteoPorEstado.retirado)}
          detalle="Ventas completadas"
        />
        <Tarjeta
          etiqueta="En curso"
          valor={String(enCurso)}
          detalle="Pagados, en preparación o listos"
        />
        <Tarjeta
          etiqueta="Cancelados"
          valor={String(resumen.conteoPorEstado.cancelado)}
          detalle="No suman a las ventas"
        />
      </section>

      <section aria-label="Historial de ventas" className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">
          Historial de ventas{" "}
          <span className="text-sm font-normal text-ink-2">
            ({historial.length})
          </span>
        </h2>

        {historial.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-warm bg-surface p-10 text-center">
            <GraficoIcon className="mx-auto h-12 w-12 text-ink-3" />
            <h3 className="mt-3 text-lg font-semibold text-ink">
              Aún no registras ventas
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-2">
              Cuando marques un pedido como retirado en la cola de pedidos,
              aparecerá aquí y sumará al total vendido.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {historial.map((pedido) => (
              <li key={pedido.id}>
                <VentaRow pedido={pedido} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Tarjeta({
  etiqueta,
  valor,
  detalle,
  destacada = false,
}: {
  etiqueta: string;
  valor: string;
  detalle: string;
  destacada?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        destacada
          ? "border-brand/20 bg-brand/5"
          : "border-border-warm bg-surface"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-ink-2">
        {etiqueta}
      </p>
      <p
        className={`mt-1 text-2xl font-bold ${
          destacada ? "text-brand" : "text-ink"
        }`}
      >
        {valor}
      </p>
      <p className="mt-1 text-xs text-ink-3">{detalle}</p>
    </div>
  );
}

function VentaRow({ pedido }: { pedido: PedidoEmpresa }) {
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
