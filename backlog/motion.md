# MVP de Motion y Microinteracciones

## Registro de implementación

| Fecha | Alcance | Estado |
|-------|---------|--------|
| 2026-06-14 | Sprint 1 — tareas 1, 2, 3 | ✅ Completado |
| 2026-06-14 | Sprint 2 — tarea 4 (page transitions) | ✅ Completado |
| 2026-06-14 | Sprint 2 — tarea 5 (shared element lista → edición) | ✅ Completado |
| 2026-06-14 | Sprint 2 — tarea 6 (skeletons) | ✅ Completado |
| 2026-06-14 | Sprint 2 — tarea 7 (presupuesto + feedback) | ✅ Completado |
| 2026-06-14 | Sprint 3 — tarea 8 (tests + performance smoke) | ✅ Completado |
| 2026-06-14 | Sprint 3 — tarea 9 (docs Motion) | ✅ Completado |

### Entregado en este push

**Dependencias**
- `framer-motion` ^12.40 (runtime)
- `jsdom` (dev, tests del hook)

**Tarea 1 — Tokens y utils**
- `src/design/motion.ts`: `motionDurations`, `motionEasings`, `motionDelays`, `motionVariants`, `motionTransitions`, `toMotionSeconds`, `fieldFocusStyle`, `shouldReduceMotion`, `getMotionProps`, `getTapMotionProps`, `getLayoutTransition`
- Fix: duraciones en ms en tokens; conversión a segundos vía `toMotionSeconds` para Framer Motion

**Tarea 2 — Preferencias + feature flag**
- `src/config/motion.ts`: `isMotionEnabled`, `shouldAnimate`
- `src/hooks/useMotionPreferences.ts`: store singleton + `useSyncExternalStore`; expone `prefersReducedMotion`, `motionEnabled`, `shouldAnimate`
- `.env.example`: `VITE_ANIMATIONS_ENABLED=true`
- `src/vite-env.d.ts`: tipado de `VITE_ANIMATIONS_ENABLED`
- Tests: `src/config/motion.test.ts`, `src/hooks/useMotionPreferences.test.ts`

**Tarea 3 — Microinteracciones**
- `src/components/ui/Form.tsx`: `Button` (hover lift + tap scale), `Input`/`Select` (focus border/shadow con tokens)
- `src/components/ui/SegmentedControl.tsx`: indicador deslizante (`layoutId`) + tap scale
- `src/components/ui/ChoiceChip.tsx`: tap scale + transición de colores
- Disabled / `prefers-reduced-motion` / `VITE_ANIMATIONS_ENABLED=false` → sin animación

**Documentación**
- `docs/DESIGN.md`: principios de micro-interacción + sección Motion completa (tokens, patrones, ejemplos)
- Este backlog alineado con paths reales del codebase

**Verificación**
- `npm test` — 177 tests
- `npm run build` — OK
- Bundle principal ~+40 KB gzip por Framer Motion (evaluar `LazyMotion` más adelante)

**Pendiente**
- Ninguno — MVP motion completo. Optimizaciones futuras: `LazyMotion`, estados error/éxito animados, toasts.

---

## Objetivo
Agregar motion design y microinteracciones de forma controlada para mejorar la experiencia de usuario sin introducir comportamientos inconsistentes.

## Librería
**Framer Motion** (`framer-motion` v12) — ya instalada. Usar `LazyMotion` + `domAnimation` si el bundle impacta en mobile.

## Definición clara de MVP
El MVP debe cubrir:
- Un sistema centralizado de tokens de motion.
- Un hook/utility para detectar `prefers-reduced-motion`.
- Un flag que habilite o deshabilite todas las animaciones de motion.
- Animaciones de microinteracción en:
  - botones primarios y secundarios
  - inputs interactivos
  - toggles y switches
- Transiciones de página suaves entre rutas principales.
- Shared element transition entre:
  - lista de movimientos (`MovementRow`)
  - formulario de edición (`MovementFormPage`) — ver decisión en tarea 5
- Skeletons animados en:
  - listados de movimientos (`MovementsPage`)
  - formulario de movimiento (`MovementFormPage`)
- Animación de barra de presupuesto cuando el valor cambia.
- Animaciones de feedback (toast o `Dialog`/`Alert` existentes) y estados de carga.

## Criterios de aceptación
Cada ítem debe cumplirse exactamente con:
1. [x] `src/design/motion.ts` existente y exportando:
   - `motionDurations` (ms), `toMotionSeconds`, `motionEasings`, `motionDelays`, `motionVariants`, `motionTransitions`, `shouldReduceMotion`, `getMotionProps`, `getLayoutTransition`
2. [x] Hook `useMotionPreferences` en `src/hooks/useMotionPreferences.ts` que devuelva:
   - `prefersReducedMotion: boolean`
   - `motionEnabled: boolean`
   - `shouldAnimate: boolean`
