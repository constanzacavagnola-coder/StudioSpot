"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { PlaceFormState } from "@/lib/business/actions";
import {
  FRANJAS_ORDEN,
  FRANJA_HORARIO,
  FRANJA_LABEL,
  NIVEL3_LABEL,
  PRECIO_LABEL,
  RUIDO_LABEL,
  TIPO_LABEL,
} from "@/lib/display";
import type {
  Franja,
  Nivel3,
  NivelPrecio,
  NivelRuido,
  Place,
  PlaceType,
} from "@/lib/types";

/**
 * Formulario de alta/edición de espacio (F4). Client Component porque mantiene
 * los valores en estado controlado: así, si la Server Action devuelve errores de
 * validación, lo que el usuario escribió se conserva (no se pierde al
 * re-renderizar). El envío va a `action` vía `useActionState`; en éxito la propia
 * Action redirige a /dashboard.
 *
 * Sirve para crear (sin `place`) y editar (con `place`: precarga valores y manda
 * el `id` por un campo oculto).
 */

const INITIAL: PlaceFormState = {};

type Props = {
  action: (prev: PlaceFormState, formData: FormData) => Promise<PlaceFormState>;
  place?: Place;
  submitLabel: string;
};

const TIPO_OPCIONES: PlaceType[] = ["cafe", "coworking", "biblioteca"];
const NIVEL3_OPCIONES: Nivel3[] = ["bajo", "medio", "alto"];
const RUIDO_OPCIONES: NivelRuido[] = ["silencioso", "moderado", "animado"];
const PRECIO_OPCIONES: NivelPrecio[] = ["gratis", "$", "$$", "$$$"];

