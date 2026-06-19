# ADR 0004 — Reglas de categorización por keyword contains

**Fecha:** 2026-06 · **Estado:** vigente

## Contexto

La importación ya sugería categorías con keywords hardcodeadas en `suggestCategory()`. El MVP de reglas persistentes debe ser editable por la pareja, aplicarse en importaciones futuras y mantenerse simple de implementar y explicar.

## Decisión

Guardar reglas por pareja como `(keyword, category_id)` y aplicarlas con matching **case-insensitive contains**: la descripción del movimiento incluye el keyword normalizado (trim + lowercase). Las reglas de usuario tienen prioridad sobre las keywords hardcodeadas; entre reglas de usuario gana la más reciente (orden `created_at desc`).

## Alternativas consideradas

- **Exact match:** demasiado frágil con extractos bancarios multilínea.
- **Regex:** más potente pero difícil de validar y explicar; fuera de alcance MVP.
- **Aprendizaje automático:** no hay uso propio aún; deuda alta.

## Consecuencias

- ✅ Reglas fáciles de crear desde settings o al corregir una importación.
- ✅ Compatible con descripciones bancarias ruidosas (ej. "FARMACITY" dentro de texto largo).
- ⚠️ Keywords ambiguos pueden categorizar movimientos no deseados; mitigación = reglas específicas y edición/eliminación.
- ⚠️ Upgrade path documentado: campo `matchType` (`contains` | `exact` | `regex`) si hace falta más precisión.
