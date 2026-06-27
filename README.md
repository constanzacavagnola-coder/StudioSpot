# Studio Spot

App web para encontrar **espacios de estudio y trabajo** con buen wifi, enchufes
disponibles y el nivel de ruido ideal para concentrarse.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`) para auth y datos
- Despliegue en **Vercel**
- Gestor de paquetes: **pnpm 11** (vía Corepack)

## Requisitos

- Node.js >= 20.11.0
- pnpm >= 11 (recomendado activarlo con Corepack):

  ```bash
  corepack enable
  corepack prepare pnpm@11.7.0 --activate
  ```

## Cómo correr en local

```bash
pnpm install        # instala dependencias (en CI: pnpm install --frozen-lockfile)
cp .env.example .env.local   # y rellenar con tus valores de Supabase
pnpm dev            # http://localhost:3000
```

Otros scripts:

```bash
pnpm build          # build de producción
pnpm start          # servir el build
pnpm lint           # ESLint
pnpm typecheck      # comprobación de tipos (tsc --noEmit)
```

## Variables de entorno

Definir en `.env.local` (local) y en Vercel (Settings → Environment Variables).
Plantilla completa en [`.env.example`](./.env.example).

| Variable | Visibilidad | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | pública | cliente y servidor |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | cliente (requiere **RLS activado**) |
| `SUPABASE_SERVICE_ROLE_KEY` | **privada / solo servidor** | operaciones admin; **nunca** al cliente |

Los clientes de Supabase están en `src/lib/supabase/`: `client.ts` (navegador) y
`server.ts` (Server Components / Route Handlers / Server Actions).

## Seguridad

Este proyecto sigue directrices estrictas de **seguridad de cadena de suministro**
y manejo de secretos. Antes de añadir dependencias, aprobar builds o tocar la
configuración de pnpm, **leer [`SECURITY.md`](./SECURITY.md)** (documento normativo).

Puntos clave:

- Scripts de build de dependencias **bloqueados por defecto** (`allowBuilds` en
  `pnpm-workspace.yaml`). No aprobar builds a ciegas.
- Cuarentena de versiones nuevas con `minimumReleaseAge` (7 días).
- `pnpm-lock.yaml` siempre commiteado; en CI instalar con `--frozen-lockfile`.
- Secretos fuera del repo; la `service_role` de Supabase nunca llega al cliente.
