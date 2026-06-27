"use client";

import { useSyncExternalStore } from "react";

import { getFranjaActual } from "@/lib/places";
import type { Franja } from "@/lib/types";

/**
 * Lee la franja horaria del cliente sin provocar desajustes de hidratación: en
 * el servidor devuelve un valor constante ("mañana") y en el cliente la hora
 * real del navegador. Compartido por /explorar y /mis-lugares.
 */
const noopSubscribe = () => () => {};

export function useFranjaActual(): Franja {
  return useSyncExternalStore(
    noopSubscribe,
    () => getFranjaActual(),
    () => "mañana" as Franja,
  );
}
