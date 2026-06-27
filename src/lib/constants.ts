// Constantes globales de Studio Spot.

// Precio del plan Premium (placeholder). Cambiar aquí para actualizarlo en toda la app.
export const PREMIUM_PRECIO_CLP = 4990;

// Montos fijos de recarga del saldo de la wallet (créditos internos de Studio
// Spot en CLP; sin pasarela de pago externa). Son la lista canónica: la UI pinta
// un botón por monto y la Server Action solo acepta valores de aquí (no se confía
// en el cliente). Ver feature F3.
export const MONTOS_RECARGA_CLP = [5000, 10000, 20000, 50000] as const;

// Montos fijos para gastar saldo como descuento al consumir en un espacio. Misma
// lógica de lista cerrada: la Server Action y la función SQL solo aceptan estos
// valores. Se valida además que haya saldo suficiente antes de descontar.
export const MONTOS_DESCUENTO_CLP = [1000, 2000, 5000] as const;

// Subida de imágenes del menú al bucket público `menu` de Storage. El bucket NO
// impone límites de mime/size (ver 0006), así que la validación vive en la app:
// en el cliente como UX y en el servidor como frontera de dominio de la URL.

// Allowlist de tipos de imagen aceptados (no se confía en la extensión original).
export const MENU_IMG_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type MenuImgMime = (typeof MENU_IMG_MIME)[number];

// Tamaño máximo por imagen (~3 MB). Subida directa desde el navegador a Storage,
// así que no pasa por el límite de body del Proxy de Next.
export const MENU_IMG_MAX_BYTES = 3 * 1024 * 1024;

// Extensión derivada del mime (canónica): el nombre del archivo se reconstruye,
// no se reutiliza el del usuario.
export const MENU_IMG_EXT: Record<MenuImgMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Formatea un monto en pesos chilenos (CLP) sin decimales: 4990 -> "$4.990".
export function formatCLP(monto: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(monto);
}
