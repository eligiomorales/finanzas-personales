# Backlog de hallazgos — arquitectura y mantenibilidad

Hallazgos del review de `src/` (jun 2026). Lo de **escala de movimientos** (`listInRange`, queries por período, Balance lazy) está en [scoped-movements-queries.md](./scoped-movements-queries.md) y ya implementado.

Este doc retoma desde **Architecture / maintainability** para futuras sesiones.

---

## Architecture / maintainability

### 4. Dual-mode branching duplicado en cada hook

`useData.ts` repite `mode === 'local' ? useLiveQuery(...) : useRemoteQuery(...)` por recurso.

**Por qué importa:** cada entidad nueva duplica lógica; fácil que local y remote divergan.

**Dirección posible:** un helper fino (`useResourceQuery`) o un adapter único que unifique liveQuery + React Query sin abstraer de más.

---

### 5. Hooks locales bypass del repository

En local, varios hooks leen `db` directo; en remote van por `repos`.

**Por qué importa:** dos caminos de acceso; más difícil testear y mantener paridad.

**Dirección posible:** que local también pase siempre por `repos` (Dexie ya está implementado ahí).

---

### 6. `DataProvider` montado en dos lugares

- `main.tsx` → local-only (sin Supabase)
- `App.tsx` → remote después de auth

**Por qué importa:** bootstrap asimétrico; fácil romper al agregar providers.

**Dirección posible:** un solo árbol de providers; `main` solo seed/bootstrap, `App` siempre envuelve `DataProvider`.

---

### 7. Sin `useMutation` / actualización manual de cache

Writes van directo a repos; invalidación depende de Realtime.

**Por qué importa:** si Realtime falla o en local, la UI puede quedar stale; no hay optimistic updates.

**Dirección posible:** `useMutation` + `invalidateQueries` en mutaciones críticas; Realtime como refuerzo, no única fuente.

---

### 8. Páginas muy grandes (600–760 líneas)

`ImportPage`, `MovementFormPage`, `SettingsPage`, `BudgetPage` mezclan UI, estado y lógica.

**Por qué importa:** difícil revisar, testear y reutilizar; cambios riesgosos.

**Dirección posible:** extraer hooks por flujo (`useImportWizard`, `useMovementForm`) y subcomponentes por step/sección — sin over-engineering.

---

### 9. Sin code splitting por ruta

Todas las pages se importan eager en `App.tsx`.

**Por qué importa:** el bundle inicial crece con cada feature; first load lento en mobile.

**Dirección posible:** `React.lazy` + `Suspense` por ruta (Import/PDF/OCR se benefician mucho).

---

## Data layer (pendiente)

### 10. Prefetch al login

**Hecho:** ya no se prefetchea el listado completo; solo mes actual + settings/categories/budgets.

**Pendiente:** revisar si Dashboard u otras pantallas disparan fetches redundantes al montar.

---

### 11. `useCoreDataLoading`

**Hecho:** ya no espera movements completos.

**Pendiente:** podría derivarse de un único “bootstrap status” en lugar de hooks sueltos.

---

### 12. `movements-query.ts` acoplado a Dexie

Importa `db` directamente.

**Por qué importa:** difícil reutilizar la lógica de filtro/orden para queries server-side más adelante.

**Dirección posible:** funciones puras que reciban `Movement[]` o una interfaz de colección; Dexie/Supabase afuera.

---

### Dashboard sigue con listado completo

`DashboardPage` usa `useMovements()` para balance de pareja (compensation row) y onboarding.

**Por qué importa:** abrir la app en Dashboard sigue descargando todo el histórico en remote.

**Dirección posible:** lazy `useMovementsQuery({ enabled: needsAllTimeBalance })` o endpoint/RPC de balance acumulado sin traer todos los rows.

---

### `useDatabaseStats` en Settings

Remote path sigue derivando stats de `movements.list()`.

**Dirección posible:** `repos.getStats()` con `COUNT(*)` en Supabase; local ya tiene `getStats()` en Dexie.

---

## UX / reliability

### 13. Manejo de errores fino en mutaciones

Muchas pages hacen `catch` local; `AuthContext` solo `console.error` en membership.

**Por qué importa:** fallos parciales silenciosos (ej. pareja no cargada).

**Dirección posible:** canal común de errores (toast / banner) en mutaciones y auth.

---

### 14. Un solo `ErrorBoundary` global

**Por qué importa:** un error de render tumba toda la app.

**Dirección posible:** boundary por ruta o por sección crítica (Import, Form).

---

### 15. Íconos SVG inline duplicados

Import, Settings, Layout definen cada uno sus `*Icon`.

**Por qué importa:** duplicación y drift visual.

**Dirección posible:** módulo `components/icons` mínimo solo donde se repiten.

---

## Testing

### 16. Tests en `lib/`, páginas casi sin cobertura

~28 test files, casi todo lógica pura (PDF/OCR, balance, import).

**Por qué importa:** flujos UI (wizard import, form validation, budget edit) pueden regresar.

**Dirección posible:** tests de integración ligeros en hooks críticos (`useFilteredMovements`, `useMovementsInRange`) antes que E2E pesado.

---

## Prioridad sugerida (post scoped-queries)

| Prioridad | Item | Esfuerzo | Impacto |
|-----------|------|----------|---------|
| P1 | Dashboard lazy all-time balance | Medio | Mobile al abrir app |
| P1 | `getStats()` remoto sin `list()` | Bajo | Settings más liviano |
| P2 | `useMutation` + invalidación explícita | Medio | Confiabilidad cache |
| P2 | Code splitting Import/Form | Bajo | First load |
| P3 | Unificar `DataProvider` bootstrap | Medio | Mantenibilidad |
| P3 | Partir `ImportPage` / `SettingsPage` | Alto | DX a largo plazo |
| P3 | Error boundaries por ruta | Bajo | Resiliencia |

---

## Lo que ya está bien (no tocar sin motivo)

- Patrón repository local/remote
- React Query + Realtime con debounce
- Multiplexado de canales Realtime
- Lógica de dominio en `lib/` con buenos unit tests
- Contextos razonables para el tamaño de la app
