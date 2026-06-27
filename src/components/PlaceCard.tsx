import Link from "next/link";
import AtributoBadges from "@/components/AtributoBadges";
import Badge from "@/components/Badge";
import { CongestionBadge } from "@/components/Congestion";
import FavoriteButton from "@/components/FavoriteButton";
import { Icon, PinIcon } from "@/components/icons";
import { FRANJA_LABEL, TIPO_ICON, TIPO_LABEL } from "@/lib/display";
import type { Franja, Place } from "@/lib/types";

/** Tarjeta de un espacio para el listado de /explorar y /mis-lugares. */
export default function PlaceCard({
  place,
  franjaActual,
  isFavorite = false,
  isAuthenticated = false,
}: {
  place: Place;
  franjaActual: Franja;
  /** Estado inicial del corazón (resuelto en el servidor). */
  isFavorite?: boolean;
  /** Si hay sesión: define si el corazón guarda o invita a entrar. */
  isAuthenticated?: boolean;
}) {
  // El corazón va como hermano del Link (no anidado) para no meter un <button>
  // dentro de un <a> (HTML inválido); el wrapper `relative` lo posiciona y el
  // `group` mantiene el hover del título.
  return (
    <div className="group relative transition-transform hover:-translate-y-0.5">
      <Link
        href={`/espacio/${place.slug}`}
        className="flex h-full flex-col gap-3 rounded-2xl border border-border-warm bg-surface p-5 shadow-sm transition-all hover:border-brand/40 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3 pr-10">
          <div>
            <h3 className="font-semibold text-ink group-hover:text-brand">
              {place.nombre}
            </h3>
            <p className="inline-flex items-center gap-1 text-sm text-ink-2">
              <PinIcon className="h-3.5 w-3.5" /> {place.comuna}
            </p>
          </div>
          <Badge className="shrink-0 bg-brand/10 text-brand ring-brand/20">
            <Icon name={TIPO_ICON[place.tipo]} className="h-3.5 w-3.5" />{" "}
            {TIPO_LABEL[place.tipo]}
          </Badge>
        </div>

        <AtributoBadges place={place} />

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-soft pt-3">
          <span className="text-xs text-ink-2">
            Ahora ({FRANJA_LABEL[franjaActual]})
          </span>
          <CongestionBadge congestion={place.congestion} franja={franjaActual} />
        </div>
      </Link>

      <FavoriteButton
        placeId={place.id}
        placeName={place.nombre}
        initialFavorite={isFavorite}
        isAuthenticated={isAuthenticated}
        variant="card"
        className="absolute right-3 top-3 z-10"
      />
    </div>
  );
}
