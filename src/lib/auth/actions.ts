"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

/**
 * Server Actions de autenticación (email + contraseña con confirmación por
 * correo). Se ejecutan SIEMPRE en el servidor: validan los campos, hablan con
 * Supabase Auth y devuelven un estado tipado que los formularios cliente
 * consumen con `useActionState` para pintar errores/carga sin recargar.
 *
 * Seguridad: la validación de cliente (HTML) es solo UX; la fuente de verdad es
 * esta validación server-side. No se filtra si un correo existe salvo el caso
 * estándar de Supabase (identities vacías) para no habilitar enumeración masiva.
 */

/** Estado que devuelven login/signup a `useActionState`. */
export type AuthState = {
  /** Operación correcta (p. ej. signup que dejó un correo pendiente). */
  ok?: boolean;
  /** Mensaje informativo de éxito (signup → "revisa tu correo"). */
  message?: string;
  /** Error general no atado a un campo concreto. */
  error?: string;
  /** Errores por campo, para mostrarlos junto al input. */
  fieldErrors?: Partial<Record<"nombre" | "email" | "password" | "password2", string>>;
  /** Valores a repoblar tras un error (nunca la contraseña). */
  values?: { nombre?: string; email?: string; rol?: UserRole };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

/** Solo permitimos redirecciones internas para evitar open-redirect. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** Origen absoluto de la app (para construir el enlace de confirmación). */
async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Inicia sesión con email + contraseña. Si las credenciales son válidas y el
 * correo está confirmado, redirige a `next` (o al inicio).
 */
export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const fieldErrors: AuthState["fieldErrors"] = {};
  if (!email) fieldErrors.email = "Ingresa tu correo.";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "El correo no es válido.";
  if (!password) fieldErrors.password = "Ingresa tu contraseña.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message.toLowerCase();
    let m = "No pudimos iniciar sesión. Inténtalo de nuevo.";
    if (msg.includes("email not confirmed")) {
      m = "Tu correo aún no está confirmado. Revisa tu bandeja de entrada.";
    } else if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
      m = "Correo o contraseña incorrectos.";
    }
    return { error: m, values: { email } };
  }

  redirect(next);
}

/**
 * Registra una cuenta nueva con rol (`usuario` | `empresa`). El nombre y el rol
 * viajan en `user_metadata` y el trigger `handle_new_user()` los persiste en
 * `profiles`. Con confirmación de correo activa NO hay sesión todavía: se
 * devuelve un estado de éxito invitando a revisar el correo.
 */
export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const rol: UserRole = formData.get("rol") === "empresa" ? "empresa" : "usuario";
  const values = { nombre, email, rol };

  const fieldErrors: AuthState["fieldErrors"] = {};
  if (nombre.length < 2) fieldErrors.nombre = "Ingresa tu nombre (mínimo 2 caracteres).";
  if (!email) fieldErrors.email = "Ingresa tu correo.";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "El correo no es válido.";
  if (!password) fieldErrors.password = "Crea una contraseña.";
  else if (password.length < PASSWORD_MIN) {
    fieldErrors.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
  }
  if (password2 !== password) fieldErrors.password2 = "Las contraseñas no coinciden.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, rol },
      emailRedirectTo: `${origin}/auth/callback?next=/`,
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    let m = "No pudimos crear la cuenta. Inténtalo de nuevo.";
    if (msg.includes("already registered") || msg.includes("already been registered")) {
      m = "Este correo ya está registrado. Intenta iniciar sesión.";
    } else if (msg.includes("password")) {
      m = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
    }
    return { error: m, values };
  }

  // Supabase devuelve un usuario con `identities` vacío cuando el correo ya
  // existía (anti-enumeración). Lo tratamos como "ya registrado".
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { error: "Este correo ya está registrado. Intenta iniciar sesión.", values };
  }

  return {
    ok: true,
    message: `Te enviamos un correo a ${email}. Confirma tu cuenta para empezar a usar Studio Spot.`,
    values: { email, rol },
  };
}

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
