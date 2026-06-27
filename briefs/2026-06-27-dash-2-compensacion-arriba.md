# Feature brief: Compensación arriba (DASH-2)

**Fecha:** 2026-06-27  
**Sesión:** 1 de 1  
**Rama sugerida:** `feature/dash-2-compensacion-arriba`

---

## 1. Problema

El balance entre integrantes es el diferenciador de la app, pero en el dashboard compite visualmente con métricas genéricas (saldo neto, categorías). La fila de compensación ya existe debajo del bento pero se lee como un link secundario.

## 2. Objetivo de la sesión

Promover `DashboardCompensationRow` a callout protagonista debajo del saldo neto, sin cambiar lógica ni posición en el layout.

## 3. Alcance

### Incluido (MVP)

- Callout con label, badge de estado, monto destacado y CTA hacia `/balance?scope=period`
- Estados pendiente (ámbar) y saldado (verde)
- Mantener contrato de props y posición en `DashboardPage`

### Fuera de alcance

- Rediseño de `DashboardSummaryBento`
- Semáforo DASH-1
- Cambios en `BalancePage` o lógica de `calculateCoupleBalanceForScope`

### Anti-goals

- No agregar dependencias nuevas
- No refactorizar módulos adyacentes
- No mover compensación por encima del saldo neto

## 4. Criterios de done

- Callout legible en mobile (monto + nombres sin truncar en exceso)
- Link sigue llevando a balance del período
- `npm run ci` verde
- `NEXT.md` y backlog actualizados

## 5. Contexto para el agente

### Archivos probables

- `src/components/DashboardCompensationRow.tsx`
- `src/pages/DashboardPage.tsx` (sin cambios esperados)

### Patrones a seguir

- `InsightCard` para estructura label + badge + contenido
- Tokens `cardSurface`, `focusRing`, colores de estado existentes

---

## 6. Plan

Promover visualmente el componente existente; quick win de una sesión.

**Tradeoffs considerados:** callout completo vs fila compacta — elegimos callout por pedido explícito de jerarquía visual.
