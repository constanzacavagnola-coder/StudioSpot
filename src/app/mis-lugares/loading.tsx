/**
 * Estado de carga de /mis-lugares (F5). Skeleton de la grilla de favoritos
 * mientras el servidor resuelve los datos.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-busy aria-live="polite">
      <span className="sr-only">Cargando tus lugares guardados…</span>
      <div className="mb-6 space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-border-warm" />
        <div className="h-4 w-56 animate-pulse rounded bg-background-alt" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-background-alt" />
        ))}
      </div>
    </div>
  );
}
