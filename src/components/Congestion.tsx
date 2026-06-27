import Badge from "@/components/Badge";
import {
  CONGESTION_CLASES,
  CONGESTION_LABEL,
  CONGESTION_PUNTO,
  FRANJA_HORARIO,
  FRANJA_LABEL,
  FRANJAS_ORDEN,
} from "@/lib/display";
import type { Congestion, Franja } from "@/lib/types";

/** Badge compacto con el nivel de congestión de una franja concreta. */
export function CongestionBadge({
  congestion,
  franja,
  mostrarFranja = false,
}: {
  congestion: Congestion;
  franja: Franja;
  mostrarFranja?: boolean;
}) {
  const nivel = congestion[franja];
  if (!nivel) {
    return (
      <Badge className="bg-stone-100 text-stone-500 ring-stone-200">
        {mostrarFranja ? `${FRANJA_LABEL[franja]}: ` : ""}sin dato
      </Badge>
    );
  }
  return (
    <Badge className={CONGESTION_CLASES[nivel]}>
      <span className={`h-2 w-2 rounded-full ${CONGESTION_PUNTO[nivel]}`} aria-hidden />
      {mostrarFranja ? `${FRANJA_LABEL[franja]}: ` : ""}
      {CONGESTION_LABEL[nivel]}
    </Badge>
  );
}

/** Visualización de la congestión por las 4 franjas horarias del día. */
export function CongestionDia({ congestion }: { congestion: Congestion }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {FRANJAS_ORDEN.map((franja) => {
        const nivel = congestion[franja];
        return (
          <div
            key={franja}
            className="rounded-xl border border-stone-200 bg-white p-3 text-center"
          >
            <p className="text-sm font-semibold text-stone-800">
              {FRANJA_LABEL[franja]}
            </p>
            <p className="mb-2 text-xs text-stone-400">{FRANJA_HORARIO[franja]}</p>
            {nivel ? (
              <div
                className={`mx-auto flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium ring-1 ring-inset ${CONGESTION_CLASES[nivel]}`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${CONGESTION_PUNTO[nivel]}`}
                  aria-hidden
                />
                {CONGESTION_LABEL[nivel]}
              </div>
            ) : (
              <div className="rounded-lg bg-stone-100 px-2 py-1.5 text-sm text-stone-400">
                sin dato
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
