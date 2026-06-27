import type { Metadata } from "next";

import { AlertaIcon, WalletIcon } from "@/components/icons";
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
        <h1 className="text-3xl font-bold tracking-tight text-ink">Wallet</h1>
        <p className="mt-1 text-ink-2">
          Recarga créditos y revisa tus movimientos.
        </p>
      </header>

      {/* Banner: saldo de demostración, sin dinero real */}
      <div
        role="note"
        className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      >
        <AlertaIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <p>
          <span className="font-semibold">Saldo de demostración.</span> Estos son
          créditos ficticios para probar la experiencia:{" "}
          <span className="font-semibold">no representan dinero real</span> ni se
          cobra ningún pago.
        </p>
      </div>

      {/* Saldo actual */}
      <section className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 to-surface p-6 shadow-sm">
        <h2 className="text-sm font-medium text-ink-2">Saldo disponible</h2>
        <p className="mt-1 text-4xl font-bold tracking-tight text-ink">
          {formatCLP(saldo)}
        </p>
        <p className="mt-1 text-xs text-ink-2">Créditos de demostración (CLP).</p>
      </section>

      {/* Recargar */}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-ink">
          Recargar saldo
        </h2>
        <WalletRecarga />
      </section>

      {/* Historial de movimientos */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">Movimientos</h2>
        {movimientos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-warm bg-surface p-10 text-center">
            <WalletIcon className="mx-auto h-12 w-12 text-ink-3" />
            <h3 className="mt-3 text-base font-semibold text-ink">
              Aún no tienes movimientos
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-2">
              Haz tu primera recarga arriba para empezar a usar tu saldo de
              demostración.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-soft overflow-hidden rounded-2xl border border-border-warm bg-surface shadow-sm">
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
        <p className="font-medium text-ink">{TX_TIPO_LABEL[tx.tipo]}</p>
        <p className="truncate text-xs text-ink-2">
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
