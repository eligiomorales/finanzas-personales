# Changelog — fases entregadas

Historial append-only de lo construido. El **estado actual** vive en `NEXT.md`; acá solo se acumula lo ya cerrado.

---

## Fase 5.1 — Lista de Movimientos (2026-06-19)

Rediseño de la pantalla `/movimientos`: agrupación por fecha (sin neto diario), cards con `CategoryAvatar`, pill del pagador (opción B), tap → editar, eliminar en formulario.

| Area | Detalle |
|------|---------|
| **Agrupación** | `src/lib/movements-grouping.ts` |
| **UI** | `MovementRow` variant `grouped-card`; skeleton agrupado |
| **UX** | Sin Editar/Eliminar en lista; delete en `MovementFormPage` |

`npm run ci` verde (208 tests).

---

## Fase 5 — UI Overhaul (en prod)

Overhaul visual inspirado en Monarch, identidad propia (paleta cálida sage/teal). Sin cambios de lógica en `src/lib/`. Referencia: `docs/DESIGN.md`.

| Area | Detalle |
|------|---------|
| **Brief visual** | `docs/DESIGN.md`: principios, tokens, componentes obligatorios, criterios |
| **Tokens globales** | `src/index.css`: paleta `brand-*`, `surface-*`, aliases semánticos (`income`/`expense`/`settlement`), radios; fix inputs `date` en iOS |
| **Estilos compartidos** | `src/components/ui/styles.ts`: `focusRing`, `cardSurface`, `pageHeaderStrip` |
| **Primitivos UI** | `Form.tsx`, `Card.tsx`, `Alert.tsx`, `Dialog.tsx`, `Stepper.tsx`, `FilterChips.tsx` |
| **Componentes nuevos** | `PageHeader`, `SectionHeader`, `SegmentedControl`, `ChoiceChip`, `MetricCard`, `TextLink` + `ButtonLink` |
| **Shell global** | `Layout.tsx`: bottom nav SVG, FAB con safe-area, contenedor desktop |
| **Dashboard piloto** | `DashboardPage` + `DashboardSummaryBento`, `DashboardCompensationRow`, `DashboardCategoryBreakdown`, `DashboardMovementList`, `InsightCard`, `OnboardingBanner` |
| **Migración de pantallas** | Login, CoupleSetup, Categories, Balance, Movements, Settings, Budget, MovementForm, Import |
| **Fix colateral** | Parsing de montos negativos/gastos en importación (`src/lib/import.ts`) |
| **Prod** | Smoke mobile OK; registro de gasto < 30 s |

Criterios: `docs/DESIGN.md` (overhaul) cumplidos; `npm run ci` verde; PR mergeado a main.

---

## Fase 4.3 — Importadores y UX de importación (en prod)

| Area | Detalle |
|------|---------|
| **Parsers** | Visa Santander (PR #6), Wallbit + OCR de imagen/PDF (PR #5) |
| **UI importación** | Rediseño parcial (PR #7); wizard migrado al overhaul en Fase 5 |
| **Tests** | Fixtures y tests en `src/lib/import.test.ts` |

---

## Fase 4.2 — Presupuestos por categoría (en prod)

| Area | Detalle |
|------|---------|
| **Modelo** | Tabla `category_budgets` en `006_category_budgets.sql`; RLS + realtime |
| **Límites fijos** | `007_recurring_budgets.sql`: presupuesto recurrente por categoría (`year_month = 'recurring'`), opt-in |
| **UI** | `BudgetPage.tsx`, `BudgetProgressBar.tsx`; progreso vs gastos del mes |
| **Prod** | PRs #3 y #4 mergeados; migraciones `006`/`007` aplicadas |

Decisión de alcance: `docs/decisions/0003-presupuesto-colaborativo-v1-solo-compartido.md`.

---

## Fase 4.1 — Identidad por cuenta (Yo / Mi pareja)

| Area | Detalle |
|------|---------|
| **Hook `useCouplePersons`** | Nombres desde `couple_members` + `profiles`; fallback a `couple_settings` |
| **Etiquetas UI** | Formularios, importación, liquidaciones, filtros: **Yo (nombre)** / **Mi pareja (nombre)** |
| **Defaults** | Pagador por defecto = rol del usuario logueado |
| **Ajustes** | Cada usuario edita solo su `display_name`; nombre de la pareja solo lectura |
| **RLS** | `005_couple_profile_read.sql` |
| **Tests** | `person-labels.test.ts` |

Decisión: `docs/decisions/0002-identidad-rol-fijo-por-cuenta.md`.

---

## Fase 4 — Importaciones en nube + códigos de invitación

| Area | Detalle |
|------|---------|
| **Importaciones Supabase** | Repositorio remoto en `supabase-repositories.ts`; hooks `useImports` / `usePendingImports`; realtime en `003_imports_realtime.sql` |
| **Revisión y duplicados** | Lógica compartida en `import-confirm.ts` |
| **Expiración de códigos** | `004_invite_code_expiration.sql`; parejas nuevas: 7 días; existentes: NULL |
| **Revocación / regeneración** | Desde Ajustes |
| **Tests** | `invite-code.test.ts`, `import-confirm.test.ts` |

---

## Fase 3 — Deploy a producción

| Area | Detalle |
|------|---------|
| **Hosting** | Vercel — proyecto `finanzas-personales` |
| **Config SPA** | `vercel.json` (build Vite, rewrites React Router) |
| **Variables prod** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` en Vercel |
| **Smoke test prod** | Login, pareja y movimiento en dos dispositivos |

---

## Fase 2 — Supabase, auth y pareja

| Area | Detalle |
|------|---------|
| **Modelo remoto** | `001_initial_schema.sql`: `profiles`, `couples`, `couple_members`, `categories`, `movements`, `couple_settings`, `imports`, `pending_import_movements` |
| **RLS** | Por `couple_id`; políticas extra en `002_fix_auth_and_join.sql` |
| **Auth** | Email + contraseña |
| **Pareja** | Crear (personA) o unirse con código (personB) |
| **Capa de datos** | Repositorios Dexie + Supabase en `src/lib/repositories/`; hooks en `useData.ts` |
| **Liquidaciones** | Movimientos `type = settlement` en nube |
| **Realtime** | Suscripción por tabla/pareja (`realtime-subscribe.ts`) |
| **Modo fallback** | Sin `.env.local` → IndexedDB con seed |

Decisión: `docs/decisions/0001-supabase-sobre-offline-first.md`.

---

## Fase 1 — MVP local

App local (IndexedDB) con registro manual, balance pagado/asumido, liquidaciones e importación revisable. Detalle del plan: `plan-implementacion-finanzas-pareja.md`.
