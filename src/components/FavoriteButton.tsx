"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";

import { toggleFavorite } from "@/lib/favorites/actions";

/**
 * Botón "guardar" (corazón) reutilizable por la tarjeta de /explorar y la ficha
 * /espacio/[slug]. Es un Client Component porque maneja interacción y UI
 * optimista.
 *
 * - Sin sesión: en vez de un botón, renderiza un enlace a /login (con `next`
 *   para volver), invitando a entrar (criterio F2).
 * - Con sesión: alterna el favorito con la Server Action `toggleFavorite`,
 *   actualizando el estado de inmediato (optimista) y revirtiendo si falla.
 *
 * `variant`:
 *  - "card":   botón circular superpuesto en la esquina de la tarjeta.
 *  - "detail": pill con icono + texto para la ficha del espacio.
 */
type Variant = "card" | "detail";

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19.5 12.572 12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.566Z" />
    </svg>
  );
}

export default function FavoriteButton({
  placeId,
  placeName,
  initialFavorite,
  isAuthenticated,
  variant = "card",
  className = "",
}: {
  placeId: string;
  placeName: string;
  initialFavorite: boolean;
  isAuthenticated: boolean;
  variant?: Variant;
  className?: string;
}) {
  const pathname = usePathname();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // --- Sin sesión: invitar a entrar ---
  if (!isAuthenticated) {
    const href = `/login?next=${encodeURIComponent(pathname)}`;
    if (variant === "detail") {
      return (
        <Link
          href={href}
          title="Inicia sesión para guardar este lugar"
          className={`inline-flex items-center gap-2 rounded-xl border border-border-warm px-4 py-2 text-sm font-semibold text-ink-2 transition-colors hover:border-brand/40 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${className}`}
        >
          <HeartIcon filled={false} className="h-4 w-4" />
          Guardar
        </Link>
      );
    }
    return (
      <Link
        href={href}
        aria-label={`Inicia sesión para guardar ${placeName}`}
        title="Inicia sesión para guardar"
        className={`grid h-9 w-9 place-items-center rounded-full bg-surface/90 text-ink-3 shadow-sm ring-1 ring-border-warm backdrop-blur transition-colors hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${className}`}
      >
        <HeartIcon filled={false} className="h-5 w-5" />
      </Link>
    );
  }

  // --- Con sesión: alternar favorito (optimista) ---
  function onToggle() {
    const target = !favorite;
    setFavorite(target);
    setError(null);
    startTransition(async () => {
      const res = await toggleFavorite(placeId, target);
      if (!res.ok) {
        setFavorite(!target); // revertir
        setError(res.error);
      }
    });
  }

  const label = favorite
    ? `Quitar ${placeName} de mis lugares`
    : `Guardar ${placeName} en mis lugares`;

  if (variant === "detail") {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          aria-pressed={favorite}
          aria-label={label}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60 ${
            favorite
              ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
              : "border-border-warm text-ink-2 hover:border-brand/40 hover:text-brand"
          }`}
        >
          <HeartIcon filled={favorite} className="h-4 w-4" />
          {favorite ? "Guardado" : "Guardar"}
        </button>
        {error ? (
          <p role="alert" className="mt-1 text-xs text-rose-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-pressed={favorite}
        aria-label={label}
        title={error ?? (favorite ? "Quitar de mis lugares" : "Guardar en mis lugares")}
        className={`grid h-9 w-9 place-items-center rounded-full bg-surface/90 shadow-sm ring-1 backdrop-blur transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60 ${
          error ? "ring-rose-300" : "ring-border-warm"
        } ${
          favorite ? "text-rose-500 hover:text-rose-600" : "text-ink-3 hover:text-rose-500"
        } ${className}`}
      >
        <HeartIcon filled={favorite} className="h-5 w-5" />
      </button>
      {/* Feedback de error accesible: la variante "card" no tiene espacio para un
          texto inline, así que se anuncia por lector de pantalla (y vía title). */}
      <span role="status" aria-live="polite" className="sr-only">
        {error ?? ""}
      </span>
    </>
  );
}
