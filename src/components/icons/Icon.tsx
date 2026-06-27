/**
 * Componente `Icon` con prop `name`: forma cómoda de usar el set de íconos
 * cuando el nombre se decide en datos (p. ej. mapear `place.tipo` o filas de una
 * tabla) en lugar de importar cada componente. Para usos puntuales, importar el
 * componente concreto desde `@/components/icons` es igual de válido.
 *
 * Accesibilidad: hereda el contrato de `IconProps` (decorativo por defecto;
 * pasar `label` para exponerlo a lectores de pantalla).
 */
import type { IconProps } from "./icons";
import {
  AlertaIcon,
  AntenaIcon,
  BibliotecaIcon,
  CafeIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ComunidadIcon,
  CorazonIcon,
  CoworkingIcon,
  DestelloIcon,
  EmpresaIcon,
  EnchufeIcon,
  FlechaDerechaIcon,
  FlechaIzquierdaIcon,
  LupaIcon,
  MapaIcon,
  MochilaIcon,
  PinIcon,
  PrecioIcon,
  RelojIcon,
  RuidoIcon,
  SillaIcon,
  WalletIcon,
  WifiIcon,
} from "./icons";

export type IconName =
  | "cafe"
  | "coworking"
  | "biblioteca"
  | "pin"
  | "enchufe"
  | "wifi"
  | "antena"
  | "ruido"
  | "precio"
  | "reloj"
  | "mapa"
  | "comunidad"
  | "empresa"
  | "mochila"
  | "wallet"
  | "silla"
  | "destello"
  | "lupa"
  | "alerta"
  | "check"
  | "check-circle"
  | "corazon"
  | "chevron-down"
  | "flecha-izquierda"
  | "flecha-derecha";

const REGISTRY: Record<IconName, (p: IconProps) => React.ReactElement> = {
  cafe: CafeIcon,
  coworking: CoworkingIcon,
  biblioteca: BibliotecaIcon,
  pin: PinIcon,
  enchufe: EnchufeIcon,
  wifi: WifiIcon,
  antena: AntenaIcon,
  ruido: RuidoIcon,
  precio: PrecioIcon,
  reloj: RelojIcon,
  mapa: MapaIcon,
  comunidad: ComunidadIcon,
  empresa: EmpresaIcon,
  mochila: MochilaIcon,
  wallet: WalletIcon,
  silla: SillaIcon,
  destello: DestelloIcon,
  lupa: LupaIcon,
  alerta: AlertaIcon,
  check: CheckIcon,
  "check-circle": CheckCircleIcon,
  corazon: CorazonIcon,
  "chevron-down": ChevronDownIcon,
  "flecha-izquierda": FlechaIzquierdaIcon,
  "flecha-derecha": FlechaDerechaIcon,
};

export function Icon({ name, ...props }: IconProps & { name: IconName }) {
  const Cmp = REGISTRY[name];
  return <Cmp {...props} />;
}
