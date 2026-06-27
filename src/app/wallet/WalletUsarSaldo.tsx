"use client";

import { useState, useTransition } from "react";

import { MONTOS_DESCUENTO_CLP, formatCLP } from "@/lib/constants";
import { usarSaldo } from "@/lib/wallet/actions";

/**
 * Botones para GASTAR saldo como descuento (cierre del ciclo del wallet). Client
 * Component reutilizable: se usa en /wallet (descuento genérico) y en la ficha de
 * un espacio (glosa con el nombre del lugar). Cada botón dispara la Server Action
 * `usarSaldo`; al terminar, la Action revalida /wallet y el saldo + historial se
 * refrescan en el servidor.
 *
 * El saldo inicial llega como prop (renderizado en el servidor) y se mantiene en
 * estado local para deshabilitar los montos que ya no alcanzan tras un descuento,
 * sin esperar al re-render. Saldo 0 muestra un aviso y deja todo deshabilitado,
 * sin error.
 */
export default function WalletUsarSaldo({
  saldo,
  glosa,
}: {
  saldo: number;
  glosa?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [saldoActual, setSaldoActual] = useState(saldo);
  const [montoEnCurso, setMontoEnCurso] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  function onUsar(monto: number) {
    setError(null);
    setExito(null);
    setMontoEnCurso(monto);
    startTransition(async () => {
      const res = await usarSaldo(monto, glosa);
      if (res.ok) {
        setSaldoActual(res.saldo);
        setExito(`Usaste ${formatCLP(monto)} de tu saldo como descuento.`);
      } else {
        setError(res.error);
      }
      setMontoEnCurso(null);
    });
  }

  const sinSaldo = saldoActual <= 0;

  return (
    <div>
      {sinSaldo ? (
        <p className="rounded-xl border border-dashed border-border-warm bg-background-alt px-4 py-3 text-sm text-ink-2">
          Aún no tienes saldo. Recarga primero para poder usarlo como descuento.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {MONTOS_DESCUENTO_CLP.map((monto) => {
            const cargando = pending && montoEnCurso === monto;
            const noAlcanza = monto > saldoActual;
            return (
              <button
                key={monto}
                type="button"
                onClick={() => onUsar(monto)}
                disabled={pending || noAlcanza}
                aria-label={`Usar ${formatCLP(monto)} de saldo como descuento`}
                className="inline-flex items-center justify-center rounded-xl border border-rose-300 bg-surface px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:border-rose-400 hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cargando ? "Aplicando…" : `− ${formatCLP(monto)}`}
              </button>
            );
          })}
        </div>
      )}

      {/* Única región viva (polite) para el feedback; sin role en los hijos. */}
      <div aria-live="polite" className="mt-3 min-h-[1.25rem]">
        {error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : exito ? (
          <p className="text-sm text-emerald-700">{exito}</p>
        ) : null}
      </div>
    </div>
  );
}
