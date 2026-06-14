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
- [ ] Interacciones pequeñas son agradables y discretas (validar en mobile).
- [ ] Se prueba el comportamiento con y sin animación (smoke formal pendiente).

## Motion (`src/design/motion.ts`)

Sistema centralizado de animación. Detalle y backlog: `implementations/mvp-motion-backlog.md`.

| Token / helper | Valor / uso |
|----------------|-------------|
| `motionDurations` | `xxs: 80`, `xs: 120`, `sm: 180`, `md: 280`, `lg: 420` (ms) |
| `toMotionSeconds` | Convierte ms → s para Framer Motion |
| `motionEasings.standard` | `[0.22, 1, 0.36, 1]` |
| `getMotionProps('button')` | hover `y: -1`, tap `scale: 0.97` |
| `getTapMotionProps` | tap only (segmented, chips) |
| `fieldFocusStyle` | CSS transition border/shadow en inputs |

**Preferencias:** `useMotionPreferences()` → `shouldAnimate`. Feature flag: `VITE_ANIMATIONS_ENABLED=false` en `.env.local`.

**Patrones en uso (Sprint 1):** `motion.button`, `layoutId` en `SegmentedControl`, tokens en focus de campos.

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
| Modal | `Dialog.tsx` |
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
