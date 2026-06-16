# ADR 0003 — Presupuesto colaborativo V1 solo sobre gastos compartidos

**Fecha:** 2026-06 · **Estado:** vigente

## Contexto

Al introducir presupuestos había que elegir alcance para V1: ¿presupuesto personal por integrante, compartido, o ambos? Más alcance = más superficie a validar antes de saber si la feature se usa.

## Decisión

V1 entrega **un presupuesto compartido por pareja** (`scope: couple`), límite recurrente por categoría (`year_month = 'recurring'`), opt-in. El avance se calcula **solo con gastos compartidos** (`isShared === true`), comparado por mes calendario navegable.

## Alternativas consideradas

- **Presupuesto personal por integrante:** alto valor para gastos mixtos, pero duplica modelo y UI. Postergado a V1.1 (`scope` ya preparado para `'personal'`).
- **Flex budgeting / grupos / rollovers:** potentes pero complejos; primero validar límites simples.

## Consecuencias

- ✅ Entrega enfocada y testeable; Dexie + Supabase con RLS y realtime.
- ✅ Modelo extensible (`scope`, `ownerRole`) sin rehacer schema.
- ⚠️ No cubre gastos personales ni montos distintos por mes calendario.
- ⚠️ Sin integración aún con metas, liquidaciones o cash flow (backlog).
