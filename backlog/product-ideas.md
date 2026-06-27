# Backlog de ideas de producto

Inbox de **ideas propias** entre sesiones. No es la cola de ejecución (`NEXT.md`) ni research de mercado (`docs/research/`).

**Cuándo usar este archivo:** capturás un dolor, una mejora o un “¿y si…?” mientras usás la app y **no** querés decidir ahora si entra en las próximas 1–3 sesiones.

**Cuándo NO usar este archivo:**

| Situación | Dónde va |
|-----------|----------|
| Próxima sesión (top 1–3) | `NEXT.md` |
| Benchmark / competencia / mercado | `docs/research/` |
| Refactor, arquitectura, DX | `backlog/code-review.md` |
| Ya cerrado | `docs/history/CHANGELOG.md` |
| Explícitamente no | `NEXT.md` → Fuera de alcance |

---

## Triage (30 s)

1. Mirar **Radar** → filtrar `Ready = ✅`
2. Preferir esfuerzo **B**, o el **siguiente del epic activo** (hoy: `IMP-1`) según [Prioridad por dolor](#prioridad-por-dolor-2026-06-21)
3. Máx **1 promoción** por triage; `NEXT.md` sigue con máx 3 ítems
4. Criterios: **uso propio** · **cabe en 1 sesión** · **deps resueltas**
5. Al promover: actualizar Radar + fila en Promovidas + referencia ID en `NEXT.md`

**Regla:** máximo **~15 filas `inbox` en Radar**. Si crece más, podar (`parked` / `rejected`) o promover.

**Nueva idea:** agregar fila al Radar + sección compacta bajo su epic (o Sueltas).

---

## Flujo

```text
Dolor o idea (uso real)
        ↓
Fila nueva en Radar (estado: inbox)
        ↓
¿Lo usamos nosotros? ──no──→ parked o rejected (+ motivo)
        ↓ sí
¿Entra en top 3 ahora? ──no──→ queda inbox (revisar en triage)
        ↓ sí
Promover a NEXT.md → marcar promoted + fecha + ID
        ↓
Sesión con brief → entregar → CHANGELOG → sacar de NEXT / marcar done acá
```

---

## Prioridad por dolor (2026-06-21)

Orden estratégico acordado. El **Radar** y las secciones de epic siguen este criterio; `NEXT.md` refleja el top 3 ejecutable.

| # | Bloque | Epic / área | Dolor principal |
|---|--------|-------------|-----------------|
| 1 | **Import by exception** | `IMP-1 → IMP-5` | Carga mensual por PDF es la fricción #1; hoy revisamos fila por fila |
| 2 | **Planning** | `PLAN-1`, `PLAN-2` (+ `META-1` dep.) | No anticipamos si el mes cierra bien ni conectamos metas al día a día |
| 3 | **Sueltas** | `TRK-*`, `BUD-1` (+ quick wins `DASH-2`) | Análisis, insights y polish acotado sin epic largo |
| 4 | **Gastos recurrentes** | `REC-1 → REC-4` | Repetimos cargas fijas; duele menos que import hasta resolver (1) |
| — | Dashboard (decisiones) | `DASH-*` | Tras Planning o embebido en PLAN/dashboard; `DASH-3` ⛔ `REV-1` |

---

## Radar

| ID | Idea | Epic | Ready | Esf. | Estado | Siguiente si… |
|----|------|------|-------|------|--------|---------------|
| IMP-1 | Import Preview | Import | ✅ | M | **done** | — |
| IMP-2 | Import by Exception | Import | ✅ | M | **done** | — |
| IMP-3 | Edición inline import | Import | ✅ | B-M | **done** | — |
| IMP-4 | Bulk Actions merchant | Import | ✅ | M | **done** | — |
| IMP-5 | Reglas desde import | Import | ✅ | B-M | **done** | — |
| IMP-UI | Pulido incremental pantalla Import | Import | ✅ | M | **done** | — |
| PLAN-1 | Proyección fin de mes | Planning | ✅ | M | inbox | prioridad #2; MVP sin REC (extrapolación lineal) |
| PLAN-2 | Meta en dashboard | Planning | ⛔ META-1 | B-M | inbox | tras metas compartidas |
| META-1 | Metas compartidas simples | Planning | ✅ | M | inbox | dep. de PLAN-2; promover cuando toque Planning |
| TRK-1 | Un insight en home | Sueltas | ✅ | M | inbox | prioridad #3 |
| TRK-2 | Pantalla Análisis | Sueltas | ✅ | M | inbox | prioridad #3 |
| TRK-3 | Tendencias mensuales | Sueltas | ✅ | M | inbox | post PLAN-1 o metas |
| TRK-4 | Tendencia por categoría | Sueltas | ✅ | M | **done** | — |
| DASH-2 | Compensación arriba | Sueltas | ✅ | B | **done** | — |
| BUD-1 | Presupuesto personal | Sueltas | ⛔ uso | M | inbox | posponer hasta presupuesto compartido en uso real |
| REC-1 | Modelo + migración | Recurrentes | ✅ | M | inbox | prioridad #4 — tras bloques 1–3 |
| REC-2 | CRUD plantillas | Recurrentes | ⛔ REC-1 | M | inbox | tras REC-1 |
| REC-3 | Generación mensual | Recurrentes | ⛔ REC-2 | M | inbox | tras REC-2 |
| REC-4 | Totales esperados | Recurrentes | ⛔ REC-3 | B | inbox | mejora PLAN-1; no bloqueante |
| DASH-1 | Semáforo de estado | Dashboard | ✅ | M | inbox | tras PLAN-1; unificar con DASH-4 |
| DASH-3 | Acciones pendientes | Dashboard | ⛔ REV-1 | M | inbox | tras estado revisión |
| DASH-4 | Alertas presupuesto | Dashboard | ✅ | B | inbox | nice-to-have |
| REV-1 | Estado revisión movimientos | Dashboard | ✅ | M | inbox | dep. de DASH-3 |

**Leyenda:** Esf. = B · M · A (bajo · medio · alto) · Ready = ✅ deps OK · ⛔ bloqueado (ref en columna)

---

## Epic: Import by exception *(cerrado 2026-06-21 — IMP-1→IMP-5 entregado)*

_Premisa:_ subir resumen → revisar **solo excepciones** → confirmar. Pipeline: parsing → merchant → reglas → confianza → preview → excepciones → persistir. Promover en orden **IMP-1 → IMP-5** (una sesión por ítem). V2 (indicadores 🟢🟡🔴, “Confiar e importar”, undo lote) → Parked.

### IMP-1 · Import Preview · promoted · M · ✅

**Dolor:** Tras subir PDF/CSV no hay snapshot claro antes de entrar fila por fila.
**MVP:** N gastos, monto total, N requieren revisión, % confianza agregado; CTA “Revisar pendientes”.
**No:** gráficos, agrupación por categoría (V2).
**Deps:** extender `ImportResult` (total, warnings, confidence). · Research: import resúmenes 2026-06-21 MVP #1

### IMP-2 · Import by Exception · done · M · ✅

**Dolor:** Se revisan todas las filas aunque Carrefour/Netflix ya tienen categoría obvia.
**MVP:** `confidence >= 90` → auto-aprobado oculto; lista solo `< 90` o sin categoría / monto inusual.
**No:** ML; señales OCR ponderadas (V2).
**Deps:** IMP-1; scoring por fila en `import.ts`. · ponytail: umbral fijo + keyword match existente

### IMP-3 · Edición inline import · done · B-M · ✅

**Dolor:** Corregir categoría/monto requiere demasiados pasos o modales.
**MVP:** Tabla/lista: merchant + `[categoría ▼]` editable in-place; persist local hasta “Importar”.
**No:** edición de fecha, split, notas.
**Deps:** `ImportReviewItemCard` / `ImportPage`. · Reutilizar patrones de `MovementFormPage`

### IMP-4 · Bulk Actions merchant · done · M · ✅

**Dolor:** 12× Starbucks = 12 correcciones idénticas.
**MVP:** Agrupar preview por `merchantNormalized`; “Aplicar categoría X a N filas” en un clic.
**No:** bulk edit monto/fecha; SQL-style updates.
**Deps:** normalización merchant en parser; revisión import. · `groupBy(merchantNormalized)` en memoria pre-persist

### IMP-5 · Reglas desde import · done · B-M · ✅

**Dolor:** Reglas existen (`category_rules`) pero no se crean fluido al corregir en import ni suben confianza.
**MVP:** Checkbox “Recordar para próximas importaciones”; guardar regla al confirmar import; match futuro → confidence 95+.
**No:** `confidenceBoost` numérico fino; inferencia automática batch.
**Deps:** migración `008`, ADR 0004, `infer-rules.ts`. · **Done:** checkbox + persist on confirm + tests

### IMP-UI · Pulido incremental pantalla Import · done · M · ✅

**Dolor:** La pantalla de import puede quedar pesada al sumar preview, revisión por excepción y edición inline.
**MVP:** Reorganizar el review en bloques más claros (resumen del lote, acciones principales, lista de excepciones) manteniendo componentes existentes y mobile-first.
**No:** rediseño completo, nuevo wizard, gráficos, navegación nueva o reescritura de `ImportPage`.
**Deps:** IMP-1/2/3/4/5. · **Done:** Opción A canvas, bulk colapsable, filas compactas, footer safe-area

---

## Epic: Planning *(prioridad dolor #2)*

### PLAN-1 · Proyección fin de mes · inbox · M · ✅

**Dolor:** El histórico no anticipa; cuesta saber si el mes cierra bien.
**MVP:** Gastos a la fecha + extrapolación lineal (promedio diario × días restantes) → saldo proyectado; ingresos esperados manuales opcionales.
**No:** cash flow multi-mes, escenarios, IA.
**Deps:** ninguna bloqueante. · **Mejora posterior:** REC-3/REC-4 enriquecen ingresos/gastos esperados

### PLAN-2 · Meta en dashboard · inbox · B-M · ⛔ META-1

**Dolor:** Sin meta visible, el home no conecta gasto diario con objetivos compartidos.
**MVP:** Si hay ≥1 meta activa: nombre + barra % + monto actual / objetivo (link a metas).
**No:** múltiples metas, contribuciones desde cuentas separadas.
**Deps:** META-1. · Bloque UI; implementar tras feature de metas

### META-1 · Metas compartidas simples · inbox · M · ✅

**Dolor:** No hay entidad meta; no podemos ahorrar hacia objetivos compartidos visibles.
**MVP:** CRUD metas (nombre, monto objetivo, monto actual manual o suma categorías); lista en ruta dedicada.
**No:** contribuciones automáticas, IA, múltiples monedas complejas.
**Deps:** ninguna. · Promover antes de PLAN-2

---

## Sueltas *(prioridad dolor #3 · Tracking · Budgeting · quick wins)*

### TRK-1 · Un insight en home · inbox · M · ✅

**Dolor:** Hay datos pero no surfacing de “qué cambió” sin abrir análisis.
**MVP:** **Un solo** insight rule-based por período (ej. “25% menos en supermercado vs mes anterior”).
**No:** motor de insights múltiples, IA generativa. · ponytail: reglas fijas, no LLM

### TRK-2 · Pantalla Análisis · inbox · M · ✅

**Dolor:** Home mezcla briefing con gráficos/detalle; el dashboard debería decidir, no analizar.
**MVP:** Ruta `/analisis` (o tab): gastos por categoría, distribuciones, tendencias; sacar breakdown pesado del dashboard.
**No:** reportes exportables, filtros avanzados.
**Deps:** `DashboardCategoryBreakdown` y similares. · No lógica nueva de dominio

### TRK-3 · Tendencias mensuales · inbox · M · ✅

**Dolor:** Cuesta ver evolución mes a mes sin exportar.
**MVP:** Gráfico o tabla: total gastos / ingresos / neto últimos 6 meses.
**No:** motor de reportes, export PDF, drill-down histórico.
**Deps:** agregaciones por mes (parcial en dashboard).

### TRK-4 · Tendencia por categoría · **done** · M · ✅

**Dolor:** Evolución mes a mes solo a nivel total; no se ve tendencia por categoría sin comparar donuts mes a mes.
**MVP:** Segundo slide del carrusel en Tendencias: barras de 6 meses para una categoría elegida vía dropdown.
**No:** multi-línea, presupuesto en slide, drill-down a movimientos.
**Deps:** `buildMonthlyTrends` / movimientos en rango 6 meses. · **Done (2026-06-27):** `buildCategoryMonthlyTrends`, `CategoryTrendBarChart`, slide en carrusel; brief `briefs/2026-06-27-trk-4-tendencia-categoria.md`

### DASH-2 · Compensación arriba · **done** · B · ✅

**Dolor:** El balance entre integrantes es el diferenciador pero compite con métricas genéricas.
**MVP:** Subir `DashboardCompensationRow` justo debajo del semáforo / saldo neto.
**No:** rediseño completo del bento.
**Deps:** ninguna (feature ya existe). · **Done (2026-06-27):** callout con label, badge, monto destacado y CTA; brief `briefs/2026-06-27-dash-2-compensacion-arriba.md`

### BUD-1 · Presupuesto personal · inbox · M · ⛔ uso

**Dolor:** Hoy solo scope `couple`; a veces queremos límite individual además del compartido.
**MVP:** Mismo modelo con scope `person_a` / `person_b` + filtro en UI.
**No:** montos distintos por mes calendario, flex budget.
**Deps:** ADR 0003; posible migración. · Posponer hasta presupuesto compartido en uso real

---

## Epic: Gastos recurrentes manuales *(prioridad dolor #4)*

**Objetivo:** cargar una vez Netflix, alquiler, sueldo fijo u otros compromisos periódicos; generar (o anticipar) los movimientos del mes sin reescribirlos a mano cada vez.

**Dolor hoy:** no hay plantillas ni vista de compromisos fijos; cada mes repetimos import o carga manual. **Duele menos que import (1)** hasta resolver el flujo by exception.

**MVP del epic:** plantillas editables + generación idempotente mensual + total esperado en dashboard. **Una sesión por fase** (`REC-1 → REC-4`).

**Fuera de MVP (→ Parked):** detección heurística desde import, calendario/vencimientos, push, frecuencias semanal/quincenal, variación de monto automática, vincular plantilla a presupuesto por categoría.

**Modelo propuesto:** tabla `recurring_templates` (pareja, tipo, monto, categoría, pagador, reparto, frecuencia) + columna opcional `recurring_template_id` en `movements` para trazabilidad e idempotencia (`template + year-month` = una instancia).

Research: `docs/research/benchmarking-monarch.md` — Prioridad 4 (empezar manual, luego heurística).

### REC-1 · Modelo + migración · inbox · M · ✅

**Dolor:** no existe entidad recurrente; imposible persistir plantillas.
**MVP:** migración `009_recurring_templates.sql`; tipos TS; repos Dexie + Supabase + RLS; tests mínimos en `src/lib/` (frecuencia mensual, campos obligatorios).
**No:** UI, generación automática, cron/server job.
**Deps:** ninguna. · **Done:** tipos + repos + migración aplicable en prod

### REC-2 · CRUD plantillas · inbox · M · ⛔ REC-1

**Dolor:** sin pantalla, las plantillas no son usables day-to-day.
**MVP:** ruta `/recurrentes` (o sección en Ajustes): listar activas/pausadas; formulario crear/editar/pausar/eliminar (reutilizar patrones de `MovementFormPage`: monto, categoría, pagador, compartido, día del mes 1–28).
**No:** generar movimientos desde acá; frecuencias distintas a mensual.
**Deps:** REC-1. · **Done:** CRUD completo local + remote con realtime

### REC-3 · Generación mensual · inbox · M · ⛔ REC-2

**Dolor:** las plantillas existen pero no impactan el mes hasta cargarlas a mano otra vez.
**MVP:** acción “Generar este mes” (y opcional al abrir app si hay pendientes): por cada plantilla activa, insertar movimiento si no existe instancia para `year-month`; `source: manual`, link `recurring_template_id`.
**No:** auto-generar meses futuros; editar instancia no muta plantilla (ponytail: instancia = movimiento normal).
**Deps:** REC-2. · **Done:** generación idempotente + smoke con 2–3 plantillas

### REC-4 · Totales esperados · inbox · B · ⛔ REC-3

**Dolor:** el dashboard no distingue lo ya cargado vs lo que falta del mes fijo.
**MVP:** bloque compacto en dashboard: “Compromisos fijos del mes” — suma plantillas activas vs ya generadas/categorizadas; link a `/recurrentes`.
**No:** proyección lineal completa (eso es PLAN-1); alertas de vencimiento.
**Deps:** REC-3. · Enriquece PLAN-1; no bloqueante

---

## Epic: Dashboard orientado a decisiones

_North star (Duo 2026-06-21):_ la app responde *“¿Cómo estamos?”* y *“¿Qué deberíamos hacer?”*, no solo *“¿Qué gastamos?”*. Balance pareja **ya implementado** (CHANGELOG Fase 4+). **Prioridad:** después de Planning; `DASH-2` movido a Sueltas.

### DASH-1 · Semáforo de estado · inbox · M · ✅

**Dolor:** El home es descriptivo; no dice si “todo en orden” o si hay que actuar.
**MVP:** Bloque arriba del fold: 🟢 sin acciones y bajo presupuesto · 🟡 categoría >80% · 🔴 ritmo → saldo negativo proyectado (heurística simple).
**No:** ML, múltiples insights, copy dinámico largo.
**Deps:** Presupuestos V1; opcional PLAN-1. · Nota: solapado con DASH-4; unificar en una sesión si se promueve

### DASH-3 · Acciones pendientes · inbox · M · ⛔ REV-1

**Dolor:** Pendientes (sin categorizar, import sin confirmar, liquidación) no están centralizados.
**MVP:** Lista corta con links: “N sin categoría”, “N import pendiente revisión”, “Balance pendiente liquidación”.
**No:** push, asignación entre pareja.
**Deps:** REV-1; flujo import existente. · Conecta import + revisión + balance

### DASH-4 · Alertas presupuesto · inbox · B · ✅

**Dolor:** V1 tiene ok/near/over; falta resumen global de categorías en riesgo en dashboard.
**MVP:** Banner “N categorías cerca del límite”; link a `/presupuesto`.
**No:** push, email, reglas configurables.
**Deps:** Presupuestos V1 (hecho). · Research: `docs/research/benchmarking-monarch.md` P2

### REV-1 · Estado revisión movimientos · inbox · M · ✅

**Dolor:** No hay flujo claro de “movimientos a revisar” post-import o sin categoría.
**MVP:** Estado `needs_review` o equivalente; lista filtrable; marcar revisado.
**No:** asignación entre pareja, workflow complejo.
**Deps:** ninguna bloqueante. · Dep. de DASH-3

---

## Plantilla al promover (copiar al brief)

Usar solo cuando una fila pasa a `NEXT.md`:

```markdown
### [ID] · [Nombre]

**Dolor:** …
**MVP:** …
**No (anti-goals):** …
**Deps / bloqueos:** …
**Done:** …
```

---

## Promovidas a NEXT (referencia)

Ideas **ya en cola de ejecución**. No duplicar trabajo; solo trazabilidad.

| ID | Idea | Promovida | En NEXT.md |
|----|------|-----------|------------|
| IMP-1→5 | Epic Import by exception | 2026-06-21 | **done** 2026-06-21 |
| PLAN-1→2 | Epic Planning (+ META-1 dep.) | 2026-06-21 | Siguiente #2 — tras Import o en paralelo PLAN-1 |
| TRK/DASH-2 | Sueltas (elegir en triage) | — | Siguiente #3 — candidatos ready abajo |

Al cerrar sesión de una promovida: marcar **done** abajo (opcional) y quitar de `NEXT.md`.

---

## Done (entregado)

Detalle técnico en `CHANGELOG`. Trazabilidad rápida acá.

| ID | Idea | Entregado | CHANGELOG / ADR |
|----|------|-----------|-----------------|
| IMP-5 | Reglas desde import | entregado | CHANGELOG 2026-06-21 |
| IMP-UI | Pulido pantalla Import | entregado | CHANGELOG 2026-06-21 |
| IMP-4 | Bulk Actions merchant | entregado | CHANGELOG 2026-06-21 |
| IMP-3 | Edición inline import | entregado | CHANGELOG 2026-06-21 |
| IMP-2 | Import by Exception | entregado | CHANGELOG 2026-06-21 |
| IMP-1 | Import Preview | entregado | CHANGELOG 2026-06-21 |
| CAT-1 | Reglas persistentes (backend) | entregado | migración `008`, ADR 0004 — UX import = IMP-5 |
| BAL-1 | Balance automático entre integrantes | entregado | CHANGELOG — liquidaciones, compensación |

---

## Parked (tal vez después)

| ID / Idea | Motivo |
|-----------|--------|
| Offline-first con cola de sync | Alto esfuerzo; fuera de alcance vigente |
| Sync bancario automático | Fuera de alcance; research documentado |
| IA conversacional | Fuera de alcance — IA real; Resumen Duo V3 |
| Simulador financiero | Requiere proyección + metas; V3 Duo |
| Metas inteligentes (IA) | IA real; depende metas manuales primero |
| Captura ultra rápida (audio, foto, IA) | IA real + scope amplio |
| Insights batch / patrones ML | Distinto de TRK-1; IA o motor pesado |
| Modelo freemium / premium | North star laboratorio: uso propio |
| View Transitions API | Evaluar en `backlog/motion.md` |
| Import V2 — indicadores 🟢🟡🔴 por fila | Tras epic Import MVP |
| Import V2 — agrupación por categoría pre-import | Expandir bajo demanda |
| Import V2 — “Confiar e importar” | `confidence > threshold && pendingIssues === 0` |
| Import V2 — métricas “N% reconocidos” | Copy de confianza post-parse |
| Import V2 — undo lote (`importBatchId`) | Opción simple antes que event sourcing |
| REC V2 — detección heurística (descripción + monto + periodicidad) | Tras epic REC MVP; research Monarch P4 |
| REC V2 — calendario / vencimientos / recordatorios | Push fuera de alcance; evaluar lista simple antes |
| REC V2 — frecuencia semanal / quincenal | Mensual basta para uso propio inicial |

---

## Rejected (no hacer / no ahora)

| Idea | Motivo |
|------|--------|
| Copiar layout Monarch | North star: identidad propia; fuera de alcance |
| Modo oscuro | Fuera de alcance salvo decisión explícita |

---

## Relación con research

| `docs/research/` | `backlog/product-ideas.md` |
|------------------|----------------------------|
| Análisis externo, comparativas, mercado | Dolor interno, captura rápida |
| Cambia poco | Crece entre sesiones, se poda |
| No accionable directo | Accionable tras triage → NEXT |
| Citá con link en la fila compacta | No copies páginas enteras de research |

**Regla práctica:** research informa; este archivo **decide si nos importa a nosotros**.
