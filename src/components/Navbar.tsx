import { getProfile, getUser } from "@/lib/auth/dal";
import NavbarClient from "@/components/NavbarClient";

/**
 * Navbar (Server Component): resuelve el estado de sesión con el DAL y se lo
 * pasa al componente cliente, que maneja la interactividad (menú de cuenta,
 * resaltado de ruta activa). Mantener la lectura de sesión en el servidor evita
 * parpadeos y no expone más datos de los necesarios al cliente.
 */
export default async function Navbar() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);

  const account = user
    ? {
        nombre: profile?.nombre ?? null,
        email: user.email ?? null,
        rol: profile?.rol ?? "usuario",
      }
    : null;

  return <NavbarClient account={account} />;
}
