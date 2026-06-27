# Feature brief: UX F1 — Revisión mensual con cierre

**Fecha:** 2026-06-27  
**Sesión:** 1 de 1  
**Rama sugerida:** `feature/ux-f1-mes-drill`

---

## 1. Problema

El flujo de revisión mensual en Tendencias termina en el donut sin salida:
- El mes seleccionado en el carrusel no tiene señal visual clara en las secciones de abajo.
- No hay CTA para ver los movimientos del mes/categoría seleccionada.

## 2. Objetivo de la sesión

Cerrar el flujo F1 con dos piezas quirúrgicas:

**A. Banner contextual** — aparece entre el carrusel y el donut cuando el mes seleccionado ≠ mes actual. Permite volver al mes actual con un tap.

**B. Categorías clicables** — cada fila del donut lleva a `/movimientos` filtrado por esa categoría + mes seleccionado.

## 3. Alcance

### Incluido (MVP)
- Banner inline en `TrendPage` (sin componente nuevo)
- `onCategoryClick?: (categoryId: string) => void` en `CategoryDonutBreakdown`
- Handler en `TrendPage`: `setFilters({ categoryId, dateFrom, dateTo })` + `navigate('/movimientos')`
- Sin drill-down desde el slide 2 (Categoría) — solo desde el donut

### Fuera de alcance
- Drill-down desde slide de Categoría
- Cambios a MovementsPage
- Badge más grande en SectionHeader (el banner ya cubre el contexto visual)

### Anti-goals
- No crear componentes nuevos si no es necesario
- No agregar dependencias nuevas

## 4. Criterios de done

- Banner aparece solo cuando `selectedYearMonth !== currentYearMonth`
- Tap en "Volver al mes actual" resetea el mes
- Tap en categoría del donut → `/movimientos` con filtros correctos
- `npm run ci` verde
- `NEXT.md` + CHANGELOG actualizados

## 5. Archivos a tocar

- `src/components/trends/CategoryDonutBreakdown.tsx`
- `src/pages/TrendPage.tsx`
