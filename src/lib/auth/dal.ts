import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

/**
 * DAL (Data Access Layer) de autenticación. Capa única y centralizada para
 * decidir autorización en server-side; F2/F3/F4 la consumen, nadie la reescribe.
 *
 * Reglas de seguridad (SECURITY.md §3.3, proxy.md "Execution order"):
 *  - La autorización SIEMPRE se decide con `getUser()` (revalida el token contra
 *    Supabase). `getSession()` lee la cookie sin verificar firma → spoofeable,
 *    se ofrece solo por compatibilidad y NO debe usarse para gating.
 *  - Cada Server Action / Route Handler / página privada re-verifica con este
 *    DAL, porque el proxy puede saltarse Server Functions vía el matcher.
 *
 * Las lecturas se memoizan por request con React `cache` para no repetir la
 * llamada a Supabase entre el proxy, el layout, la página y sus componentes.
 */

/** Usuario autenticado y verificado, o null. Base de toda decisión de authz. */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
});

/**
 * Sesión cruda desde las cookies. NO usar para autorización (no verifica el
 * token). Disponible solo para casos no sensibles / compatibilidad.
 */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
});

/** Perfil ({id, nombre, rol}) del usuario autenticado, o null. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  // `.maybeSingle()`: el trigger crea el profile al registrarse, pero justo tras
  // el signup podría no existir todavía; no usar `.single()` para no lanzar.
  const { data } = await supabase
    .from("profiles")
    .select("id, nombre, rol")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return null;
  return { id: data.id, nombre: data.nombre, rol: data.rol as UserRole };
});

/** Exige sesión; si no hay, redirige a /login. Devuelve el usuario verificado. */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Exige sesión Y un rol concreto. Sin sesión → /login; rol distinto → home.
 * Devuelve usuario + perfil ya resueltos para evitar consultas repetidas.
 */
export async function requireRole(
  rol: UserRole,
): Promise<{ user: User; profile: Profile }> {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (!profile || profile.rol !== rol) redirect("/");

  return { user, profile };
}
