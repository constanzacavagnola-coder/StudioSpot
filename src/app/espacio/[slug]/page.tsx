import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AtributoBadges from "@/components/AtributoBadges";
import Badge from "@/components/Badge";
import { CongestionDia } from "@/components/Congestion";
import {
  NIVEL3_LABEL,
  PRECIO_LABEL,
  RUIDO_LABEL,
  TIPO_EMOJI,
  TIPO_LABEL,
} from "@/lib/display";
import { getAllPlaces, getPlaceBySlug } from "@/lib/places";

// Prerendera una página estática por cada espacio del dataset.
export function generateStaticParams() {
  return getAllPlaces().map((place) => ({ slug: place.slug }));
}

type EspacioProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: EspacioProps): Promise<Metadata> {
  const { slug } = await params;
  const place = getPlaceBySlug(slug);
  if (!place) return { title: "Espacio no encontrado · Studio Spot" };
  return {
    title: `${place.nombre} · Studio Spot`,
    description:
      place.descripcion ??
      `${TIPO_LABEL[place.tipo]} en ${place.comuna}, ${place.direccion}.`,
  };
}

export default async function EspacioPage({ params }: EspacioProps) {
  const { slug } = await params;
  const place = getPlaceBySlug(slug);

  if (!place) notFound();

  const googleMaps = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/explorar"
        className="inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-brand"
      >
        ← Volver a explorar
      </Link>

      {/* Encabezado */}
      <header className="mt-4 flex flex-col gap-3 border-b border-stone-200 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-brand/10 text-brand ring-brand/20">
            <span aria-hidden>{TIPO_EMOJI[place.tipo]}</span> {TIPO_LABEL[place.tipo]}
          </Badge>
          <span className="text-sm text-stone-500">📍 {place.comuna}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          {place.nombre}
        </h1>
        <p className="text-stone-600">{place.direccion}</p>
        {place.descripcion && (
          <p className="max-w-2xl leading-7 text-stone-700">{place.descripcion}</p>
        )}
      </header>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {/* Columna principal */}
        <div className="md:col-span-2 space-y-8">
          {/* Atributos */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-stone-900">Atributos</h2>
            <AtributoBadges place={place} />
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Dato titulo="Enchufes" valor={NIVEL3_LABEL[place.enchufes]} />
              <Dato titulo="WiFi" valor={NIVEL3_LABEL[place.wifi]} />
              <Dato titulo="Ruido" valor={RUIDO_LABEL[place.ruido]} />
              <Dato titulo="Precio" valor={PRECIO_LABEL[place.precio]} />
              <Dato titulo="Baños" valor={place.tiene_banos ? "Sí" : "No"} />
              {place.ambiente && <Dato titulo="Ambiente" valor={place.ambiente} />}
            </dl>
          </section>

          {/* Congestión */}
          <section>
            <h2 className="mb-1 text-lg font-semibold text-stone-900">
              Congestión por horario
            </h2>
            <p className="mb-3 text-sm text-stone-500">
              Qué tan lleno suele estar a lo largo del día.
            </p>
            <CongestionDia congestion={place.congestion} />
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Tranquilo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Moderado
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Lleno
              </span>
            </div>
          </section>
        </div>

        {/* Columna lateral */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-stone-900">Información</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-stone-500">Horario</dt>
                <dd className="font-medium text-stone-800">
                  {place.horario ?? "Sin información"}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">Dirección</dt>
                <dd className="font-medium text-stone-800">{place.direccion}</dd>
              </div>
            </dl>
            <a
              href={googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              🗺️ Cómo llegar (Google Maps)
            </a>
            <p className="mt-2 text-center text-xs text-stone-400">
              {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
            </p>
          </div>

          {place.fuente && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">👥 Dato aportado por la comunidad</p>
              <p className="mt-1 text-amber-800">
                Fuente: {place.fuente}. Los atributos son estimaciones que pueden
                variar; ayúdanos a mejorarlos.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <dt className="text-xs text-stone-500">{titulo}</dt>
      <dd className="mt-0.5 font-medium text-stone-800">{valor}</dd>
    </div>
  );
}
