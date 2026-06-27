import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AtributoBadges from "@/components/AtributoBadges";
import Badge from "@/components/Badge";
import { CongestionDia } from "@/components/Congestion";
import FavoriteButton from "@/components/FavoriteButton";
import {
  ComunidadIcon,
  FlechaIzquierdaIcon,
  Icon,
  MapaIcon,
  PinIcon,
} from "@/components/icons";
import { getUser } from "@/lib/auth/dal";
import { isFavorite } from "@/lib/favorites/data";
import {
  NIVEL3_LABEL,
  PRECIO_LABEL,
  RUIDO_LABEL,
  TIPO_ICON,
  TIPO_LABEL,
} from "@/lib/display";
import { getAllPlaces, getPlaceBySlug } from "@/lib/places";
import { formatCLP } from "@/lib/constants";
import { getWalletSaldo } from "@/lib/wallet/data";
import WalletUsarSaldo from "@/app/wallet/WalletUsarSaldo";

// Prerendera una página estática por cada espacio del dataset.
export async function generateStaticParams() {
  const places = await getAllPlaces();
  return places.map((place) => ({ slug: place.slug }));
}

type EspacioProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: EspacioProps): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
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
  const place = await getPlaceBySlug(slug);

  if (!place) notFound();

  // Sesión y estado del favorito para el botón "guardar" (F2). Si hay sesión,
  // también el saldo de la wallet para ofrecer "usar saldo" como descuento aquí.
  const user = await getUser();
  const [favorited, saldo] = user
    ? await Promise.all([isFavorite(place.id), getWalletSaldo()])
    : [false, 0];

  const googleMaps = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/explorar"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-2 hover:text-brand"
      >
        <FlechaIzquierdaIcon className="h-4 w-4" /> Volver a explorar
      </Link>

      {/* Encabezado */}
      <header className="mt-4 flex flex-col gap-3 border-b border-border-warm pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-brand/10 text-brand ring-brand/20">
              <Icon name={TIPO_ICON[place.tipo]} className="h-3.5 w-3.5" />{" "}
              {TIPO_LABEL[place.tipo]}
            </Badge>
            <span className="inline-flex items-center gap-1 text-sm text-ink-2">
              <PinIcon className="h-3.5 w-3.5" /> {place.comuna}
            </span>
          </div>
          <FavoriteButton
            placeId={place.id}
            placeName={place.nombre}
            initialFavorite={favorited}
            isAuthenticated={!!user}
            variant="detail"
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {place.nombre}
        </h1>
        <p className="text-ink-2">{place.direccion}</p>
        {place.descripcion && (
          <p className="max-w-2xl leading-7 text-ink-2">{place.descripcion}</p>
        )}
      </header>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {/* Columna principal */}
        <div className="md:col-span-2 space-y-8">
          {/* Atributos */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink">Atributos</h2>
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
            <h2 className="mb-1 text-lg font-semibold text-ink">
              Congestión por horario
            </h2>
            <p className="mb-3 text-sm text-ink-2">
              Qué tan lleno suele estar a lo largo del día.
            </p>
            <CongestionDia congestion={place.congestion} />
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cong-bajo" /> Tranquilo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cong-medio" /> Moderado
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cong-alto" /> Lleno
              </span>
            </div>
          </section>
        </div>

        {/* Columna lateral */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-border-warm bg-surface p-5 shadow-sm">
            <h3 className="font-semibold text-ink">Información</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-ink-2">Horario</dt>
                <dd className="font-medium text-ink">
                  {place.horario ?? "Sin información"}
                </dd>
              </div>
              <div>
                <dt className="text-ink-2">Dirección</dt>
                <dd className="font-medium text-ink">{place.direccion}</dd>
              </div>
            </dl>
            <a
              href={googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              <MapaIcon className="h-4 w-4" /> Cómo llegar (Google Maps)
            </a>
            <p className="mt-2 text-center text-xs text-ink-2">
              {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
            </p>
          </div>

          {/* Usar saldo como descuento al consumir aquí (solo con sesión). */}
          {user && (
            <div className="rounded-2xl border border-border-warm bg-surface p-5 shadow-sm">
              <h3 className="font-semibold text-ink">Usar saldo aquí</h3>
              <p className="mt-1 text-sm text-ink-2">
                Aplica un descuento con tu saldo Studio Spot al consumir en este
                espacio.
              </p>
              <p className="mt-2 text-xs text-ink-2">
                Saldo disponible:{" "}
                <span className="font-semibold text-ink">{formatCLP(saldo)}</span>
              </p>
              <div className="mt-3">
                <WalletUsarSaldo
                  saldo={saldo}
                  glosa={`Descuento en ${place.nombre}`}
                />
              </div>
              <Link
                href="/wallet"
                className="mt-3 inline-block text-xs font-medium text-brand hover:text-brand-dark"
              >
                Ir a mi wallet
              </Link>
            </div>
          )}

          {place.fuente && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="inline-flex items-center gap-1.5 font-semibold">
                <ComunidadIcon className="h-4 w-4" /> Dato aportado por la comunidad
              </p>
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
    <div className="rounded-xl border border-border-warm bg-surface p-3">
      <dt className="text-xs text-ink-2">{titulo}</dt>
      <dd className="mt-0.5 font-medium text-ink">{valor}</dd>
    </div>
  );
}
