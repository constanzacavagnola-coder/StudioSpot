import type { Metadata } from "next";
import Link from "next/link";

import PlaceForm from "@/components/business/PlaceForm";
import { FlechaIzquierdaIcon } from "@/components/icons";
import { requireRole } from "@/lib/auth/dal";
import { createPlace } from "@/lib/business/actions";

export const metadata: Metadata = {
  title: "Crear espacio · Studio Spot",
  description: "Publica un espacio nuevo de tu empresa en Studio Spot.",
};

/**
 * Alta de un espacio nuevo (F4). Ruta privada por rol empresa. El formulario
 * envía a la Server Action `createPlace`, que fija `owner_id = auth.uid()` y, en
 * éxito, redirige a /dashboard.
 */
export default async function NuevoEspacioPage() {
  await requireRole("empresa");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-2 hover:text-brand"
      >
<FlechaIzquierdaIcon className="h-4 w-4" /> Volver al dashboard
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Crear espacio
        </h1>
        <p className="mt-1 text-ink-2">
          Publica un espacio nuevo. Quedará a nombre de tu empresa y podrás
          editarlo cuando quieras.
        </p>
      </header>

      <PlaceForm action={createPlace} submitLabel="Crear espacio" />
    </div>
  );
}
