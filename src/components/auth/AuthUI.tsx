"use client";

import { useFormStatus } from "react-dom";

/**
 * Primitivas de UI compartidas por los formularios de autenticación
 * (login / registro). Centralizadas para mantener coherencia visual, de copy y
 * de accesibilidad (labels asociados, `aria-invalid`, mensajes de error con rol
 * de alerta). Son client components porque `SubmitButton` usa `useFormStatus`.
 */

/** Input de texto con label, error por campo y estados accesibles. */
export function Field({
  id,
  label,
  type = "text",
  autoComplete,
  defaultValue,
  placeholder,
  error,
  required = true,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition-colors placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 ${
          error
            ? "border-rose-300 focus-visible:ring-rose-300"
            : "border-stone-300 focus-visible:ring-brand/40"
        }`}
      />
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Botón de envío con estado de carga vía `useFormStatus`. */
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          Procesando…
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Banner de error general (no atado a un campo). */
export function ErrorAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
    >
      {message}
    </div>
  );
}

/** Banner de éxito / información (p. ej. "revisa tu correo"). */
export function SuccessAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
    >
      {message}
    </div>
  );
}
