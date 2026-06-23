# Feature brief: Integrar presupuesto en Tendencias

**Fecha:** 2026-06-23  
**Sesión:** 1 de 1  
**Rama sugerida:** `feature/analisis-budget-trends`

---

## 1. Problema

La pestaña Categorías en Análisis duplica el reparto por categoría que ya muestra Tendencias (donut). El valor único de Categorías es la comparación contra presupuesto establecido.

## 2. Objetivo de la sesión

Fusionar esa comparación de presupuesto dentro de Tendencias, conservando el donut y enriqueciendo su lista. Simplificar navegación a dos pestañas: Tendencias + Presupuesto.

## 3. Alcance

### Incluido (MVP)

- Presupuesto por categoría en `CategoryDonutBreakdown` (mes seleccionado en gráfico)
- Resumen read-only de presupuesto compartido en `TrendPage`
- Quitar pestaña Categorías; redirects legacy
- Actualizar deep links desde dashboard/insights

### Fuera de alcance

- PeriodFilter flexible en Tendencias
- Deltas vs mes anterior en la lista del donut
- Mover Presupuesto fuera del hub Análisis

### Anti-goals

- No agregar dependencias nuevas
- No eliminar el donut
- No refactorizar `BudgetPage`

## 4. Criterios de done

- Donut + lista muestran gasto vs presupuesto cuando hay presupuesto compartido
- `/analisis` aterriza en tendencias; `/analisis/categorias` redirige
- `npm run ci` verde
- `NEXT.md` actualizado

## 5. Contexto para el agente

### Archivos probables

- `src/pages/TrendPage.tsx`
- `src/components/trends/CategoryDonutBreakdown.tsx`
- `src/pages/AnalisisPage.tsx`
- `src/App.tsx`
