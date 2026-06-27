import Badge from "@/components/Badge";
import {
  NIVEL3_LABEL,
  PRECIO_LABEL,
  RUIDO_LABEL,
} from "@/lib/display";
import type { Place } from "@/lib/types";

const NEUTRO = "bg-stone-100 text-stone-700 ring-stone-200";

/** Conjunto de badges con los atributos clave de un espacio (enchufes, wifi, ruido, precio). */
export default function AtributoBadges({ place }: { place: Place }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge className={NEUTRO}>
        <span aria-hidden>🔌</span> Enchufes: {NIVEL3_LABEL[place.enchufes]}
      </Badge>
      <Badge className={NEUTRO}>
        <span aria-hidden>📶</span> WiFi: {NIVEL3_LABEL[place.wifi]}
      </Badge>
      <Badge className={NEUTRO}>
        <span aria-hidden>🔊</span> {RUIDO_LABEL[place.ruido]}
      </Badge>
      <Badge className={NEUTRO}>
        <span aria-hidden>💰</span> {PRECIO_LABEL[place.precio]}
      </Badge>
    </div>
  );
}
