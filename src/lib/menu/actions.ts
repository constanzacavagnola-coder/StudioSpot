"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/dal";
import { getOwnedPlaceById } from "@/lib/business/data";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Actions del menú de empresa (0006). Todas se ejecutan SIEMPRE en el
 * servidor y, antes de escribir:
 *  1) re-verifican el rol con el DAL (`requireRole("empresa")`),
 *  2) re-verifican la PROPIEDAD del espacio con `getOwnedPlaceById` (el cliente
 *     nunca es fuente de verdad), y
 *  3) validan que `imagen_url`, si viene, pertenezca al dominio público del
 *     bucket `menu` (no se confía en una URL arbitraria del cliente).
 *
 * La RLS `menu_owner_all` es la última barrera: solo deja tocar ítems de un
 * `place` cuyo `owner_id = auth.uid()`.
 */

// Prefijo del dominio público del bucket `menu`. Toda `imagen_url` válida empieza
// por aquí (subida vía src/lib/menu/upload.ts).
const PUBLIC_MENU_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu/`;

export type MenuItemFormState = {
  // `ok: true` solo en un guardado exitoso. Permite al formulario distinguir el
  // estado inicial ({}) de un envío correcto (revalidación ya hecha en servidor)
  // y cerrar/limpiar el panel sin confundirlo con el primer render.
  ok?: true;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type MenuItemResult = { ok: true } | { ok: false; error: string };

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

/** True si la URL apunta al bucket público `menu` (frontera de confianza). */
function imagenEnDominio(url: string): boolean {
  return url.startsWith(PUBLIC_MENU_PREFIX);
}

/**
 * True si la URL es del bucket `menu` Y vive en el folder `${placeId}/` (la
 * convención de subida es `{place_id}/{uuid}.{ext}`). Evita que un dueño guarde en
 * su ficha una imagen del folder de OTRO espacio; va en línea con la policy de
 * Storage acotada por dueño del 0008.
 */
function imagenDeEspacio(url: string, placeId: string): boolean {
  return url.startsWith(`${PUBLIC_MENU_PREFIX}${placeId}/`);
}

/** Ruta interna del objeto en el bucket a partir de su URL pública, o null. */
function pathDeImagen(url: string | null): string | null {
  if (!url || !url.startsWith(PUBLIC_MENU_PREFIX)) return null;
  return url.slice(PUBLIC_MENU_PREFIX.length);
}

type MenuPayload = {
  nombre: string;
  descripcion: string | null;
  precio_clp: number;
  stock: number;
  imagen_url: string | null;
  activo: boolean;
};

/** Lee y valida el formulario de ítem. Devuelve el payload o errores por campo. */
function parseMenuForm(
  fd: FormData,
):
  | { payload: MenuPayload; fieldErrors?: undefined }
  | { payload?: undefined; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};

  const nombre = str(fd, "nombre");
  const precioRaw = str(fd, "precio_clp");
  const stockRaw = str(fd, "stock");
  const imagenUrl = str(fd, "imagen_url");

  if (nombre.length < 2) {
    fieldErrors.nombre = "Ingresa un nombre (mínimo 2 caracteres).";
  }

  const precio = Number(precioRaw);
  if (!precioRaw || !Number.isInteger(precio) || precio < 0) {
    fieldErrors.precio_clp = "Ingresa un precio válido (entero, en CLP).";
  }

  const stock = Number(stockRaw);
  if (!stockRaw || !Number.isInteger(stock) || stock < 0) {
    fieldErrors.stock = "Ingresa un stock válido (entero, 0 o más).";
  }

  if (imagenUrl && !imagenEnDominio(imagenUrl)) {
    fieldErrors.imagen_url = "La imagen no es válida. Vuelve a subirla.";
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const descripcion = str(fd, "descripcion");

  return {
    payload: {
      nombre,
      descripcion: descripcion || null,
      precio_clp: precio,
      stock,
      imagen_url: imagenUrl || null,
      // El checkbox solo viene en el FormData si está marcado.
      activo: fd.get("activo") != null,
    },
  };
}

/** Revalida la ruta de menú del dueño y la ficha pública del espacio. */
function revalidarMenu(placeId: string, slug: string) {
  revalidatePath(`/dashboard/${placeId}/menu`);
  revalidatePath(`/espacio/${slug}`);
}

/** Crea un ítem de menú en un espacio propio. */
export async function crearItem(
  _prev: MenuItemFormState,
  formData: FormData,
): Promise<MenuItemFormState> {
  await requireRole("empresa");

  const placeId = str(formData, "place_id");
  const place = await getOwnedPlaceById(placeId);
  if (!place) return { error: "No encontramos el espacio o no eres su dueño." };

  const parsed = parseMenuForm(formData);
  if (!parsed.payload) return { fieldErrors: parsed.fieldErrors };

  if (parsed.payload.imagen_url && !imagenDeEspacio(parsed.payload.imagen_url, placeId)) {
    return { fieldErrors: { imagen_url: "La imagen no es válida. Vuelve a subirla." } };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .insert({ ...parsed.payload, place_id: placeId });

  if (error) {
    return { error: "No pudimos crear el ítem. Inténtalo de nuevo." };
  }

  revalidarMenu(placeId, place.slug);
  return { ok: true };
}

/** Edita un ítem de menú de un espacio propio. */
export async function actualizarItem(
  _prev: MenuItemFormState,
  formData: FormData,
): Promise<MenuItemFormState> {
  await requireRole("empresa");

  const id = str(formData, "id");
  const placeId = str(formData, "place_id");
  if (!id) return { error: "Ítem inválido." };

  const place = await getOwnedPlaceById(placeId);
  if (!place) return { error: "No encontramos el espacio o no eres su dueño." };

  const parsed = parseMenuForm(formData);
  if (!parsed.payload) return { fieldErrors: parsed.fieldErrors };

  if (parsed.payload.imagen_url && !imagenDeEspacio(parsed.payload.imagen_url, placeId)) {
    return { fieldErrors: { imagen_url: "La imagen no es válida. Vuelve a subirla." } };
  }

  const supabase = await createClient();
  // Imagen previa: si el dueño la reemplazó o quitó, hay que limpiar el objeto
  // huérfano del bucket tras guardar (la nueva ya está subida por el cliente).
  const { data: previo } = await supabase
    .from("menu_items")
    .select("imagen_url")
    .eq("id", id)
    .eq("place_id", placeId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("menu_items")
    .update(parsed.payload)
    .eq("id", id)
    .eq("place_id", placeId)
    .select("id")
    .maybeSingle();

  if (error) return { error: "No pudimos guardar los cambios. Inténtalo de nuevo." };
  if (!data) return { error: "No encontramos el ítem." };

  // Limpieza best-effort de la imagen anterior si cambió (no bloquea el éxito).
  const prevUrl = (previo?.imagen_url as string | null) ?? null;
  if (prevUrl && prevUrl !== parsed.payload.imagen_url) {
    const prevPath = pathDeImagen(prevUrl);
    if (prevPath) await supabase.storage.from("menu").remove([prevPath]);
  }

  revalidarMenu(placeId, place.slug);
  return { ok: true };
}

/** Activa/desactiva un ítem (control de visibilidad pública sin borrarlo). */
export async function toggleActivo(
  itemId: string,
  activo: boolean,
): Promise<MenuItemResult> {
  await requireRole("empresa");
  if (typeof itemId !== "string" || itemId.length === 0) {
    return { ok: false, error: "Ítem inválido." };
  }

  const supabase = await createClient();
  // Recuperar el place_id para verificar propiedad y revalidar la ficha.
  const { data: item } = await supabase
    .from("menu_items")
    .select("place_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return { ok: false, error: "No encontramos el ítem." };

  const place = await getOwnedPlaceById(item.place_id as string);
  if (!place) return { ok: false, error: "No eres dueño de este espacio." };

  const { error } = await supabase
    .from("menu_items")
    .update({ activo: Boolean(activo) })
    .eq("id", itemId);

  if (error) return { ok: false, error: "No pudimos actualizar el ítem." };

  revalidarMenu(place.id, place.slug);
  return { ok: true };
}

/** Elimina un ítem y, si tenía imagen propia, borra también el objeto en Storage. */
export async function eliminarItem(itemId: string): Promise<MenuItemResult> {
  await requireRole("empresa");
  if (typeof itemId !== "string" || itemId.length === 0) {
    return { ok: false, error: "Ítem inválido." };
  }

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("menu_items")
    .select("place_id, imagen_url")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return { ok: false, error: "No encontramos el ítem." };

  const place = await getOwnedPlaceById(item.place_id as string);
  if (!place) return { ok: false, error: "No eres dueño de este espacio." };

  const { error } = await supabase.from("menu_items").delete().eq("id", itemId);
  if (error) return { ok: false, error: "No pudimos eliminar el ítem." };

  // Limpieza best-effort del objeto en Storage (no bloquea el resultado).
  const path = pathDeImagen((item.imagen_url as string | null) ?? null);
  if (path) {
    await supabase.storage.from("menu").remove([path]);
  }

  revalidarMenu(place.id, place.slug);
  return { ok: true };
}
