import Badge from "@/components/Badge";
import { EnchufeIcon, PrecioIcon, RuidoIcon, WifiIcon } from "@/components/icons";
import {
  NIVEL3_LABEL,
  PRECIO_LABEL,
  RUIDO_LABEL,
} from "@/lib/display";
import type { Place } from "@/lib/types";

const NEUTRO = "bg-background-alt text-ink-2 ring-border-warm";
const ICONO = "h-3.5 w-3.5 text-ink-3";

/** Conjunto de badges con los atributos clave de un espacio (enchufes, wifi, ruido, precio). */
export default function AtributoBadges({ place }: { place: Place }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge className={NEUTRO}>
        <EnchufeIcon className={ICONO} /> Enchufes: {NIVEL3_LABEL[place.enchufes]}
      </Badge>
      <Badge className={NEUTRO}>
        <WifiIcon className={ICONO} /> WiFi: {NIVEL3_LABEL[place.wifi]}
      </Badge>
      <Badge className={NEUTRO}>
        <RuidoIcon className={ICONO} /> {RUIDO_LABEL[place.ruido]}
      </Badge>
      <Badge className={NEUTRO}>
        <PrecioIcon className={ICONO} /> {PRECIO_LABEL[place.precio]}
      </Badge>
    </div>
  );
}
