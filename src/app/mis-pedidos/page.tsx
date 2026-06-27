import type { Metadata } from "next";

import { CartIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth/dal";
import { getMisPedidos } from "@/lib/orders/data";
import MisPedidos from "./MisPedidos";

export const metadata: Metadata = {
  title: "Mis pedidos · Studio Spot",
  description:
    "Revisa tus pedidos en Studio Spot con su número, espacio, productos, total y estado en vivo.",
};

/**
 * Feature C (cliente): historial de pedidos del usuario con estado en vivo (0006).
 * Ruta privada: `requireUser` redirige a /login sin sesión. Los pedidos los
 * resuelve el servidor (`getMisPedidos`, autorizados por RLS `orders_select_client`)
 * y el Client Component se suscribe a Realtime para reflejar los cambios de estado.
 */
export default async function MisPedidosPage() {
  const user = await requireUser();
  const pedidos = await getMisPedidos();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-start gap-3">
        <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <CartIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Mis pedidos
          </h1>
          <p className="mt-1 text-ink-2">
            El estado de cada pedido se actualiza solo: te avisamos cuando esté
            en preparación, listo y retirado.
          </p>
        </div>
      </header>

      <MisPedidos pedidos={pedidos} userId={user.id} />
    </div>
  );
}
