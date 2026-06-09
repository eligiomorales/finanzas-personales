# Guía de diseño — Finanzas Pareja

Inspiración visual: [Monarch](https://www.monarch.com/) (claridad, cards limpias, sensación premium). Identidad propia: paleta cálida, foco en finanzas de pareja.

## Principios

1. **Mobile-first** — registrar un gasto debe ser rápido en pantalla chica.
2. **Claridad financiera** — balance, quién pagó y quién asumió deben leerse sin esfuerzo.
3. **Menos ruido** — una acción principal por bloque; estados vacíos explícitos.
4. **Consistencia** — nuevos controles van en `src/components/ui/`.
5. **Accesibilidad** — contraste AA, focus visible, labels y roles correctos.

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
