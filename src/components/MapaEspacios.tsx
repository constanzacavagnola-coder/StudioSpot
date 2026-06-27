"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FlechaDerechaIcon } from "@/components/icons";
import { TIPO_LABEL } from "@/lib/display";
import type { Place, PlaceType } from "@/lib/types";

// Centro aproximado de Santiago (usado como vista inicial del mapa).
const CENTRO_SANTIAGO: [number, number] = [-33.445, -70.63];

// Trazos SVG (mismos paths del set de íconos en src/components/icons) para
// dibujar el ícono del tipo dentro del marcador. Nada de emojis: se inyecta un
// SVG con trazo blanco sobre el pin lavanda de la paleta.
const TIPO_PATHS: Record<PlaceType, string> = {
  cafe: '<path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M17 9h2.5a2.5 2.5 0 0 1 0 5H17"/><path d="M7 2.5c-.6.8-.6 1.7 0 2.5M11 2.5c-.6.8-.6 1.7 0 2.5"/><path d="M3 21h15"/>',
  coworking:
    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M3 12h18M11 12v2"/>',
  biblioteca:
    '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H9a1 1 0 0 1 1 1v14a1 1 0 0 0-1-1H5.5A1.5 1.5 0 0 1 4 16.5V5.5Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H15a1 1 0 0 0-1 1v14a1 1 0 0 1 1-1h3.5a1.5 1.5 0 0 0 1.5-1.5V5.5Z"/><path d="M10 8h4M10 12h4"/>',
};

// Iconos personalizados con `divIcon`: un pin dibujado en HTML/CSS con el ícono
// SVG del tipo de lugar. Así evitamos depender de las imágenes de marcador por
// defecto de Leaflet, que suelen romperse al empaquetar con bundlers.
const iconCache = new Map<PlaceType, L.DivIcon>();

function getIcon(tipo: PlaceType): L.DivIcon {
  const cached = iconCache.get(tipo);
  if (cached) return cached;
  const svg = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TIPO_PATHS[tipo]}</svg>`;
  const icon = L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:#7a6fa6;transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,.25);border:2px solid #fff;">
      <span style="transform:rotate(45deg);display:flex;line-height:0;">${svg}</span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });
  iconCache.set(tipo, icon);
  return icon;
}

export default function MapaEspacios({ places }: { places: Place[] }) {
  return (
    <MapContainer
      center={CENTRO_SANTIAGO}
      zoom={12}
      scrollWheelZoom={false}
      className="h-[420px] w-full rounded-2xl border border-border-warm z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={getIcon(place.tipo)}
        >
          <Popup>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">{place.nombre}</p>
              <p className="text-xs text-ink-2">
                {TIPO_LABEL[place.tipo]} · {place.comuna}
              </p>
              <a
                href={`/espacio/${place.slug}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand underline"
              >
                Ver ficha <FlechaDerechaIcon className="h-3 w-3" />
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
