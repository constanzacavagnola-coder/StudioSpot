import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth/dal";
import RegistroForm from "../registro/RegistroForm";

export const metadata: Metadata = {
  title: "Registro de empresa · Studio Spot",
  description:
    "Crea tu cuenta de empresa en Studio Spot para reclamar y publicar tus espacios.",
};

const VENTAJAS = [
  "Reclama un espacio existente o publica uno nuevo.",
  "Edita atributos: wifi, enchufes, ruido, precio y horario.",
  "Actualiza la congestión por franja para tus clientes.",
];

/**
 * Página /registro-empresa. Atajo directo al flujo de empresa: reutiliza el
 * mismo formulario de registro con el rol "empresa" preseleccionado y añade
 * contexto sobre lo que habilita la cuenta de empresa.
 */
export default async function RegistroEmpresaPage() {
  const user = await getUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
          🏢 Cuenta de empresa
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-900">
          Registra tu empresa
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Gestiona la presencia de tus espacios en Studio Spot.
        </p>

        <ul className="mt-4 space-y-1.5 text-sm text-stone-600">
          {VENTAJAS.map((v) => (
            <li key={v} className="flex gap-2">
              <span aria-hidden className="text-brand">
                ✓
              </span>
              <span>{v}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <RegistroForm rolInicial="empresa" />
        </div>

        <p className="mt-6 text-center text-sm text-stone-600">
          ¿Buscas una cuenta personal?{" "}
          <Link href="/registro" className="font-semibold text-brand hover:underline">
            Regístrate como usuario
          </Link>
        </p>
      </div>
    </div>
  );
}
