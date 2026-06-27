"use client";

import { useActionState } from "react";

import { login, type AuthState } from "@/lib/auth/actions";
import { ErrorAlert, Field, SubmitButton } from "@/components/auth/AuthUI";

const INITIAL: AuthState = {};

/**
 * Formulario de inicio de sesión. Usa `useActionState` para enlazar la Server
 * Action `login`: en éxito ésta redirige (no vuelve), y en error devuelve el
 * estado con mensajes que se pintan aquí sin recargar la página.
 */
export default function LoginForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const [state, formAction] = useActionState(login, INITIAL);
  const generalError = state.error ?? initialError;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      <ErrorAlert message={generalError} />

      <Field
        id="email"
        label="Correo"
        type="email"
        autoComplete="email"
        placeholder="tucorreo@ejemplo.cl"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />

      <Field
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        placeholder="Tu contraseña"
        error={state.fieldErrors?.password}
      />

      <SubmitButton>Entrar</SubmitButton>
    </form>
  );
}
