import type { Metadata } from "next";
import Link from "next/link";

import AtributoBadges from "@/components/AtributoBadges";
import Badge from "@/components/Badge";
import { CongestionBadge } from "@/components/Congestion";
import { requireRole } from "@/lib/auth/dal";
import { getOwnedPlaces } from "@/lib/business/data";
import { FRANJAS_ORDEN, TIPO_EMOJI, TIPO_LABEL } from "@/lib/display";
import { getFranjaActual } from "@/lib/places";
import type { Place } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard · Studio Spot",
  description:
    "Gestiona los espacios de tu empresa en Studio Spot: reclama, crea y edita atributos y congestión.",
};

/**
 * Dashboard de empresa (F4). Ruta privada y por rol: `requireRole("empresa")`
 * redirige a /login si no hay sesión y a / si el rol no es empresa. Lista los
 * espacios del dueño (`owner_id = auth.uid()`, vía RLS + filtro) y ofrece los
 * accesos para reclamar y crear.
 */
export default async function DashboardPage() {
  const { profile } = await requireRole("empresa");
  const places = await getOwnedPlaces();
  const franjaActual = getFranjaActual();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Dashboard
          </h1>
          <p className="mt-1 text-stone-600">
            Hola{profile.nombre ? `, ${profile.nombre}` : ""}. Gestiona los
            espacios de tu empresa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/reclamar"
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-white px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:border-brand hover:bg-brand/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            🔎 Reclamar espacio
          </Link>
          <Link
            href="/dashboard/nuevo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            + Crear espacio
          </Link>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">
          Tus espacios{" "}
          <span className="text-sm font-normal text-stone-500">
            ({places.length})
          </span>
        </h2>

        {places.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <p className="text-4xl" aria-hidden>
              🏢
            </p>
            <h3 className="mt-3 text-lg font-semibold text-stone-900">
              Aún no gestionas espacios
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">
              Reclama un espacio que ya esté en Studio Spot o crea uno nuevo para
              empezar a gestionar sus atributos y congestión.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link
                href="/dashboard/reclamar"
                className="inline-flex items-center rounded-xl border border-brand/30 bg-white px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:border-brand hover:bg-brand/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                Reclamar espacio
              </Link>
              <Link
                href="/dashboard/nuevo"
                className="inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                Crear espacio
              </Link>
            </div>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {places.map((place) => (
              <OwnedPlaceCard
                key={place.id}
                place={place}
                franjaActual={franjaActual}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function OwnedPlaceCard({
  place,
  franjaActual,
}: {
  place: Place;
  franjaActual: ReturnType<typeof getFranjaActual>;
}) {
  const sinCongestion = FRANJAS_ORDEN.every((f) => !place.congestion[f]);

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-stone-900">{place.nombre}</h3>
          <p className="text-sm text-stone-500">📍 {place.comuna}</p>
        </div>
        <Badge className="shrink-0 bg-brand/10 text-brand ring-brand/20">
          <span aria-hidden>{TIPO_EMOJI[place.tipo]}</span> {TIPO_LABEL[place.tipo]}
        </Badge>
      </div>

      <AtributoBadges place={place} />

      <div className="flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
        <span className="text-xs text-stone-500">Congestión ahora</span>
        {sinCongestion ? (
          <span className="text-xs text-stone-500">Sin datos de congestión</span>
        ) : (
          <CongestionBadge congestion={place.congestion} franja={franjaActual} />
        )}
      </div>

      <div className="mt-1 flex items-center gap-2">
        <Link
          href={`/dashboard/${place.id}/editar`}
          className="inline-flex items-center rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Editar
        </Link>
        <Link
          href={`/espacio/${place.slug}`}
          className="inline-flex items-center rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-brand/40 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Ver ficha
        </Link>
      </div>
    </li>
  );
}
