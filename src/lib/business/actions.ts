"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getProfile, requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { FRANJAS_ORDEN } from "@/lib/display";
import type {
  Congestion,
  Franja,
  Nivel3,
  NivelPrecio,
  NivelRuido,
  PlaceType,
} from "@/lib/types";

/**
 * Server Actions del dashboard de empresa (F4): reclamar, crear y editar
 * espacios. Todas se ejecutan SIEMPRE en el servidor y re-verifican el rol con
 * el DAL (el cliente nunca es fuente de verdad). RLS es la última barrera:
 *  - crear  → `places_insert_owner` (with check owner_id = auth.uid()).
 *  - editar → `places_update_owner` (using/with check owner_id = auth.uid()).
 *  - reclamar → `claim_place()` (SECURITY DEFINER) que solo toma espacios sin
 *    dueño y registra el claim.
 *
 * Los inputs se validan contra listas cerradas (enums del esquema); aunque el
 * cliente envíe otro valor, se rechaza.
 */

// ---- Conjuntos válidos (espejo de los enums del esquema SQL) ----
const TIPOS: readonly PlaceType[] = ["cafe", "coworking", "biblioteca"];
const NIVELES3: readonly Nivel3[] = ["bajo", "medio", "alto"];
const RUIDOS: readonly NivelRuido[] = ["silencioso", "moderado", "animado"];
const PRECIOS: readonly NivelPrecio[] = ["gratis", "$", "$$", "$$$"];

function inSet<T extends string>(set: readonly T[], v: string): v is T {
  return (set as readonly string[]).includes(v);
}

/** Campos editables de un espacio (sin slug ni owner_id, que se fijan aparte). */
type PlacePayload = {
  nombre: string;
  tipo: PlaceType;
  comuna: string;
  direccion: string;
  lat: number;
  lng: number;
  descripcion: string | null;
  enchufes: Nivel3;
  wifi: Nivel3;
  ruido: NivelRuido;
  ambiente: string | null;
  precio: NivelPrecio;
  tiene_banos: boolean;
  horario: string | null;
  congestion: Congestion;
  fuente: string | null;
};

/** Estado que devuelven crear/editar a `useActionState`. */
export type PlaceFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type ClaimResult = { ok: true } | { ok: false; error: string };

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

/** Convierte un nombre en un slug url-safe (sin tildes ni símbolos). */
function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Lee y valida el formulario de espacio. Devuelve el payload listo para la BD o,
 * si hay errores, los `fieldErrors` por campo. Reutilizado por crear y editar.
 */
function parsePlaceForm(
  fd: FormData,
): { payload: PlacePayload; fieldErrors?: undefined } | { payload?: undefined; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};

  const nombre = str(fd, "nombre");
  const comuna = str(fd, "comuna");
  const direccion = str(fd, "direccion");
  const tipo = str(fd, "tipo");
  const enchufes = str(fd, "enchufes");
  const wifi = str(fd, "wifi");
  const ruido = str(fd, "ruido");
  const precio = str(fd, "precio");
  const latRaw = str(fd, "lat");
  const lngRaw = str(fd, "lng");

  if (nombre.length < 2) fieldErrors.nombre = "Ingresa un nombre (mínimo 2 caracteres).";
  if (!comuna) fieldErrors.comuna = "Ingresa la comuna.";
  if (!direccion) fieldErrors.direccion = "Ingresa la dirección.";
  if (!inSet(TIPOS, tipo)) fieldErrors.tipo = "Elige un tipo de espacio.";
  if (!inSet(NIVELES3, enchufes)) fieldErrors.enchufes = "Elige el nivel de enchufes.";
  if (!inSet(NIVELES3, wifi)) fieldErrors.wifi = "Elige el nivel de WiFi.";
  if (!inSet(RUIDOS, ruido)) fieldErrors.ruido = "Elige el nivel de ruido.";
  if (!inSet(PRECIOS, precio)) fieldErrors.precio = "Elige el nivel de precio.";

  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!latRaw || Number.isNaN(lat) || lat < -90 || lat > 90) {
    fieldErrors.lat = "Latitud inválida (entre -90 y 90).";
  }
  if (!lngRaw || Number.isNaN(lng) || lng < -180 || lng > 180) {
    fieldErrors.lng = "Longitud inválida (entre -180 y 180).";
  }

  // Congestión por franja: cada select es opcional; se ignoran vacíos/ inválidos.
  const congestion: Congestion = {};
  for (const franja of FRANJAS_ORDEN) {
    const v = str(fd, `congestion-${franja}`);
    if (v && inSet(NIVELES3, v)) congestion[franja as Franja] = v;
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const descripcion = str(fd, "descripcion");
  const ambiente = str(fd, "ambiente");
  const horario = str(fd, "horario");
  const fuente = str(fd, "fuente");

  return {
    payload: {
      nombre,
      tipo: tipo as PlaceType,
      comuna,
      direccion,
      lat,
      lng,
      descripcion: descripcion || null,
      enchufes: enchufes as Nivel3,
      wifi: wifi as Nivel3,
      ruido: ruido as NivelRuido,
      ambiente: ambiente || null,
      precio: precio as NivelPrecio,
      tiene_banos: fd.get("tiene_banos") != null,
      horario: horario || null,
      congestion,
      fuente: fuente || null,
    },
  };
}

