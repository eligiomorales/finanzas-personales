# Feature brief: IMP-4 Bulk Actions Merchant

**Fecha:** 2026-06-21  
**Sesión:** 1 de 1  
**Rama sugerida:** `feature/imp-4-bulk-actions-merchant`

---

## 1. Problema

12× Starbucks = 12 correcciones idénticas de categoría en la revisión de import. El bulk global del lote ayuda, pero no agrupa por comercio repetido.

---

## 2. Objetivo de la sesión

Detectar comercios repetidos en el preview de import y aplicar una categoría a todas las filas pendientes de ese comercio en un clic.

---

## 3. Alcance

### Incluido (MVP)

- Helpers puros: nombre agrupable desde `importItemTitle`, normalización, `groupImportItemsByMerchant` (solo `pending` + `needsReview`, count ≥ 2).
- Componente `ImportMerchantBulkActionsCard` debajo de defaults del lote.
- Acción `applyCategoryToMerchantGroup(groupKey, categoryId)` en `ImportPage`.
- Tests mínimos + `NEXT.md` actualizado.

### Fuera de alcance (explícito)

- Bulk edit monto/fecha/reparto por merchant.
- Reglas persistentes (IMP-5).
- Migraciones, RLS, rediseño IMP-UI.

### Anti-goals

- No agregar dependencias nuevas.
- No refactorizar `ImportBatchDefaultsCard` ni parsers PDF.
- No agrupar por comprobante numérico.

---

## 4. Criterios de done

- Grupos repetidos visibles con count y CTA "Aplicar categoría a N filas".
- Aplicar categoría solo al grupo seleccionado; auto-aprobados/ignorados intactos.
- `npm run ci` verde.
- Smoke manual: lote con 2+ filas mismo comercio → una categoría → todas actualizadas.
- `NEXT.md` actualizado (+ CHANGELOG si fase cerrada).

---

## 5. Contexto para el agente

### Leer primero

- `AGENTS.md`, `PLAYBOOK.md`, `NEXT.md`
- `backlog/product-ideas.md` → IMP-4

### Archivos probables

```
src/lib/import-display.ts
src/lib/import-display.test.ts
src/components/ImportMerchantBulkActionsCard.tsx
src/pages/ImportPage.tsx
```

---

## 6. Plan

1. Helpers de normalización y agrupación en `import-display.ts`.
2. Tests de agrupación y exclusión de auto-aprobados.
3. `ImportMerchantBulkActionsCard` con picker por grupo.
4. Wiring en `ImportPage` + CI + Capture.

**Tradeoffs:** agrupar por título legible (`importItemTitle`), no por `merchant` crudo (PDF = comprobante).

---

## 8. Post-sesión (Capture)

| Campo | Valor |
|-------|-------|
| Tiempo humano activo (min) | |
| ¿Brief respetado? | |
| Aprendizaje (1–3 líneas) | |
