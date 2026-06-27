import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Ruta de confirmación de correo (Route Handler). El enlace del email de
 * Supabase aterriza aquí tras pulsar "Confirmar mi correo".
 *
 * Soporta los dos formatos que puede emitir Supabase según la configuración:
 *  - Flujo PKCE: `?code=...` → `exchangeCodeForSession` (usa el code_verifier
 *    en cookie que dejó el signUp).
 *  - Flujo OTP / token_hash: `?token_hash=...&type=...` → `verifyOtp`.
 *
 * En ambos casos `createClient()` (server) escribe las cookies de sesión, así
 * que tras el intercambio el usuario queda autenticado. Si algo falla, se
 * redirige a /login con un aviso. `next` se valida para evitar open-redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=confirmacion`);
}
