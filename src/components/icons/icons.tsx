/**
 * Set de íconos SVG inline de Studio Spot.
 *
 * Reemplazan a los emojis de la interfaz (regla de UI: nada de emojis, solo SVG;
 * ver CLAUDE.md y SECURITY.md §6 — no se instalan librerías de íconos).
 *
 * Accesibilidad:
 *  - Decorativo (default): se renderiza con `aria-hidden` y `focusable={false}`.
 *  - Con significado: pasar `label` se expone `role="img"` + `aria-label`.
 *
 * Todos heredan el color con `currentColor` y el tamaño con la clase
 * (`h-* w-*`) o la prop `size`. Trazo 1.8 para un look pastel/redondeado.
 */
import type { SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  /** Texto accesible. Si se omite, el ícono es decorativo (aria-hidden). */
  label?: string;
  /** Tamaño en px (alternativa a clases h-/w-). */
  size?: number;
};

/** Envoltorio común: viewBox 24, trazo redondeado, color heredado. */
function SvgBase({ label, size, children, ...rest }: IconProps & { children: React.ReactNode }) {
  const a11y = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const, focusable: false as const };
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...a11y}
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ---- Tipos de espacio ---- */

// Café
export function CafeIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
      <path d="M17 9h2.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M7 2.5c-.6.8-.6 1.7 0 2.5M11 2.5c-.6.8-.6 1.7 0 2.5" />
      <path d="M3 21h15" />
    </SvgBase>
  );
}

// Coworking (maletín)
export function CoworkingIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M3 12h18M11 12v2" />
    </SvgBase>
  );
}

// Biblioteca (libros)
export function BibliotecaIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H9a1 1 0 0 1 1 1v14a1 1 0 0 0-1-1H5.5A1.5 1.5 0 0 1 4 16.5V5.5Z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H15a1 1 0 0 0-1 1v14a1 1 0 0 1 1-1h3.5a1.5 1.5 0 0 0 1.5-1.5V5.5Z" />
      <path d="M10 8h4M10 12h4" />
    </SvgBase>
  );
}

/* ---- Atributos / mapa ---- */

// Pin de ubicación
export function PinIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </SvgBase>
  );
}

// Enchufe
export function EnchufeIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M9 2.5v5M15 2.5v5" />
      <path d="M6 7.5h12v3a6 6 0 0 1-12 0v-3Z" />
      <path d="M12 16.5V22" />
    </SvgBase>
  );
}

// WiFi
export function WifiIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M2.5 9a14 14 0 0 1 19 0" />
      <path d="M5.5 12.5a9.5 9.5 0 0 1 13 0" />
      <path d="M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="0.6" fill="currentColor" stroke="none" />
    </SvgBase>
  );
}

// Antena / WiFi dedicado
export function AntenaIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M5 13a8 8 0 0 1 0-9M7.5 11a4.5 4.5 0 0 1 0-5" />
      <circle cx="10.5" cy="8.5" r="1.8" />
      <path d="M11.6 10 17 21M9.4 10 7 15" />
      <path d="M6 21h7" />
    </SvgBase>
  );
}

// Ruido (volumen)
export function RuidoIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M4 9.5h3l4-3.5v12l-4-3.5H4Z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
    </SvgBase>
  );
}

// Precio (moneda)
export function PrecioIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v9M14.2 9.5a2.4 2.4 0 0 0-2.2-1.3c-1.3 0-2.3.8-2.3 1.9 0 2.6 4.8 1.4 4.8 4 0 1.2-1.1 2-2.5 2A2.6 2.6 0 0 1 9.7 16" />
    </SvgBase>
  );
}

// Reloj (congestión por horario)
export function RelojIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </SvgBase>
  );
}

// Mapa
export function MapaIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M9 4 3.5 6.2v13L9 17l6 2.5 5.5-2.2v-13L15 6.5 9 4Z" />
      <path d="M9 4v13M15 6.5v13" />
    </SvgBase>
  );
}

/* ---- Personas / cuentas ---- */

// Comunidad (usuarios)
export function ComunidadIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.4a3.2 3.2 0 0 1 0 5.2M17.5 14.2A5.5 5.5 0 0 1 20.5 19" />
    </SvgBase>
  );
}

