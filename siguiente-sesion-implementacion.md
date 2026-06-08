# Siguiente Sesion De Implementacion

## Estado: Fase 5 (UI Overhaul) completada en local — pendiente PR y deploy

La app está en Vercel con Supabase configurado. En **main/prod**: movimientos, categorías, settings, importaciones, invitaciones, identidad por cuenta, **presupuestos por categoría** y parsers adicionales (Visa Santander, Wallbit OCR). Migraciones `005`–`007` aplicadas.

En **local** (rama `ui-error-expense-parsing`, sin merge a main): overhaul visual completo según `DESIGN.md` + fix de parsing de gastos en importación (`a0885d5`). `npm run ci` verde.

**URL producción:** https://finanzas-personales-ebon.vercel.app

---

## Hecho

### Fase 2 — Supabase, auth y pareja

| Area | Detalle |
|------|---------|
| **Modelo remoto** | Tablas en `supabase/migrations/001_initial_schema.sql`: `profiles`, `couples`, `couple_members`, `categories`, `movements`, `couple_settings`, `imports`, `pending_import_movements` |
| **RLS** | Row Level Security por `couple_id`; políticas extra en `002_fix_auth_and_join.sql` (perfil, invitaciones, membresía) |
| **Auth** | Email + contraseña; login, registro, cierre de sesión |
| **Pareja** | Crear pareja (personA) o unirse con código (personB); código visible en Ajustes |
| **Capa de datos** | Repositorios Dexie + Supabase en `src/lib/repositories/`; hooks en `useData.ts` |
| **CRUD remoto** | Movimientos, categorías, settings (nombres, moneda, cotización) |
| **Liquidaciones** | Movimientos `type = settlement` en nube; visibles en ambos navegadores |
| **Balance** | Sin cambios en `src/lib/balance.ts`; tests pasando |
| **Realtime** | Suscripción compartida por tabla/pareja (`realtime-subscribe.ts`) |
| **Recuperación** | Detección de pareja existente al login; ErrorBoundary para errores de UI |
| **Migración local → nube** | UI en Ajustes con preview (`src/lib/migration/local-to-remote.ts`) — **no usada** (datos locales eran dummy) |
| **Modo fallback** | Sin `.env.local` sigue funcionando en IndexedDB con seed de ejemplo |

### Fase 3 — Deploy a producción

