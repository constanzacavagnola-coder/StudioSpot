# Plan de implementación — Studio Spot (features de cuenta)

> Contrato único para el loop multi-agente. Los agentes DEBEN ceñirse a esto.
> Stack: Next.js 16 (App Router) + TS + Tailwind + `@supabase/ssr`. Gestor pnpm.
> **Leer primero** `AGENTS.md`, `SECURITY.md` y los docs en `node_modules/next/dist/docs/` (Next 16 tiene breaking changes).

## Estado base (ya hecho)
- App desplegada, datos en Supabase (`places`), lectura con fallback JSON en `src/lib/places.ts`.
- Esquema de cuentas YA APLICADO en Supabase (ver `supabase/migrations/0003_auth_favorites_wallet_business.sql`): tablas `profiles`, `favorites`, `wallet`, `wallet_tx`, `place_claims`, columna `places.owner_id`, función `claim_place(uuid)`. **No recrear el esquema; construir contra él.**
- Auth emails: confirmación activa, `site_url`/allow-list a producción. Plantillas español en `supabase/email-templates/` (el usuario las pega en el dashboard).

## Decisiones de producto (cerradas)
- **Roles:** dos tipos de cuenta, `usuario` y `empresa`. Implementar **selección de rol en el registro Y flujos/áreas dedicadas por rol** (completo para cada rol). El rol viaja en `user_metadata.rol` al registrarse y lo persiste el trigger en `profiles`.
- **Empresa↔espacio:** la empresa puede **reclamar** un espacio existente (`claim_place`) **y crear** uno nuevo (insert con `owner_id = auth.uid()`).
- **Wallet:** **saldo de DEMO / créditos ficticios. NO dinero real.** Dejarlo explícito en la UI. Recargas y descuentos simulados (insert en `wallet_tx` + update de `wallet.saldo_clp`).
- **Login:** email + contraseña con confirmación por correo. Google OAuth NO en esta iteración (queda preparado).

## Alcance de esta iteración del loop
Implementar **todo** lo siguiente, completo y pulido (UX, accesibilidad, rendimiento, seguridad, consistencia). Los agentes exploradores/aprobadores pueden añadir mejoras razonables dentro de este alcance.

### F1 · Autenticación
- `src/lib/supabase/` ya tiene client/server; añadir **middleware** (`src/middleware.ts`) que refresque la sesión (patrón `@supabase/ssr` para Next 16).
- Páginas: `/login`, `/registro` (con selección de rol usuario/empresa), `/registro-empresa` (atajo directo al flujo empresa), ruta de callback de confirmación (`/auth/callback`), y logout.
- `Navbar`: estado de sesión (entrar/registrarse vs. menú de cuenta con nombre + salir). Mostrar accesos según rol.
- Helpers: `getSession()`/`getProfile()` server-side; proteger rutas privadas.

### F2 · Favoritos (usuario)
- Botón "guardar" (corazón) en `PlaceCard` y en la ficha `/espacio/[slug]` (client component; insert/delete en `favorites`). Si no hay sesión, invita a entrar.
- Página `/mis-lugares`: lista de favoritos del usuario.

### F3 · Wallet demo (usuario)
- Página `/wallet`: saldo actual, botón "recargar" (montos fijos, ficticio), historial (`wallet_tx`). Banner "saldo de demostración".

### F4 · Dashboard de empresa
- `/dashboard` (solo rol empresa): lista de espacios del dueño (`places.owner_id = auth.uid()`).
- **Reclamar:** buscador de los 32 espacios → `claim_place(place_id)`.
- **Crear:** formulario de alta de espacio nuevo (mismos campos del esquema `places`).
- **Editar:** atributos (enchufes, wifi, ruido, precio, horario, ambiente) y **congestión por franja** (jsonb).

### F5 · Pulido transversal
- Estados loading/empty/error en todas las vistas nuevas.
- Accesibilidad (labels, foco, contraste), responsive, consistencia visual con la marca.
- Seguridad: nunca exponer `service_role`; confiar en RLS; validar inputs.
- `pnpm typecheck && pnpm lint && pnpm build` deben pasar.

## Reglas para el loop
1. **Explorar → planificar → implementar → verificar → commit**, por fase.
2. **Verde siempre:** tras cada cambio, typecheck/lint/build. Si rompe, se arregla o revierte.
3. **Commits por partes, técnicamente explicativos, SIN co-autor** (nada de `Co-Authored-By`).
4. **No instalar dependencias sin vetar** (SECURITY.md §6). Evitar libs nuevas; Tailwind + supabase-js bastan.
5. No tocar la carpeta padre (`entregafinal`), solo `StudioSpot`.
6. No recrear el esquema SQL (ya aplicado); si se necesita un cambio de schema, escribir un nuevo archivo de migración y DEJARLO documentado (lo aplica el humano).

## Pendientes fuera de esta iteración
- Google OAuth (requiere client id/secret de Google).
- SMTP propio para plantillas español + volumen de correo.
- Auto-deploy GitHub→Vercel (Vercel GitHub App).
