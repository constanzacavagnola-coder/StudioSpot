import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import MenuAdmin from "@/components/business/MenuAdmin";
import { CartIcon, FlechaIzquierdaIcon } from "@/components/icons";
import { requireRole } from "@/lib/auth/dal";
import { getOwnedPlaceById } from "@/lib/business/data";
import { getMenuItemsDeDueño } from "@/lib/menu/data";

export const metadata: Metadata = {
  title: "Menú del espacio · Studio Spot",
  description:
    "Administra el menú de tu espacio: crea, edita, activa y elimina productos con precio, stock e imagen.",
};

type Props = { params: Promise<{ id: string }> };

/**
 * Administración del menú de un espacio propio (Feature A, 0006). Ruta privada
 * por rol empresa; solo carga si el espacio pertenece al usuario
 * (`getOwnedPlaceById`), si no, 404. Lista TODOS los ítems (activos e inactivos)
 * vía `getMenuItemsDeDueño` (RLS `menu_owner_all` + filtro por propiedad). La
 * administración (crear/editar/activar/eliminar) vive en `MenuAdmin`, cuyas
 * acciones re-verifican rol y propiedad en el servidor.
 */
export default async function MenuEspacioPage({ params }: Props) {
  await requireRole("empresa");
  const { id } = await params;
  const place = await getOwnedPlaceById(id);

  if (!place) notFound();

  const items = await getMenuItemsDeDueño(id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-2 hover:text-brand"
      >
        <FlechaIzquierdaIcon className="h-4 w-4" /> Volver al dashboard
      </Link>

      <header className="mt-4 mb-6 flex items-start gap-3">
        <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <CartIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Menú de {place.nombre}
          </h1>
          <p className="mt-1 text-ink-2">
            Crea y administra los productos que tu espacio ofrece. Los productos
            activos se muestran en la ficha pública para que los clientes los
            compren con su saldo.
          </p>
        </div>
      </header>

      <MenuAdmin placeId={place.id} slug={place.slug} items={items} />
    </div>
  );
}