| Area | Detalle |
|------|---------|
| **Hosting** | Vercel — proyecto `finanzas-personales`, scope `eligiomorales-1082s-projects` |
| **Config SPA** | `vercel.json` (build Vite, rewrites React Router) |
| **Variables prod** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` en entorno **production** de Vercel |
| **Scripts** | `scripts/deploy-production.sh`, `scripts/configure-supabase-auth.sh`, `npm run deploy` |
| **Deploy** | https://finanzas-personales-ebon.vercel.app — login Supabase visible en prod |
| **Docs** | README con URL, pasos de deploy, checklist dos dispositivos |
| **Build y tests** | `npm run build` y `npm test` OK |
| **Auth URLs** | Site URL + redirect URLs prod y localhost configurados en Supabase |
| **Smoke test prod** | Login, pareja y movimiento verificados en dos dispositivos |

### Fase 4 — Importaciones en nube + códigos de invitación

| Area | Detalle |
|------|---------|
| **Importaciones Supabase** | Repositorio remoto en `supabase-repositories.ts`; hooks `useImports` / `usePendingImports`; realtime en `003_imports_realtime.sql` |
| **Revisión y duplicados** | Lógica compartida en `import-confirm.ts`; flujo de `ImportPage` sin cambios de UX |
| **Expiración de códigos** | Columna `invite_code_expires_at` en `004_invite_code_expiration.sql`; parejas nuevas: 7 días; parejas existentes: NULL (sin vencimiento) |
| **Revocación** | Desde Ajustes; marca `expires_at = now()` |
| **Regeneración** | Desde Ajustes; código nuevo + 7 días de validez |
| **Auto-expiración al unirse** | Cuando personB se une, el código queda invalidado |
| **Prod** | Migración `004` aplicada en Supabase; UI desplegada en Vercel |
| **Tests** | `invite-code.test.ts`, `import-confirm.test.ts` |

### Fase 4.1 — Identidad por cuenta (Yo / Mi pareja)

| Area | Detalle |
|------|---------|
| **Hook `useCouplePersons`** | Nombres desde `couple_members` + `profiles`; fallback a `couple_settings` para parejas existentes |
| **Etiquetas UI** | Formularios, importación, liquidaciones y filtros: **Yo (nombre)** / **Mi pareja (nombre)** |
| **Defaults** | Pagador por defecto = rol del usuario logueado (movimientos, importación, liquidación) |
| **Ajustes** | Cada usuario edita solo su `display_name`; nombre de la pareja solo lectura |
| **Sincronización legacy** | Al guardar nombre o unirse con código, se actualiza `couple_settings` para backup/export |
| **RLS** | `005_couple_profile_read.sql` — miembros pueden leer perfiles de su pareja |
| **Prod** | Migración `005` aplicada; UI desplegada; smoke test con dos cuentas OK |
| **Tests** | `person-labels.test.ts` (+ suite existente: 81 tests) |

### Fase 4.2 — Presupuestos por categoría (en prod)

| Area | Detalle |
|------|---------|
| **Modelo** | Tabla `category_budgets` en `006_category_budgets.sql`; RLS + realtime |
| **Límites fijos** | Migración `007_recurring_budgets.sql`: un presupuesto recurrente por categoría (`year_month = 'recurring'`), opt-in |
| **UI** | `BudgetPage.tsx`, `BudgetProgressBar.tsx`; progreso vs gastos del mes |
| **Prod** | PRs #3 y #4 mergeados a main; migraciones `006`/`007` pendientes de confirmar en Supabase prod |

### Fase 4.3 — Importadores y UX de importación (en prod)

| Area | Detalle |
|------|---------|
| **Parsers** | Visa Santander (PR #6), Wallbit + OCR de imagen/PDF (PR #5) |
| **UI importación** | Rediseño parcial en main (PR #7); wizard completo migrado al overhaul en Fase 5 |
| **Tests** | Fixtures y tests en `src/lib/import.test.ts` |

### Fase 5 — UI Overhaul incremental (sesión anterior, local)

Overhaul visual inspirado en Monarch, identidad propia (paleta cálida sage/teal, foco en finanzas de pareja). Sin cambios de lógica en `src/lib/`. Referencia: `DESIGN.md`.

| Area | Detalle |
|------|---------|
| **Brief visual** | `DESIGN.md`: principios, tokens, componentes obligatorios, criterios de aceptación |
| **Tokens globales** | `src/index.css`: paleta `brand-*`, `surface-*`, aliases semánticos (`income`/`expense`/`settlement`), radios; mantiene fix de inputs `date` en iOS |
| **Estilos compartidos** | `src/components/ui/styles.ts`: `focusRing`, `cardSurface`, `pageHeaderStrip`, tonos de texto |
| **Primitivos UI** | Refinados: `Form.tsx`, `Card.tsx`, `Alert.tsx`, `Dialog.tsx`, `Stepper.tsx`, `FilterChips.tsx` |
| **Componentes nuevos** | `PageHeader`, `SectionHeader`, `SegmentedControl`, `ChoiceChip`, `MetricCard`, `TextLink` + `ButtonLink` (evita `<Link><Button>`) |
| **Shell global** | `Layout.tsx`: bottom nav con iconos SVG, FAB con safe-area, contenedor desktop; loading/error en `App.tsx`, `main.tsx`, `ErrorBoundary.tsx` |
| **Dashboard piloto** | `DashboardPage` + `DashboardSummaryBento`, `DashboardCompensationRow`, `DashboardCategoryBreakdown`, `DashboardMovementList`, `InsightCard`, `OnboardingBanner` |
| **Migración de pantallas** | Login, CoupleSetup, Categories, Balance, Movements (+ `MovementFilterToolbar`), Settings, Budget, MovementForm, Import (+ componentes hijos) |
| **Controles unificados** | `SegmentedControl` en moneda (`CurrencyToggle`), vista personal/pareja (`BalanceScopeSelector`), create/join; `ChoiceChip` donde aplica |
| **Validación** | `npm run ci` verde en rama local |
| **Fix colateral** | Commit `a0885d5`: parsing de montos negativos/gastos en importación (`src/lib/import.ts`) |

### Archivos clave (Fase 2–5)

```
DESIGN.md
supabase/migrations/001_initial_schema.sql … 007_recurring_budgets.sql
src/index.css
src/components/ui/styles.ts
src/components/ui/PageHeader.tsx
src/components/ui/SectionHeader.tsx
src/components/ui/SegmentedControl.tsx
src/components/ui/ChoiceChip.tsx
src/components/ui/MetricCard.tsx
src/components/ui/TextLink.tsx
src/components/ui/Form.tsx
src/components/ui/Card.tsx
src/components/Layout.tsx
src/pages/DashboardPage.tsx
src/pages/ImportPage.tsx
src/pages/MovementFormPage.tsx
src/lib/couple/person-labels.ts
src/lib/import.ts
```

### Criterios de aceptación

**Fase 2–3**

- [x] Login funcional
- [x] Pareja creada o seleccionada
- [x] Movimientos en backend compartido
- [x] Misma lista visible en dos navegadores
- [x] Deploy en Vercel con variables prod
- [x] Smoke test prod (login + pareja + movimiento)

**Fase 4**

- [x] Importaciones compartidas entre usuarios de la pareja
- [x] Revisión previa, duplicados y confirmación sin regresiones
- [x] Códigos con expiración (7 días en parejas nuevas)
- [x] Regenerar y revocar desde Ajustes
- [x] Parejas existentes no afectadas (expires_at NULL)
- [x] Migración `004` aplicada en Supabase prod
- [x] Deploy con UI de invitaciones en prod

**Fase 4.1**

- [x] Nombres derivados de perfiles + rol de `couple_members` (no edición cruzada en Ajustes)
- [x] UI Yo / Mi pareja en formularios, importación, balance y listas
- [x] Pagador por defecto = usuario logueado
- [x] Migración `005` aplicada en Supabase prod
- [x] Smoke test prod con dos cuentas (nombres, defaults, balance)

**Fase 4.2**

- [x] Presupuesto opt-in por categoría con progreso mensual
- [x] Límites recurrentes (migración `007`)
- [ ] Confirmar migraciones `006`/`007` aplicadas en Supabase prod

**Fase 5 (UI Overhaul)**

- [x] `DESIGN.md` y tokens `brand-*` / `surface-*` en `index.css`
- [x] Componentes compartidos (`PageHeader`, `MetricCard`, `SegmentedControl`, `ChoiceChip`, `ButtonLink`)
- [x] Dashboard piloto y resto de pantallas migradas
- [x] Focus ring unificado (`styles.ts`)
- [x] `npm run ci` verde (local)
- [ ] Smoke manual mobile post-merge (Dashboard, nuevo movimiento, balance, filtros, presupuesto, importación)
- [ ] PR mergeado a main y deploy en Vercel
- [ ] Registrar gasto en &lt; 30 s en móvil (validación manual pendiente)

---

## Pendiente

### Próxima sesión de código (prioridad)

| Prioridad | Tarea |
|-----------|-------|
| 1 | **PR + merge UI Overhaul** (rama `ui-error-expense-parsing` → main) |
| 2 | Smoke visual mobile y deploy a prod |
| 3 | Confirmar migraciones `006`/`007` en Supabase prod si aún no aplicadas |
| 4 | Metas compartidas y gastos recurrentes (feature) |
| 5 | Tests de integración contra Supabase (opcional) |
| 6 | Offline-first con cola de sync (arquitectura) |

### Fuera de alcance

- Integraciones bancarias automáticas
- IA real
- Permisos avanzados por rol
- Multi-pareja o grupos de más de dos personas
- Resolución compleja de conflictos offline
- Modo oscuro (salvo decisión explícita antes de tocar tokens)
- Copiar marca/layout exacto de Monarch

---

## Riesgos vigentes

- **RLS en producción**: revisar políticas antes de uso real con datos sensibles; no usar `service_role` en el frontend.
- **`couple_settings.person_a/b_name`**: columnas legacy sincronizadas al guardar perfil; la fuente de verdad en UI es `profiles` + `couple_members`. Deprecación completa opcional en fase futura.
- **UI Overhaul sin merge**: prod sigue con estética anterior hasta PR/deploy; evitar divergencia prolongada.

---

## Prompt sugerido para la próxima sesión

```text
Quiero continuar Finanzas Pareja después del UI Overhaul (Fase 5).

Lee:
- README.md
- DESIGN.md
- siguiente-sesion-implementacion.md

Contexto:
- Producción: https://finanzas-personales-ebon.vercel.app (Vercel + Supabase).
- Main: presupuestos, importadores (Galicia, Santander, Wallbit OCR), identidad Yo/Mi pareja.
- Local (rama ui-error-expense-parsing): overhaul visual completo + fix parsing import; npm run ci verde; sin merge a main.

Objetivo:
- Abrir PR del UI Overhaul, mergear a main y validar smoke mobile en prod.
- Confirmar migraciones 006/007 en Supabase prod si faltan.

Ejecuta build y tests al final.
```

---

## Referencia histórica (plan original Fase 2)

<details>
<summary>Objetivo y decisiones originales</summary>

Evolucionar desde IndexedDB hacia datos compartidos, backup confiable, auth simple y fuente única de verdad.

**Decisión tomada:** Supabase primero, sin offline-first completo. IndexedDB queda como fallback local.

</details>
