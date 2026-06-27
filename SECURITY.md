# Directrices de Seguridad — Studio Spot

> Stack objetivo: **Next.js + Supabase**, deploy en **Vercel**.
> Este documento es **normativo**: el agente que haga el scaffolding debe seguirlo al pie de la letra.
> Foco principal: **seguridad de cadena de suministro (supply chain)** y manejo de secretos.

**Última revisión:** 2026-06-26
**Versiones de referencia:** pnpm **11.x** (recomendada). Se incluyen notas para pnpm **10.x** porque varias opciones cambiaron de nombre/ubicación entre 10 y 11.

---

## 0. Resumen de decisiones

1. Gestor de paquetes **obligatorio: pnpm** (fijado por versión, instalado vía Corepack).
2. **Scripts de instalación de dependencias bloqueados por defecto** (no se ejecutan `preinstall`/`install`/`postinstall` de paquetes salvo aprobación explícita).
3. **Cuarentena de versiones nuevas** con `minimumReleaseAge` (mínimo 24 h, recomendado 1 semana para empezar).
4. `pnpm-lock.yaml` **siempre commiteado**; en CI se instala con `--frozen-lockfile`.
5. **Secretos fuera del repo**; la `service_role` de Supabase **nunca** llega al cliente.
6. **Toda dependencia nueva (pnpm o uv) se veta y aprueba ANTES de instalar** (prohibido instalar a ciegas; ver §6.0).
7. **Python: `uv` obligatorio, `pip` prohibido**; cuarentena con `exclude-newer` (~7 días) y `uv.lock` commiteado con hashes (ver §6).

---

## 1. Gestor de paquetes: pnpm obligatorio

### 1.1 Por qué pnpm (y no npm/yarn clásico)

- **Store con enlaces (content-addressable store):** pnpm guarda cada paquete una sola vez en un store global y crea *hard links* hacia `node_modules`. Ahorra disco y, sobre todo, permite **verificación de integridad** del contenido (`verify-store-integrity`).
- **Aislamiento estricto de dependencias (`node_modules` no plano):** por defecto un paquete **solo** puede importar lo que declara en su `package.json`. Esto elimina las **dependencias fantasma** (*phantom dependencies*) que aparecen con el `node_modules` plano de npm/yarn, donde código puede usar (y un atacante abusar de) paquetes nunca declarados.
- **`blockExoticSubdeps` (por defecto `true` en pnpm 11):** impide que dependencias transitivas se resuelvan desde fuentes "exóticas" (tarballs, git, URLs arbitrarias), reduciendo vías de inyección.
- **Bloqueo de scripts de build por defecto** y flujo explícito de aprobación (clave contra gusanos tipo Shai-Hulud; ver §2).

### 1.2 Fijar la versión de pnpm (reproducibilidad)

Fijar la versión exacta evita que cada desarrollador/CI use un pnpm distinto con defaults distintos.

En `package.json`:

```json
{
  "packageManager": "pnpm@11.1.0",
  "engines": {
    "node": ">=20.11.0",
    "pnpm": ">=11.0.0"
  }
}
```

Activar **Corepack** (incluido con Node) para que respete `packageManager`:

```bash
corepack enable
corepack prepare pnpm@11.1.0 --activate
pnpm --version   # debe imprimir 11.1.0
```

> Reemplazar `11.1.0` por la última 11.x estable verificada en el momento del scaffolding.
> **No** instalar pnpm con `npm i -g pnpm` sin fijar versión: rompe la reproducibilidad.

### 1.3 Dónde van las opciones (cambio importante en pnpm 11)

A partir de **pnpm 11**, el `.npmrc` queda reservado a **registro y autenticación** (`registry=`, `//registry.npmjs.org/:_authToken=`, etc.). **Las opciones propias de pnpm se configuran en `pnpm-workspace.yaml`** (o en el config global `~/.config/pnpm/config.yaml`). Las variables de entorno usan el prefijo `pnpm_config_*` (antes `npm_config_*`).

Por eso a continuación se da **cada opción en sus dos formas**:
- **YAML** (`pnpm-workspace.yaml`) → forma recomendada en pnpm 11.
- **kebab-case** (`.npmrc`) → válida en pnpm 10; en pnpm 11 sigue leyéndose para compatibilidad pero la forma canónica es YAML.

### 1.4 Configuración recomendada — `pnpm-workspace.yaml`

