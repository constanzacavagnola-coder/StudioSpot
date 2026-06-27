import type { Metadata } from "next";
import { getAllPlaces, getComunas, getTipos } from "@/lib/places";
import ExplorarClient from "./ExplorarClient";

export const metadata: Metadata = {
  title: "Explorar espacios · Studio Spot",
  description:
    "Explora cafés, coworkings y bibliotecas de Santiago. Filtra por WiFi, enchufes, ruido, precio y comuna, y revisa la congestión por horario.",
};

export default function ExplorarPage() {
  // Datos cargados en el servidor desde el dataset y entregados al cliente,
  // donde se aplican los filtros y se renderiza el mapa.
  const places = getAllPlaces();
  const comunas = getComunas();
  const tipos = getTipos();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
          Explorar espacios
        </h1>
        <p className="mt-1 text-stone-600">
          {places.length} espacios en Santiago. Filtra y encuentra tu lugar ideal.
        </p>
      </header>

      <ExplorarClient places={places} comunas={comunas} tipos={tipos} />
    </div>
  );
}
