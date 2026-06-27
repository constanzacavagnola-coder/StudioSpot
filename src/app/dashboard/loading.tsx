/**
 * Estado de carga del dashboard de empresa y sus subrutas (F5). Skeleton que se
 * muestra mientras el servidor resuelve la sesión, el rol y los espacios.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6" aria-busy aria-live="polite">
      <span className="sr-only">Cargando el dashboard…</span>
      <div className="mb-6 space-y-2">
        <div className="h-9 w-44 animate-pulse rounded-lg bg-border-warm" />
        <div className="h-4 w-72 animate-pulse rounded bg-background-alt" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-background-alt" />
        ))}
      </div>
    </div>
  );
}
