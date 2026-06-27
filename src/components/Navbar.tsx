import { getUser } from "@/lib/auth/dal";
import NavbarClient from "@/components/NavbarClient";
import type { UserRole } from "@/lib/types";

/**
 * Navbar (Server Component): resuelve el estado de sesión con el DAL y se lo
 * pasa al componente cliente, que maneja la interactividad (menú de cuenta,
 * resaltado de ruta activa). Mantener la lectura de sesión en el servidor evita
 * parpadeos y no expone más datos de los necesarios al cliente.
 *
 * Rendimiento: el navbar (presente en TODAS las rutas) solo necesita nombre y
 * rol para pintarse, y ambos viajan ya en `user_metadata` (los fija el signup).
 * Se leen de ahí en vez de consultar la tabla `profiles`, evitando un roundtrip
 * a la BD en cada página. La autorización real sigue usando el DAL/RLS aparte.
 */
export default async function Navbar() {
  const user = await getUser();

  const meta = (user?.user_metadata ?? {}) as { nombre?: string; rol?: string };
  const account = user
    ? {
        nombre: meta.nombre ?? null,
        email: user.email ?? null,
        rol: (meta.rol === "empresa" ? "empresa" : "usuario") as UserRole,
      }
    : null;

  return <NavbarClient account={account} />;
}
