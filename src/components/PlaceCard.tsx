import Link from "next/link";
import AtributoBadges from "@/components/AtributoBadges";
import Badge from "@/components/Badge";
import { CongestionBadge } from "@/components/Congestion";
import { FRANJA_LABEL, TIPO_EMOJI, TIPO_LABEL } from "@/lib/display";
import type { Franja, Place } from "@/lib/types";

/** Tarjeta de un espacio para el listado de /explorar. */
export default function PlaceCard({
  place,
  franjaActual,
}: {
  place: Place;
  franjaActual: Franja;
}) {
  return (
    <Link
      href={`/espacio/${place.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-stone-900 group-hover:text-brand">
            {place.nombre}
          </h3>
          <p className="text-sm text-stone-500">📍 {place.comuna}</p>
        </div>
        <Badge className="shrink-0 bg-brand/10 text-brand ring-brand/20">
          <span aria-hidden>{TIPO_EMOJI[place.tipo]}</span> {TIPO_LABEL[place.tipo]}
        </Badge>
      </div>

      <AtributoBadges place={place} />

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
        <span className="text-xs text-stone-400">
          Ahora ({FRANJA_LABEL[franjaActual]})
        </span>
        <CongestionBadge congestion={place.congestion} franja={franjaActual} />
      </div>
    </Link>
  );
}
