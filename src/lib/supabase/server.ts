import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para el SERVIDOR (Server Components, Route Handlers,
 * Server Actions). Lee/escribe la sesión desde las cookies de la request.
 *
 * Usa la ANON key (pública) y asume RLS activado. Para operaciones
 * administrativas que requieran SUPABASE_SERVICE_ROLE_KEY, créese un cliente
 * separado y úsese SOLO en server-side, nunca con prefijo NEXT_PUBLIC_
 * (ver SECURITY.md §3.2).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde un Server Component: ignorar. La sesión se
            // refresca vía middleware/Route Handler con acceso de escritura.
          }
        },
      },
    },
  );
}
