"use client";

import PlaceCard from "@/components/PlaceCard";
import { useFranjaActual } from "@/hooks/useFranjaActual";
import type { Place } from "@/lib/types";

/**
 * Grilla de favoritos. Es Client Component solo para resolver la franja horaria
 * del navegador (igual que /explorar) y reutilizar la misma tarjeta. Todas las
 * tarjetas vienen ya marcadas como favoritas y con sesión activa.
 */
export default function MisLugaresGrid({ places }: { places: Place[] }) {
  const franjaActual = useFranjaActual();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {places.map((place) => (
        <PlaceCard
          key={place.id}
          place={place}
          franjaActual={franjaActual}
          isFavorite
          isAuthenticated
        />
      ))}
    </div>
  );
}
