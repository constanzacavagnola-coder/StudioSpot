import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border-warm bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-ink-2 sm:flex-row sm:px-6">
        <p>
          <span className="font-semibold text-ink-2">Studio Spot</span> · Encuentra
          tu lugar para estudiar y trabajar en Santiago.
        </p>
        <nav className="flex gap-4">
          <Link href="/explorar" className="hover:text-ink">
            Explorar
          </Link>
          <Link href="/premium" className="hover:text-ink">
            Premium
          </Link>
        </nav>
      </div>
      <p className="pb-6 text-center text-xs text-ink-3">
        Datos aportados por la comunidad. MVP con fines demostrativos.
      </p>
    </footer>
  );
}
