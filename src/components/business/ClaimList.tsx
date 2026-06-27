"use client";

import { useMemo, useState, useTransition } from "react";

import { claimPlace } from "@/lib/business/actions";
import { TIPO_EMOJI, TIPO_LABEL } from "@/lib/display";
import type { Place } from "@/lib/types";

/**
 * Buscador + reclamo de espacios sin dueño (F4). Client Component: filtra la
 * lista en el navegador por nombre/comuna y, al reclamar, llama a la Server
 * Action `claim_place`. En éxito quita el espacio de la lista local y muestra un
 * aviso; la Action ya revalida /dashboard.
 */
export default function ClaimList({ places }: { places: Place[] }) {
  const [disponibles, setDisponibles] = useState(places);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return disponibles;
    return disponibles.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.comuna.toLowerCase().includes(q),
    );
  }, [disponibles, query]);

  function onReclamar(place: Place) {
    setError(null);
    setExito(null);
    setPendingId(place.id);
    startTransition(async () => {
      const res = await claimPlace(place.id);
      if (res.ok) {
        setDisponibles((prev) => prev.filter((p) => p.id !== place.id));
        setExito(`Reclamaste "${place.nombre}". Ya puedes gestionarlo desde tu dashboard.`);
      } else {
        setError(res.error);
      }
      setPendingId(null);
    });
  }

  if (disponibles.length === 0) {
    return (
      <div>
        {exito ? <ExitoAviso mensaje={exito} /> : null}
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="text-4xl" aria-hidden>
            ✅
          </p>
          <h2 className="mt-3 text-lg font-semibold text-stone-900">
            No quedan espacios por reclamar
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">
            Todos los espacios del catálogo ya tienen dueño. Puedes crear uno
            nuevo desde tu dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="buscar-espacio" className="sr-only">
          Buscar espacio por nombre o comuna
        </label>
        <input
          id="buscar-espacio"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o comuna…"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
      </div>

      {/* Sin aria-live en el contenedor: cada hijo es su propia región viva
          (role alert / status) para no anidar live regions y evitar el doble
          anuncio en algunos lectores. */}
      <div>
        {error ? (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        ) : exito ? (
          <ExitoAviso mensaje={exito} />
        ) : null}
      </div>

      <p className="text-sm text-stone-500">
        {filtrados.length === 0
          ? "Ningún espacio coincide con tu búsqueda."
          : `${filtrados.length} ${filtrados.length === 1 ? "espacio disponible" : "espacios disponibles"}.`}
      </p>

      <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {filtrados.map((place) => {
          const cargando = isPending && pendingId === place.id;
          return (
            <li
              key={place.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">
                  <span aria-hidden>{TIPO_EMOJI[place.tipo]}</span> {place.nombre}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {TIPO_LABEL[place.tipo]} · 📍 {place.comuna}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onReclamar(place)}
                disabled={cargando}
                aria-busy={cargando}
                className="shrink-0 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cargando ? "Reclamando…" : "Reclamar"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ExitoAviso({ mensaje }: { mensaje: string }) {
  return (
    <div
      role="status"
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
    >
      {mensaje}
    </div>
  );
}
