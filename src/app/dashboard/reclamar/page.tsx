import type { Metadata } from "next";
import Link from "next/link";

import ClaimList from "@/components/business/ClaimList";
import { requireRole } from "@/lib/auth/dal";
import { getClaimablePlaces } from "@/lib/business/data";

export const metadata: Metadata = {
  title: "Reclamar espacio · Studio Spot",
  description:
    "Reclama un espacio existente del catálogo de Studio Spot para gestionarlo como empresa.",
};

/**
 * Reclamar un espacio existente (F4). Ruta privada por rol empresa. Lista los
 * espacios sin dueño y delega el buscado/reclamo al Client Component, que llama
 * a la Server Action `claim_place`.
 */
export default async function ReclamarPage() {
  await requireRole("empresa");
  const places = await getClaimablePlaces();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-brand"
      >
        ← Volver al dashboard
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
          Reclamar espacio
        </h1>
        <p className="mt-1 text-stone-600">
          Busca un espacio que ya esté en Studio Spot y reclámalo para
          gestionarlo. Solo aparecen los espacios sin dueño.
        </p>
      </header>

      <ClaimList places={places} />
    </div>
  );
}