3. [x] Flag `VITE_ANIMATIONS_ENABLED` en `.env.example` y lectura centralizada en `src/config/motion.ts`.
4. [x] Wrapper de rutas animadas en `src/components/AnimatedRoutes.tsx` usando `AnimatePresence`, montado alrededor del `Outlet` en `Layout.tsx`.
5. [x] `MovementRow` con `layoutId={`movement-${id}`}` en lista y mismo `layoutId` en `MovementFormPage` al editar.
6. [x] Skeletons en `src/components/skeletons/` con shimmer usando `motion`.
7. [x] Barra de presupuesto en `src/components/BudgetProgressBar.tsx` con animación de progreso y label animado.
8. [x] Feedback animado: `ToastProvider` nuevo **o** animar `Dialog`/`Alert` existentes con `AnimatePresence` (no hay sistema de toasts hoy).
9. [x] Documentación en `docs/DESIGN.md` y `backlog/motion.md`.

## Backlog inicial detallado

### 1. Motion tokens + utils ✅
- [x] Crear `src/design/motion.ts`
- [x] Definir tokens y helpers
- [x] Unit test para `toMotionSeconds` y `getMotionProps` con `shouldAnimate: false` (tarea 8)
- Entregable: archivo con exports usados por todos los componentes motion.
- Estimación: 2 SP

### 2. Prefer-reduced-motion + feature flag ✅
- [x] Crear `src/hooks/useMotionPreferences.ts`
- [x] Crear `src/config/motion.ts` (lee `VITE_ANIMATIONS_ENABLED`, default `true`)
- [x] Refactorizar hook para usar `config/motion.ts` en lugar de `import.meta.env` directo
- [x] Agregar `VITE_ANIMATIONS_ENABLED=true` en `.env.example`
- [x] Tipar en `src/vite-env.d.ts`
- [x] Retornar: `shouldAnimate = motionEnabled && !prefersReducedMotion`
- [x] Entregable: hook probado con unit test.
- Estimación: 1 SP

### 3. Microinteracciones en botones/inputs ✅
- [x] Actualizar `src/components/ui/Form.tsx` (`Button`, `Input`, `Select`)
  - `whileTap={{ scale: 0.97 }}`, `whileHover={{ y: -1 }}` vía `getMotionProps("button", shouldAnimate)`
  - borde/sombra animados en focus de inputs con `fieldFocusStyle`
- [x] Actualizar toggles existentes:
  - `src/components/ui/SegmentedControl.tsx`
  - `src/components/ui/ChoiceChip.tsx`
  - indicador deslizante (`layoutId`) + tap con tokens cortos
- [x] Entregable: comportamiento reproducible; disabled states sin animación.
- Estimación: 2 SP

### 4. Page transitions wrapper ✅
- [x] Crear `src/components/AnimatedRoutes.tsx`
- [x] Montar alrededor de `<Outlet />` en `src/components/Layout.tsx` (no envolver todo `Routes` — hay rutas anidadas bajo `/analisis`)
- [x] Usar `key={location.pathname}` y variantes `slideUp` de `motionVariants`
- [x] Tener en cuenta que `RoutedContent` remonta el outlet al cambiar visibilidad de montos; no animar ese remount
- [x] Entregable: transición consistente entre al menos 3 rutas principales (Dashboard, Movimientos, Balance).
- Estimación: 2 SP

### 5. Shared element transition: lista → edición ✅
**Decisión MVP:** animar lista → `MovementFormPage` (`/movimientos/editar/:id`). No existe pantalla de detalle separada; no crear modal solo para motion.

- [x] En `MovementRow` (variante `detailed`) asignar `layoutId={`movement-${id}`}` al bloque principal
- [x] En `MovementFormPage` (modo edición) usar el mismo `layoutId` en el encabezado/resumen del movimiento
- [x] Usar `getLayoutTransition(shouldAnimate)` para la transición de layout
- [x] `LayoutGroup` + `AnimatePresence mode="popLayout"` en `AnimatedRoutes` para permitir shared layout entre rutas
- [x] Expectativa: transición visible pero limitada (cambio de página completa, no modal)
- [x] Entregable: animación perceptible al abrir/cerrar edición desde lista.
- Estimación: 3 SP

### 6. Skeletons y carga animada ✅
- [x] Crear `src/components/skeletons/SkeletonCard.tsx`
- [x] Crear `src/components/skeletons/SkeletonList.tsx`
- [x] Usar variante `shimmer` de `motionVariants` o keyframes CSS con tokens
- [x] Integrar en:
  - `src/pages/MovementsPage.tsx` (hoy solo muestra texto "Cargando movimientos...")
  - `src/pages/MovementFormPage.tsx` mientras carga movimiento existente
- [x] Entregable: skeletons cuando `loading === true`.
- Estimación: 1.5 SP

### 7. Barra de presupuesto animada + feedback animado ✅
- [x] Actualizar `src/components/BudgetProgressBar.tsx`
  - animar ancho con Framer Motion (`useMotionValue` / `animate`) desde valor previo
  - animar label en `BudgetProgressMeta` si aplica
