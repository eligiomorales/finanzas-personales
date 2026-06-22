# Feature brief: IMP-5 Reglas Desde Import

**Fecha:** 2026-06-21  
**Sesión:** 1 de 1  
**Rama sugerida:** `feature/imp-5-reglas-desde-import`

---

## 1. Problema

Las reglas persistentes (`category_rules`) existen pero no se crean de forma fluida al corregir categorías en import. Cada mes repetimos las mismas correcciones.

---

## 2. Objetivo de la sesión

Checkbox "Recordar para próximas importaciones" al corregir categoría en import; persistir reglas al confirmar el lote; match futuro → confianza 95+ (auto-aprobado).

---

## 3. Alcance

### Incluido (MVP)

- Helpers puros: keyword default desde `importItemTitle`, detección regla existente, candidatos a guardar al confirmar.
- Checkbox + keyword editable por fila corregida en `ImportReviewItemCard`.
- Estado local en `ImportPage`; `addRule()` al confirmar importación (antes de `confirmImport`).
- Tests mínimos confianza `user_rule` + helpers de candidatos.
- `NEXT.md` + CHANGELOG.

### Fuera de alcance (explícito)

- `confidenceBoost` numérico fino.
- Inferencia batch automática (`infer-rules.ts` ya en settings).
- Reglas al aplicar bulk merchant sin checkbox explícito.
- Migraciones (008 ya aplicada).

### Anti-goals

- No agregar dependencias nuevas.
- No refactorizar `MovementFormPage` ni `CategorySettingsPage`.
- No guardar regla inmediatamente al marcar checkbox (guardado al confirmar).

---

## 4. Criterios de done

- Fila corregida muestra checkbox; regla existente muestra estado sin duplicar.
- Confirmar importación persiste candidatos vía `categoryRules.add` (upsert).
- Próxima importación: match user rule → `IMPORT_CONFIDENCE.USER_RULE` (95) y auto-aprobado si no hay duplicado/OCR.
- `npm run ci` verde.
- `NEXT.md` actualizado; epic Import by exception cerrado en CHANGELOG.

---

## 5. Contexto para el agente

### Leer primero

- `AGENTS.md`, `PLAYBOOK.md`, `NEXT.md`
- `docs/decisions/0004-category-rules-keyword-match.md`
- `backlog/product-ideas.md` → IMP-5

### Archivos probables

```
src/lib/import-display.ts
src/lib/import-display.test.ts
src/lib/import.test.ts
src/components/ImportReviewItemCard.tsx
src/pages/ImportPage.tsx
```

---

## 6. Plan

1. Helpers de candidatos y keyword default en `import-display.ts`.
2. Reemplazar "Guardar como regla" inmediato por checkbox + keyword en `ImportReviewItemCard`.
3. Estado `rememberedRules` + persistencia en `confirmSelected()` en `ImportPage`.
4. Tests + CI + Capture.

**Tradeoffs:** guardado al confirmar (atómico con el lote); keyword default = título legible del movimiento.

---

## 8. Post-sesión (Capture)

| Campo                      | Valor |
| -------------------------- | ----- |
| ¿Brief respetado?          | sí    |

**Pendiente para próxima sesión:** PLAN-1 o IMP-UI según triage.
