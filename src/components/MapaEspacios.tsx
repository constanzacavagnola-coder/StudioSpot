"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { TIPO_EMOJI, TIPO_LABEL } from "@/lib/display";
import type { Place, PlaceType } from "@/lib/types";

// Centro aproximado de Santiago (usado como vista inicial del mapa).
const CENTRO_SANTIAGO: [number, number] = [-33.445, -70.63];

// Iconos personalizados con `divIcon`: un pin dibujado en HTML/CSS con el emoji
// del tipo de lugar. Así evitamos depender de las imágenes de marcador por
// defecto de Leaflet, que suelen romperse al empaquetar con bundlers.
const iconCache = new Map<PlaceType, L.DivIcon>();

function getIcon(tipo: PlaceType): L.DivIcon {
  const cached = iconCache.get(tipo);
  if (cached) return cached;
  const icon = L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:#4f46e5;transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff;">
      <span style="transform:rotate(45deg);font-size:15px;line-height:1;">${TIPO_EMOJI[tipo]}</span>
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
      className="h-[420px] w-full rounded-2xl border border-stone-200 z-0"
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
              <p className="text-sm font-semibold text-stone-900">{place.nombre}</p>
              <p className="text-xs text-stone-500">
                {TIPO_LABEL[place.tipo]} · {place.comuna}
              </p>
              <a
                href={`/espacio/${place.slug}`}
                className="inline-block text-xs font-medium text-indigo-600 underline"
              >
                Ver ficha →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
