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

// Formatea un monto en pesos chilenos (CLP) sin decimales: 4990 -> "$4.990".
export function formatCLP(monto: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(monto);
}