Crear en la raíz del repo:

```yaml
# pnpm-workspace.yaml — endurecimiento de cadena de suministro

# 1) Cuarentena de versiones recién publicadas (en MINUTOS).
#    1440 = 1 día (default en pnpm 11). Recomendado empezar con 1 semana.
minimumReleaseAge: 10080            # 7 días

# 1b) Excepciones puntuales (por nombre de paquete, aplica a todas sus versiones).
#     Mantener esta lista lo más vacía posible y justificar cada entrada.
minimumReleaseAgeExclude: []
#   - '@studio-spot/internal-pkg'   # ejemplo: paquete propio publicado en registro privado

# 2) Aprobación explícita de scripts de build de dependencias.
#    En pnpm 10/11 los scripts de install de dependencias están BLOQUEADOS por defecto.
#    'allowBuilds' (pnpm 11) es un mapa nombre -> booleano. true = permitido, false = denegado.
allowBuilds:
  # Se irá poblando con 'pnpm approve-builds' SOLO tras revisar cada paquete.
  # Ejemplos típicos que sí necesitan build nativo:
  # esbuild: true
  # '@swc/core': true
  # sharp: true

# 3) NO permitir todos los builds. Mantener en false (es el default).
dangerouslyAllowAllBuilds: false

# 4) Bloquear subdependencias exóticas (default true en pnpm 11; fijar explícito).
blockExoticSubdeps: true

# 5) Verificar integridad del store antes de enlazar (default true; fijar explícito).
verifyStoreIntegrity: true

# 6) Fallar ante peer dependencies faltantes/ inválidas.
strictPeerDependencies: true
```

### 1.5 Configuración recomendada — `.npmrc`

Solo registro/auth y un par de flags de comportamiento de CLI. **No** poner aquí secretos: el token se inyecta por variable de entorno en CI.

```ini
# .npmrc — registro, auth y comportamiento de CLI (NO secretos en claro)
registry=https://registry.npmjs.org/

# No ejecutar pre/post scripts del PROPIO proyecto de forma implícita.
# (Distinto de los scripts de instalación de DEPENDENCIAS, ver nota abajo.)
enable-pre-post-scripts=false

# Lockfile estricto: la CLI no debe "arreglar" el lockfile silenciosamente.
prefer-frozen-lockfile=true

# Si se usa registro privado con token, el token va por ENV, nunca hardcodeado:
# //registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

> **Aclaración importante sobre scripts (no confundir):**
> - `enable-pre-post-scripts` controla si pnpm encadena los `pre*`/`post*` **de tus propios scripts** de `package.json` (p. ej. `prebuild` antes de `build`). Ponerlo en `false` evita ejecuciones implícitas inesperadas.
> - Los scripts de **instalación de dependencias** (`preinstall`/`install`/`postinstall` de paquetes de terceros) **NO** se controlan con ese flag: en pnpm 10/11 están **bloqueados por defecto** y solo se ejecutan los paquetes aprobados vía `allowBuilds` / `pnpm approve-builds`.
> - Si se quiere el bloqueo total y absoluto de *cualquier* lifecycle script (propio y de deps), existe `ignore-scripts=true` / `ignoreScripts: true`. Útil en CI puro de instalación; tener en cuenta que también desactiva builds nativos legítimos.

### 1.6 Flujo de aprobación de builds (`pnpm approve-builds`)

Cuando una dependencia nueva trae scripts de instalación, pnpm los **omite** y avisa. Para revisarlos y decidir:

```bash
# Lista interactiva de builds pendientes; deja elegir cuáles aprobar.
pnpm approve-builds

