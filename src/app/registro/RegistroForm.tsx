"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { signup, type AuthState } from "@/lib/auth/actions";
import { ErrorAlert, Field, SubmitButton, SuccessAlert } from "@/components/auth/AuthUI";
import { Icon, type IconName } from "@/components/icons";
import type { UserRole } from "@/lib/types";

const INITIAL: AuthState = {};

const ROLES: { value: UserRole; titulo: string; desc: string; icon: IconName }[] = [
  {
    value: "usuario",
    titulo: "Usuario",
    desc: "Busca espacios, guarda favoritos y usa tu wallet.",
    icon: "mochila",
  },
  {
    value: "empresa",
    titulo: "Empresa",
    desc: "Reclama o publica tus espacios y gestiónalos.",
    icon: "empresa",
  },
];

/**
 * Formulario de registro con selección de rol (usuario / empresa). El rol viaja
 * en el `FormData` y la Server Action lo pasa a `user_metadata.rol`. Con la
 * confirmación de correo activa el alta no crea sesión: en éxito mostramos un
 * aviso para revisar el correo en lugar de redirigir.
 *
 * `rolInicial` permite preseleccionar (lo usa /registro-empresa).
 */
export default function RegistroForm({
  rolInicial = "usuario",
}: {
  rolInicial?: UserRole;
}) {
  const [state, formAction] = useActionState(signup, INITIAL);
  const [rol, setRol] = useState<UserRole>(state.values?.rol ?? rolInicial);

  if (state.ok) {
    return (
      <div className="space-y-4">
        <SuccessAlert message={state.message} />
        <p className="text-sm text-ink-2">
          ¿Ya confirmaste?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <ErrorAlert message={state.error} />

      <fieldset>
        <legend className="block text-sm font-medium text-ink-2">
          Tipo de cuenta
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {ROLES.map((opcion) => {
            const seleccionado = rol === opcion.value;
            return (
              <label
                key={opcion.value}
                className={`cursor-pointer rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-brand/40 ${
                  seleccionado
                    ? "border-brand bg-brand/5 ring-1 ring-brand"
                    : "border-border-warm bg-surface hover:border-border-warm"
                }`}
              >
                <input
                  type="radio"
                  name="rol"
                  value={opcion.value}
                  checked={seleccionado}
                  onChange={() => setRol(opcion.value)}
                  className="sr-only"
                />
                <Icon
                  name={opcion.icon}
                  className={`h-6 w-6 ${seleccionado ? "text-brand" : "text-ink-3"}`}
                />
                <span className="mt-1 block text-sm font-semibold text-ink">
                  {opcion.titulo}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-ink-2">
                  {opcion.desc}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Field
        id="nombre"
        label={rol === "empresa" ? "Nombre de la empresa" : "Nombre"}
        autoComplete={rol === "empresa" ? "organization" : "name"}
        placeholder={rol === "empresa" ? "Mi Empresa SpA" : "Tu nombre"}
        defaultValue={state.values?.nombre}
        error={state.fieldErrors?.nombre}
      />

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
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        error={state.fieldErrors?.password}
      />

      <Field
        id="password2"
        label="Repite la contraseña"
        type="password"
        autoComplete="new-password"
        placeholder="Repite tu contraseña"
        error={state.fieldErrors?.password2}
      />

      <SubmitButton>Crear cuenta</SubmitButton>

      <p className="text-center text-xs text-ink-2">
        Te enviaremos un correo para confirmar tu cuenta.
      </p>
    </form>
  );
}
