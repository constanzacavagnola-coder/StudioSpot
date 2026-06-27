import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth/dal";
import RegistroForm from "./RegistroForm";

export const metadata: Metadata = {
  title: "Crear cuenta · Studio Spot",
  description:
    "Regístrate en Studio Spot como usuario o empresa con tu correo y contraseña.",
};

/**
 * Página /registro. Si ya hay sesión, redirige al inicio. El registro elige rol
 * (usuario / empresa) dentro del propio formulario.
 */
export default async function RegistroPage() {
  const user = await getUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-border-warm bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Crea tu cuenta
        </h1>
        <p className="mt-1 text-sm text-ink-2">
          Encuentra y gestiona tus espacios para estudiar y trabajar.
        </p>

        <div className="mt-6">
          <RegistroForm />
        </div>

        <p className="mt-6 text-center text-sm text-ink-2">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
