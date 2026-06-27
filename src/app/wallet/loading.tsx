/**
 * Estado de carga de /wallet (F5). Skeleton que se muestra mientras el segmento
 * resuelve el saldo y los movimientos en el servidor.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6" aria-busy aria-live="polite">
      <span className="sr-only">Cargando tu wallet…</span>
      <div className="mb-6 space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-border-warm" />
        <div className="h-4 w-64 animate-pulse rounded bg-background-alt" />
      </div>
      <div className="mb-6 h-20 animate-pulse rounded-2xl bg-background-alt" />
      <div className="h-28 animate-pulse rounded-2xl bg-background-alt" />
      <div className="mt-6 space-y-3">
        <div className="h-14 animate-pulse rounded-2xl bg-background-alt" />
        <div className="h-14 animate-pulse rounded-2xl bg-background-alt" />
        <div className="h-14 animate-pulse rounded-2xl bg-background-alt" />
      </div>
    </div>
  );
}
