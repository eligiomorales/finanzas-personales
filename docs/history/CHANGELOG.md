# Changelog — fases entregadas

Historial append-only de lo construido. El **estado actual** vive en `NEXT.md`; acá solo se acumula lo ya cerrado.

---

## TRK-4 — Tendencia por categoría (2026-06-27)

Segundo slide del carrusel en `/analisis/tendencias`: evolución mensual de gasto por categoría.

| Area | Detalle |
|------|---------|
| **Lógica** | `buildCategoryMonthlyTrends` en `monthly-trends.ts` — gasto por categoría × 6 meses; respeta vista pareja/personal |
| **UI** | `CategoryTrendBarChart` + dropdown; slide "Categoría" entre flujo de caja y ritmo de gasto |
| **Tests** | 3 casos nuevos en `monthly-trends.test.ts` |
| **Brief** | `briefs/2026-06-27-trk-4-tendencia-categoria.md` |

Sin dependencias nuevas. `npm run ci` verde (257 tests).

---

## DASH-2 — Compensación arriba (2026-06-27)

Callout protagonista en dashboard para el balance entre integrantes.

| Area | Detalle |
|------|---------|
| **UI** | `DashboardCompensationRow`: label, badge Pendiente/Saldado, monto `text-2xl`, CTA a `/balance?scope=period` |
| **Posición** | Debajo de `DashboardSummaryBento` (sin cambio de layout) |
| **Brief** | `briefs/2026-06-27-dash-2-compensacion-arriba.md` |

Sin lógica nueva ni dependencias. `npm run ci` verde (254 tests).

---

## TRK-3 — Tendencias mensuales (2026-06-21 + polish 2026-06-22)

Tab **Tendencias** en `/analisis/tendencias`: evolución de 6 meses y distribución por categoría.

| Area | Detalle |
|------|---------|
| **MVP (21)** | `TrendPage.tsx` + `monthly-trends.ts`: barras de gastos y detalle mensual |
| **Rediseño (22)** | Carrusel: flujo de caja (barras ingreso/gasto + línea ahorro) y ritmo de gasto (acumulado vs prom. diario 3m) |
| **Categorías** | Dona + listado `monto (%)`; filtro por mes seleccionado en flujo de caja |
| **Resumen mes** | Inline bajo el gráfico (ingresos / gastos / ahorro) — evita clip del carrusel |
| **Componentes** | `src/components/trends/`: `CashFlowChart`, `CumulativeSpendChart`, `CategoryDonutBreakdown`, `TrendChartCarousel` |
| **Tests** | `monthly-trends.test.ts` (`buildCumulativeSpendSeries`) |

Sin nuevas dependencias; SVG inline. `npm run ci` verde (247 tests).

---

## IMP-UI — Pulido Pantalla Import (2026-06-21)

Reorganización del paso `review`: resumen compacto, excepciones first (Opción A del canvas), bulk colapsable, filas compactas para auto-aprobados, footer sobre nav con safe-area.

| Area | Detalle |
|------|---------|
| **Decisión** | Canvas `imp-ui-import-redesign.canvas.tsx` · Opción A · brief `briefs/2026-06-21-imp-ui-import-polish.md` |
| **ImportPage** | 4 métricas max; filtros antes de lista; `CollapsiblePanel` para lote y comercios; `Alert`/`EmptyState`; footer `bottom-[calc(4.5rem+safe-area)]` |
| **Cards** | `ImportReviewItemCard` compact + `CollapsiblePanel` ajustes; `embedded` en batch/merchant cards |
| **Sin cambios** | Parsing, scoring, reglas, persistencia |

`npm run ci` verde (238 tests).

---

## IMP-5 — Reglas Desde Import (2026-06-21)

Checkbox "Recordar para próximas importaciones" al corregir categoría en import; reglas persistidas al confirmar el lote; match futuro → confianza 95 (auto-aprobado).

| Area | Detalle |
|------|---------|
| **Helpers** | `defaultImportRuleKeyword`, `buildImportRuleCandidatesToSave`, `importItemCategoryWasCorrected`, `findExistingImportRuleForItem` en `import-display.ts` |
| **UI** | Checkbox + keyword editable en `ImportReviewItemCard`; estado `rememberedRules` en `ImportPage`; `addRule()` antes de `confirmImport` |
| **Confianza** | `IMPORT_CONFIDENCE.USER_RULE` (95) ya wired en `suggestCategoryWithConfidence` |
| **Tests** | +2 en `import.test.ts`, +4 en `import-display.test.ts` |

Epic **Import by exception** (IMP-1→IMP-5) cerrado.

`npm run ci` verde (238 tests).

---

## IMP-4 — Bulk Actions Merchant (2026-06-21)

Agrupación por comercio repetido en review de import; aplicar categoría a N filas del mismo merchant en un clic.

| Area | Detalle |
|------|---------|
| **Helpers** | `normalizeImportMerchantKey`, `buildImportMerchantGroups`, `applyCategoryToImportMerchantGroup` en `import-display.ts` |
| **UI** | `ImportMerchantBulkActionsCard` debajo de defaults del lote en `ImportPage` |
| **Tests** | +5 en `import-display.test.ts` |

`npm run ci` verde (232 tests).

---

## IMP-3 — Edición Inline Import (2026-06-21)

Categoría editable in-place en cada fila de excepción; cambios persisten en `pendingItems` hasta confirmar; bloqueo si hay pendientes sin categoría.

| Area | Detalle |
|------|---------|
| **UI** | `ImportCategoryPicker` inline en `ImportReviewItemCard`; "Ajustar" solo reparto/moneda/extracto |
| **Validación** | `importPendingMissingCategory` + guard en `confirmSelected()` |
| **Tests** | +1 en `import-display.test.ts` |

`npm run ci` verde (227 tests).

---

## IMP-2 — Import by Exception (2026-06-21)

Revisión por excepción: lista primaria solo movimientos con `needsReview`; auto-aprobados ocultos por defecto; confirmar importa todo el lote pendiente.

| Area | Detalle |
|------|---------|
| **Helpers** | `importItemAutoApproved`, `shouldApplyImportBulkAction`, filtro `auto_approved`, `autoApprovedCount` en preview |
| **UI** | Default filtro `needs_review`; métricas Auto-aprobados / Para revisar; empty state positivo; bulk solo excepciones |
| **Tests** | +2 en `import-display.test.ts` |

`npm run ci` verde (226 tests).

---

## IMP-1 — Import Preview (2026-06-21)

Preview del lote importado en el paso `review`: N gastos, total ARS, requieren revisión, confianza estimada, CTA "Revisar pendientes".

| Area | Detalle |
|------|---------|
| **Confianza v0** | `suggestCategoryWithConfidence` + `scoreImportRowConfidence` en `src/lib/import.ts` |
| **Resumen** | `buildImportPreviewSummary` en `src/lib/import-display.ts` |
| **UI** | Tarjeta preview + filtro `needs_review` en `ImportPage.tsx` |
| **OCR** | Warnings por fechas faltantes en `parse-image.ts` |

`npm run ci` verde (224 tests).

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
