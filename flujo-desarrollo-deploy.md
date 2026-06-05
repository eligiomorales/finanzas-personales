# Flujo de desarrollo y deploy

Guía para probar cambios en local y publicarlos en producción.

**Producción:** [https://finanzas-personales-ebon.vercel.app](https://finanzas-personales-ebon.vercel.app)

**Estado actual:** migraciones `001`–`005` aplicadas en Supabase prod; frontend publicado en Vercel.

## Requisitos previos

- Node.js y dependencias instaladas (`npm install`)
- `.env.local` con credenciales de Supabase (copiá `.env.example` si no existe)
- Sesión en Vercel: `npx vercel login` (solo la primera vez o si expiró)

Variables necesarias en `.env.local` (no está en git; guardá la anon key aparte):

```bash
VITE_SUPABASE_URL=https://nzerinfnrtycejptlypj.supabase.co
VITE_SUPABASE_ANON_KEY=...   # Supabase → Settings → API Keys → Publishable key
```

**No ejecutes `vercel env pull` ni `vercel link` a mano** si no sabés qué hacen: pueden sobrescribir `.env.local` con tokens de Vercel y borrar tus `VITE_`*.

## Flujo habitual

```
Código → npm run dev → probar en localhost → npm run ci → PR → merge a main → CI + deploy Vercel
```

`**.env.local` es solo para desarrollo local** (`npm run dev`). El deploy **no lo usa** y no debería modificarlo.

### 1. Desarrollar en local

```bash
npm run dev
```

Abrí [http://localhost:5173](http://localhost:5173).


| Configuración        | Comportamiento                                                                          |
| -------------------- | --------------------------------------------------------------------------------------- |
| **Con `.env.local`** | Login, pareja, movimientos, importaciones y sync en tiempo real contra el mismo Supabase de producción |
| **Sin `.env.local`** | Modo IndexedDB con datos de ejemplo; útil para UI pura, no prueba auth ni sync          |


### 2. Validar antes de deployar


| Paso                | Comando           | Para qué                                                                     |
| ------------------- | ----------------- | ---------------------------------------------------------------------------- |
| Tests automáticos   | `npm test`        | Balance, filtros, import, etc.                                               |
| Build de producción | `npm run build`   | Detectar errores de TypeScript o del bundler                                 |
| Preview del build   | `npm run preview` | Probar el bundle compilado en [http://localhost:4173](http://localhost:4173) |


**Checklist manual** (recomendado si tocás auth, pareja, importaciones o sincronización):

1. Login / registro
2. Crear o unirse a pareja
3. Verificar **Ajustes → Tu nombre** (solo editable el propio; pareja solo lectura)
4. Crear un movimiento: pagador por defecto = **Yo**; confirmar en otro navegador (realtime)
5. Importar un resumen y confirmar defaults de pagador en importación
6. Revisar balance (etiquetas Yo / Mi pareja) y dashboard
7. (Opcional) Regenerar o revocar código en **Ajustes → Cuenta y sincronización**

### 3. Deploy a producción

**Habitual (con Git conectado en Vercel):** merge a `main` → CI verde → Vercel despliega solo.

Configuración: [finanzas-personales → Settings → Git](https://vercel.com/eligiomorales-1082s-projects/finanzas-personales/settings/git) → repo `eligiomorales/finanzas-personales`, rama `main`, Production.

**Manual** (fallback o emergencia):

```bash
npm run deploy
```

Equivale a:

```bash
npx vercel deploy --prod --yes --scope eligiomorales-1082s-projects
```

- Usa las credenciales de Supabase **ya guardadas en Vercel** (entorno Production).
- **No lee ni modifica** `.env.local`.

**Solo si cambiás la URL o la anon key de Supabase:**

```bash
# 1. Actualizá .env.local
# 2. Subí las variables a Vercel
npm run deploy:env
# 3. Publicá de nuevo
npm run deploy
```

Las variables `VITE_*` se inyectan en **build time** en los servidores de Vercel. Si cambiás credenciales, hace falta `deploy:env` + `deploy`.

### 4. Verificar en producción

Smoke test en [https://finanzas-personales-ebon.vercel.app](https://finanzas-personales-ebon.vercel.app) (idealmente dos dispositivos):

1. Login
2. Movimiento de prueba
3. Sincronización entre navegadores (movimientos e importaciones)
4. Balance coherente en ambos
5. (Si tocás invitaciones) Estado del código visible en Ajustes

Checklist completo de pareja + realtime: ver sección [Verificación en dos dispositivos](#verificación-en-dos-dispositivos).

## Resumen rápido

```bash
npm run dev          # local (usa .env.local)
npm test             # tests (opcional)
npm run build        # verificar que compila (opcional)
# merge a main       # Vercel despliega automáticamente (Git conectado)
npm run deploy       # fallback manual a producción
npm run deploy:env   # solo si cambiaste credenciales Supabase
```

## Casos especiales

### Cambios en la base de datos (migraciones SQL)

Los archivos viven en el repo local (`supabase/migrations/`); **no se suben solos** a Supabase.

Si agregás una migración nueva:

1. Copiá el contenido del `.sql` y ejecutalo en el [SQL Editor de Supabase](https://supabase.com/dashboard/project/nzerinfnrtycejptlypj/sql)
2. Validá en local con `npm run dev`
3. Deploy del frontend con `npm run deploy`

**Migraciones aplicadas en prod (hasta hoy):**

| Archivo | Contenido |
|---------|-----------|
| `001_initial_schema.sql` | Schema inicial + RLS |
| `002_fix_auth_and_join.sql` | Perfil, join por código |
| `003_imports_realtime.sql` | Realtime en importaciones |
| `004_invite_code_expiration.sql` | Expiración/revocación de códigos |
| `005_couple_profile_read.sql` | Lectura de perfiles entre miembros de la pareja |

Las migraciones **no se aplican solas** con el deploy de Vercel: siempre SQL Editor primero, deploy después.

### Preview en Vercel (sin tocar producción)

Para obtener una URL temporal de prueba:

```bash
npx vercel deploy
```

(sin `--prod`). Útil para compartir un cambio antes de publicarlo.

### Cambiás credenciales de Supabase

1. Actualizá `.env.local`
2. `npm run deploy:env`
3. `npm run deploy`

### Perdiste `.env.local`

1. URL: `https://nzerinfnrtycejptlypj.supabase.co`
2. Anon key: [Supabase → API Keys](https://supabase.com/dashboard/project/nzerinfnrtycejptlypj/settings/api-keys)
3. Pegala en `.env.local` para `npm run dev`. **No hace falta** para deployar: producción ya tiene las variables en Vercel.

### Supabase Auth (dominio de producción)

Ya configurado para prod y localhost. Solo hace falta revisar si cambia el dominio de Vercel.

En [Authentication → URL Configuration](https://supabase.com/dashboard/project/nzerinfnrtycejptlypj/auth/url-configuration):


| Campo             | Valor                                                                         |
| ----------------- | ----------------------------------------------------------------------------- |
| **Site URL**      | `https://finanzas-personales-ebon.vercel.app`                                 |
| **Redirect URLs** | `https://finanzas-personales-ebon.vercel.app/`** y `http://localhost:5173/**` |


Con token de cuenta (`https://supabase.com/dashboard/account/tokens`):

```bash
export SUPABASE_ACCESS_TOKEN="tu-token"
./scripts/configure-supabase-auth.sh https://finanzas-personales-ebon.vercel.app
```

## Deploy (primera vez)

Si el proyecto aún no está vinculado a Vercel:

1. `npx vercel login`
2. `.env.local` con `VITE_SUPABASE_*`
3. `npm run deploy:env` (sube variables a Vercel)
4. `npm run deploy`

## Verificación en dos dispositivos

1. Abrir la URL de producción en navegador A y B (o móvil + desktop)
2. Registrar/iniciar sesión con dos usuarios distintos
3. Usuario A: **Ajustes → Cuenta** → crear pareja; copiar código de invitación
4. Usuario B: unirse con el código
5. Usuario A: crear un movimiento de prueba (p. ej. gasto compartido)
6. Confirmar que el movimiento aparece en B en segundos (realtime)
7. (Opcional) Usuario A importa un resumen; Usuario B ve la importación pendiente
8. Revisar balance en ambos

No migrar datos de IndexedDB local a producción en este flujo.

## Importante: local y prod comparten datos

Local y producción apuntan al **mismo proyecto Supabase**. Un movimiento de prueba en localhost es un movimiento real en la base compartida.

Para pruebas destructivas:

- Usar cuentas o movimientos claramente de test, o
- Crear un proyecto Supabase aparte para desarrollo (otro `.env.local`)

**Modo local sin Supabase:** sin `.env.local`, la app usa IndexedDB para todo (incluidas importaciones). Con Supabase configurado, importaciones y el resto van a la nube.

## Archivos y scripts relacionados


| Recurso                    | Ubicación                                           |
| -------------------------- | --------------------------------------------------- |
| Deploy a producción        | `npm run deploy` → `scripts/deploy-production.sh`   |
| Sync credenciales → Vercel | `npm run deploy:env` → `scripts/sync-vercel-env.sh` |
| Config Auth Supabase       | `scripts/configure-supabase-auth.sh`                |
| Rewrites SPA               | `vercel.json`                                       |
| Migraciones SQL            | `supabase/migrations/`                              |
| Variables de ejemplo       | `.env.example`                                      |