# Aprobar/denegar paquetes concretos (prefijo ! = denegar):
pnpm approve-builds esbuild sharp '!core-js'
```

- Aprobar añade el paquete a `allowBuilds` con `true`; denegar lo añade con `false`.
- **Regla:** aprobar un build es una decisión de seguridad. Antes de aprobar, revisar el paquete (ver checklist §5) y qué hace su script de install.
- `--all` aprueba todo lo pendiente sin prompts: **prohibido** en este proyecto salvo emergencia justificada.

> **Nota pnpm 10:** la opción se llamaba `onlyBuiltDependencies` (lista de paquetes permitidos) en `package.json`/`pnpm-workspace.yaml`, con `neverBuiltDependencies`/`ignoredBuiltDependencies` para denegar. En **pnpm 11** todo eso se consolidó en el mapa **`allowBuilds`** (`paquete: true|false`). Si el scaffolding se hace con pnpm 10, usar `onlyBuiltDependencies`; con pnpm 11, `allowBuilds`.

### 1.7 Lockfile y CI

- **Commitear siempre `pnpm-lock.yaml`.** Nunca a `.gitignore`.
- Instalación local normal: `pnpm install`.
- **En CI siempre:**

```bash
pnpm install --frozen-lockfile
```

`--frozen-lockfile` falla si `package.json` y el lockfile no concuerdan, en vez de actualizar el lockfile silenciosamente. Esto impide que una resolución inesperada (o manipulada) entre sin pasar por revisión.

---

## 2. Amenaza Shai-Hulud / "mini Shai-Hulud" (gusano de supply chain en npm)

### 2.1 Qué es

**Shai-Hulud** es un **gusano autopropagante** en el ecosistema npm, observado por primera vez en **septiembre de 2025**, con oleadas posteriores (incl. "Shai-Hulud 2.0" a fines de 2025 y variantes en 2026 dirigidas a paquetes de SAP). Su funcionamiento:

1. **Ejecución vía scripts de instalación:** inyecta un `preinstall`/`postinstall` malicioso en el `package.json` del paquete troyanizado. El payload se ejecuta automáticamente cuando un desarrollador o un *runner* de CI hace `install`.
2. **Robo de secretos:** extrae credenciales del entorno de ejecución: **tokens de npm**, **tokens de GitHub**, y **credenciales de cloud / secretos de CI-CD** (variables de entorno, archivos de config).
3. **Autopropagación:** si encuentra un token de npm con permisos de publicación, **publica versiones troyanizadas de todos los paquetes a los que ese token tiene acceso**, propagándose por el registro sin intervención humana. Fue el primer gusano autopropagante exitoso documentado en npm.
4. **Persistencia / exfiltración por GitHub:** crea repositorios públicos y/o **GitHub Actions** maliciosos para exfiltrar los secretos robados y mantener presencia.

El patrón de "smash-and-grab" es rápido: la versión maliciosa suele detectarse y retirarse en **horas**, pero en ese intervalo cualquier `install` automático queda comprometido.

### 2.2 Mitigaciones concretas (aplicar todas)

- **Scripts de install de dependencias deshabilitados por defecto** (§1.4/§1.6). Es la defensa #1: aunque instales una versión troyanizada, su `postinstall` **no corre** hasta que apruebes explícitamente el build. No apruebes builds de paquetes que no deberían necesitarlos.
- **Cuarentena de versiones nuevas (`minimumReleaseAge`):** con 7 días (o mínimo 1 día), las versiones recién publicadas **no se resuelven** hasta cumplir la antigüedad. Como el malware se detecta y retira en horas, la cuarentena evita casi todos los "smash-and-grab". Mantener `minimumReleaseAgeExclude` casi vacío.
- **Revisar paquetes nuevos y actualizaciones antes de aprobar builds** (checklist §5).
- **Evitar dependencias innecesarias:** cada dependencia (y su árbol transitivo) es superficie de ataque. Preferir la librería estándar / utilidades propias antes que micro-paquetes.
- **Auditar:**

  ```bash
  pnpm audit                 # vulnerabilidades conocidas
  pnpm audit --prod          # solo dependencias de producción
  pnpm licenses list         # revisar también licencias/origen
  ```

- **Fijar versiones exactas para dependencias sensibles** (auth, crypto, SDK de Supabase, herramientas que corren en CI): usar versión exacta en `package.json` (sin `^`/`~`), p. ej. `"@supabase/supabase-js": "2.45.1"`. El lockfile fija el resto del árbol.
- **Vigilar advisories:** [GitHub Advisory Database](https://github.com/advisories), y si están disponibles **socket.dev** y/o **Snyk** integrados en el repo para detección de comportamiento malicioso (no solo CVEs).
- **Higiene de tokens:** los tokens de npm/GitHub usados en CI deben tener **el mínimo alcance** y, si es posible, ser **efímeros** (OIDC / tokens de corta vida) para que un robo tenga ventana de uso reducida (ver §4).

---

## 3. Manejo de secretos

### 3.1 Nunca commitear `.env*`

Incluir desde el primer commit en `.gitignore`:

```gitignore
# Variables de entorno y secretos
.env
.env.*
!.env.example          # se permite SOLO la plantilla sin valores reales
```

- Commitear únicamente **`.env.example`** con las **claves** (nombres) y valores vacíos o de ejemplo, como documentación.
- Si un secreto se filtra al historial: **rotarlo inmediatamente** (no basta con borrar el archivo; queda en el historial de git).

### 3.2 Cliente vs. servidor en Next.js

- En Next.js, **toda variable con prefijo `NEXT_PUBLIC_*` se inlinea en el bundle del cliente** y es visible para cualquiera. Úsalo **solo** para valores públicos.
- Variables **sin** `NEXT_PUBLIC_` solo existen del lado servidor (Server Components, Route Handlers, Server Actions, API routes).

Para Supabase:

| Variable | Prefijo | Dónde se usa |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | público | cliente y servidor |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | público | cliente (asume **RLS activado**) |
| `SUPABASE_SERVICE_ROLE_KEY` | **privado** | **solo servidor**, nunca expuesto |

- La **`service_role` key de Supabase JAMÁS** va al cliente ni a una variable `NEXT_PUBLIC_*`. Tiene privilegios que **saltan RLS**; filtrarla equivale a entregar la base de datos completa. Usarla únicamente en código server-side (y solo cuando sea estrictamente necesario).
- La **`anon` key** es pública por diseño, **pero solo es segura si RLS está activado** en todas las tablas accesibles.

### 3.3 Supabase RLS como modelo de autorización

- **Activar Row Level Security (RLS) en todas las tablas** expuestas y escribir políticas explícitas. La `anon` key (y la `authenticated`) **asumen RLS habilitado**; sin políticas, una tabla con RLS activado deniega por defecto (lo cual es correcto: empezar denegando y abrir con políticas).

```sql
-- Patrón base por tabla
alter table public.projects enable row level security;

