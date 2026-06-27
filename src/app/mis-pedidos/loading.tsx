/**
 * Estado de carga de /mis-pedidos (Feature C). Skeleton mientras el servidor
 * resuelve los pedidos del usuario.
 */
export default function Loading() {
  return (
    <div
      className="mx-auto max-w-3xl px-4 py-8 sm:px-6"
      aria-busy
      aria-live="polite"
    >
      <span className="sr-only">Cargando tus pedidos…</span>
      <div className="mb-6 space-y-2">
        <div className="h-8 w-44 animate-pulse rounded-lg bg-border-warm" />
        <div className="h-4 w-72 animate-pulse rounded bg-background-alt" />
      </div>
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-2xl bg-background-alt" />
        <div className="h-36 animate-pulse rounded-2xl bg-background-alt" />
      </div>
    </div>
  );
}
