import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/dal";
import { getFavoritePlaces } from "@/lib/favorites/data";
import MisLugaresGrid from "./MisLugaresGrid";

export const metadata: Metadata = {
  title: "Mis lugares · Studio Spot",
  description: "Los espacios que guardaste como favoritos en Studio Spot.",
};

/**
 * Página /mis-lugares: lista los favoritos del usuario. Ruta privada — sin
 * sesión, `requireUser()` redirige a /login. Los datos llegan ya filtrados por
 * RLS al usuario autenticado.
 */
export default async function MisLugaresPage() {
  await requireUser();
  const places = await getFavoritePlaces();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
          Mis lugares
        </h1>
        <p className="mt-1 text-stone-600">
          {places.length === 0
            ? "Aún no has guardado ningún espacio."
            : `${places.length} ${places.length === 1 ? "espacio guardado" : "espacios guardados"}.`}
        </p>
      </header>

      {places.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="text-4xl" aria-hidden>
            🤍
          </p>
          <h2 className="mt-3 text-lg font-semibold text-stone-900">
            Guarda tus espacios favoritos
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">
            Pulsa el corazón en cualquier espacio para guardarlo aquí y volver a
            encontrarlo rápido.
          </p>
          <Link
            href="/explorar"
            className="mt-5 inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Explorar espacios
          </Link>
        </div>
      ) : (
        <MisLugaresGrid places={places} />
      )}
    </div>
  );
}
