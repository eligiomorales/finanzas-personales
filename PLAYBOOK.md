# Playbook v0 — Desarrollo solo-founder + AI

Laboratorio de flujo de producto asistido por agente. **Finanzas Pareja** es el dominio de práctica; el output reutilizable es este playbook, las rules/skills y los templates.

**Versión:** 0.1 · Jun 2026  
**Próxima revisión:** después de 3–5 sesiones con brief + métricas

---

## 1. North star

| | |
|---|---|
| **Producto** | App de finanzas de pareja que funcione para nosotros; features solo si las usamos o enseñan un skill |
| **Laboratorio** | Definir y medir un flujo repetible: brief → implement → verify → capture |
| **No perseguir** | Escala comercial, sync bancario, clonar Monarch, features de mercado sin uso propio |

Contexto de mercado y viabilidad: `docs/research/`.

---

## 2. Ciclo de una sesión (6 fases)

```
Brief → Explore → Plan → Implement → Verify → Capture
```

| Fase | Quién | Qué pasa | Artefacto |
|------|-------|----------|-----------|
| **Brief** | Humano (+ agente si ayuda) | Problema, alcance, anti-goals, done | `templates/feature-brief.md` copiado y completado |
| **Explore** | Agente | Lee repo, docs, archivos clave; no codea todavía | Resumen corto de contexto + archivos a tocar |
| **Plan** | Agente → humano aprueba | Plan de 5–15 líneas con tradeoffs | Comentario en chat o sección del brief |
| **Implement** | Agente | Cambios quirúrgicos; tests mínimos en lógica no trivial | PR o commit en rama feature |
| **Verify** | Agente + humano | CI + checklist acotado | CI verde; checklist manual si aplica |
| **Capture** | Humano (5 min) | Qué funcionó, fricciones, regla nueva | Actualizar `NEXT.md` (+ ADR si hubo decisión) |

**Regla:** no saltar Brief ni Capture. Son las fases que más valor dan para el próximo emprendimiento.

---

## 3. Cómo arrancar una sesión con el agente

### Prompt mínimo (continuidad)

```text
Quiero continuar Finanzas Pareja.

Lee:
- AGENTS.md
- PLAYBOOK.md
- NEXT.md
- [brief adjunto o pegado]

Objetivo de esta sesión: [una sola cosa]

Al final: npm run ci + actualizar NEXT.md (Capture)
```

### Prompt con feature nueva

1. Copiar `templates/feature-brief.md` → `briefs/YYYY-MM-DD-nombre-corto.md` (opcional pero recomendado)
2. Completar las secciones obligatorias (problema, alcance, anti-goals, done)
3. Pegar el brief en el chat o referenciar la ruta
4. Pedir **Explore + Plan** antes de implementar

### Una sesión = un objetivo

- ✅ "Reglas de categorización persistentes (MVP)"
- ✅ "Refactor acotado: extraer hook de ImportPage (solo step 1)"
- ❌ "Metas + recurrentes + offline + landing"

---

## 4. Mapa de documentación

El índice operativo vive en `AGENTS.md`. Resumen por ciclo de vida:

| Archivo / carpeta | Tipo | Cuándo usarlo |
|-------------------|------|---------------|
| `AGENTS.md` | Router | Mapa: qué leer según la tarea |
| `PLAYBOOK.md` | Proceso | Este doc; flujo y delegación |
| `NEXT.md` | Estado vivo | Handoff entre sesiones (corto, se sobrescribe) |
| `docs/history/CHANGELOG.md` | Historial | Fases ya cerradas (append-only) |
| `docs/decisions/` | ADRs | Por qué se decidió algo (append-only) |
| `README.md` | Referencia | Stack, funcionalidades, setup |
| `docs/DESIGN.md` | Referencia | Diseño y motion; criterios UI |
| `docs/deploy.md` | Proceso | Local → CI → PR → Vercel; migraciones |
| `backlog/*.md` | Backlog | Deuda técnica por tema |
| `docs/research/` | Research | Benchmark, mercado, viabilidad |
| `plan-implementacion-finanzas-pareja.md` | Histórico | Plan original del MVP |
| `.cursor/rules/` | Comportamiento | Reglas del agente (siempre activas) |
| `.agents/skills/hallmark/` | Skill | Diseño UI (audit, redesign, build) |
| `templates/feature-brief.md` | Template | Inicio de cada feature |

---

## 5. Stack humano + AI

| Capa | Herramienta | Rol |
|------|-------------|-----|
| IDE + agente | Cursor | Implementación, explore, tests, docs |
| Contexto | Rules + skills + AGENTS.md + docs | Calidad y continuidad entre sesiones |
| Calidad | `npm test` + `npm run build` (`npm run ci`) | Gate antes de merge |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | Mismo chequeo en PR |
| Deploy | Vercel (merge a `main`) | Producción automática |
| Diseño | Hallmark skill | Evitar UI genérica; audit antes de rediseños |
| Smoke manual | Checklist en `docs/deploy.md` | Auth, pareja, import, balance |
| Browser MCP | Opcional post-implement | Flujos críticos si tocás UI/auth |

**No priorizar aún:** agentes autónomos 24/7, RAG sobre el repo, multi-agent orchestration, IA en producción para categorizar.

---

## 6. Rules y skills (comportamiento del agente)

### Rules activas (`.cursor/rules/`)

- **karpathy-guidelines** — pensar antes de codear; simplicidad; cambios quirúrgicos; criterios verificables
- **ponytail-lazy-senior-dev** — YAGNI; stdlib/deps primero; mínimo código; test mínimo en lógica no trivial
- **context-router** — recuerda al agente qué doc leer según la tarea

