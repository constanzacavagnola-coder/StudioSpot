"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";

import {
  AlertaIcon,
  CartIcon,
  CheckCircleIcon,
  EquisIcon,
  ImagenIcon,
  MasIcon,
  WalletIcon,
} from "@/components/icons";
import { formatCLP } from "@/lib/constants";
import { pagarPedido, type CheckoutResult } from "@/lib/orders/checkout";
import { ORDER_ESTADO_CLASES, ORDER_ESTADO_LABEL } from "@/lib/display";
import type { MenuItem, OrderEstado } from "@/lib/types";

/**
 * Feature B (cliente): sección Menú de la ficha del espacio. Client Component que
 * lista los ítems activos, mantiene un carrito local (por espacio) y dispara el
 * checkout con un DIÁLOGO DE CONFIRMACIÓN antes de pagar.
 *
 * Fuente de verdad: el servidor. El carrito solo envía `{ id, cantidad }`; los
 * precios y el total reales los pone la BD en `pagar_pedido` (el total mostrado
 * aquí es informativo). El `saldo` llega del servidor para avisar si no alcanza,
 * pero la validación dura vive en el RPC (`Saldo insuficiente`). Requiere sesión:
 * sin ella se muestra el menú en modo lectura con CTA a iniciar sesión.
 */

type Carrito = Map<string, number>; // itemId -> cantidad

type Linea = { item: MenuItem; cantidad: number };

export default function MenuCompra({
  placeId,
  slug,
  nombreEspacio,
  items,
  isAuthenticated,
  saldo,
}: {
  placeId: string;
  slug: string;
  nombreEspacio: string;
  items: MenuItem[];
  isAuthenticated: boolean;
  saldo: number;
}) {
  const router = useRouter();
  const [carrito, setCarrito] = useState<Carrito>(new Map());
  const [confirmando, setConfirmando] = useState(false);
  const [resultado, setResultado] = useState<
    Extract<CheckoutResult, { ok: true }> | null
  >(null);

  const itemsPorId = useMemo(
    () => new Map(items.map((i) => [i.id, i])),
    [items],
  );

  // Líneas del carrito resueltas contra el catálogo vigente (descarta ítems que
  // ya no estén o se hayan agotado tras un re-render con stock fresco).
  const lineas = useMemo<Linea[]>(() => {
    const out: Linea[] = [];
    for (const [id, cantidad] of carrito) {
      const item = itemsPorId.get(id);
      if (!item || item.stock <= 0) continue;
      out.push({ item, cantidad: Math.min(cantidad, item.stock) });
    }
    return out;
  }, [carrito, itemsPorId]);

  const total = useMemo(
    () => lineas.reduce((acc, l) => acc + l.item.precio_clp * l.cantidad, 0),
    [lineas],
  );
  const cantidadTotal = useMemo(
    () => lineas.reduce((acc, l) => acc + l.cantidad, 0),
    [lineas],
  );

  function setCantidad(id: string, cantidad: number) {
    setResultado(null);
    setCarrito((prev) => {
      const next = new Map(prev);
      const item = itemsPorId.get(id);
      const tope = item ? item.stock : 0;
      const c = Math.max(0, Math.min(cantidad, tope));
      if (c <= 0) next.delete(id);
      else next.set(id, c);
      return next;
    });
  }

  function limpiar() {
    setCarrito(new Map());
  }

  return (
    <section aria-labelledby="menu-heading">
      <h2 id="menu-heading" className="mb-1 text-lg font-semibold text-ink">
        Menú
      </h2>
      <p className="mb-4 text-sm text-ink-2">
        Pide desde aquí y paga con tu saldo Studio Spot. Retiras en el local.
      </p>

      {!isAuthenticated ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border-warm bg-background-alt px-4 py-3 text-sm text-ink-2">
          <span>Inicia sesión para armar tu pedido y pagar con tu saldo.</span>
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Iniciar sesión
          </Link>
        </div>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <ProductoCard
              item={item}
              cantidad={carrito.get(item.id) ?? 0}
              interactivo={isAuthenticated}
              onCambiar={(c) => setCantidad(item.id, c)}
            />
          </li>
        ))}
      </ul>

      {/* Resumen del carrito + botón comprar (solo con sesión y algo en el carrito). */}
      {isAuthenticated && lineas.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-border-warm bg-surface p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-2">
              <span className="font-semibold text-ink">{cantidadTotal}</span>{" "}
              {cantidadTotal === 1 ? "producto" : "productos"} ·{" "}
              <span className="font-semibold text-ink">{formatCLP(total)}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={limpiar}
                className="inline-flex items-center rounded-lg border border-border-warm px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-brand/40 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                Vaciar
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <CartIcon className="h-4 w-4" /> Comprar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Confirmación del pedido recién pagado (número + estado + enlace). */}
      {resultado ? (
        <PedidoConfirmado resultado={resultado} nombreEspacio={nombreEspacio} />
      ) : null}

      {confirmando ? (
        <DialogoConfirmacion
          lineas={lineas}
          total={total}
          saldo={saldo}
          placeId={placeId}
          slug={slug}
          onCerrar={() => setConfirmando(false)}
          onPagado={(res) => {
            setResultado(res);
            setConfirmando(false);
            limpiar();
            // Re-renderiza el Server Component para traer stock y saldo frescos
            // (el revalidatePath del server marca el cache; sin refresh las props
            // `items`/`saldo` quedarían con los valores de la carga inicial).
            router.refresh();
          }}
        />
      ) : null}
    </section>
  );
}

