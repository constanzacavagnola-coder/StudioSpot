"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Cierra la sesión (Server Action). Se ejecuta server-side con el cliente que
 * hereda la cookie de sesión, por lo que `signOut()` puede limpiar las cookies
 * de auth. Tras cerrar, redirige al inicio.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