### Cuándo invocar Hallmark

- Nueva pantalla o rediseño visible
- `hallmark audit <pantalla>` antes de tocar CSS/layout
- Cambios visuales acotados dentro de `docs/DESIGN.md` existente → no hace falta skill completo

---

## 7. Flujo git y deploy

```
feature/nombre-corto → npm run ci local → PR → CI GitHub → merge main → Vercel
```

| Paso | Comando / acción |
|------|------------------|
| Rama | `git checkout -b feature/nombre-corto` |
| Validar | `npm run ci` |
| PR | Template en `.github/pull_request_template.md` |
| Migración SQL | `supabase/migrations/00N_*.sql` + documentar en README |
| Deploy | Automático al merge; manual: `npm run deploy` |

Detalle completo: `docs/deploy.md`. **Rama actual de trabajo:** anotar en `NEXT.md` si difiere de `main`.

---

## 8. Qué delegar al agente vs qué no

### Delegar

- Explorar codebase y proponer plan acotado
- Implementar lógica de dominio con tests (`src/lib/`)
- CRUD, hooks, repositorios siguiendo patrones existentes
- Migraciones SQL siguiendo convención del repo
- Refactors con scope cerrado (un item del backlog)
- Actualizar docs de handoff al cierre
- UI dentro de tokens/componentes de `docs/DESIGN.md`

### Revisar siempre (humano)

- Alcance del brief (¿se coló YAGNI?)
- Migraciones y RLS en Supabase prod
- Parsers PDF/OCR (frágiles; validar con fixture real)
- Decisiones de producto ("¿lo vamos a usar nosotros?")
- Merge a `main` / deploy

### No delegar sin brief explícito

- Nuevas dependencias
- Cambios de arquitectura (offline-first, dual-mode)
- Features fuera de alcance en `NEXT.md`
- Copiar competidores / scope de mercado

---

## 9. Verificación por tipo de cambio

| Tipo | Automático | Manual |
|------|------------|--------|
| Lógica pura (`src/lib/`) | `npm test` | — |
| UI | `npm run build` | Smoke en móvil si tocás forms/nav |
| Auth / pareja / sync | CI | Dos navegadores; checklist deploy |
| Import / parsers | Tests con fixtures | PDF real anonimizado |
| Supabase | — | Migración en SQL Editor; smoke prod |
| Solo docs | — | Releer handoff |

Checklist completo: `docs/deploy.md` §2.

---

## 10. Cierre de sesión (Capture)

Al terminar, actualizar `NEXT.md`:

1. **En curso / Siguiente** — bullet concreto (no "avances varios")
2. **Bloqueos / riesgos** — si aparecieron
3. Si una **fase terminó** → mover su detalle a `docs/history/CHANGELOG.md`
4. Si hubo una **decisión con tradeoff** → nuevo ADR en `docs/decisions/`
5. **Aprendizaje** — 1–3 líneas: qué delegación funcionó / falló (sección Capture del brief)

Tiempo humano: ~5 minutos.

---

## 11. Métricas simples (opcional)

Registrar en una nota externa o en la sección Capture del brief:

| Métrica | Para qué |
|---------|----------|
| Tiempo humano activo (min) | Calibrar cuánto vale el flujo |
| Iteraciones hasta merge | Fricción del agente |
| Líneas corregidas a mano post-agente | Calidad de delegación |
| ¿Brief respetado? (sí/no) | Disciplina de scope |

**Meta v0:** features chicas en 1–2 sesiones con CI verde y brief respetado.

---

## 12. Anti-patrones

| Evitar | Por qué |
|--------|---------|
| Sesión sin brief | Scope creep; difícil medir aprendizaje |
| "Mejorar todo el módulo X" | Over-engineering; viola ponytail |
| Feature de mercado sin uso propio | Desvía el north star del laboratorio |
| Agente commitea sin CI | Rompe confianza en delegación |
| Dejar crecer `NEXT.md` | Vuelve al problema original (estado + historia mezclados) |
| Nuevo skill/rule por sesión | Mantenimiento; consolidar cada 5 sesiones |
| Parsers de bancos que no usamos | Deuda perpetua |

---

## 13. Roadmap del laboratorio (no del producto)

Prioridad de **aprendizaje**, no de mercado:

1. Brief estandarizado + 2–3 features con métricas
2. Refactor acotado desde `backlog/code-review.md`
3. Hallmark audit en un flujo existente
4. Smoke browser MCP en login + movimiento (opcional)
5. Retrospectiva → **Playbook v1** (ajustar rules, template, checklist)

Features de producto solo entran si están en uso propio: reglas de categorización, recurrentes, cierre mensual.

---

## 14. Bootstrapping un repo nuevo (futuro)

Copiar al iniciar otro emprendimiento:

```
.cursor/rules/          → karpathy + ponytail + context-router
AGENTS.md               → mapa de contexto
PLAYBOOK.md             → recortar secciones específicas de Finanzas Pareja
NEXT.md                 → vacío con estructura
docs/decisions/0000-template.md
templates/feature-brief.md
.github/workflows/ci.yml
backlog/                → vacío
```

Stack mínimo recomendado: TypeScript + Vite/React + CI + un doc de handoff (`NEXT.md`) + rules + `AGENTS.md`.

---

## Referencias

- `AGENTS.md`
- `docs/deploy.md`
- `NEXT.md` · `docs/history/CHANGELOG.md`
- `backlog/code-review.md`
- `docs/research/`
