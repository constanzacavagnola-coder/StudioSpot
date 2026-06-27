"use client"; // Los error boundaries deben ser Client Components.

import { useEffect } from "react";

/**
 * Error boundary global (F5). Envuelve las rutas dentro del layout raíz, así que
 * mantiene Navbar/Footer y muestra una pantalla de error en español con opción
 * de reintentar. `unstable_retry` (Next 16.2) re-ejecuta el segmento que falló.
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // En producción solo llega un mensaje genérico + digest (no datos sensibles).
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <p className="text-5xl" aria-hidden>
        ⚠️
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-stone-900">
        Algo salió mal
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        Ocurrió un error inesperado al cargar esta página. Puedes intentarlo de
        nuevo; si el problema persiste, vuelve más tarde.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-6 inline-flex items-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        Reintentar
      </button>
    </div>
  );
}
