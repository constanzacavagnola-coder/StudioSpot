"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/explorar", label: "Explorar" },
  { href: "/premium", label: "Premium" },
];

export default function Navbar() {
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
                  className={`rounded-lg px-3 py-2 transition-colors ${
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
      </nav>
    </header>
  );
}
