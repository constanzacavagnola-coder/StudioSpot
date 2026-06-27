// Módulo de CLIENTE (sin "use server"): la subida de imágenes del menú va
// directo desde el navegador a Storage. Así evitamos pasar el archivo por una
// Server Action (límite de body del Proxy de Next 16) y subimos con la ANON key
// bajo las policies `menu_obj_*` (authenticated puede insert/update/delete).
//
// La validación de mime/size aquí es UX: el servidor revalida el DOMINIO de la
// `imagen_url` y la propiedad del espacio al guardar el ítem (frontera real).

import {
  MENU_IMG_EXT,
  MENU_IMG_MAX_BYTES,
  MENU_IMG_MIME,
  type MenuImgMime,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export type SubirImagenResult =
  | { url: string; error?: undefined }
  | { url?: undefined; error: string };

function esMimeValido(t: string): t is MenuImgMime {
  return (MENU_IMG_MIME as readonly string[]).includes(t);
}

/**
 * Sube `file` al bucket `menu` bajo `${placeId}/${uuid}.${ext}` y devuelve su URL
 * pública. Valida tipo y tamaño antes de subir. La extensión se deriva del mime
 * (no del nombre original). `getPublicUrl` es síncrono y siempre devuelve URL
 * (el bucket es público).
 */
export async function subirImagenMenu(
  placeId: string,
  file: File,
): Promise<SubirImagenResult> {
  if (!esMimeValido(file.type)) {
    return { error: "Formato no permitido. Usa JPG, PNG o WebP." };
  }
  if (file.size > MENU_IMG_MAX_BYTES) {
    return { error: "La imagen supera el tamaño máximo de 3 MB." };
  }

  const ext = MENU_IMG_EXT[file.type];
  const path = `${placeId}/${crypto.randomUUID()}.${ext}`;

  const supabase = createClient();
  const { error } = await supabase.storage
    .from("menu")
    .upload(path, file, { contentType: file.type });

  if (error) {
    return { error: "No pudimos subir la imagen. Inténtalo de nuevo." };
  }

  const { data } = supabase.storage.from("menu").getPublicUrl(path);
  return { url: data.publicUrl };
}
