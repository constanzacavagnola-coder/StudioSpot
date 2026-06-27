import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy de Next.js 16 (antes `middleware`, deprecado y renombrado en v16 —
 * ver node_modules/next/dist/docs/.../proxy.md). Corre en runtime Node por
 * defecto y se ejecuta antes de renderizar las rutas.
 *
 * Su ÚNICA responsabilidad aquí es REFRESCAR la sesión de Supabase en cada
 * request (patrón oficial de @supabase/ssr): lee las cookies de la request,
 * llama a `getUser()` para revalidar/rotar el token y reescribe las cookies en
 * la response. No toma decisiones de autorización: cada Server Action / Route
 * Handler / página privada re-verifica el usuario con el DAL (src/lib/auth/dal.ts),
 * porque el matcher puede saltarse Server Functions y `getSession()` es
 * spoofeable (ver SECURITY.md §3.3 y proxy.md "Execution order").
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Espejar las cookies actualizadas tanto en la request (para el resto
          // de la cadena) como en la response (para el navegador).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: no insertar lógica entre createServerClient y getUser(); el
  // getUser revalida el token contra Supabase y dispara el refresh de cookies.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Corre en todas las rutas EXCEPTO estáticos e imágenes, para no bloquear
  // CSS/JS/assets (proxy.md §matcher / "negative matching").
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