export default function PlaceForm({ action, place, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, INITIAL);

  // Estado controlado: precargado desde `place` en edición, vacío en alta.
  const [nombre, setNombre] = useState(place?.nombre ?? "");
  const [tipo, setTipo] = useState<PlaceType | "">(place?.tipo ?? "");
  const [comuna, setComuna] = useState(place?.comuna ?? "");
  const [direccion, setDireccion] = useState(place?.direccion ?? "");
  const [lat, setLat] = useState(place ? String(place.lat) : "");
  const [lng, setLng] = useState(place ? String(place.lng) : "");
  const [descripcion, setDescripcion] = useState(place?.descripcion ?? "");
  const [enchufes, setEnchufes] = useState<Nivel3 | "">(place?.enchufes ?? "");
  const [wifi, setWifi] = useState<Nivel3 | "">(place?.wifi ?? "");
  const [ruido, setRuido] = useState<NivelRuido | "">(place?.ruido ?? "");
  const [precio, setPrecio] = useState<NivelPrecio | "">(place?.precio ?? "");
  const [ambiente, setAmbiente] = useState(place?.ambiente ?? "");
  const [horario, setHorario] = useState(place?.horario ?? "");
  const [fuente, setFuente] = useState(place?.fuente ?? "");
  const [tieneBanos, setTieneBanos] = useState(place?.tiene_banos ?? true);
  const [congestion, setCongestion] = useState<Record<Franja, Nivel3 | "">>(() => {
    const base: Record<Franja, Nivel3 | ""> = {
      mañana: "",
      mediodia: "",
      tarde: "",
      noche: "",
    };
    if (place) {
      for (const franja of FRANJAS_ORDEN) {
        base[franja] = place.congestion[franja] ?? "";
      }
    }
    return base;
  });

  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {place ? <input type="hidden" name="id" value={place.id} /> : null}

      {state.error ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {state.error}
        </div>
      ) : null}

      {/* Datos básicos */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Datos básicos</h2>

        <TextField
          id="nombre"
          label="Nombre del espacio"
          value={nombre}
          onChange={setNombre}
          error={fe.nombre}
          placeholder="Café Central"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="tipo"
            label="Tipo"
            value={tipo}
            onChange={(v) => setTipo(v as PlaceType)}
            error={fe.tipo}
            options={TIPO_OPCIONES.map((t) => ({ value: t, label: TIPO_LABEL[t] }))}
          />
          <TextField
            id="comuna"
            label="Comuna"
            value={comuna}
            onChange={setComuna}
            error={fe.comuna}
            placeholder="Providencia"
          />
        </div>

        <TextField
          id="direccion"
          label="Dirección"
          value={direccion}
          onChange={setDireccion}
          error={fe.direccion}
          placeholder="Av. Siempre Viva 123"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="lat"
            label="Latitud"
            value={lat}
            onChange={setLat}
            error={fe.lat}
            inputMode="decimal"
            placeholder="-33.4372"
          />
          <TextField
            id="lng"
            label="Longitud"
            value={lng}
            onChange={setLng}
            error={fe.lng}
            inputMode="decimal"
            placeholder="-70.6506"
          />
        </div>
        <p className="text-xs text-stone-400">
          Coordenadas en grados decimales. Puedes copiarlas desde Google Maps.
        </p>

        <TextAreaField
          id="descripcion"
          label="Descripción"
          value={descripcion}
          onChange={setDescripcion}
          required={false}
          placeholder="Breve descripción del espacio (opcional)."
        />
      </section>

      {/* Atributos */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Atributos</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="enchufes"
            label="Enchufes"
            value={enchufes}
            onChange={(v) => setEnchufes(v as Nivel3)}
            error={fe.enchufes}
            options={NIVEL3_OPCIONES.map((n) => ({ value: n, label: NIVEL3_LABEL[n] }))}
          />
          <SelectField
            id="wifi"
            label="WiFi"
            value={wifi}
            onChange={(v) => setWifi(v as Nivel3)}
            error={fe.wifi}
            options={NIVEL3_OPCIONES.map((n) => ({ value: n, label: NIVEL3_LABEL[n] }))}
          />
          <SelectField
            id="ruido"
            label="Ruido"
            value={ruido}
            onChange={(v) => setRuido(v as NivelRuido)}
            error={fe.ruido}
            options={RUIDO_OPCIONES.map((n) => ({ value: n, label: RUIDO_LABEL[n] }))}
          />
          <SelectField
            id="precio"
            label="Precio"
            value={precio}
            onChange={(v) => setPrecio(v as NivelPrecio)}
            error={fe.precio}
            options={PRECIO_OPCIONES.map((n) => ({ value: n, label: PRECIO_LABEL[n] }))}
          />
        </div>

        <TextField
          id="ambiente"
          label="Ambiente"
          value={ambiente}
          onChange={setAmbiente}
          required={false}
          placeholder="Luminoso, mesas amplias, terraza"
        />

        <TextField
          id="horario"
          label="Horario"
          value={horario}
          onChange={setHorario}
          required={false}
          placeholder="Lun-Vie 08:00-21:00"
        />

        <TextField
          id="fuente"
          label="Fuente del dato"
          value={fuente}
          onChange={setFuente}
          required={false}
          placeholder="De dónde proviene la información (opcional)"
        />

        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            name="tiene_banos"
            checked={tieneBanos}
            onChange={(e) => setTieneBanos(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-brand focus:ring-brand/40"
          />
          El espacio cuenta con baños
        </label>
      </section>

      {/* Congestión por franja */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">
            Congestión por franja
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Qué tan lleno suele estar el espacio en cada momento del día (opcional).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {FRANJAS_ORDEN.map((franja) => (
            <SelectField
              key={franja}
              id={`congestion-${franja}`}
              label={`${FRANJA_LABEL[franja]} · ${FRANJA_HORARIO[franja]}`}
              value={congestion[franja]}
              onChange={(v) =>
                setCongestion((c) => ({ ...c, [franja]: v as Nivel3 | "" }))
              }
              required={false}
              emptyLabel="Sin dato"
              options={NIVEL3_OPCIONES.map((n) => ({
                value: n,
                label: NIVEL3_LABEL[n],
              }))}
            />
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3 border-t border-stone-200 pt-6">
        <SubmitButton label={submitLabel} />
        <Link
          href="/dashboard"
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          Guardando…
        </>
      ) : (
        label
      )}
    </button>
  );
}

// ---- Campos reutilizables (controlados) ----

const baseInput =
  "mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition-colors placeholder:text-stone-400 focus:outline-none focus-visible:ring-2";

function fieldClasses(error?: string) {
  return `${baseInput} ${
    error
      ? "border-rose-300 focus-visible:ring-rose-300"
      : "border-stone-300 focus-visible:ring-brand/40"
  }`;
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-1 text-xs text-rose-600">
      {error}
    </p>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  inputMode,
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  inputMode?: "decimal" | "text";
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
        {!required ? (
          <span className="ml-1 font-normal text-stone-400">(opcional)</span>
        ) : null}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClasses(error)}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
        {!required ? (
          <span className="ml-1 font-normal text-stone-400">(opcional)</span>
        ) : null}
      </label>
      <textarea
        id={id}
        name={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${baseInput} border-stone-300 focus-visible:ring-brand/40`}
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  error,
  options,
  required = true,
  emptyLabel = "Selecciona…",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  options: { value: string; label: string }[];
  required?: boolean;
  emptyLabel?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClasses(error)}
      >
        <option value="">{required ? "Selecciona…" : emptyLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <FieldError id={id} error={error} />
    </div>
  );
}
