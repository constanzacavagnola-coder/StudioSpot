"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import PlaceCard from "@/components/PlaceCard";
import { useFranjaActual } from "@/hooks/useFranjaActual";
import {
  NIVEL3_LABEL,
  PRECIO_LABEL,
  RUIDO_LABEL,
  TIPO_LABEL,
} from "@/lib/display";
import { filterPlaces, type PlaceFilters } from "@/lib/places";
import type {
  Nivel3,
  NivelPrecio,
  NivelRuido,
  Place,
  PlaceType,
} from "@/lib/types";

// El mapa usa Leaflet (APIs de navegador), por eso se carga SOLO en el cliente.
// Según los docs de Next.js, `ssr: false` con next/dynamic solo se permite dentro
// de un Client Component, como este.
const MapaEspacios = dynamic(() => import("@/components/MapaEspacios"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[420px] w-full place-items-center rounded-2xl border border-border-warm bg-background-alt text-ink-3">
      Cargando mapa…
    </div>
  ),
});

const FILTROS_INICIALES: Required<PlaceFilters> = {
  tipo: "todos",
  comuna: "todas",
  enchufesMin: "cualquiera",
  wifiMin: "cualquiera",
  ruido: "cualquiera",
  precio: "cualquiera",
};

const NIVELES3: Nivel3[] = ["bajo", "medio", "alto"];
const RUIDOS: NivelRuido[] = ["silencioso", "moderado", "animado"];
const PRECIOS: NivelPrecio[] = ["gratis", "$", "$$", "$$$"];

export default function ExplorarClient({
  places,
  comunas,
  tipos,
  favoriteIds = [],
  isAuthenticated = false,
}: {
  places: Place[];
  comunas: string[];
  tipos: PlaceType[];
  /** IDs de los espacios ya guardados por el usuario (resueltos en el servidor). */
  favoriteIds?: string[];
  isAuthenticated?: boolean;
}) {
  const [filtros, setFiltros] = useState<Required<PlaceFilters>>(FILTROS_INICIALES);

  const franjaActual = useFranjaActual();

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const filtradas = useMemo(
    () => filterPlaces(places, filtros),
    [places, filtros],
  );

  const hayFiltrosActivos = useMemo(
    () =>
      (Object.keys(filtros) as (keyof PlaceFilters)[]).some(
        (k) => filtros[k] !== FILTROS_INICIALES[k],
      ),
    [filtros],
  );

  function set<K extends keyof PlaceFilters>(key: K, value: Required<PlaceFilters>[K]) {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filtros */}
      <div className="rounded-2xl border border-border-warm bg-surface p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Selector
            label="Tipo"
            value={filtros.tipo}
            onChange={(v) => set("tipo", v as Required<PlaceFilters>["tipo"])}
            opcionTodos={{ value: "todos", label: "Todos los tipos" }}
            opciones={tipos.map((t) => ({ value: t, label: TIPO_LABEL[t] }))}
          />
          <Selector
            label="Comuna"
            value={filtros.comuna}
            onChange={(v) => set("comuna", v)}
            opcionTodos={{ value: "todas", label: "Todas las comunas" }}
            opciones={comunas.map((c) => ({ value: c, label: c }))}
          />
          <Selector
            label="Precio"
            value={filtros.precio}
            onChange={(v) => set("precio", v as Required<PlaceFilters>["precio"])}
            opcionTodos={{ value: "cualquiera", label: "Cualquier precio" }}
            opciones={PRECIOS.map((p) => ({ value: p, label: PRECIO_LABEL[p] }))}
          />
          <Selector
            label="Enchufes (al menos)"
            value={filtros.enchufesMin}
            onChange={(v) => set("enchufesMin", v as Required<PlaceFilters>["enchufesMin"])}
            opcionTodos={{ value: "cualquiera", label: "Cualquier nivel" }}
            opciones={NIVELES3.map((n) => ({ value: n, label: NIVEL3_LABEL[n] }))}
          />
          <Selector
            label="WiFi (al menos)"
            value={filtros.wifiMin}
            onChange={(v) => set("wifiMin", v as Required<PlaceFilters>["wifiMin"])}
            opcionTodos={{ value: "cualquiera", label: "Cualquier nivel" }}
            opciones={NIVELES3.map((n) => ({ value: n, label: NIVEL3_LABEL[n] }))}
          />
          <Selector
            label="Ruido"
            value={filtros.ruido}
            onChange={(v) => set("ruido", v as Required<PlaceFilters>["ruido"])}
            opcionTodos={{ value: "cualquiera", label: "Cualquier ambiente" }}
            opciones={RUIDOS.map((r) => ({ value: r, label: RUIDO_LABEL[r] }))}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-ink-2">
            <span className="font-semibold text-ink">{filtradas.length}</span>{" "}
            {filtradas.length === 1 ? "espacio" : "espacios"}
          </p>
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={() => setFiltros(FILTROS_INICIALES)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/10"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Mapa */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">Mapa</h2>
        <MapaEspacios places={filtradas} />
        <p className="mt-2 text-xs text-ink-3">
          Mapa con OpenStreetMap. Haz clic en un marcador para ver la ficha del lugar.
        </p>
      </section>

      {/* Listado */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">Listado</h2>
        {filtradas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-warm bg-surface p-10 text-center text-ink-2">
            No hay espacios que coincidan con tus filtros. Prueba a relajar alguno.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtradas.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                franjaActual={franjaActual}
                isFavorite={favoriteSet.has(place.id)}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Selector({
  label,
  value,
  onChange,
  opcionTodos,
  opciones,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  opcionTodos: { value: string; label: string };
  opciones: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-ink-2">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border-warm bg-surface px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
      >
        <option value={opcionTodos.value}>{opcionTodos.label}</option>
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
