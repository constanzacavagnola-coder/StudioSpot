import Link from "next/link";
import {
  ComunidadIcon,
  EnchufeIcon,
  RelojIcon,
  RuidoIcon,
  WifiIcon,
} from "@/components/icons";
import { getAllPlaces } from "@/lib/places";

export default async function Home() {
  const places = await getAllPlaces();
  const total = places.length;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand/10 via-background to-background"
          aria-hidden
        />
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center sm:py-28">
          <span className="rounded-full border border-brand/20 bg-surface px-4 py-1 text-sm font-medium text-brand">
            {total} espacios reales en Santiago
          </span>

          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-6xl">
            Encuentra tu lugar para{" "}
            <span className="text-brand">estudiar y trabajar</span>
          </h1>

          <p className="max-w-xl text-lg leading-8 text-ink-2">
            Cafés, coworkings y bibliotecas con buen WiFi, enchufes disponibles y el
            nivel de ruido que necesitas para concentrarte. Sin dar vueltas buscando
            mesa.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/explorar"
              className="rounded-xl bg-brand px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
            >
              Explorar espacios
            </Link>
            <Link
              href="/premium"
              className="rounded-xl border border-border-warm bg-surface px-6 py-3 font-semibold text-ink transition-colors hover:bg-background-alt"
            >
              Conocer Premium
            </Link>
          </div>

          <ul className="flex flex-wrap items-center justify-center gap-3 pt-4 text-sm font-medium text-ink-2">
            <li className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-4 py-2 shadow-sm ring-1 ring-border-warm">
              <EnchufeIcon className="h-4 w-4 text-brand" /> Enchufes
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-4 py-2 shadow-sm ring-1 ring-border-warm">
              <WifiIcon className="h-4 w-4 text-brand" /> WiFi rápido
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-4 py-2 shadow-sm ring-1 ring-border-warm">
              <RuidoIcon className="h-4 w-4 text-brand" /> Nivel de ruido
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-4 py-2 shadow-sm ring-1 ring-border-warm">
              <RelojIcon className="h-4 w-4 text-brand" /> Congestión por horario
            </li>
          </ul>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-ink">
          Cómo funciona
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-ink-2">
          Tres pasos para dejar de perder tiempo buscando dónde sentarte.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              n: "1",
              t: "Explora el mapa y el listado",
              d: "Mira todos los espacios de Santiago en un mapa interactivo o en tarjetas, con sus atributos clave a la vista.",
            },
            {
              n: "2",
              t: "Filtra por lo que necesitas",
              d: "Tipo de lugar, comuna, nivel de enchufes y WiFi, ruido y precio. Encuentra el match perfecto en segundos.",
            },
            {
              n: "3",
              t: "Anticipa la congestión",
              d: "Revisa qué tan lleno suele estar cada lugar por franja horaria y elige el mejor momento para ir.",
            },
          ].map((paso) => (
            <div
              key={paso.n}
              className="rounded-2xl border border-border-warm bg-surface p-6 shadow-sm"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 font-bold text-brand">
                {paso.n}
              </div>
              <h3 className="mt-4 font-semibold text-ink">{paso.t}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-2">{paso.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Diferencial */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid items-center gap-8 rounded-3xl bg-ink p-8 text-white sm:p-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">¿Qué nos hace distintos?</h2>
            <p className="mt-4 text-ink-3">
              No somos otro listado de cafés. Studio Spot combina{" "}
              <span className="font-semibold text-white">datos aportados por la comunidad</span>{" "}
              con información de{" "}
              <span className="font-semibold text-accent">
                congestión por franja horaria
              </span>
              , para que sepas no solo dónde ir, sino también cuándo.
            </p>
          </div>
          <ul className="grid gap-4">
            <li className="rounded-2xl bg-surface/5 p-4 ring-1 ring-white/10">
              <p className="inline-flex items-center gap-2 font-semibold">
                <ComunidadIcon className="h-5 w-5 text-accent" /> Datos de la comunidad
              </p>
              <p className="mt-1 text-sm text-ink-3">
                Atributos reales reportados por quienes ya estudiaron o trabajaron ahí.
              </p>
            </li>
            <li className="rounded-2xl bg-surface/5 p-4 ring-1 ring-white/10">
              <p className="inline-flex items-center gap-2 font-semibold">
                <RelojIcon className="h-5 w-5 text-accent" /> Congestión por horario
              </p>
              <p className="mt-1 text-sm text-ink-3">
                Mañana, mediodía, tarde y noche: anticipa la afluencia antes de salir.
              </p>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
