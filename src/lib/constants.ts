// Constantes globales de Studio Spot.

// Precio del plan Premium (placeholder). Cambiar aquí para actualizarlo en toda la app.
export const PREMIUM_PRECIO_CLP = 4990;

// Formatea un monto en pesos chilenos (CLP) sin decimales: 4990 -> "$4.990".
export function formatCLP(monto: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(monto);
}
