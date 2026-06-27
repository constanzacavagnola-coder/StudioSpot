// Constantes globales de Studio Spot.

// Precio del plan Premium (placeholder). Cambiar aquí para actualizarlo en toda la app.
export const PREMIUM_PRECIO_CLP = 4990;

// Montos fijos de recarga de la wallet de DEMO (créditos ficticios, sin dinero
// real). Son la lista canónica: la UI pinta un botón por monto y la Server Action
// solo acepta valores de aquí (no se confía en el cliente). Ver feature F3.
export const MONTOS_RECARGA_CLP = [5000, 10000, 20000, 50000] as const;

// Formatea un monto en pesos chilenos (CLP) sin decimales: 4990 -> "$4.990".
export function formatCLP(monto: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(monto);
}
