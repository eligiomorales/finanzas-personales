# AGENTS.md — Mapa de contexto

Punto de entrada para cualquier agente (Cursor u otro) que trabaje en este repo. Antes de actuar, sabé **qué leer según la tarea**.

## Qué leer según la tarea

| Necesito saber… | Leer |
|-----------------|------|
| Estado actual / qué sigue | `NEXT.md` |
| Cómo trabajamos (flujo, delegación) | `PLAYBOOK.md` |
| Por qué se tomó una decisión | `docs/decisions/` (ADRs) |
| Qué es el producto / setup | `README.md` |
| Sistema de diseño y motion | `docs/DESIGN.md` |
| Cómo deployar / migraciones | `docs/deploy.md` |
| Deuda técnica conocida | `backlog/` |
| Análisis de mercado / competencia | `docs/research/` |
| Plan original del MVP (histórico) | `plan-implementacion-finanzas-pareja.md` |
| Historial de fases entregadas | `docs/history/CHANGELOG.md` |

## Reglas de operación

1. **Antes de implementar:** completar `templates/feature-brief.md`. Una sesión = un objetivo.
2. **Respetar las rules** de `.cursor/rules/` (simplicidad, cambios quirúrgicos, YAGNI).
3. **Validar:** `npm run ci` (tests + build) antes de proponer merge.
4. **Al cerrar la sesión:** actualizar `NEXT.md`. Si una fase terminó, mover su detalle a `docs/history/CHANGELOG.md`.
5. **Decisiones con tradeoff real** → agregar un ADR en `docs/decisions/` (append-only, nunca editar uno viejo).

## Convenciones de documentación

| Tipo | Dónde | Ciclo de vida |
|------|-------|---------------|
| Referencia estable | `README.md`, `docs/DESIGN.md` | Cambia rara vez |
| Estado vivo | `NEXT.md` | Cada sesión (se sobrescribe) |
| Historial | `docs/history/CHANGELOG.md` | Append-only |
| Decisiones | `docs/decisions/NNNN-*.md` | Append-only, numeradas |
| Backlogs | `backlog/*.md` | Cuando surge deuda |
| Proceso / research | `PLAYBOOK.md`, `docs/deploy.md`, `docs/research/` | Rara vez |

No crear un doc nuevo si un humano o el agente no lo va a leer en las próximas semanas.
