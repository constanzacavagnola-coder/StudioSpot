import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth/dal";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Entrar · Studio Spot",
  description: "Inicia sesión en tu cuenta de Studio Spot.",
};

const MENSAJES_ERROR: Record<string, string> = {
  confirmacion:
    "No pudimos confirmar tu correo. El enlace pudo expirar; intenta iniciar sesión o regístrate de nuevo.",
};

/**
 * Página /login. Si ya hay sesión, redirige (no tiene sentido reloguear). Lee
 * `next` (a dónde volver tras entrar) y `error` (p. ej. tras un callback fallido)
 * de los search params, que en Next 16 llegan como Promise.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const user = await getUser();
  if (user) redirect(safeNext);

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Entra a tu cuenta
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Bienvenido de vuelta a Studio Spot.
        </p>

        <div className="mt-6">
          <LoginForm
            next={safeNext}
            initialError={error ? MENSAJES_ERROR[error] : undefined}
          />
        </div>

        <p className="mt-6 text-center text-sm text-stone-600">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-brand hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
