# Plan de evolución — Studio Spot

Roadmap de features acordadas. Las marcadas ⏳ están pendientes de implementar; ✅ ya están.

## Estado actual (✅ hecho)
- App Next.js 16 desplegada en Vercel: https://studio-spot.vercel.app (deploy directo por CLI).
- Código en GitHub: https://github.com/constanzacavagnola-coder/StudioSpot (rama `main`).
- Datos reales (32 espacios de Santiago) en **Supabase** (`bqojbvsvcnrokirhplcj`), tabla `places` con RLS de lectura pública. La app lee de Supabase con fallback a JSON.
- Env vars en Vercel: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Production y Development.
- Auth emails: confirmación activa, `site_url` y allow-list apuntando a producción.

## Decisiones de producto
- **Wallet = saldo ficticio / créditos demo.** NO maneja dinero real (sin pasarela ni cumplimiento legal); es una demostración del modelo de negocio. Los "descuentos" se simulan.
- **Auth:** primero email + contraseña (Supabase); luego Google OAuth.
- **Dos tipos de cuenta:** usuario final y empresa (dueño de un espacio). El dashboard de empresa permite editar el propio espacio.

## Fase 1 — Autenticación (email + contraseña) ⏳
- Páginas `/login`, `/registro`, callback de confirmación; cierre de sesión.
- Usar `@supabase/ssr` (clientes ya existen) + middleware para refrescar sesión.
- Estado de sesión en el `Navbar` (entrar / mi cuenta / salir).
- Migración: tabla `profiles` (id = auth.users.id, nombre, rol `usuario`|`empresa`, created_at) con RLS (cada quien lee/edita su perfil); trigger que crea el profile al registrarse.

## Fase 2 — Favoritos / "Mis lugares" (versión free) ⏳
- Migración: tabla `favorites` (user_id, place_id, created_at, PK compuesta) con RLS por usuario.
- Botón "guardar" en `PlaceCard` y en la ficha; página `/mis-lugares` con los guardados.
- Requiere sesión (Fase 1).

## Fase 3 — Wallet demo ⏳
- Migración: `wallet` (user_id, saldo_clp int) + `wallet_tx` (id, user_id, monto, tipo `recarga`|`descuento`, glosa, created_at), RLS por usuario.
- Página `/wallet`: ver saldo, "recargar" (ficticio), historial de movimientos.
- Dejar visualmente claro que es saldo de demostración.

## Fase 4 — Google OAuth ⏳
- Crear OAuth Client en Google Cloud (Authorized redirect URI: `https://bqojbvsvcnrokirhplcj.supabase.co/auth/v1/callback`).
- Habilitar provider Google en Supabase (se puede vía Management API: `external_google_enabled`, client id/secret) — **requiere que el usuario provea client id + secret de Google**.
- Botón "Continuar con Google" en `/login`.

## Fase 5 — Dashboard de empresa ⏳
- Vincular un `place` a un dueño: columna `owner_id` en `places` (nullable) o tabla `place_owners`.
- RLS: el dueño puede `update` su propio espacio; el público sigue con solo lectura.
- `/dashboard`: el dueño edita atributos (enchufes, wifi, ruido, precio, horario) y **disponibilidad/congestión** por franja.
- Flujo de "reclamar espacio" (claim) o alta manual de empresas.

## Fase 6 — Infra y pulido ⏳
- **SMTP propio** (ej. Resend/SendGrid) para plantillas de correo en español + límites de envío reales.
- **Auto-deploy GitHub→Vercel**: instalar la Vercel GitHub App en el repo (requiere admin del repo) y conectar; habilita previews por PR.
- **Env var de Preview** en Vercel (hoy faltó; se agrega en dashboard o con token del equipo).
- **Loop de pulido multi-agente** (ver `.claude/skills/pulido-fino`) antes de un release.

## Pendientes que dependen del usuario
- Credenciales de **Google OAuth** (client id + secret) para Fase 4.
- Proveedor **SMTP** para correos en español / volumen (Fase 6).
- **Vercel GitHub App** autorizada en el repo (admin) para auto-deploy.
- Token de Vercel **del equipo `tive-team`** si se quiere automatizar más por API (el actual es personal).
