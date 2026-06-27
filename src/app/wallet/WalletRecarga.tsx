"use client";

import { useState, useTransition } from "react";

import { MONTOS_RECARGA_CLP, formatCLP } from "@/lib/constants";
import { recargar } from "@/lib/wallet/actions";

/**
 * Botones de recarga del saldo de la wallet (F3). Client Component porque maneja
 * interacción y estado de carga. Cada botón dispara la Server Action `recargar`
 * con un monto fijo; al terminar, la Action revalida /wallet y el saldo +
 * historial (renderizados en el servidor) se refrescan solos.
 *
 * Mientras hay una recarga en curso se deshabilitan todos los botones y se marca
 * cuál se pulsó, para feedback claro y evitar dobles envíos.
 */
export default function WalletRecarga() {
  const [pending, startTransition] = useTransition();
  const [montoEnCurso, setMontoEnCurso] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  function onRecargar(monto: number) {
    setError(null);
    setExito(null);
    setMontoEnCurso(monto);
    startTransition(async () => {
      const res = await recargar(monto);
      if (res.ok) {
        setExito(`Recargaste ${formatCLP(monto)} de saldo.`);
      } else {
        setError(res.error);
      }
      setMontoEnCurso(null);
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MONTOS_RECARGA_CLP.map((monto) => {
          const cargando = pending && montoEnCurso === monto;
          return (
            <button
              key={monto}
              type="button"
              onClick={() => onRecargar(monto)}
              disabled={pending}
              aria-label={`Recargar ${formatCLP(monto)} de saldo`}
              className="inline-flex items-center justify-center rounded-xl border border-brand/30 bg-surface px-4 py-3 text-sm font-semibold text-brand transition-colors hover:border-brand hover:bg-brand/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? "Recargando…" : `+ ${formatCLP(monto)}`}
            </button>
          );
        })}
      </div>

      {/* El contenedor es la única región viva (polite); los hijos no llevan
          role propio para no anidar live regions ni duplicar el anuncio. */}
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