function ProductoCard({
  item,
  cantidad,
  interactivo,
  onCambiar,
}: {
  item: MenuItem;
  cantidad: number;
  interactivo: boolean;
  onCambiar: (cantidad: number) => void;
}) {
  const agotado = item.stock <= 0;

  return (
    <div
      className={`flex h-full gap-3 rounded-2xl border bg-surface p-3 shadow-sm ${
        agotado ? "border-border-soft opacity-75" : "border-border-warm"
      }`}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border-warm bg-background-alt">
        {item.imagen_url ? (
          <Image
            src={item.imagen_url}
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

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-ink">{item.nombre}</h3>
          {agotado ? (
            <span className="shrink-0 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-500/25">
              Agotado
            </span>
          ) : null}
        </div>

        {item.descripcion ? (
          <p className="mt-0.5 line-clamp-2 text-sm text-ink-2">
            {item.descripcion}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="text-sm font-semibold text-ink">
            {formatCLP(item.precio_clp)}
          </p>
          {interactivo && !agotado ? (
            cantidad > 0 ? (
              <Stepper
                cantidad={cantidad}
                max={item.stock}
                nombre={item.nombre}
                onCambiar={onCambiar}
              />
            ) : (
              <button
                type="button"
                onClick={() => onCambiar(1)}
                className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <MasIcon className="h-4 w-4" /> Agregar
              </button>
            )
          ) : !interactivo && !agotado ? (
            <span className="text-xs text-ink-3">Stock: {item.stock}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stepper({
  cantidad,
  max,
  nombre,
  onCambiar,
}: {
  cantidad: number;
  max: number;
  nombre: string;
  onCambiar: (cantidad: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border-warm bg-surface">
      <button
        type="button"
        onClick={() => onCambiar(cantidad - 1)}
        aria-label={`Quitar una unidad de ${nombre}`}
        className="grid h-8 w-8 place-items-center rounded-l-lg text-ink-2 transition-colors hover:bg-background-alt hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <MenosGlyph />
      </button>
      <span
        className="min-w-[2rem] text-center text-sm font-semibold text-ink"
        aria-live="polite"
      >
        {cantidad}
      </span>
      <button
        type="button"
        onClick={() => onCambiar(cantidad + 1)}
        disabled={cantidad >= max}
        aria-label={`Agregar una unidad de ${nombre}`}
        className="grid h-8 w-8 place-items-center rounded-r-lg text-ink-2 transition-colors hover:bg-background-alt hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MasIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Glifo "menos" inline (no hay ícono propio en el set; se evita texto/emoji). */
function MenosGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function DialogoConfirmacion({
  lineas,
  total,
  saldo,
  placeId,
  slug,
  onCerrar,
  onPagado,
}: {
  lineas: Linea[];
  total: number;
  saldo: number;
  placeId: string;
  slug: string;
  onCerrar: () => void;
  onPagado: (res: Extract<CheckoutResult, { ok: true }>) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const tituloId = useId();
  const confirmarRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const noAlcanza = total > saldo;

  // Al abrir: bloquear el scroll del fondo, enfocar el botón principal y, al
  // cerrar, devolver el foco al elemento que abrió el diálogo (a11y de modal).
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmarRef.current?.focus();
    return () => {
      document.body.style.overflow = overflowPrevio;
      previo?.focus?.();
    };
  }, []);

  // Escape para cerrar y trampa de foco (Tab/Shift+Tab cicla dentro del panel,
  // para que el teclado no se escape al contenido de fondo).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (!pending) onCerrar();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      const activo = document.activeElement;
      if (e.shiftKey) {
        if (activo === primero || !panel.contains(activo)) {
          e.preventDefault();
          ultimo.focus();
        }
      } else if (activo === ultimo || !panel.contains(activo)) {
        e.preventDefault();
        primero.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCerrar, pending]);

  function onConfirmar() {
    setError(null);
    startTransition(async () => {
      const res = await pagarPedido(
        placeId,
        slug,
        lineas.map((l) => ({ id: l.item.id, cantidad: l.cantidad })),
      );
      if (res.ok) onPagado(res);
      else setError(res.error);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => !pending && onCerrar()}
        className="absolute inset-0 cursor-default bg-ink/40"
        tabIndex={-1}
      />

      <div
        ref={panelRef}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-warm bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-soft px-5 py-4">
          <h3 id={tituloId} className="text-lg font-semibold text-ink">
            Confirmar pedido
          </h3>
          <button
            type="button"
            onClick={() => !pending && onCerrar()}
            disabled={pending}
            aria-label="Cerrar"
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-background-alt hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
          >
            <EquisIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
          <ul className="divide-y divide-border-soft">
            {lineas.map((l) => (
              <li
                key={l.item.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="min-w-0 text-ink">
                  <span className="font-medium text-ink-2">{l.cantidad}×</span>{" "}
                  {l.item.nombre}
                </span>
                <span className="shrink-0 font-medium text-ink">
                  {formatCLP(l.item.precio_clp * l.cantidad)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-border-soft pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-2">Total</dt>
              <dd className="text-base font-bold text-ink">{formatCLP(total)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="inline-flex items-center gap-1.5 text-ink-2">
                <WalletIcon className="h-4 w-4" /> Saldo disponible
              </dt>
              <dd className="font-medium text-ink">{formatCLP(saldo)}</dd>
            </div>
          </dl>

          {noAlcanza ? (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertaIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Tu saldo no alcanza para este pedido. Recarga en tu{" "}
                <Link href="/wallet" className="font-semibold underline">
                  wallet
                </Link>{" "}
                e inténtalo de nuevo.
              </span>
            </p>
          ) : null}

          <div aria-live="polite" className="mt-2 min-h-[1.25rem]">
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-soft px-5 py-4">
          <button
            type="button"
            onClick={onCerrar}
            disabled={pending}
            className="inline-flex items-center rounded-lg border border-border-warm px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-brand/40 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            ref={confirmarRef}
            type="button"
            onClick={onConfirmar}
            disabled={pending || noAlcanza || lineas.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Procesando…" : `Pagar ${formatCLP(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function PedidoConfirmado({
  resultado,
  nombreEspacio,
}: {
  resultado: Extract<CheckoutResult, { ok: true }>;
  nombreEspacio: string;
}) {
  // El estado inicial de todo pedido pagado es `pagado` (ver pagar_pedido).
  const estado: OrderEstado = "pagado";

  return (
    <div
      role="status"
      className="mt-5 rounded-2xl border border-mint-ink/30 bg-mint-ink/10 p-5"
    >
      <div className="flex items-start gap-3">
        <CheckCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-mint-ink" />
        <div className="min-w-0">
          <h3 className="font-semibold text-ink">¡Pedido confirmado!</h3>
          <p className="mt-1 text-sm text-ink-2">
            Tu pedido en {nombreEspacio} se pagó con tu saldo. Te avisamos cuando
            esté listo para retirar.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-ink">
              Pedido #{resultado.numero}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${ORDER_ESTADO_CLASES[estado]}`}
            >
              {ORDER_ESTADO_LABEL[estado]}
            </span>
            <span className="text-ink-2">
              · Total {formatCLP(resultado.total)} · Saldo{" "}
              {formatCLP(resultado.saldo)}
            </span>
          </div>
          <Link
            href="/mis-pedidos"
            className="mt-3 inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Ver mis pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}