-- Ejemplo: cada usuario solo ve/edita sus filas
create policy "owner can read"   on public.projects
  for select using (auth.uid() = user_id);
create policy "owner can write"  on public.projects
  for insert with check (auth.uid() = user_id);
```

- No usar la `service_role` para "saltarse" RLS por comodidad desde el backend salvo operaciones administrativas concretas y revisadas.

### 3.4 Secretos en Vercel

- Cargar los secretos como **Environment Variables del proyecto en Vercel** (Settings → Environment Variables), separadas por entorno (Production / Preview / Development). **No** en el repo.
- Marcar `SUPABASE_SERVICE_ROLE_KEY` solo para los entornos que la necesiten; nunca exponerla a build del cliente.
- Para desarrollo local, usar `vercel env pull .env.local` (y `.env.local` ignorado por git).

---

## 4. CI / repo

- **Lockfile congelado:** toda instalación en CI con `pnpm install --frozen-lockfile`. Falla el build si el lockfile no concuerda con `package.json`.
- **Revisión de dependencias en cada PR:**
  - Activar **Dependabot/Renovate** con agrupación y revisión humana (no auto-merge de mayores).
  - Activar **GitHub Dependency Review Action** para que el PR muestre dependencias nuevas/cambiadas y advisories.
  - Tratar cualquier cambio en `pnpm-lock.yaml` como cambio revisable: revisar **qué paquetes nuevos entran** y por qué.
- **Mínimos permisos para tokens (principio de menor privilegio):**
  - En GitHub Actions fijar `permissions:` al mínimo necesario, por defecto solo lectura:

    ```yaml
    permissions:
      contents: read
    ```

  - Preferir **OIDC / tokens efímeros** frente a PATs de larga vida (npm, cloud, Vercel).
  - Tokens de npm/registry con alcance mínimo (solo lectura si no se publica).
- **No exponer tokens en logs:** usar `secrets.*` de GitHub (se enmascaran), nunca `echo` de un secreto, nunca pasarlos por argumentos de CLI visibles en el log. Desactivar debug verboso en jobs que tocan secretos.
- **Aislar el `install` de scripts no aprobados también en CI:** el mismo `allowBuilds` aplica en CI; no usar `--all` ni `dangerouslyAllowAllBuilds` en pipelines.

---

## 5. Checklist final — antes de cada `pnpm install` de una dependencia nueva

Verificar **todo** lo siguiente antes de añadir o aprobar una dependencia:

- [ ] **¿Es realmente necesaria?** ¿Se puede resolver con código propio o algo ya instalado?
- [ ] **Reputación y mantenimiento:** descargas, repositorio activo, issues, último release, número de mantenedores.
- [ ] **Antigüedad de la versión:** ¿cumple `minimumReleaseAge` (>= 1 día, idealmente 7)? Si la quiero saltar, ¿por qué y está justificado en `minimumReleaseAgeExclude`?
- [ ] **¿Trae scripts de install?** Si pnpm pide aprobar build, **revisar el script** antes de `pnpm approve-builds`. Si no necesita build nativo y aun así pide ejecutar scripts → señal de alarma, **no aprobar**.
- [ ] **Árbol transitivo:** revisar dependencias que arrastra (`pnpm why <pkg>`, diff del lockfile). ¿Aparecen paquetes raros o typosquatting (nombres casi iguales a populares)?
- [ ] **Auditoría:** `pnpm audit` sin vulnerabilidades nuevas relevantes; revisar advisories (GitHub Advisory DB, socket.dev/Snyk si están).
- [ ] **Versión fijada** (exacta para deps sensibles) y **`pnpm-lock.yaml` actualizado y commiteado**.
- [ ] **Sin secretos nuevos hardcodeados** ni cambios que envíen datos a hosts externos.
- [ ] **El PR pasa Dependency Review** y la revisión humana del cambio del lockfile.
- [ ] Tras instalar, **CI corre con `--frozen-lockfile`** y sin `--all` / `dangerouslyAllowAllBuilds`.

---

## 6. Python / uv: gestión de dependencias y supply chain

Aplica a cualquier utilidad Python del proyecto (por ejemplo `tools-xlsx/`, la herramienta para leer/escribir la planilla `.xlsx` del curso). El mismo espíritu de las §1–§5 (cuarentena, lockfile, revisión previa) se traslada al ecosistema Python.

### 6.0 Proceso OBLIGATORIO de aprobación de dependencias (pnpm **y** uv)

**Antes de instalar CUALQUIER dependencia nueva** —de Node/pnpm o de Python/uv— se debe **vetar con una revisión de supply chain y obtener aprobación explícita ANTES de instalar**. Está **prohibido instalar "a ciegas"** (sin haber mirado el paquete).

La revisión mínima cubre:

1. **Legitimidad / typosquat:** confirmar el nombre exacto y el proyecto oficial (mantenedor, repo, organización). Desconfiar de nombres casi iguales a paquetes populares.
2. **Madurez y mantenimiento:** descargas, antigüedad, releases recientes, número de mantenedores, repo activo.
3. **Scripts de instalación / código nativo:** ¿ejecuta código en install (`postinstall` en npm, `setup.py` con lógica en sdist de Python)? ¿Trae binarios/compilación nativa? Preferir **pure-Python + wheels**.
4. **CVEs / advisories:** revisar GitHub Advisory DB, [OSV](https://osv.dev), PyPI/Snyk. Evaluar si afectan **nuestro uso concreto**.
5. **Red en runtime:** ¿hace llamadas de red que no debería?

El resultado se registra como **APROBADO** o **RECHAZADO** (ver registro de ejemplo en §6.6). Sin aprobación documentada, no se instala.

### 6.1 Python: **uv obligatorio, pip prohibido**

El gestor de paquetes Python obligatorio es **uv** (Astral). **`pip` está prohibido** para instalar dependencias del proyecto. Motivos:

- **Resolución reproducible** y universal (multiplataforma) con `uv lock` → `uv.lock`.
- **Lockfile con hashes** de cada artefacto: instalación verificable e idempotente.
- **Control de fuentes (índices) explícito**, evitando resoluciones desde fuentes exóticas.
- **Cooldown / cuarentena nativa de versiones** (`exclude-newer`), equivalente al `minimumReleaseAge` de pnpm (ver §6.2).

> `pip install` no fija el árbol transitivo con hashes por defecto ni ofrece cuarentena de versiones: por eso queda prohibido salvo dentro del propio uv (`uv pip ...`).

Fijar la versión de uv (reproducibilidad, igual que con pnpm en §1.2). Referencia: uv **0.11.x**, Python 3.14.

### 6.2 Estándar de antigüedad en uv (cooldown) — equivalente a `minimumReleaseAge`

uv implementa la cuarentena de versiones recién publicadas con la opción **`exclude-newer`**:

- Desde **uv 0.9.17** (diciembre 2025) `exclude-newer` acepta **duraciones relativas** además de timestamps absolutos. Esto es el "cooldown" nativo y es lo que usamos.
- **Valor recomendado: `"7 days"`** (cuarentena ~7 días), espejo del `minimumReleaseAge: 10080` minutos de pnpm (§1.4). Mínimo aceptable: `"1 day"`.

Configuración en `pyproject.toml` (sección `[tool.uv]`) o en `uv.toml`:

```toml
[tool.uv]
# Cuarentena: ignora versiones publicadas en los últimos 7 días.
exclude-newer = "7 days"

