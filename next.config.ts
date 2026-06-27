import type { NextConfig } from "next";

// Las imágenes del menú viven en el bucket público `menu` de Supabase Storage
// (ver supabase/migrations/0006_menu_pedidos.sql). Para servirlas con next/image
// hay que permitir explícitamente ese host/ruta en `remotePatterns` (cualquier
// otra URL externa responde 400). El host se deriva de la URL pública de Supabase
// para no hardcodear el proyecto; si la env no está, no se añade patrón.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl}/storage/v1/object/public/menu/**`)]
      : [],
  },
};

export default nextConfig;