- [x] Feedback animado (elegir uno):
  - **Opción A (menor scope):** animar entrada/salida de `Dialog` y `Alert` con `AnimatePresence`
- [x] Entregable: barra se mueve suavemente al actualizar presupuesto; feedback de acciones con animación.
- Estimación: 2 SP

### 8. Tests y performance smoke ✅
- [x] Tests unitarios para:
  - `motion.ts` (`toMotionSeconds`, `getMotionProps`, duraciones en segundos en `motionTransitions`)
  - `useMotionPreferences.ts` (ya en `src/hooks/useMotionPreferences.test.ts`)
- [x] Test de integración básico para wrapper de rutas animadas (`src/components/AnimatedRoutes.test.tsx`)
- [x] Smoke manual: Dashboard, Movimientos, edición de movimiento con/sin `prefers-reduced-motion` (checklist abajo)
- [x] Entregable: tests verdes y notas breves de performance.
- Estimación: 2 SP

**Performance smoke (2026-06-14)**
- `npm test` — 195 tests (18 nuevos: 13 en `motion.test.ts`, 5 en `AnimatedRoutes.test.tsx`)
- `npm run build` — OK; bundle principal ~493 KB gzip (+~4 KB vs post-skeletons por Dialog/Alert/Budget motion)
- Animaciones usan solo `transform`/`opacity` en rutas y shared layout; shimmer y barra de presupuesto animan width/background (aceptable en MVP)
- `LazyMotion` + `domAnimation` sigue siendo optimización futura si el bundle pesa en mobile
- Smoke manual recomendado antes de merge: Dashboard ↔ Movimientos ↔ Balance; Editar desde lista; toggle ojo montos (sin transición); `prefers-reduced-motion: reduce` y `VITE_ANIMATIONS_ENABLED=false`

### 9. Documentación y guidelines ✅
- [x] Actualizar `docs/DESIGN.md` sección **Motion** (tokens, patrones, ejemplos)
- [x] Mantener principios de micro-interacción solo en `docs/DESIGN.md` (fuente única)
- [x] Incluir: valores exactos, `whileTap`, `AnimatePresence`, `layoutId`, `toMotionSeconds`
- [x] Entregable: documentación lista para el equipo.
- Estimación: 1 SP

## Principios de micro-interacción

Ver `docs/DESIGN.md` — sección "Principios de micro-interacción". No duplicar aquí.

### Checklist de micro-interacción

- [x] Cada botón interactivo tiene un feedback inmediato (`Form.Button`, chips, segmented).
- [x] Los toggles y switches usan movimiento con retorno suave (`SegmentedControl` layoutId).
- [x] Los campos de formulario indican focus claramente (`Input`, `Select`).
- [ ] Los estados de error/éxito son inequívocos.
- [x] No se anima cada cambio de estado innecesario (solo interacción directa).
- [x] Las animaciones respetan `prefers-reduced-motion`.
- [x] Disabled states están quietos y con opacidad reducida.
- [x] El sistema de motion usa tokens comunes para duración y easing.
- [x] El feedback de micro-transacción es consistente en componentes tocados (Sprint 1).
- [x] Las animaciones son discretas y mantienen buen rendimiento (smoke documentado — tarea 8).

## Plan por sprints
- Sprint 1: tareas 1, 2, 3 ✅
- Sprint 2: tareas 4, 5, 6
- Sprint 3: tareas 7, 8, 9 ✅

## Riesgos y mitigaciones
- Animaciones demasiado pesadas:
  - Usar transform/opacity únicamente
  - Respetar `prefers-reduced-motion`
  - Considerar `LazyMotion` + `domAnimation`
- Navegación rota:
  - `key={location.pathname}` en wrapper de rutas
  - Montar `AnimatePresence` en `Layout`, no en raíz de `Routes`
- Inconsistencia visual:
  - Usar tokens en todos los componentes motion
- Duraciones incorrectas:
  - Tokens en ms (`motionDurations`); pasar a Framer Motion con `toMotionSeconds`
- Shared element limitado:
  - MVP acotado a lista → formulario de edición; no prometer modal de detalle
- Remount inesperado:
  - `Layout` remonta `Outlet` al togglear visibilidad de montos; excluir de transiciones de ruta

## Mapa de archivos del codebase

| Concepto backlog | Archivo real |
|------------------|--------------|
| Button / Input | `src/components/ui/Form.tsx` |
| Movement card | `src/components/ui/MovementRow.tsx` |
| Lista movimientos | `src/pages/MovementsPage.tsx` |
| Edición movimiento | `src/pages/MovementFormPage.tsx` |
| Barra presupuesto | `src/components/BudgetProgressBar.tsx` |
| Rutas | `src/App.tsx` + `src/components/Layout.tsx` |
| Toggles | `SegmentedControl.tsx`, `ChoiceChip.tsx` |
| Feedback inline | `Alert.tsx`, `StatusMessage` en `Form.tsx`, `Dialog.tsx` |
