import Link from "next/link";
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
          <span className="rounded-full border border-brand/20 bg-white px-4 py-1 text-sm font-medium text-brand">
            Beta · {total} espacios en Santiago
          </span>

          <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-6xl">
            Encuentra tu lugar para{" "}
            <span className="text-brand">estudiar y trabajar</span>
          </h1>

          <p className="max-w-xl text-lg leading-8 text-stone-600">
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
              className="rounded-xl border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-800 transition-colors hover:bg-stone-50"
            >
              Conocer Premium
            </Link>
          </div>

          <ul className="flex flex-wrap items-center justify-center gap-3 pt-4 text-sm font-medium text-stone-700">
            <li className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-stone-200">
              🔌 Enchufes
            </li>
            <li className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-stone-200">
              📶 WiFi rápido
            </li>
            <li className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-stone-200">
              🔊 Nivel de ruido
            </li>
            <li className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-stone-200">
              🕒 Congestión por horario
            </li>
          </ul>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-stone-900">
          Cómo funciona
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-stone-600">
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
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 font-bold text-brand">
                {paso.n}
              </div>
              <h3 className="mt-4 font-semibold text-stone-900">{paso.t}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{paso.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Diferencial */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid items-center gap-8 rounded-3xl bg-stone-900 p-8 text-white sm:p-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">¿Qué nos hace distintos?</h2>
            <p className="mt-4 text-stone-300">
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
            <li className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="font-semibold">👥 Datos de la comunidad</p>
              <p className="mt-1 text-sm text-stone-300">
                Atributos reales reportados por quienes ya estudiaron o trabajaron ahí.
              </p>
            </li>
            <li className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="font-semibold">🕒 Congestión por horario</p>
              <p className="mt-1 text-sm text-stone-300">
                Mañana, mediodía, tarde y noche: anticipa la afluencia antes de salir.
              </p>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