# Override por paquete SOLO si un fix de seguridad cae dentro de la ventana.
# Mantener vacío y justificar cada excepción (equivale a minimumReleaseAgeExclude):
# exclude-newer-package = { algun-paquete = "2026-06-26T00:00:00Z" }
```

Formatos aceptados por `exclude-newer`:
- **Duración relativa:** `"7 days"`, `"1 week"`, `"24 hours"` (o ISO-8601: `"P7D"`, `"PT24H"`). No se permiten meses/años (unidades de calendario).
- **Timestamp absoluto** (RFC 3339): `"2026-06-26T00:00:00Z"` o fecha local `"2026-06-26"`.

> **Limitación clave (igual que cualquier cuarentena por fecha de corte):** al hacer `uv lock`/`uv sync`, uv **convierte la duración relativa en un timestamp FIJO que queda guardado en `uv.lock`**. No es una ventana móvil perpetua: la fecha de corte se "congela" en el momento de la resolución y solo se recalcula cuando se vuelve a resolver. En la práctica funciona como cuarentena porque al lockear se descarta todo lo publicado en los últimos 7 días. Si se quiere mover la ventana, hay que re-resolver (`uv lock --upgrade`).
>
> **Override por paquete:** si un parche de seguridad legítimo cae dentro de la ventana de 7 días y se necesita ya, usar `exclude-newer-package = { paquete = "<timestamp>" }` (o `= false` para desactivar el cooldown solo en ese paquete), tras revisarlo. Es el equivalente Python de una entrada justificada en `minimumReleaseAgeExclude`.

### 6.3 No ejecutar build scripts innecesarios

Para dependencias **pure-Python** no hay nada que compilar: forzar el uso de **wheels** evita ejecutar el `setup.py` de un sdist (que es donde se inyectaría un payload tipo Shai-Hulud en Python). En `[tool.uv]`:

```toml
no-build = true   # rechaza compilar desde sdist; exige wheel ya construido
```

Si en el futuro se necesita un paquete con extensión nativa legítima, se levanta esta restricción **solo para ese paquete** y tras revisión (análogo al flujo `approve-builds` de §1.6).

### 6.4 Lockfile (`uv.lock`), hashes e instalación reproducible

- **`uv lock` genera `uv.lock`** con el árbol completo resuelto **y los hashes** de cada artefacto. **Commitear siempre `uv.lock`** (nunca a `.gitignore`), igual que `pnpm-lock.yaml`.
- Instalación local del entorno: `uv sync` (crea/actualiza el `.venv` desde el lockfile).
- **En CI siempre con lockfile congelado:**

  ```bash
  uv sync --frozen     # falla si pyproject.toml y uv.lock no concuerdan; no re-resuelve
  ```

  `--frozen` es el equivalente a `pnpm install --frozen-lockfile` (§1.7): impide que una resolución inesperada o manipulada entre sin pasar por revisión. uv verifica los hashes del lockfile al instalar.
- Para flujos estilo `requirements`, `uv pip install` admite `--require-hashes` (exige hash por cada paquete). Dentro de un proyecto con `uv.lock`, los hashes ya van implícitos en el lockfile.

### 6.5 Comandos correctos (respetando el estándar)

```bash
# Añadir una dependencia ya APROBADA (escribe en pyproject.toml + actualiza uv.lock):
uv add openpyxl==3.1.5

