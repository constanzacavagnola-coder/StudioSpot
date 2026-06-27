"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { logout } from "@/lib/auth/actions";
import { ROL_LABEL } from "@/lib/display";
import type { UserRole } from "@/lib/types";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/explorar", label: "Explorar" },
  { href: "/premium", label: "Premium" },
];

export type NavAccount = {
  nombre: string | null;
  email: string | null;
  rol: UserRole;
};

// Accesos del menú de cuenta según el rol (ver criterios F1 del PLAN).
function accesosPorRol(rol: UserRole) {
  if (rol === "empresa") {
    return [{ href: "/dashboard", label: "Dashboard" }];
  }
  return [
    { href: "/mis-lugares", label: "Mis lugares" },
    { href: "/wallet", label: "Wallet" },
  ];
}

function esActivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function NavbarClient({ account }: { account: NavAccount | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobilePanelId = useId();

  // El menú móvil se cierra al pulsar un enlace (onClick en cada Link del panel),
  // en vez de reaccionar al cambio de pathname con un efecto: así evitamos un
  // setState dentro de useEffect (cascading renders) y el cierre es inmediato.
  const cerrarMovil = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-stone-900">
          <span
            className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm text-white"
            aria-hidden
          >
            SS
          </span>
          <span className="text-lg tracking-tight">Studio Spot</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Enlaces principales: inline desde sm; en móvil van al menú colapsable. */}
          <ul className="hidden items-center gap-1 text-sm font-medium sm:flex sm:gap-2">
            {LINKS.map((link) => {
              const activo = esActivo(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={activo ? "page" : undefined}
                    className={`rounded-lg px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${
                      activo
                        ? "bg-brand/10 text-brand"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="ml-1 flex items-center gap-2 sm:ml-2 sm:border-l sm:border-stone-200 sm:pl-3">
            {account ? (
              <AccountMenu account={account} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                >
                  Entrar
                </Link>
                <Link
                  href="/registro"
                  className="hidden rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 sm:inline-flex"
                >
                  Registrarse
                </Link>
              </>
            )}

            {/* Botón hamburguesa: solo en móvil, abre/cierra los enlaces. */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls={mobilePanelId}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              className="grid h-9 w-9 place-items-center rounded-lg text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 sm:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {mobileOpen ? (
                  <path d="M6 6l12 12M18 6 6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Panel móvil colapsable con los enlaces principales. */}
      {mobileOpen && (
        <div id={mobilePanelId} className="border-t border-stone-200 bg-white sm:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 text-sm font-medium">
            {LINKS.map((link) => {
              const activo = esActivo(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={cerrarMovil}
                    aria-current={activo ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${
                      activo
                        ? "bg-brand/10 text-brand"
                        : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            {!account && (
              <li>
                <Link
                  href="/registro"
                  onClick={cerrarMovil}
                  className="block rounded-lg bg-brand px-3 py-2 text-center font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                >
                  Registrarse
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}

/**
 * Menú de cuenta como patrón "disclosure" (botón con aria-expanded + región de
 * enlaces). No usa role="menu"/"menuitem" a propósito: no implementamos la
 * navegación con flechas que ese patrón ARIA promete, así que un grupo de
 * enlaces con foco natural es más correcto y accesible.
 */
function AccountMenu({ account }: { account: NavAccount }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const display = account.nombre || account.email || "Mi cuenta";
  const accesos = accesosPorRol(account.rol);

  // Cerrar al hacer clic fuera o pulsar Escape (a11y por teclado).
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 sm:px-3"
      >
        <span
          className="grid h-7 w-7 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand"
          aria-hidden
        >
          {display.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:inline">{display}</span>
        <span aria-hidden className="text-stone-400">
          ▾
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-stone-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-stone-900">
              {display}
            </p>
            <p className="mt-0.5 text-xs text-stone-500">
              {ROL_LABEL[account.rol]}
            </p>
          </div>

          {accesos.map((acceso) => (
            <Link
              key={acceso.href}
              href={acceso.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-100 focus:bg-stone-100 focus:outline-none"
            >
              {acceso.label}
            </Link>
          ))}

          <form action={logout} className="border-t border-stone-100">
            <button
              type="submit"
              className="block w-full px-4 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 focus:bg-rose-50 focus:outline-none"
            >
              Salir
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
