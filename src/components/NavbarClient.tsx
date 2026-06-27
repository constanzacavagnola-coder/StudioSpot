"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

export default function NavbarClient({ account }: { account: NavAccount | null }) {
  const pathname = usePathname();

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
          <ul className="flex items-center gap-1 text-sm font-medium sm:gap-2">
            {LINKS.map((link) => {
              const activo =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
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

          <div className="ml-1 flex items-center gap-2 border-l border-stone-200 pl-2 sm:ml-2 sm:pl-3">
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
                  className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

function AccountMenu({ account }: { account: NavAccount }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
      >
        <span
          className="grid h-7 w-7 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand"
          aria-hidden
        >
          {display.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-[10rem] truncate">{display}</span>
        <span aria-hidden className="text-stone-400">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menú de cuenta"
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
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-100 focus:bg-stone-100 focus:outline-none"
            >
              {acceso.label}
            </Link>
          ))}

          <form action={logout} className="border-t border-stone-100">
            <button
              type="submit"
              role="menuitem"
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
