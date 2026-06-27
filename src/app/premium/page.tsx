import type { Metadata } from "next";
import Link from "next/link";
import { formatCLP, PREMIUM_PRECIO_CLP } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Premium · Studio Spot",
  description:
    "StudioSpot Premium: espacio reservado en lugares asociados, WiFi dedicado propio y wallet con descuentos al consumir.",
};

const PRIVILEGIOS = [
  {
    icon: "🪑",
    titulo: "Espacio reservado",
    desc: "Llega y siéntate sin dar vueltas: tienes un cupo asegurado en los espacios asociados a la red Studio Spot.",
  },
  {
    icon: "📡",
    titulo: "WiFi dedicado",
    desc: "Conéctate a la red propia de Studio Spot, separada del WiFi del local, para trabajar rápido y estable.",
  },
  {
    icon: "👛",
    titulo: "Wallet con descuentos",
    desc: "Acumula saldo y obtén descuentos al consumir en los locales de la red. Tu café del día, más barato.",
  },
];

// Cada fila: [característica, Free, Premium]
const COMPARATIVA: [string, string | boolean, string | boolean][] = [
  ["Explorar todos los espacios", true, true],
  ["Filtros por WiFi, enchufes, ruido y precio", true, true],
  ["Congestión por franja horaria", true, true],
  ["Espacio reservado en locales asociados", false, true],
  ["WiFi dedicado de Studio Spot", false, true],
  ["Wallet con descuentos al consumir", false, true],
  ["Soporte prioritario", false, true],
];

export default function PremiumPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <section className="text-center">
        <span className="inline-block rounded-full bg-accent/15 px-4 py-1 text-sm font-semibold text-amber-700">
          ✨ Propuesta de membresía
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          Studio Spot <span className="text-brand">Premium</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600">
          Lleva tu rutina de estudio y trabajo al siguiente nivel: lugar asegurado,
          internet propio y descuentos en cada visita.
        </p>
        <div className="mt-6 inline-flex items-baseline gap-1 rounded-2xl border border-brand/20 bg-white px-6 py-4 shadow-sm">
          <span className="text-4xl font-bold text-stone-900">
            {formatCLP(PREMIUM_PRECIO_CLP)}
          </span>
          <span className="text-stone-500">/mes</span>
        </div>
        <p className="mt-2 text-xs text-stone-400">Precio referencial (CLP).</p>
      </section>

      {/* Aviso propuesta */}
      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
        <p className="font-semibold">Esta es una propuesta de concepto.</p>
        <p className="mt-1 text-amber-800">
          La red de socios, el WiFi dedicado y la wallet de descuentos aún{" "}
          <span className="font-semibold">no están implementados</span>; se muestran
          para ilustrar la visión del producto.
        </p>
      </div>

      {/* Privilegios */}
      <section className="mt-12">
        <h2 className="text-center text-2xl font-bold text-stone-900">
          Los 3 privilegios Premium
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {PRIVILEGIOS.map((p) => (
            <div
              key={p.titulo}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-2xl">
                {p.icon}
              </div>
              <h3 className="mt-4 font-semibold text-stone-900">{p.titulo}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{p.desc}</p>
              <span className="mt-3 inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-500">
                Propuesta
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Comparativa */}
      <section className="mt-14">
        <h2 className="text-center text-2xl font-bold text-stone-900">
          Free vs Premium
        </h2>
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left">
                <th className="px-4 py-3 font-semibold text-stone-700">
                  Característica
                </th>
                <th className="px-4 py-3 text-center font-semibold text-stone-700">
                  Free
                </th>
                <th className="px-4 py-3 text-center font-semibold text-brand">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARATIVA.map(([caract, free, premium], i) => (
                <tr
                  key={caract as string}
                  className={i % 2 === 1 ? "bg-stone-50/50" : ""}
                >
                  <td className="px-4 py-3 text-stone-700">{caract}</td>
                  <td className="px-4 py-3 text-center">
                    <Celda valor={free} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Celda valor={premium} destacado />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-xl bg-stone-300 px-8 py-3 font-semibold text-white"
          >
            Suscribirme (próximamente)
          </button>
          <Link href="/explorar" className="text-sm font-medium text-brand hover:underline">
            Mientras tanto, explora los espacios gratis →
          </Link>
        </div>
      </section>
    </div>
  );
}

function Celda({ valor, destacado = false }: { valor: string | boolean; destacado?: boolean }) {
  if (typeof valor === "boolean") {
    return valor ? (
      <span className={destacado ? "text-brand" : "text-emerald-600"}>✓</span>
    ) : (
      <span className="text-stone-300">—</span>
    );
  }
  return <span className="text-stone-700">{valor}</span>;
}
