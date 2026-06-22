# Feature brief: IMP-3 Edición Inline Import

**Fecha:** 2026-06-21  
**Sesión:** 1 de 1  
**Rama sugerida:** `feature/imp-3-edicion-inline-import`

---

## 1. Problema

Corregir categoría en la revisión de import requiere abrir "Ajustar" y navegar chips dentro de un panel colapsado. Demasiados pasos para el dolor #1 (carga mensual por PDF).

---

## 2. Objetivo de la sesión

Categoría editable in-place en cada fila de excepción; cambios persisten en `pendingItems` hasta "Confirmar"; validación que bloquea import si hay pendientes sin categoría.

---

## 3. Alcance

### Incluido (MVP)

- `ImportCategoryPicker` visible inline en `ImportReviewItemCard` para items `pending`.
- "Ajustar" solo para reparto, moneda, extracto y guardar regla.
- Helper puro `importPendingMissingCategory` + validación en `confirmSelected()`.
- Tests mínimos + `NEXT.md` actualizado.

### Fuera de alcance (explícito)

- Edición de fecha, monto, notas, split avanzado.
- Modales, wizard nuevo, rediseño `IMP-UI`.
- Migraciones, RLS, repos.

### Anti-goals

- No agregar dependencias nuevas.
- No refactorizar módulos adyacentes.
- No bulk actions merchant (IMP-4).

---

## 4. Criterios de done

- Categoría editable inline sin abrir "Ajustar".
- Confirmar bloqueado si hay `pending` sin `selectedCategoryId`.
- `npm run ci` verde.
- Smoke manual: subir archivo → cambiar categoría inline → confirmar → categoría correcta.
- `NEXT.md` actualizado (+ CHANGELOG si fase cerrada).

---

## 5. Contexto para el agente

### Leer primero

- `AGENTS.md`, `PLAYBOOK.md`, `NEXT.md`
- `backlog/product-ideas.md` → IMP-3

### Archivos probables

```
src/components/ImportReviewItemCard.tsx
src/components/ImportCategoryPicker.tsx
src/pages/ImportPage.tsx
src/lib/import-display.ts
src/lib/import-display.test.ts
```

---

## 6. Plan

1. Inline `ImportCategoryPicker` en card; mover regla guardada debajo del picker.
2. Helper `importPendingMissingCategory(items)` en `import-display.ts`.
3. Validar en `confirmSelected()` + scroll a excepciones.
4. Tests + CI + Capture.

**Tradeoffs:** reutilizar `ImportCategoryPicker` (grid + select) vs chips pill actuales — picker ya existe y es accesible; menos código nuevo.

---

## 8. Post-sesión (Capture)

| Campo | Valor |
|-------|-------|
| Tiempo humano activo (min) | |
| ¿Brief respetado? | |
| Aprendizaje (1–3 líneas) | |