/** Exige sesión + rol empresa. Redirige si no cumple (sin sesión → /login). */
async function requireEmpresa(): Promise<User> {
  const { user } = await requireRole("empresa");
  return user;
}

/**
 * Crea un espacio nuevo del que la empresa queda como dueña. El slug se deriva
 * del nombre; si choca con uno existente (unique), se pide cambiar el nombre.
 */
export async function createPlace(
  _prev: PlaceFormState,
  formData: FormData,
): Promise<PlaceFormState> {
  const user = await requireEmpresa();

  const parsed = parsePlaceForm(formData);
  if (!parsed.payload) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const slug = slugify(parsed.payload.nombre) || `espacio-${Date.now()}`;

  const { error } = await supabase
    .from("places")
    .insert({ ...parsed.payload, slug, owner_id: user.id });

  if (error) {
    // 23505 = unique_violation sobre slug: el nombre genera un slug ya usado.
    if (error.code === "23505") {
      return {
        fieldErrors: { nombre: "Ya existe un espacio con ese nombre. Prueba otro." },
      };
    }
    return { error: "No pudimos crear el espacio. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/**
 * Edita atributos y congestión de un espacio propio. No cambia el slug (mantiene
 * estable la URL pública). El `.eq("owner_id")` + RLS garantizan que solo el
 * dueño pueda actualizar.
 */
export async function updatePlace(
  _prev: PlaceFormState,
  formData: FormData,
): Promise<PlaceFormState> {
  const user = await requireEmpresa();

  const id = str(formData, "id");
  if (!id) return { error: "Espacio inválido." };

  const parsed = parsePlaceForm(formData);
  if (!parsed.payload) return { fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .update(parsed.payload)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("slug")
    .maybeSingle();

  if (error) {
    return { error: "No pudimos guardar los cambios. Inténtalo de nuevo." };
  }
  if (!data) {
    return { error: "No encontramos el espacio o no eres su dueño." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/espacio/${data.slug as string}`);
  redirect("/dashboard");
}

/**
 * Reclama un espacio sin dueño vía la función `claim_place()` (auto-aprobado: el
 * espacio queda asociado de inmediato). Devuelve un resultado para que la UI
 * muestre feedback sin recargar.
 */
export async function claimPlace(placeId: string): Promise<ClaimResult> {
  if (typeof placeId !== "string" || placeId.length === 0) {
    return { ok: false, error: "Espacio inválido." };
  }

  const profile = await getProfile();
  if (!profile || profile.rol !== "empresa") {
    return { ok: false, error: "Solo las cuentas de empresa pueden reclamar espacios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_place", { p_place_id: placeId });

  if (error) {
    // La función lanza si el espacio no existe o ya tiene dueño.
    return { ok: false, error: "El espacio no existe o ya fue reclamado." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reclamar");
  return { ok: true };
}
