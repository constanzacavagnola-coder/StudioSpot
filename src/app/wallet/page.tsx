import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/dal";
import { formatCLP } from "@/lib/constants";
import { TX_TIPO_LABEL } from "@/lib/display";
import type { WalletTx } from "@/lib/types";
import { getWalletSaldo, getWalletTransactions } from "@/lib/wallet/data";
import WalletRecarga from "./WalletRecarga";

export const metadata: Metadata = {
  title: "Wallet · Studio Spot",
  description:
    "Tu saldo de demostración en Studio Spot: recarga créditos ficticios y revisa el historial de movimientos.",
};

// Formatea la fecha/hora de un movimiento en español de Chile.
const FECHA_FMT = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Página /wallet (F3): saldo de DEMO, recarga de créditos ficticios e historial
 * de movimientos. Ruta privada — sin sesión, `requireUser()` redirige a /login.
 * Los datos llegan ya filtrados por RLS al usuario autenticado.
 *
 * IMPORTANTE: el saldo es de demostración (créditos ficticios), NO dinero real.
 * El banner lo deja explícito (decisión de producto del PLAN).
 */
export default async function WalletPage() {
  await requireUser();
  const [saldo, movimientos] = await Promise.all([
    getWalletSaldo(),
    getWalletTransactions(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Wallet</h1>
        <p className="mt-1 text-stone-600">
          Recarga créditos y revisa tus movimientos.
        </p>
      </header>

      {/* Banner: saldo de demostración, sin dinero real */}
      <div
        role="note"
        className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      >
        <span aria-hidden className="text-lg leading-none">
          ⚠️
        </span>
        <p>
          <span className="font-semibold">Saldo de demostración.</span> Estos son
          créditos ficticios para probar la experiencia:{" "}
          <span className="font-semibold">no representan dinero real</span> ni se
          cobra ningún pago.
        </p>
      </div>

      {/* Saldo actual */}
      <section className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 to-white p-6 shadow-sm">
        <h2 className="text-sm font-medium text-stone-500">Saldo disponible</h2>
        <p className="mt-1 text-4xl font-bold tracking-tight text-stone-900">
          {formatCLP(saldo)}
        </p>
        <p className="mt-1 text-xs text-stone-500">Créditos de demostración (CLP).</p>
      </section>

      {/* Recargar */}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-stone-900">
          Recargar saldo
        </h2>
        <WalletRecarga />
      </section>

      {/* Historial de movimientos */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-stone-900">Movimientos</h2>
        {movimientos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <p className="text-4xl" aria-hidden>
              👛
            </p>
            <h3 className="mt-3 text-base font-semibold text-stone-900">
              Aún no tienes movimientos
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">
              Haz tu primera recarga arriba para empezar a usar tu saldo de
              demostración.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            {movimientos.map((tx) => (
              <MovimientoFila key={tx.id} tx={tx} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MovimientoFila({ tx }: { tx: WalletTx }) {
  // Una recarga suma; descuento resta. El signo se deriva del tipo para que la
  // lectura sea clara aunque el monto venga siempre como positivo.
  const esIngreso = tx.tipo === "recarga";
  const signo = esIngreso ? "+" : "−";

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="font-medium text-stone-900">{TX_TIPO_LABEL[tx.tipo]}</p>
        <p className="truncate text-xs text-stone-500">
          {tx.glosa ?? "Movimiento de saldo"} · {FECHA_FMT.format(new Date(tx.created_at))}
        </p>
      </div>
      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          esIngreso ? "text-emerald-700" : "text-rose-600"
        }`}
      >
        {signo}
        {formatCLP(Math.abs(tx.monto_clp))}
      </span>
    </li>
  );
}
