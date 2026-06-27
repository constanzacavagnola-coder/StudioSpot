import type { Metadata } from "next";
import { getUser } from "@/lib/auth/dal";
import { getFavoriteIds } from "@/lib/favorites/data";
import { getAllPlaces } from "@/lib/places";
import ExplorarClient from "./ExplorarClient";

export const metadata: Metadata = {
  title: "Explorar espacios · Studio Spot",
  description:
    "Explora cafés, coworkings y bibliotecas de Santiago. Filtra por WiFi, enchufes, ruido, precio y comuna, y revisa la congestión por horario.",
};

export default async function ExplorarPage() {
  // Datos cargados en el servidor (Supabase o JSON) y entregados al cliente,
  // donde se aplican los filtros y se renderiza el mapa. La sesión y los
  // favoritos se resuelven aquí (cookies) para pintar los corazones sin parpadeo.
  const [places, user, favoriteIds] = await Promise.all([
    getAllPlaces(),
    getUser(),
    getFavoriteIds(),
  ]);
  const comunas = [...new Set(places.map((p) => p.comuna))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  const tipos = [...new Set(places.map((p) => p.tipo))];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Explorar espacios
        </h1>
        <p className="mt-1 text-ink-2">
          {places.length} espacios en Santiago. Filtra y encuentra tu lugar ideal.
        </p>
      </header>

      <ExplorarClient
        places={places}
        comunas={comunas}
        tipos={tipos}
        favoriteIds={[...favoriteIds]}
        isAuthenticated={!!user}
      />
    </div>
  );
}
