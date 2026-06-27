"use client";

import Image from "next/image";
import { useState, useTransition } from "react";

import Badge from "@/components/Badge";
import {
  BasureroIcon,
  CartIcon,
  ImagenIcon,
  LapizIcon,
  MasIcon,
} from "@/components/icons";
import MenuItemForm from "@/components/business/MenuItemForm";
import { formatCLP } from "@/lib/constants";
import { eliminarItem, toggleActivo } from "@/lib/menu/actions";
import type { MenuItem } from "@/lib/types";

/**
 * Administración del menú de un espacio (Feature A). Client Component que orquesta
 * la lista (activos e inactivos) y el formulario de alta/edición. La lista se
 * renderiza SIEMPRE desde la prop `items` (fuente de verdad del servidor): cada
 * Server Action revalida la ruta, el server re-renderiza y este componente
 * recibe los ítems actualizados. El estado local es solo UI efímera (qué panel
 * está abierto, qué fila está en curso).
 *
 * Activar/desactivar y eliminar pasan por las Server Actions `toggleActivo` /
 * `eliminarItem`, que re-verifican rol y propiedad del espacio en el servidor.
 */

type Modo = null | "crear" | { editar: MenuItem };

export default function MenuAdmin({
  placeId,
  slug,
  items,
}: {
  placeId: string;
  slug: string;
  items: MenuItem[];
}) {
  const [modo, setModo] = useState<Modo>(null);

  const activos = items.filter((i) => i.activo).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2">
          {items.length === 0 ? (
            "Aún no tienes productos."
          ) : (
            <>
              <span className="font-semibold text-ink">{items.length}</span>{" "}
              {items.length === 1 ? "producto" : "productos"} ·{" "}
              <span className="font-semibold text-ink">{activos}</span> activo
              {activos === 1 ? "" : "s"}
            </>
          )}
        </p>
        {modo !== "crear" ? (
          <button
            type="button"
            onClick={() => setModo("crear")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <MasIcon className="h-4 w-4" /> Agregar producto
          </button>
        ) : null}
      </div>

      {modo === "crear" ? (
        <MenuItemForm
          placeId={placeId}
          onDone={() => setModo(null)}
        />
      ) : null}

      {items.length === 0 && modo !== "crear" ? (
        <div className="rounded-2xl border border-dashed border-border-warm bg-surface p-10 text-center">
          <CartIcon className="mx-auto h-12 w-12 text-ink-3" />
          <h3 className="mt-3 text-lg font-semibold text-ink">
            Tu menú está vacío
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-2">
            Agrega tu primer producto con nombre, precio, stock e imagen. Los
            productos activos aparecerán en la ficha del espacio para que los
            clientes los compren.
          </p>
          <button
            type="button"
            onClick={() => setModo("crear")}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <MasIcon className="h-4 w-4" /> Agregar producto
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const enEdicion =
              typeof modo === "object" && modo?.editar.id === item.id;
            return (
              <li key={item.id}>
                {enEdicion ? (
                  <MenuItemForm
                    placeId={placeId}
                    item={item}
                    onDone={() => setModo(null)}
                  />
                ) : (
                  <MenuRow
                    item={item}
                    slug={slug}
                    onEditar={() => setModo({ editar: item })}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MenuRow({
  item,
  slug,
  onEditar,
}: {
  item: MenuItem;
  slug: string;
  onEditar: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onToggle() {
    setError(null);
    startTransition(async () => {
      const res = await toggleActivo(item.id, !item.activo);
      if (!res.ok) setError(res.error);
    });
  }

  function onEliminar() {
    setError(null);
    const ok = window.confirm(
      `¿Eliminar "${item.nombre}" del menú? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await eliminarItem(item.id);
      if (!res.ok) setError(res.error);
    });
  }

  const agotado = item.stock === 0;

  return (
    <div
      className={`rounded-2xl border bg-surface p-4 shadow-sm transition-opacity ${
        item.activo ? "border-border-warm" : "border-border-soft opacity-75"
      } ${pending ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border-warm bg-background-alt">
          {item.imagen_url ? (
            <Image
              src={item.imagen_url}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-ink-3">
              <ImagenIcon className="h-6 w-6" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{item.nombre}</h3>
            {item.activo ? (
              <Badge className="bg-mint-ink/15 text-mint-ink ring-mint-ink/25">
                Activo
              </Badge>
            ) : (
              <Badge className="bg-ink-2/10 text-ink-2 ring-ink-2/20">
                Inactivo
              </Badge>
            )}
            {agotado ? (
              <Badge className="bg-rose-500/15 text-rose-600 ring-rose-500/25">
                Sin stock
              </Badge>
            ) : null}
          </div>

          {item.descripcion ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-ink-2">
              {item.descripcion}
            </p>
          ) : null}

          <p className="mt-1 text-sm text-ink-2">
            <span className="font-semibold text-ink">
              {formatCLP(item.precio_clp)}
            </span>{" "}
            · Stock: <span className="font-medium text-ink">{item.stock}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-soft pt-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          className="inline-flex items-center rounded-lg border border-border-warm px-3 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:border-brand/40 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {item.activo ? "Desactivar" : "Activar"}
        </button>
        <button
          type="button"
          onClick={onEditar}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-warm px-3 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:border-brand/40 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LapizIcon className="h-4 w-4" /> Editar
        </button>
        <button
          type="button"
          onClick={onEliminar}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <BasureroIcon className="h-4 w-4" /> Eliminar
        </button>

        <a
          href={`/espacio/${slug}`}
          className="ml-auto text-xs font-medium text-ink-2 hover:text-brand"
        >
          Ver en la ficha
        </a>
      </div>

      <div aria-live="polite" className="mt-1 min-h-[1rem]">
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>
    </div>
  );
}
