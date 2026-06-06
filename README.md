# Finanzas Pareja

Aplicación web responsive para gestionar las finanzas de una pareja, con sincronización en la nube entre dispositivos.

**Producción:** https://finanzas-personales-ebon.vercel.app — Fase 4.1 desplegada (identidad por cuenta + Yo/Mi pareja).

| Hecho | Pendiente |
|-------|-----------|
| Auth, pareja, movimientos/categorías/settings/importaciones en Supabase | Presupuestos, metas, gastos recurrentes |
| Identidad por cuenta: nombres desde perfiles, UI Yo/Mi pareja, migración `005` en prod | Tests de integración contra Supabase (opcional) |
| Deploy en Vercel (`npm run deploy`) | Offline-first con cola de sync |
| Realtime entre navegadores | |
| Códigos de invitación (expiración, revocación, regeneración) en prod | |

Detalle: `siguiente-sesion-implementacion.md`. Flujo local → deploy: `flujo-desarrollo-deploy.md`.

## Git y GitHub

Repositorio privado recomendado (app personal con Supabase en producción).

### Flujo de trabajo

```
main (producción) ← PR ← feature/nombre-corto
```

1. Crear rama: `git checkout -b feature/mi-cambio`
2. Desarrollar y validar: `npm run ci` (tests + build)
3. Push y abrir Pull Request hacia `main`
4. Merge cuando CI pase en GitHub
5. **Deploy automático:** Vercel publica al mergear a `main` (repo conectado en [Settings → Git](https://vercel.com/eligiomorales-1082s-projects/finanzas-personales/settings/git))

**CI en GitHub:** cada push y PR ejecuta `npm test` y `npm run build` (`.github/workflows/ci.yml`).

**Deploy manual** (solo si hace falta): `npm run deploy` — usa variables ya guardadas en Vercel, no lee `.env.local`.

**Secretos:** nunca commitear `.env.local`. Solo `.env.example` va al repo.

### Subir el repo por primera vez

```bash
# Crear repo en GitHub (web o gh repo create finanzas-personales --private --source=. --push)
git remote add origin git@github.com:TU_USUARIO/finanzas-personales.git
git push -u origin main
```

Opcional en GitHub → Settings → Branches: proteger `main` (requerir PR + CI verde antes de merge).

## Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS 4** — diseño mobile-first
- **Supabase** — auth, Postgres y sincronización compartida (modo principal)
- **Dexie.js** — persistencia local de respaldo (modo sin Supabase)
- **React Router** — navegación
- **PapaParse** + **SheetJS** + **PDF.js** + **Tesseract.js** — importación CSV/Excel/PDF y capturas (OCR local)

## Ejecutar

```bash
npm install
cp .env.example .env.local   # completar credenciales de Supabase
npm run dev
```

Abre http://localhost:5173 en el navegador.

Sin `.env.local` la app arranca en **modo local** (IndexedDB + datos de ejemplo). Con Supabase configurado pide login y usa datos compartidos.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm test` | Tests unitarios (balance, filtros, import, etc.) |
| `npm run ci` | Tests + build (mismo chequeo que GitHub Actions) |
| `npm run deploy` | Deploy a Vercel (production) con variables de `.env.local` |

## Funcionalidades

- Registro de ingresos, gastos y liquidaciones
- Distinción personal / compartido con reparto configurable (50/50, 70/30, etc.)
- Balance entre personas: pagado vs. asumido
- Dashboard con resumen del mes
- Análisis de gastos por categoría
- Filtros en lista de movimientos
- Importación CSV/Excel/PDF (Galicia Mastercard/Visa, Santander Visa) y capturas Wallbit (OCR en el navegador) con revisión previa y detección de duplicados
- Configuración de categorías y moneda; **tu nombre** vinculado a tu cuenta (no editable por la pareja)
- **Identidad por cuenta** — rol fijado al crear/unirse a la pareja; formularios con **Yo / Mi pareja**; pagador por defecto = usuario logueado
- **Auth email + contraseña** (Supabase)
- **Pareja compartida** — crear pareja o unirse con código de invitación
- **Códigos de invitación** — vencen a los 7 días (parejas nuevas), revocables y regenerables desde Ajustes
- **Sincronización en tiempo casi real** entre navegadores (movimientos, categorías, settings, importaciones)

## Datos y persistencia

| Recurso | Con Supabase (producción) | Sin Supabase (dev local) |
|---------|---------------------------|--------------------------|
| Movimientos | Nube, compartidos | IndexedDB local |
| Categorías | Nube, compartidas | IndexedDB local |
| Settings (moneda, cotización; nombres derivados de perfiles) | Nube | IndexedDB local (nombres editables manualmente) |
| Importaciones y pendientes | Nube, compartidas | IndexedDB local |
| Backup JSON export/import | Sigue disponible en Ajustes | IndexedDB local |

La lógica de balance vive en `src/lib/balance.ts` y no depende del backend.

### Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar en el [SQL Editor de Supabase](https://supabase.com/dashboard/project/nzerinfnrtycejptlypj/sql), en orden (copiar/pegar desde el repo local):
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_fix_auth_and_join.sql`
   - `supabase/migrations/003_imports_realtime.sql`
   - `supabase/migrations/004_invite_code_expiration.sql`
   - `supabase/migrations/005_couple_profile_read.sql`
3. En Authentication → Providers → Email: habilitar email/password (desactivar confirmación de email en dev si conviene)
4. Copiar Project URL y anon key a `.env.local`

### Flujo de pareja

1. Registrarse / iniciar sesión
2. Crear pareja (persona A) o unirse con código (persona B) — el rol queda fijado a la cuenta
3. Configurar **tu nombre** en Ajustes (solo el propio; el de la pareja se lee de su perfil)
4. El código de invitación está en **Ajustes → Cuenta y sincronización** (regenerar o revocar desde ahí)

Las parejas creadas antes de la migración `004` conservan su código sin vencimiento hasta que lo regeneren manualmente.

## Arquitectura (Fase 2+)

- **Repositorios** en `src/lib/repositories/` — Dexie (local) y Supabase (remoto)
- **Hooks** en `src/hooks/useData.ts` y `src/hooks/useCouplePersons.ts` — la UI no llama a Dexie ni Supabase directamente
- **Auth y pareja** en `src/contexts/AuthContext.tsx` y `src/lib/couple/` (`persons.ts`, `person-labels.ts`)
- **Schema SQL** en `supabase/migrations/`

## Producción

**Hosting:** [Vercel](https://vercel.com) (build estático de Vite, rewrites para React Router en `vercel.json`).

**URL:** https://finanzas-personales-ebon.vercel.app

**Deploy:** `npm run deploy` — sube variables de `.env.local` y publica en Vercel.

Guía completa (desarrollo local, validación, deploy, migraciones, preview): **`flujo-desarrollo-deploy.md`**.

## Próximas iteraciones

1. Presupuestos mensuales, metas, gastos recurrentes.
2. Offline-first con cola de sync.
3. Tests de integración contra Supabase.

Estado completo y prompt para la próxima sesión: `siguiente-sesion-implementacion.md`.
