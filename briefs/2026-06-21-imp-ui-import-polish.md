# Feature brief: IMP-UI Import Polish

**Fecha:** 2026-06-21  
**Sesión:** 1 de 1  
**Rama sugerida:** `feature/imp-ui-import-polish`

---

## 1. Problema

Tras IMP-1→IMP-5, el paso de revisión de importación acumula resumen, métricas duplicadas, defaults del lote, bulk por comercio, filtros y filas editables en un scroll largo. La tarea principal — corregir excepciones — queda enterrada y la UI se siente cargada en móvil.

---

## 2. Objetivo de la sesión

Reorganizar el paso `review` de importación para priorizar excepciones, colapsar herramientas avanzadas y alinear controles con `docs/DESIGN.md` y polished-ui, sin cambiar lógica de parsing ni persistencia.

---

## 3. Alcance

### Incluido (MVP)

- Canvas con ≥2 alternativas de rediseño y decisión registrada.
- Resumen compacto del lote (menos métricas redundantes).
- Filtros + lista de excepciones más cerca del fold.
- Acciones del lote y comercios repetidos en `CollapsiblePanel` (cerrados por defecto).
- Filas más densas: ajustes secundarios en disclosure; modo compacto para auto-aprobados.
- Barra fija de confirmación con safe-area y offset sobre nav inferior.

### Fuera de alcance (explícito)

- Wizard nuevo, rutas nuevas, gráficos.
- Cambios en parsers, scoring, reglas, confirm persist.
- Undo por lote, import history, semáforos V2.

### Anti-goals

- No agregar dependencias nuevas.
- No refactorizar módulos adyacentes fuera de import UI.
- No copiar layout Monarch.
- No implementar código de app antes de elegir alternativa en Canvas.

---

## 4. Criterios de done

- Canvas comparativo revisado; decisión humana documentada abajo.
- Paso `review` reorganizado según opción elegida.
- `npm run ci` verde.
- Smoke manual: import PDF/CSV, revisar excepción, bulk merchant, confirmar.
- `NEXT.md` actualizado (+ CHANGELOG si cierra IMP-UI).

---

## 5. Contexto para el agente

### Leer primero

- `AGENTS.md`, `PLAYBOOK.md`, `NEXT.md`
- `docs/DESIGN.md`, `.cursor/skills/polished-ui/SKILL.md`
- Canvas: `canvases/imp-ui-import-redesign.canvas.tsx`

### Archivos probables

```
src/pages/ImportPage.tsx
src/components/ImportReviewItemCard.tsx
src/components/ImportBatchDefaultsCard.tsx
src/components/ImportMerchantBulkActionsCard.tsx
```

---

## 6. Plan

1. Canvas con Opción A (excepciones first) y Opción B (workbench lote).
2. **Decisión:** Opción A — alinea con IMP-2 by exception; lista visible sin scroll previo; bulk como herramienta secundaria colapsada.
3. Reordenar `ImportPage` review step.
4. Colapsar bulk cards; compactar item cards; pulir footer.
5. `npm run ci` + actualizar docs.

**Tradeoffs considerados:** Opción B expone más bulk arriba (útil con muchos comercios repetidos) pero reproduce la densidad actual; A gana en foco móvil.

---

## 7. Decisión humana (Canvas)

| Campo | Valor |
|-------|-------|
| Canvas | `imp-ui-import-redesign.canvas.tsx` |
| Opción elegida | **A — Excepciones first** |
| Fecha | 2026-06-21 |
| Notas | Bulk y comercios en `CollapsiblePanel` cerrados; resumen 4 métricas máx.; footer sobre nav con safe-area |

---

## 8. Post-sesión (Capture)

| Campo | Valor |
|-------|-------|
| Tiempo humano activo (min) | |
| Iteraciones hasta merge | |
| ¿Brief respetado? | |
| Aprendizaje | |

**PR / commit:**  
**Pendiente para próxima sesión:**