// Empresa (edificio)
export function EmpresaIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16" />
      <path d="M14 9h4a1 1 0 0 1 1 1v11" />
      <path d="M3 21h18" />
      <path d="M8 8h2M8 12h2M8 16h2M17 13h0M17 17h0" />
    </SvgBase>
  );
}

// Mochila (estudiante)
export function MochilaIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M6 9a6 6 0 0 1 12 0v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9Z" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
      <path d="M9 13h6v4H9z" />
    </SvgBase>
  );
}

/* ---- Premium / wallet ---- */

// Wallet
export function WalletIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a1 1 0 0 1 1 1v1.5" />
      <rect x="4" y="7.5" width="16" height="11.5" rx="2.5" />
      <path d="M20 11.5h-3.5a2 2 0 0 0 0 4H20" />
    </SvgBase>
  );
}

// Silla (espacio reservado)
export function SillaIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M7 4v7h10V4" />
      <path d="M6.5 11h11l-.7 5H7.2L6.5 11Z" />
      <path d="M7.5 16v4M16.5 16v4" />
    </SvgBase>
  );
}

// Destello (premium / marca)
export function DestelloIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M12 3c.4 3.3 1.4 4.3 4.7 4.7C13.4 8.1 12.4 9.1 12 12.4 11.6 9.1 10.6 8.1 7.3 7.7 10.6 7.3 11.6 6.3 12 3Z" />
      <path d="M18.5 13c.2 1.6.7 2.1 2.3 2.3-1.6.2-2.1.7-2.3 2.3-.2-1.6-.7-2.1-2.3-2.3 1.6-.2 2.1-.7 2.3-2.3Z" />
      <path d="M6 14c.2 1.4.6 1.8 2 2-1.4.2-1.8.6-2 2-.2-1.4-.6-1.8-2-2 1.4-.2 1.8-.6 2-2Z" />
    </SvgBase>
  );
}

// Bolsa de compra (carrito / pedido)
export function CartIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M6 8h12l-1 11.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.5L6 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </SvgBase>
  );
}

/* ---- Genéricos / UI ---- */

// Lupa (buscar / reclamar)
export function LupaIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.5-4.5" />
    </SvgBase>
  );
}

// Alerta
export function AlertaIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M12 3.5 1.8 21h20.4L12 3.5Z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17.8" r="0.6" fill="currentColor" stroke="none" />
    </SvgBase>
  );
}

// Check (visto)
export function CheckIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="m4.5 12.5 4.5 4.5 10.5-11" />
    </SvgBase>
  );
}

// dentro de círculo (estado confirmado)
export function CheckCircleIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8 12 2.8 2.8L16 9" />
    </SvgBase>
  );
}

// Corazón (favorito). `filled` rellena el trazo.
export function CorazonIcon({ filled, ...p }: IconProps & { filled?: boolean }) {
  return (
    <SvgBase {...p} fill={filled ? "currentColor" : "none"}>
      <path d="M19.5 12.572 12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.566Z" />
    </SvgBase>
  );
}

// Chevron abajo
export function ChevronDownIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="m6 9 6 6 6-6" />
    </SvgBase>
  );
}

// Flecha izquierda
export function FlechaIzquierdaIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </SvgBase>
  );
}

// Flecha derecha
export function FlechaDerechaIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </SvgBase>
  );
}

// Más (agregar)
export function MasIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M12 5v14M5 12h14" />
    </SvgBase>
  );
}

// Cerrar (equis)
export function EquisIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </SvgBase>
  );
}

// Lápiz (editar)
export function LapizIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" />
      <path d="M13.5 6.5l4 4" />
    </SvgBase>
  );
}

// Basurero (eliminar)
export function BasureroIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M10 11v6M14 11v6" />
    </SvgBase>
  );
}

// Imagen (marcador de foto)
export function ImagenIcon(p: IconProps) {
  return (
    <SvgBase {...p}>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="m4 17 5-5 4 4 3-2.5 4 3.5" />
    </SvgBase>
  );
}