# Resolver/regenerar el lockfile aplicando la cuarentena de [tool.uv]:
uv lock

# Instalar el entorno desde el lockfile (local):
uv sync

# CI / instalación verificada y reproducible:
uv sync --frozen
```

> `uv add`/`uv lock`/`uv sync` leen automáticamente `exclude-newer`, `no-build` e índices desde `[tool.uv]`, así que el estándar se aplica sin flags extra. No inventar flags: el cooldown es **`exclude-newer`** (con duración relativa desde 0.9.17); uv **no** tiene un flag llamado `minimum-release-age`.

### 6.6 Registro de evaluación — `openpyxl` + `et-xmlfile` (ejemplo aplicado)

Aplicación del proceso §6.0 a la primera dependencia Python del proyecto:

| Criterio | Hallazgo |
|---|---|
| **Paquete canónico / typosquat** | **Legítimo.** `openpyxl` en PyPI es el proyecto oficial (homepage `openpyxl.readthedocs.io`, repo `foss.heptapod.net/openpyxl/openpyxl`). Su dependencia `et-xmlfile` es del **mismo mantenedor** (CharlieX) y la **misma organización** (`foss.heptapod.net/openpyxl/et_xmlfile`). No es typosquat. |
| **Madurez / mantenimiento** | Estándar de facto para `.xlsx` en Python, años en producción, descargas masivas. `openpyxl` 3.1.5 (2024-06-28), `et-xmlfile` 2.0.0 (2024-10-25). Ambos MIT, `Production/Stable`, `requires-python >=3.8`. |
| **Pure-Python / código nativo** | **Pure-Python**, sin binarios ni compilación (`py2.py3-none-any.whl`). Sin lógica peligrosa en install. `et-xmlfile` usa solo la stdlib. |
| **Red en runtime** | **No** hace llamadas de red; solo lee/escribe XML local. |
| **CVEs / advisories** | **CVE-2017-5992** (XXE) afectaba a 2.4.x (2017) — **no aplica** a 3.1.5. Nota actual: openpyxl no protege por defecto contra *billion-laughs*/*quadratic-blowup*; se mitiga instalando **`defusedxml`** (opcional). Irrelevante para nuestro uso (un `.xlsx` **local de confianza**). |
| **Nuestro uso** | Leer/escribir un `.xlsx` local de confianza del curso. Superficie mínima. |

**VEREDICTO: APROBADO.** `openpyxl==3.1.5` (+ transitiva `et-xmlfile`) es el paquete canónico, pure-Python, MIT, sin scripts de install peligrosos ni red en runtime, y sin CVEs que afecten nuestro uso (leer/escribir un `.xlsx` local de confianza). Se añade `defusedxml` como hardening opcional. Alternativa sin dependencias (manipular el XML del `.xlsx` a mano con `zipfile`+`xml`) existe pero es más frágil y propensa a errores; **se recomienda openpyxl**. Instalación con cuarentena de 7 días vía `uv add openpyxl==3.1.5` sobre el `[tool.uv]` de `tools-xlsx/pyproject.toml`.

---

### Referencias

- uv — Resolution (`exclude-newer`, cooldowns, lockfile): <https://docs.astral.sh/uv/concepts/resolution/>
- uv — Settings (`[tool.uv]`): <https://docs.astral.sh/uv/reference/settings/>
- openpyxl — PyPI: <https://pypi.org/project/openpyxl/> · repo: <https://foss.heptapod.net/openpyxl/openpyxl>
- et-xmlfile — PyPI: <https://pypi.org/project/et-xmlfile/>
- OSV — Open Source Vulnerabilities: <https://osv.dev>
- pnpm — Mitigating supply chain attacks: <https://pnpm.io/supply-chain-security>
- pnpm — Settings (`pnpm-workspace.yaml`): <https://pnpm.io/settings>
- pnpm 11.0 release notes: <https://pnpm.io/blog/releases/11.0>
- pnpm — `approve-builds`: <https://pnpm.io/cli/approve-builds>
- Microsoft Security — Shai-Hulud 2.0 guidance: <https://www.microsoft.com/en-us/security/blog/2025/12/09/shai-hulud-2-0-guidance-for-detecting-investigating-and-defending-against-the-supply-chain-attack/>
- Unit 42 (Palo Alto) — Shai-Hulud worm: <https://unit42.paloaltonetworks.com/npm-supply-chain-attack/>
- Wiz — Shai-Hulud npm supply chain attack: <https://www.wiz.io/blog/shai-hulud-npm-supply-chain-attack>
- GitHub Advisory Database: <https://github.com/advisories>
