import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PedidosEmpresa from "@/components/business/PedidosEmpresa";
import {
  CartIcon,
  FlechaIzquierdaIcon,
  GraficoIcon,
} from "@/components/icons";
import { requireRole } from "@/lib/auth/dal";
import { getOwnedPlaceById } from "@/lib/business/data";
import { getPedidosDeEspacio } from "@/lib/orders/data";

export const metadata: Metadata = {
  title: "Pedidos del espacio · Studio Spot",
  description:
    "Cola de pedidos de tu espacio: avanza el estado de cada pedido (pagado, en preparación, listo, retirado) y cancela cuando corresponda.",
};

type Props = { params: Promise<{ id: string }> };

/**
 * Feature C (empresa): cola/tablero de pedidos de un espacio propio (0006). Ruta
 * privada por rol empresa; solo carga si el espacio pertenece al usuario
 * (`getOwnedPlaceById`), si no, 404. Los pedidos los resuelve el servidor
 * (`getPedidosDeEspacio`, autorizados por RLS `orders_select_owner` + filtro de
 * propiedad). El tablero (avanzar/cancelar + Realtime) vive en `PedidosEmpresa`,
 * cuyas acciones re-verifican rol, propiedad y transición en el servidor.
 */
export default async function PedidosEspacioPage({ params }: Props) {
  await requireRole("empresa");
  const { id } = await params;
  const place = await getOwnedPlaceById(id);

  if (!place) notFound();

  const pedidos = await getPedidosDeEspacio(id);

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
            <CartIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              Pedidos de {place.nombre}
            </h1>
            <p className="mt-1 text-ink-2">
              Gestiona la cola de pedidos: marca cada uno en preparación, listo
              y retirado, o cancélalo si no puedes prepararlo. Los pedidos
              nuevos aparecen solos.
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/${place.id}/ventas`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-warm px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-brand/40 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <GraficoIcon className="h-4 w-4" /> Ver ventas
        </Link>
      </header>

      <PedidosEmpresa pedidos={pedidos} placeId={place.id} />
    </div>
  );
}
