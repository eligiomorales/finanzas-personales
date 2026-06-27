# Feature brief: Tendencia por categoría (TRK-4)

**Fecha:** 2026-06-27  
**Sesión:** 1 de 1  
**Rama sugerida:** `feature/trk-4-tendencia-categoria`

---

## 1. Problema

En Tendencias solo se ve evolución mensual total. No hay forma de ver "Supermercado: ene $80k, feb $95k, mar $70k" sin comparar mentalmente el donut de cada mes.

## 2. Objetivo de la sesión

Segundo slide del carrusel en `/analisis/tendencias`: gráfico de barras de los últimos 6 meses para una categoría seleccionable por dropdown.

## 3. Alcance

### Incluido (MVP)

- `buildCategoryMonthlyTrends` en `monthly-trends.ts` + tests
- `CategoryTrendBarChart` con barras mensuales
- Slide "Categoría" en segundo lugar del carrusel (entre flujo de caja y ritmo de gasto)
- Dropdown con categorías con gasto en 6 meses; default = mayor gasto total

### Fuera de alcance

- Multi-línea, presupuesto en el slide, drill-down, export, IA

### Anti-goals

- No agregar dependencias nuevas
- No refactorizar donut ni cash flow existentes

## 4. Criterios de done

- Dropdown cambia el gráfico de barras
- Vista pareja y personal respetan share
- `npm run ci` verde
- `NEXT.md` + backlog + CHANGELOG actualizados

## 5. Archivos probables

- `src/lib/monthly-trends.ts`
- `src/lib/monthly-trends.test.ts`
- `src/components/trends/CategoryTrendBarChart.tsx`
- `src/pages/TrendPage.tsx`
