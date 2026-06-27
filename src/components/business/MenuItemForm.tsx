"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { EquisIcon, ImagenIcon } from "@/components/icons";
import type { MenuItemFormState } from "@/lib/menu/actions";
import { crearItem, actualizarItem } from "@/lib/menu/actions";
import { eliminarImagenMenu, subirImagenMenu } from "@/lib/menu/upload";
import type { MenuItem } from "@/lib/types";

/**
 * Formulario de alta/edición de un ítem del menú (Feature A). Client Component:
 * mantiene los campos en estado controlado para no perder lo escrito si la
 * Server Action devuelve errores de validación, y gestiona la subida de la
 * imagen al bucket `menu` (directo desde el navegador con la ANON key; ver
 * src/lib/menu/upload.ts). El servidor revalida el dominio de `imagen_url` y la
 * propiedad del espacio al guardar.
 *
 * Sirve para crear (sin `item`) y editar (con `item`: precarga valores y envía
 * el `id` por un campo oculto). En éxito llama a `onDone()`; la Action ya
 * revalidó la ruta, así que la lista de arriba se refresca sola.
 */

const INITIAL: MenuItemFormState = {};

type Props = {
  placeId: string;
  item?: MenuItem;
  onDone: () => void;
};

export default function MenuItemForm({ placeId, item, onDone }: Props) {
  const action = item ? actualizarItem : crearItem;
  const [state, formAction] = useActionState(action, INITIAL);

  const [nombre, setNombre] = useState(item?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(item?.descripcion ?? "");
  const [precio, setPrecio] = useState(item ? String(item.precio_clp) : "");
  const [stock, setStock] = useState(item ? String(item.stock) : "");
  const [activo, setActivo] = useState(item?.activo ?? true);
  const [imagenUrl, setImagenUrl] = useState(item?.imagen_url ?? "");

  const [subiendo, setSubiendo] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  // Path de una imagen subida en ESTA sesión y aún no persistida (en un ref: no
  // afecta el render, solo sirve para limpieza). Si se reemplaza o se quita antes
  // de guardar, se borra del bucket para no dejar huérfanos. La imagen original de
  // un ítem en edición NO se rastrea aquí (la limpia el server al guardar si
  // cambió), así que cancelar no borra la imagen ya guardada.
  const subidaPathRef = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fe = state.fieldErrors ?? {};

  // En cuanto la Action confirma el guardado (state.ok), cerrar el panel. La
  // revalidación de la ruta ya ocurrió en el servidor, así que la lista superior
  // mostrará el cambio al re-renderizar. La imagen ya quedó persistida: se olvida
  // el path de sesión para no borrarla.
  useEffect(() => {
    if (state.ok) {
      subidaPathRef.current = null;
      onDone();
    }
  }, [state.ok, onDone]);

  async function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const previa = subidaPathRef.current;
    setImgError(null);
    setSubiendo(true);
    const res = await subirImagenMenu(placeId, file);
    setSubiendo(false);
    if (res.url) {
      // Reemplazo: limpiar la subida de sesión anterior (huérfana).
      if (previa && previa !== res.path) void eliminarImagenMenu(previa);
      setImagenUrl(res.url);
      subidaPathRef.current = res.path;
      return;
    }
    setImgError(res.error ?? "No pudimos subir la imagen. Inténtalo de nuevo.");
    if (fileRef.current) fileRef.current.value = "";
  }

  function quitarImagen() {
    // Solo se borra del bucket si era una subida de esta sesión (no la original).
    if (subidaPathRef.current) void eliminarImagenMenu(subidaPathRef.current);
    subidaPathRef.current = null;
    setImagenUrl("");
    setImgError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-border-warm bg-surface p-5 shadow-sm"
      noValidate
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink">
          {item ? "Editar producto" : "Nuevo producto"}
        </h3>
        <button
          type="button"
          onClick={onDone}
          aria-label="Cerrar formulario"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-background-alt hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          <EquisIcon className="h-4 w-4" />
        </button>
      </div>

      <input type="hidden" name="place_id" value={placeId} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <input type="hidden" name="imagen_url" value={imagenUrl} />

      {state.error ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {state.error}
        </div>
      ) : null}

      <TextField
        id="nombre"
        label="Nombre"
        value={nombre}
        onChange={setNombre}
        error={fe.nombre}
        placeholder="Café latte"
      />

      <TextAreaField
        id="descripcion"
        label="Descripción"
        value={descripcion}
        onChange={setDescripcion}
        placeholder="Breve descripción del producto (opcional)."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="precio_clp"
          label="Precio (CLP)"
          value={precio}
          onChange={setPrecio}
          error={fe.precio_clp}
          inputMode="numeric"
          placeholder="3500"
        />
        <TextField
          id="stock"
          label="Stock"
          value={stock}
          onChange={setStock}
          error={fe.stock}
          inputMode="numeric"
          placeholder="20"
        />
      </div>

      {/* Imagen del producto */}
      <div className="space-y-2">
        <label htmlFor="imagen-menu" className="block text-sm font-medium text-ink-2">
          Imagen <span className="font-normal">(opcional)</span>
        </label>

        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border-warm bg-background-alt">
            {imagenUrl ? (
              <Image
                src={imagenUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-ink-3">
                <ImagenIcon className="h-7 w-7" />
              </span>
            )}
          </div>

          <div className="space-y-2">
            <input
              ref={fileRef}
              id="imagen-menu"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onArchivo}
              disabled={subiendo}
              className="block w-full text-sm text-ink-2 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand hover:file:bg-brand/15 disabled:opacity-60"
            />
            <div className="flex items-center gap-3 text-xs text-ink-2">
              {subiendo ? (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/30 border-t-brand"
                  />
                  Subiendo imagen…
                </span>
              ) : (
                <span>JPG, PNG o WebP. Máx. 3 MB.</span>
              )}
              {imagenUrl && !subiendo ? (
                <button
                  type="button"
                  onClick={quitarImagen}
                  className="font-medium text-rose-600 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                  Quitar imagen
                </button>
              ) : null}
            </div>
            <div aria-live="polite" className="min-h-[1rem]">
              {imgError ? (
                <p className="text-xs text-rose-600">{imgError}</p>
              ) : fe.imagen_url ? (
                <p className="text-xs text-rose-600">{fe.imagen_url}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          name="activo"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="h-4 w-4 rounded border-border-warm text-brand focus:ring-brand/40"
        />
        Producto activo (visible para los clientes en la ficha del espacio)
      </label>

      <div className="flex items-center gap-3 border-t border-border-warm pt-4">
        <SubmitButton subiendo={subiendo} editar={Boolean(item)} />
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-background-alt hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function SubmitButton({
  subiendo,
  editar,
}: {
  subiendo: boolean;
  editar: boolean;
}) {
  const { pending } = useFormStatus();
  const disabled = pending || subiendo;
  return (
    <button
      type="submit"
      disabled={disabled}
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
      ) : editar ? (
        "Guardar cambios"
      ) : (
        "Crear producto"
      )}
    </button>
  );
}

// ---- Campos controlados (mismo estilo que PlaceForm) ----

const baseInput =
  "mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink shadow-sm transition-colors placeholder:text-ink-3 focus:outline-none focus-visible:ring-2";

function fieldClasses(error?: string) {
  return `${baseInput} ${
    error
      ? "border-rose-300 focus-visible:ring-rose-300"
      : "border-border-warm focus-visible:ring-brand/40"
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-2">
        {label}
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-2">
        {label} <span className="font-normal text-ink-2">(opcional)</span>
      </label>
      <textarea
        id={id}
        name={id}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${baseInput} border-border-warm focus-visible:ring-brand/40`}
      />
    </div>
  );
}
