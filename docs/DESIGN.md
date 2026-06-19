# Guía de diseño — Finanzas Pareja

Inspiración visual: [Monarch](https://www.monarch.com/) (claridad, cards limpias, sensación premium). Identidad propia: paleta cálida, foco en finanzas de pareja.

## Principios

1. **Mobile-first** — registrar un gasto debe ser rápido en pantalla chica.
2. **Claridad financiera** — balance, quién pagó y quién asumió deben leerse sin esfuerzo.
3. **Menos ruido** — una acción principal por bloque; estados vacíos explícitos.
4. **Consistencia** — nuevos controles van en `src/components/ui/`.
5. **Accesibilidad** — contraste AA, focus visible, labels y roles correctos.

## Principios de micro-interacción

Cada micro-interacción debe seguir estos principios:

- **Squash & Stretch**: presión del botón con compresión ligera; interruptores que terminan con “settle”.
- **Anticipation**: hover y estados previos al clic que indican acción.
- **Staging**: foco claro en la acción activa; un solo feedback dominante a la vez.
- **Straight Ahead / Pose to Pose**: usar animaciones continuas para progreso y transiciones definidas para cambios de estado.
- **Follow Through / Overlapping**: efectos que se prolongan y elementos que animan en solapamiento.
- **Slow In / Slow Out**: entradas rápidas, salidas suaves; evitar animaciones lineales.
- **Arc**: movimiento curvo en toggles y componentes circulares.
- **Secondary Action**: iconos y badges responden al estado del elemento principal.
- **Timing**: micro-interacciones 100–200 ms; cambios de estado 200–300 ms.
- **Exaggeration**: efecto notable pero controlado.
- **Solid Drawing**: comportamiento consistente de transformaciones.
- **Appeal**: que la UI se sienta viva y responsiva sin distraer.

### Checklist de micro-interacción

- [x] Feedback inmediato en botones y controles (`Form`, `SegmentedControl`, `ChoiceChip`).
- [x] Animaciones consistentes con tokens de timing y easing (`src/design/motion.ts`).
- [ ] Estados de error y éxito claramente distinguibles.
- [x] `prefers-reduced-motion` respetado en componentes con motion (Sprint 1).
- [x] No se animan actualizaciones irrelevantes.
- [x] Disabled states sin animación.
- [x] Un solo efecto de feedback visible por interacción.
- [x] Componentes compartidos usan los mismos patrones de motion (Sprint 1).
- [x] Interacciones pequeñas son agradables y discretas (validado en smoke — tarea 8).
- [x] Se prueba el comportamiento con y sin animación (`motion.test.ts`, `useMotionPreferences.test.ts`, smoke manual).

## Motion (`src/design/motion.ts`)

Sistema centralizado de animación con **Framer Motion**. Backlog de implementación: `backlog/motion.md`.

### Preferencias y feature flag

```ts
const { prefersReducedMotion, motionEnabled, shouldAnimate } = useMotionPreferences()
// shouldAnimate === motionEnabled && !prefersReducedMotion
```

- Hook: `src/hooks/useMotionPreferences.ts`
- Flag: `VITE_ANIMATIONS_ENABLED=false` en `.env.local` (default `true`; ver `src/config/motion.ts`)
- **Regla:** si `shouldAnimate` es `false`, no pasar props de motion — render estático

### Duraciones (`motionDurations`, en ms)

| Token | ms | Uso |
|-------|-----|-----|
| `xxs` | 80 | — |
| `xs` | 120 | Micro-interacciones, focus CSS |
| `fast` | 150 | Respuestas táctiles rápidas |
| `sm` | 180 | — |
| `normal` | 200 | Transiciones generales |
| `page` | 220 | Entrada de página (`slideUp`) |
| `pageExit` | 140 | Salida de página |
| `slow`/`md` | 280 | Shared layout, barra de presupuesto, blur entrances |
| `lg` | 420 | Shimmer de skeletons |

Framer Motion usa **segundos**. Siempre convertir:

```ts
import { toMotionSeconds, motionDurations } from '@/design/motion'

toMotionSeconds(motionDurations.xs)  // 0.12
```

### Easings (`motionEasings`)

| Token | Valor | Uso |
|-------|-------|-----|
| `standard` | `[0.22, 1, 0.36, 1]` | Default para casi todo (botones, chips, shared element) |
| `out` | `[0.17, 1, 0.32, 1]` | Entradas decorativas |
| `decel` | `[0, 0, 0.2, 1]` | Entrada de página |
| `accel` | `[0.4, 0, 0.2, 1]` | Salida de página |
| `inOut` | `[0.66, 0, 0.34, 1]` | Movimientos simétricos |
| `spring` | `[0.35, 1.55, 0.65, 1]` | Badges, pops, overshoot |

**Regla:** Nunca usar `ease`, `ease-in-out` ni `linear` como default. Siempre referenciar un token.

### Transiciones (`motionTransitions`, duration ya en segundos)

| Token | Duración | Easing |
|-------|----------|--------|
| `microInteraction` | 0.12 s | `standard` |
| `pageTransition` | 0.22 s | `decel` |
| `pageExitTransition` | 0.14 s | `accel` |
| `sharedElement` | 0.28 s | `standard` |
| `shimmer` | 0.42 s | `linear`, `repeat: Infinity` |

### Helpers

| Helper | Comportamiento |
|--------|----------------|
| `getMotionProps('button', shouldAnimate)` | `whileHover: { y: -1 }`, `whileTap: { scale: 0.98 }` |
| `getMotionProps('page', shouldAnimate)` | variantes `slideUp` |
| `getTapMotionProps(shouldAnimate)` | solo `whileTap: { scale: 0.98 }` (segmented, chips) |
| `getLayoutTransition(shouldAnimate)` | `sharedElement` o `{ duration: 0 }` |
| `fieldFocusStyle` | CSS transition border/shadow (120 ms) |

### Patrones Framer Motion

**Micro-interacción (`whileTap` / `whileHover`)**

```tsx
const { shouldAnimate } = useMotionPreferences()
const motion = shouldAnimate && !disabled ? getMotionProps('button', true) : {}

<MotionButton whileHover={motion.whileHover} whileTap={motion.whileTap} transition={motion.transition} />
```

Valores estándar: hover `y: -1`, tap `scale: 0.98`. Disabled → sin props motion.

**Transiciones de página (`AnimatePresence`)**

Montar en `Layout` alrededor del `<Outlet />`, no en la raíz de `Routes`:

```tsx
// src/components/AnimatedRoutes.tsx
<LayoutGroup>
  <AnimatePresence mode="popLayout" initial={false}>
    <motion.div key={location.pathname} variants={motionVariants.slideUp} …>
      <Outlet key={outletKey} />  {/* outletKey = visibilidad montos; no dispara transición */}
    </motion.div>
  </AnimatePresence>
</LayoutGroup>
```

- `mode="popLayout"` — necesario para shared layout entre rutas
- `slideUp`: entrada `y: 24 → 0` (220 ms), salida `y: 0 → -12` (140 ms)

**Shared element (`layoutId`)**

Lista → edición de movimiento:

```tsx
// MovementRow (lista)
<MovementSummaryBlock layoutId={`movement-${id}`} … />

// MovementFormPage (edición)
<MovementSummaryBlock layoutId={`movement-${id}`} … />

// Dentro del bloque, cuando shouldAnimate:
<motion.div layoutId={layoutId} transition={getLayoutTransition(shouldAnimate)} />
```

Helper: `movementLayoutId(id)` en `MovementRow.tsx`.

**Indicador deslizante (mismo patrón, scope local)**

```tsx
<motion.span layoutId={indicatorLayoutId} transition={motionTransitions.microInteraction} />
```

Ver `SegmentedControl.tsx`.

**Feedback modal / alerta**

- `Dialog`: `AnimatePresence` + fade overlay + slide panel
- `Alert`: `motion.div` con enter/exit; envolver alerts condicionales en `<AnimatePresence>` (ver `SettingsPage`)

**Carga (skeletons)**

- `SkeletonBar`: variante `shimmer` + `motionTransitions.shimmer`
- `SkeletonList` / `SkeletonCard`: sin animación si `!shouldAnimate`

**Barra de presupuesto**

- Ancho: `useMotionValue` + `animate()` con `motionTransitions.sharedElement`
- Label `%`: micro fade al cambiar valor

### Mapa de archivos motion

| Patrón | Archivo |
|--------|---------|
| Tokens y helpers | `src/design/motion.ts` |
| Preferencias | `src/hooks/useMotionPreferences.ts` |
| Feature flag | `src/config/motion.ts` |
| Rutas animadas | `src/components/AnimatedRoutes.tsx` |
| Botones / inputs | `src/components/ui/Form.tsx` |
| Segmented / chips | `SegmentedControl.tsx`, `ChoiceChip.tsx` |
| Shared element movimiento | `MovementRow.tsx`, `MovementFormPage.tsx` |
| Skeletons | `src/components/skeletons/` |
| Presupuesto | `BudgetProgressBar.tsx` |
| Modales / alertas | `Dialog.tsx`, `Alert.tsx` |

### Variante `blurIn` (entradas premium)

Nunca usar un fade puro. Las entradas combinan opacity + rise + blur:

```tsx
// motionVariants.blurIn
initial: { opacity: 0, y: 6, filter: "blur(2px)" }
animate: { opacity: 1, y: 0, filter: "blur(0px)" }  // 280ms, standard
exit:    { opacity: 0, y: -4, filter: "blur(2px)" }
```

Usar para cards, tooltips, y elementos que "enfocan" al aparecer. Para entradas de página seguir usando `slideUp`.

### Sombras — layered, nunca single

Tokens en `src/index.css`:

```css
--shadow-card:
  0 1px 2px rgba(0,0,0,0.05),
  0 2px 4px rgba(0,0,0,0.02),
  0 0 0 0.5px rgba(0,0,0,0.08);    /* hairline ring, no border */

--shadow-elevated:
  0 4px 8px rgba(0,0,0,0.02),
  0 8px 12px rgba(0,0,0,0.02),
  0 2px 4px rgba(0,0,0,0.02),
  0 1px 2px rgba(0,0,0,0.04),
  0 0 0 0.5px rgba(0,0,0,0.08);
```

Principios:
- **Hairline ring** reemplaza border: define borde con luz, no con stroke de 1px.
- Opacidades 2%–8%. Sombras pesadas se ven baratas.
- Stack de múltiples blurs a diferentes tamaños: contacto (tight) + ambient (wide).
- Animar el stack completo en hover (`transition: box-shadow`).

### Física para draggables

Cualquier elemento draggable usa física real:
- Tracking de velocidad (smoothed) para que flicks tengan peso.
- Momentum en release: coast to stop, no snap.
- Soft boundaries: stretch leve en bordes, spring back.

Para contadores animados/números en vivo, usar spring interpolation, no duración fija.

### Snap points (haptics virtuales)

Cuando un draggable tiene valores significativos (meses, presets):
- Pull-in zone chica, release zone más grande (traba y resiste).
- Flash/pulse en el label al catchear para micro-feedback.

### Reveal de altura

Usar `grid-template-rows: 0fr → 1fr` para expand/collapse. Nunca `max-height: 9999px`.

```css
.reveal { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--duration) var(--ease); }
.reveal[data-open="true"] { grid-template-rows: 1fr; }
.reveal > * { overflow: hidden; }
```

Para elementos que se mueven entre containers: FLIP (First-Last-Invert-Play).

### State-driven design

Un componente es un sistema de estados, no una imagen. Siempre considerar:
**idle → hover → pressed → focus → disabled → loading → success → error**

Micro-interacciones descubiertas en build (no en Figma):
- Números que ruedan dígito a dígito, no hard-cut.
- Labels que shimmer (light sweep suave, ~2s loop) mientras cargan — no spinners genéricos.
- Íconos que cross-fade + scale entre estados (play ↔ pause).

### Al agregar motion nuevo

1. Leer duración/easing de tokens — no hardcodear ms en componentes
2. Usar `useMotionPreferences()` → `shouldAnimate`
3. Preferir `transform` y `opacity`; evitar animar layout salvo `layoutId` explícito
4. Añadir test en `motion.test.ts` si es helper reusable
5. Verificar con `prefers-reduced-motion: reduce` y `VITE_ANIMATIONS_ENABLED=false`
6. Sombras solo desde tokens `--shadow-card` / `--shadow-elevated`; no inventar one-offs

## Tokens (`src/index.css`)

| Token | Uso |
|-------|-----|
| `brand-*` | Acciones primarias, links, nav activa |
| `surface-*` | Fondos de app y cards |
| `stone-*` | Texto y bordes neutros (preferir sobre `slate`) |
| `emerald-*` | Ingresos, éxito, saldado |
| `red-*` | Gastos, error, deuda |
| `amber-*` | Advertencias, compensación pendiente |

Radios: `rounded-lg` controles, `rounded-xl` cards, `rounded-2xl` modales.

## Componentes obligatorios

| Necesidad | Componente |
|-----------|------------|
| Botón / input / label | `Form.tsx` |
| Superficie contenedora | `Card.tsx` |
| Métrica label + valor | `MetricCard.tsx` |
| Título de página + acciones | `PageHeader.tsx` |
| Bloque de Ajustes (card + título) | `SettingsSection.tsx` |
| Sección con link | `SectionHeader.tsx` |
| Toggle single-select | `SegmentedControl.tsx` |
| Chip seleccionable | `ChoiceChip.tsx` |
| Panel colapsable (reparto, etc.) | `CollapsiblePanel.tsx` |
| Link de marca | `TextLink.tsx` |
| Link con estilo botón | `ButtonLink.tsx` |
| Mensajes | `Alert.tsx` |
| Modal / confirmación | `Dialog.tsx`, `ConfirmDialog.tsx` |
| Skeleton de carga | `skeletons/SkeletonList.tsx`, `SkeletonCard.tsx` |
| Barra de presupuesto | `BudgetProgressBar.tsx` |
| Fila de movimiento | `MovementRow.tsx` (+ `MovementList`) |

**No usar:** `<Link><Button>` anidados. Usar `ButtonLink`.

## Copy de pareja

Etiquetas Yo / Mi pareja: `src/lib/couple/person-labels.ts`. No hardcodear nombres en UI.

## Criterios de aceptación (overhaul)

- [x] Registrar gasto en &lt; 30 s en móvil
- [x] Balance de pareja legible en Dashboard y Balance
- [x] Focus ring unificado (`styles.ts`)
- [x] Misma interacción de segmented control en moneda, vista y create/join
- [x] Lista de movimientos unificada (`MovementRow` en Dashboard y Movimientos)
- [x] Secciones de Ajustes unificadas (`SettingsSection`)
- [x] Bloque de reparto colapsable unificado (`CollapsiblePanel`)
- [x] `npm run ci` verde tras cambios visuales
