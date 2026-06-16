# Finanzas Pareja

Aplicación web responsive para gestionar las finanzas de una pareja, con sincronización en la nube entre dispositivos.

**Producción:** https://finanzas-personales-ebon.vercel.app — Fase 5 desplegada (UI overhaul + presupuestos + identidad Yo/Mi pareja).

| Hecho | Pendiente |
|-------|-----------|
| Auth, pareja, movimientos/categorías/settings/importaciones en Supabase | Metas compartidas, gastos recurrentes |
| Identidad por cuenta: nombres desde perfiles, UI Yo/Mi pareja | Tests de integración contra Supabase (opcional) |
| Presupuestos por categoría (mensual y recurrente); migraciones `006`/`007` en prod | Offline-first con cola de sync |
| UI overhaul (`docs/DESIGN.md`): tokens, componentes compartidos, pantallas migradas | |
| Motion Sprint 1: tokens, microinteracciones, `prefers-reduced-motion` (ver `backlog/motion.md`) | Motion Sprint 2+: rutas, skeletons, presupuesto animado |
| Deploy en Vercel (`npm run deploy`); realtime entre navegadores | |
| Códigos de invitación (expiración, revocación, regeneración) | |

Estado vivo: `NEXT.md` · historial: `docs/history/CHANGELOG.md`. Mapa de docs: `AGENTS.md`. Flujo local → deploy: `docs/deploy.md`. Flujo solo-founder + AI: `PLAYBOOK.md` · brief de feature: `templates/feature-brief.md`.

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
- **Framer Motion** — microinteracciones y animaciones (MVP en progreso)
- **PapaParse** + **SheetJS** + **PDF.js** + **Tesseract.js** — importación CSV/Excel/PDF y capturas (OCR local)

## Ejecutar

```bash
npm install
cp .env.example .env.local   # completar credenciales de Supabase
npm run dev
```

Abre http://localhost:5173 en el navegador.

Sin `.env.local` la app arranca en **modo local** (IndexedDB + datos de ejemplo). Con Supabase configurado pide login y usa datos compartidos.

**Probar en el celular (misma Wi‑Fi):** `npm run dev -- --host` → abrir la URL `Network` (ej. `http://192.168.x.x:5173`).

**Animaciones:** opcional `VITE_ANIMATIONS_ENABLED=false` en `.env.local` para desactivarlas. Backlog: `backlog/motion.md`.

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
- **Presupuestos por categoría** — límite mensual opt-in y límites recurrentes con barra de progreso
- **Sincronización en tiempo casi real** entre navegadores (movimientos, categorías, settings, importaciones, presupuestos)

## Datos y persistencia

| Recurso | Con Supabase (producción) | Sin Supabase (dev local) |
|---------|---------------------------|--------------------------|
| Movimientos | Nube, compartidos | IndexedDB local |
| Categorías | Nube, compartidas | IndexedDB local |
| Settings (moneda, cotización; nombres derivados de perfiles) | Nube | IndexedDB local (nombres editables manualmente) |
| Importaciones y pendientes | Nube, compartidas | IndexedDB local |
| Presupuestos por categoría | Nube, compartidos | IndexedDB local |
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
   - `supabase/migrations/006_category_budgets.sql`
   - `supabase/migrations/007_recurring_budgets.sql`
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

Guía completa (desarrollo local, validación, deploy, migraciones, preview): **`docs/deploy.md`**.

## Próximas iteraciones

1. Metas compartidas y gastos recurrentes.
2. Offline-first con cola de sync.
3. Tests de integración contra Supabase (opcional).

Guía de diseño vigente: `docs/DESIGN.md`.

Estado vivo y prompt para la próxima sesión: `NEXT.md`. Historial de fases: `docs/history/CHANGELOG.md`.
