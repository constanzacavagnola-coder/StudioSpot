import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PlaceForm from "@/components/business/PlaceForm";
import { FlechaIzquierdaIcon } from "@/components/icons";
import { requireRole } from "@/lib/auth/dal";
import { updatePlace } from "@/lib/business/actions";
import { getOwnedPlaceById } from "@/lib/business/data";

export const metadata: Metadata = {
  title: "Editar espacio · Studio Spot",
  description: "Edita los atributos y la congestión por franja de tu espacio.",
};

type Props = { params: Promise<{ id: string }> };

/**
 * Edición de un espacio propio (F4). Ruta privada por rol empresa. Solo carga el
 * espacio si pertenece al usuario (`getOwnedPlaceById`); si no, 404. El
 * formulario envía a `updatePlace`, que vuelve a verificar la propiedad.
 */
export default async function EditarEspacioPage({ params }: Props) {
  await requireRole("empresa");
  const { id } = await params;
  const place = await getOwnedPlaceById(id);

  if (!place) notFound();

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
          Editar espacio
        </h1>
        <p className="mt-1 text-ink-2">
          Actualiza los atributos y la congestión por franja de{" "}
          <span className="font-semibold text-ink">{place.nombre}</span>.
        </p>
      </header>

      <PlaceForm action={updatePlace} place={place} submitLabel="Guardar cambios" />
    </div>
  );
}
