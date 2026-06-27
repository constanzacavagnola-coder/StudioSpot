import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el NAVEGADOR (Client Components).
 * Usa únicamente variables públicas (NEXT_PUBLIC_*). La seguridad depende de
 * que RLS esté ACTIVADO en todas las tablas (ver SECURITY.md §3.3).
 * NUNCA importar aquí la service_role key.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
