# Feature brief: IMP-1 Import Preview

**Fecha:** 2026-06-21  
**Sesión:** 1 de 1  
**Rama sugerida:** `feature/imp-1-import-preview`

---

## 1. Problema

Tras subir PDF/CSV no hay snapshot claro del lote antes de entrar fila por fila. No sabemos cuántos gastos hay, el total, cuántos requieren revisión ni qué tan confiable es el parse.

---

## 2. Objetivo de la sesión

Mostrar una preview del lote importado en el paso `review`: N gastos, monto total, N requieren revisión, % confianza estimada y CTA para revisar pendientes.

---

## 3. Alcance

### Incluido (MVP)

- Señales v0 de confianza/revisión por fila (regla, keyword, fallback, duplicado, OCR).
- Helpers puros para resumen agregado.
- Tarjeta Import Preview en `ImportPage` (paso review).
- Tests unitarios mínimos.
- `NEXT.md` actualizado.

### Fuera de alcance (explícito)

- Gráficos, agrupación por categoría.
- Auto-ocultar filas (IMP-2).
- Migraciones, RLS, repos.
- Rediseño completo (`IMP-UI`).

### Anti-goals

- No agregar dependencias nuevas.
- No refactorizar módulos adyacentes.
- No ML ni umbrales configurables.

---

## 4. Criterios de done

- Preview visible con 4 métricas + CTA "Revisar pendientes".
- Confianza etiquetada como "estimada" (v0 determinística).
- `npm run ci` verde.
- Smoke manual: subir archivo → review → preview visible.
- `NEXT.md` actualizado.

---

## 5. Contexto para el agente

### Leer primero

- `AGENTS.md`, `PLAYBOOK.md`, `NEXT.md`
- `backlog/product-ideas.md` → IMP-1

### Archivos probables

```
src/lib/import.ts
src/lib/import-display.ts
src/lib/import.test.ts
src/lib/import-display.test.ts
src/lib/ocr/parse-image.ts
src/pages/ImportPage.tsx
```

---

## 6. Plan

Ver plan aprobado IMP-1 Import Preview.

**Tradeoffs:** confianza v0 = heurística fija, no precisión real; suficiente para IMP-2 threshold 90.

---

## 8. Post-sesión (Capture)

| Campo | Valor |
|-------|-------|
| Tiempo humano activo (min) | |
| ¿Brief respetado? | |
