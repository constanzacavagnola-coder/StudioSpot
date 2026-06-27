import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckIcon,
  DestelloIcon,
  FlechaDerechaIcon,
  Icon,
  type IconName,
} from "@/components/icons";
import { formatCLP, PREMIUM_PRECIO_CLP } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Premium · Studio Spot",
  description:
    "StudioSpot Premium: espacio reservado en lugares asociados, WiFi dedicado propio y wallet con descuentos al consumir.",
};

const PRIVILEGIOS: { icon: IconName; titulo: string; desc: string }[] = [
  {
    icon: "silla",
    titulo: "Espacio reservado",
    desc: "Llega y siéntate sin dar vueltas: tienes un cupo asegurado en los espacios asociados a la red Studio Spot.",
  },
  {
    icon: "antena",
    titulo: "WiFi dedicado",
    desc: "Conéctate a la red propia de Studio Spot, separada del WiFi del local, para trabajar rápido y estable.",
  },
  {
    icon: "wallet",
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-4 py-1 text-sm font-semibold text-brand-dark">
          <DestelloIcon className="h-4 w-4" /> Propuesta de membresía
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Studio Spot <span className="text-brand">Premium</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-2">
          Lleva tu rutina de estudio y trabajo al siguiente nivel: lugar asegurado,
          internet propio y descuentos en cada visita.
        </p>
        <div className="mt-6 inline-flex items-baseline gap-1 rounded-2xl border border-brand/20 bg-surface px-6 py-4 shadow-sm">
          <span className="text-4xl font-bold text-ink">
            {formatCLP(PREMIUM_PRECIO_CLP)}
          </span>
          <span className="text-ink-2">/mes</span>
        </div>
        <p className="mt-2 text-xs text-ink-3">Precio referencial (CLP).</p>
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
        <h2 className="text-center text-2xl font-bold text-ink">
          Los 3 privilegios Premium
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {PRIVILEGIOS.map((p) => (
            <div
              key={p.titulo}
              className="rounded-2xl border border-border-warm bg-surface p-6 shadow-sm"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon name={p.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-ink">{p.titulo}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-2">{p.desc}</p>
              <span className="mt-3 inline-block rounded-full bg-background-alt px-2.5 py-0.5 text-xs font-medium text-ink-2">
                Propuesta
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Comparativa */}
      <section className="mt-14">
        <h2 className="text-center text-2xl font-bold text-ink">
          Free vs Premium
        </h2>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border-warm bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-warm bg-background-alt text-left">
                <th className="px-4 py-3 font-semibold text-ink-2">
                  Característica
                </th>
                <th className="px-4 py-3 text-center font-semibold text-ink-2">
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
                  className={i % 2 === 1 ? "bg-background-alt/50" : ""}
                >
                  <td className="px-4 py-3 text-ink-2">{caract}</td>
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
            className="cursor-not-allowed rounded-xl bg-ink-3 px-8 py-3 font-semibold text-white"
          >
            Suscribirme (próximamente)
          </button>
          <Link
            href="/explorar"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            Mientras tanto, explora los espacios gratis
            <FlechaDerechaIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Celda({ valor, destacado = false }: { valor: string | boolean; destacado?: boolean }) {
  if (typeof valor === "boolean") {
    return valor ? (
      <CheckIcon
        className={`mx-auto h-4 w-4 ${destacado ? "text-brand" : "text-mint-ink"}`}
        label="Incluido"
      />
    ) : (
      <span className="text-ink-3" aria-label="No incluido">
        —
      </span>
    );
  }
  return <span className="text-ink-2">{valor}</span>;
}
