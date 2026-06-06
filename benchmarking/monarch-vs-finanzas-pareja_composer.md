# Benchmark funcional: Monarch vs Finanzas Pareja

**Competidor analizado:** [Monarch](https://www.monarch.com/)  
**Producto propio:** Finanzas Pareja — https://finanzas-personales-ebon.vercel.app  
**Fecha:** Junio 2026  
**Estructura solicitada:** 2 secciones principales, 3 segmentos funcionales: **Tracking**, **Budgeting** y **Planning**.

Monarch se posiciona como una app integral para **trackear**, **presupuestar**, **colaborar** y **planificar** dinero en una sola experiencia. Su diferencial principal es la agregación automática de cuentas, presupuesto flexible/categorizado, objetivos y reportes amplios. Finanzas Pareja, en cambio, está optimizada para una necesidad más concreta: **gestionar gastos de pareja**, importar movimientos de forma controlada, calcular quién pagó vs quién debía asumir, registrar liquidaciones y —desde V1 de presupuestos (junio 2026)— **definir límites colaborativos por categoría** para gastos compartidos.

## Sección 1: Cobertura Funcional

### Segmento 1: Tracking

#### Feature: vista consolidada de movimientos

- **Monarch:** lista única y searchable de transacciones de todas las cuentas conectadas.
- **Finanzas Pareja:** **implementado**. Existe lista de movimientos con CRUD, filtros por período, categoría, tipo, pagador, origen, compartido, moneda y búsqueda textual.
- **Impacto si faltara:** no aplica.
- **Observación:** Finanzas Pareja resuelve bien la revisión manual y el contexto de pareja, aunque no trae movimientos automáticamente desde bancos.

#### Feature: conexión automática a instituciones financieras

- **Monarch:** sincroniza cuentas bancarias, tarjetas, préstamos, inversiones y otros activos mediante múltiples proveedores, con más de 13.000 instituciones.
- **Finanzas Pareja:** **no implementado**. El README y el plan original lo dejan explícitamente fuera de alcance.
- **Impacto/beneficio:** **medio para el producto actual; alto para competir como app financiera generalista**.
- **Por qué:** automatiza la carga y mejora retención, pero agrega complejidad, dependencia de proveedores, costos, privacidad y baja disponibilidad/confiabilidad para bancos argentinos. Para el posicionamiento actual, conviene priorizar mejores importaciones y reglas antes que sync bancario.

#### Feature: importación manual de extractos

- **Monarch:** el foco público está en conexión automática; también permite operar sobre transacciones sincronizadas.
- **Finanzas Pareja:** **implementado**. Importa CSV, Excel y PDF, con mapeo, revisión previa, detección de duplicados, categoría sugerida y soporte específico para resúmenes Galicia.
- **Impacto si faltara:** no aplica.
- **Observación:** este es un diferencial propio frente a un producto global: permite controlar qué se sube y adaptarse a formatos locales.

#### Feature: categorización automática de transacciones

- **Monarch:** categorización automática/AI y reglas configurables por el usuario.
- **Finanzas Pareja:** **parcialmente implementado**. Hay sugerencias por keywords durante la importación, pero no reglas persistentes, aprendizaje ni aplicación global a movimientos manuales.
- **Impacto/beneficio:** **alto**.
- **Por qué:** baja fricción en cada importación y convierte una app de carga manual en una experiencia mucho más rápida. Encaja directo con el uso actual sin requerir integración bancaria.
- **Siguiente paso recomendado:** reglas persistentes por descripción/comercio, editables desde ajustes o desde la revisión de importación.

#### Feature: marcar transacciones como revisadas

- **Monarch:** permite revisar/editar transacciones y marcarlas como revisadas; para parejas también se menciona taggear a la pareja para revisar.
- **Finanzas Pareja:** **no implementado**. Los importados pueden estar pendientes/confirmados/ignorados durante el flujo de importación, pero el movimiento final no conserva un estado `reviewed`.
- **Impacto/beneficio:** **medio**.
- **Por qué:** ayuda al hábito semanal/mensual de revisión y es especialmente útil cuando se importan muchos movimientos. No es tan crítico como presupuesto/metas, pero complementa muy bien importaciones.

#### Feature: net worth / patrimonio neto

- **Monarch:** consolida activos, pasivos, cuentas, propiedades, inversiones y evolución del patrimonio.
- **Finanzas Pareja:** **no implementado**. No existe modelo de cuentas, activos, pasivos, inversiones ni valuación patrimonial.
- **Impacto/beneficio:** **medio-bajo**.
- **Por qué:** aporta visión de largo plazo, pero requiere un modelo nuevo y se aleja del problema principal actual: gastos compartidos y saldos entre dos personas.

#### Feature: cuentas separadas y conjuntas del hogar

- **Monarch:** permite reunir cuentas separadas y conjuntas en un dashboard del hogar, asignar ownership y compartir la foto financiera.
- **Finanzas Pareja:** **parcialmente implementado**. Hay identidad de pareja, movimientos personales/compartidos y pagador/asumido, pero no existe entidad `Account` ni saldos por cuenta.
- **Impacto/beneficio:** **medio**.
- **Por qué:** sería útil para interpretar importaciones multi-banco y saber de dónde sale cada gasto. Conviene implementarlo solo si el flujo de importación empieza a mezclar varias cuentas reales.

#### Feature: gastos recurrentes, suscripciones y calendario de vencimientos

- **Monarch:** detecta suscripciones y facturas recurrentes, permite verlas como calendario/lista y recibir recordatorios.
- **Finanzas Pareja:** **no implementado**. Existe categoría "Suscripciones" y sugerencia de categoría por keywords, pero no detección recurrente ni calendario.
- **Impacto/beneficio:** **alto**.
- **Por qué:** reduce carga mental, ayuda a anticipar el mes y es una de las funcionalidades más visibles para usuarios finales.
- **Siguiente paso recomendado:** comenzar simple con movimientos recurrentes manuales y detección heurística por descripción+monto+periodicidad, antes de alertas complejas.

#### Feature: reportes y tendencias

- **Monarch:** reportes personalizables, charts, tendencias por categoría, ingresos, gastos, net worth y Sankey.
- **Finanzas Pareja:** **parcialmente implementado**. Hay dashboard del período, comparación contra período anterior, gasto por categoría y balance; no hay reportes personalizables ni tendencias históricas.
- **Impacto/beneficio:** **medio**.
- **Por qué:** mejora la comprensión y el storytelling financiero, pero depende de tener datos suficientes. Como quick win, una vista de evolución mensual por categoría daría valor sin copiar todo Monarch.

#### Feature: dashboard personalizable

- **Monarch:** widgets arrastrables y dashboard personalizable.
- **Finanzas Pareja:** **no implementado**. Dashboard fijo, mobile-first, orientado al período actual.
- **Impacto/beneficio:** **bajo**.
- **Por qué:** aporta polish, pero no cambia decisiones financieras clave. No debería competir por prioridad contra presupuesto, metas o recurrentes.

#### Feature: web, iOS y Android sincronizados

- **Monarch:** web + apps nativas iOS/Android, siempre sincronizadas.
- **Finanzas Pareja:** **parcialmente implementado**. Es web responsive en Vercel con Supabase/realtime, pero no tiene apps nativas.
- **Impacto/beneficio:** **medio-bajo**.
- **Por qué:** la web responsive cubre bastante para el estado actual. PWA/offline-first probablemente tenga mejor ROI que apps nativas.

### Segmento 2: Budgeting

#### Feature: presupuesto mensual por categoría

- **Monarch:** presupuesto por categorías, grupos, montos esperados vs reales, progreso y alertas.
- **Finanzas Pareja:** **implementado** (V1, junio 2026). Límite **fijo recurrente** por categoría de gasto (`yearMonth: recurring`); el gasto real se compara contra ese tope **por mes calendario** navegable. Solo cuentan movimientos `expense` con `isShared === true`. Persistencia Dexie + Supabase con RLS y realtime; página `/presupuesto`; progreso también en dashboard y análisis de categorías (vista pareja).
- **Impacto si faltara:** no aplica para el núcleo V1.
- **Observación:** V1 priorizó límites simples y colaborativos sobre flexibilidad avanzada. Montos distintos por mes calendario quedaron fuera de alcance.

#### Feature: presupuesto colaborativo de pareja

- **Monarch:** permite presupuestar con pareja/household sin costo adicional.
- **Finanzas Pareja:** **implementado** (V1). Un presupuesto compartido por `couple_id` y categoría (`scope: couple`), editable por ambos miembros con sincronización en tiempo real.
- **Impacto si faltara:** no aplica para V1.
- **Observación:** el diferencial de pareja (quién pagó, quién asumió, liquidaciones) sigue siendo fuerte; la integración presupuesto ↔ liquidaciones queda para una iteración posterior.

#### Feature: presupuesto personal por integrante

- **Monarch:** presupuesto a nivel household con visibilidad por persona/cuenta.
- **Finanzas Pareja:** **no implementado**. Explícitamente fuera de alcance V1. El modelo incluye `scope: 'couple'` preparado para ampliar a `'personal'` en V1.1 (`ownerRole`, cálculo por gasto asumido de cada persona).
- **Impacto/beneficio:** **alto** para parejas con gastos mixtos personal/compartido.
- **Por qué:** V1 validó el flujo colaborativo compartido primero. La extensión natural es un selector Pareja / Personal con presupuestos separados por integrante.
- **Siguiente paso recomendado:** V1.1 con `scope: 'couple' | 'personal'` y UI de edición por persona.

#### Feature: Flex Budgeting

- **Monarch:** presupuesto flexible con buckets de gastos fijos, flexibles y no mensuales.
- **Finanzas Pareja:** **no implementado**.
- **Impacto/beneficio:** **medio**.
- **Por qué:** es poderoso, pero puede ser una segunda capa después del presupuesto por categoría. Para una pareja, primero conviene validar límites simples por categoría.

#### Feature: presupuesto por grupos de categorías

- **Monarch:** group budgeting, con presupuesto a nivel grupo y rollovers.
- **Finanzas Pareja:** **no implementado**. Las categorías no están agrupadas jerárquicamente.
- **Impacto/beneficio:** **medio**.
- **Por qué:** reduce micromanagement y puede simplificar la UX, pero exige rediseñar categorías o agregar `categoryGroup`.

#### Feature: rollovers de presupuesto

- **Monarch:** permite arrastrar sobrantes o excesos a meses siguientes en categorías/grupos.
- **Finanzas Pareja:** **no implementado**.
- **Impacto/beneficio:** **medio-bajo inicialmente; medio después de presupuestos**.
- **Por qué:** útil para gastos no mensuales, pero aumenta complejidad contable. No debería entrar en la primera versión de presupuestos.

#### Feature: alertas por sobre-gasto

- **Monarch:** avisa cuando se superan límites o hay riesgos de excederse.
- **Finanzas Pareja:** **parcialmente implementado** (V1). Estados básicos embebidos en la UI: `ok` (menor al 80%), `near` (80–100%), `over` (más del 100%) en `/presupuesto`, dashboard y categorías. **No** hay alertas proactivas destacadas, resumen global de riesgo ni notificaciones.
- **Impacto/beneficio:** **alto** para la capa avanzada (Prioridad 2).
- **Por qué:** V1 entregó señales visuales mínimas dentro del flujo de presupuesto. La Prioridad 2 amplía visibilidad y accionabilidad sin depender de push/email.

#### Feature: notificaciones push o email de presupuesto

- **Monarch:** alertas y recordatorios fuera de la app.
- **Finanzas Pareja:** **no implementado**. Explícitamente fuera de alcance V1 y de la Prioridad 2 planificada (solo alertas visuales in-app).
- **Impacto/beneficio:** **medio**.
- **Por qué:** útil para hábito y retención, pero agrega infraestructura (permisos, proveedores, preferencias) sin bloquear el valor core del presupuesto colaborativo.

#### Feature: sugerencias de presupuesto por histórico

- **Monarch:** puede sugerir montos usando histórico de gastos.
- **Finanzas Pareja:** **no implementado**.
- **Impacto/beneficio:** **medio**.
- **Por qué:** útil para onboarding de presupuesto, pero requiere primero tener presupuestos básicos. Se puede implementar con promedio de 3 meses por categoría.

#### Feature: integración presupuesto con metas, liquidaciones y cash flow

- **Monarch:** conecta presupuesto, metas, flujo de caja y deuda en una vista de planificación.
- **Finanzas Pareja:** **no implementado**. Liquidaciones y balance entre personas existen como feature propio, pero el presupuesto V1 **no** se cruza con metas, liquidaciones ni proyección de cash flow.
- **Impacto/beneficio:** **alto** a mediano plazo.
- **Por qué:** explícitamente fuera de alcance V1 para mantener la entrega enfocada. El siguiente salto de valor sería mostrar, por ejemplo, si el exceso de presupuesto impacta la deuda neta o el avance hacia una meta compartida.

### Presupuestos colaborativos — alcance V1 y backlog explícito

**Entregado en V1 (junio 2026):**

- Presupuesto colaborativo compartido por pareja (`scope: couple`).
- Límite recurrente por categoría de gasto; avance consultable por mes calendario.
- Cálculo solo con gastos compartidos (`isShared === true`).
- CRUD en `/presupuesto`; progreso en dashboard y categorías.
- Estados básicos `ok` / `near` / `over` dentro de la UI de presupuesto.
- Soporte Dexie (modo local) y Supabase (RLS + realtime).

**Explícitamente fuera de V1 / backlog:**

- Presupuesto personal por integrante (candidato V1.1).
- Flex budgeting.
- Presupuestos por grupos de categorías.
- Rollovers entre meses.
- Montos de presupuesto distintos por mes calendario.
- Sugerencias automáticas por histórico.
- Notificaciones push o emails.
- Alertas visuales avanzadas como feature independiente (Prioridad 2).
- Integración con metas, liquidaciones o cash flow proyectado.
- Modelo de cuentas bancarias o saldos por cuenta (Prioridad 8).

### Segmento 3: Planning

#### Feature: metas de ahorro compartidas

- **Monarch:** metas para vacaciones, remodelaciones, fondo de emergencia, ahorro o pago de deuda; se pueden compartir y trackear.
- **Finanzas Pareja:** **no implementado**. Está en roadmap como "metas compartidas".
- **Impacto/beneficio:** **alto**.
- **Por qué:** abre el caso de uso de planificación conjunta y le da propósito al tracking. Es especialmente natural para parejas: viaje, mudanza, fondo común, compras grandes.

#### Feature: progreso hacia metas

- **Monarch:** targets, progreso y visualización en dashboard.
- **Finanzas Pareja:** **no implementado**.
- **Impacto/beneficio:** **alto**.
- **Por qué:** sin progreso visible, una meta queda como nota estática. La app ya tiene dashboard y período; puede sumar un bloque de metas activas.

#### Feature: contribuciones a metas desde cuentas separadas

- **Monarch:** permite contribuir a objetivos compartidos incluso manteniendo cuentas separadas.
- **Finanzas Pareja:** **no implementado**.
- **Impacto/beneficio:** **alto**.
- **Por qué:** encaja muy bien con la lógica actual de pareja: cada persona puede aportar a una meta sin mezclar toda su economía.

#### Feature: ajustar cash flow para cumplir metas

- **Monarch:** conecta metas con cash flow para entender si se está llegando al plan.
- **Finanzas Pareja:** **no implementado**. Hay ingresos/gastos/neto del período, pero no proyección.
- **Impacto/beneficio:** **medio**.
- **Por qué:** requiere presupuesto y metas antes. Vale la pena como tercera capa: primero medir, luego presupuestar, luego proyectar.

#### Feature: planificación de deudas

- **Monarch:** goals pueden incluir pago de deuda; también monitorea préstamos y tarjetas si están conectados.
- **Finanzas Pareja:** **no implementado**. No hay pasivos ni deuda entre terceros; solo deuda interna de compensación entre personas.
- **Impacto/beneficio:** **medio-bajo**.
- **Por qué:** puede ser valioso más adelante, pero el balance entre personas ya cubre la deuda operativa más importante del producto.

#### Feature: inversiones y asignación de portfolio

- **Monarch:** inversiones, performance, asignación, top movers.
- **Finanzas Pareja:** **no implementado**.
- **Impacto/beneficio:** **bajo**.
- **Por qué:** fuera del alcance natural de una app de gastos de pareja. Requiere integraciones y modelo patrimonial amplio.

### Capacidades Transversales de Colaboración

#### Feature: invitar pareja o household member

- **Monarch:** colaboración con pareja/household sin costo extra.
- **Finanzas Pareja:** **implementado**. Auth Supabase, crear pareja, unirse con código, expiración/revocación/regeneración e identidad por cuenta.
- **Impacto si faltara:** no aplica.
- **Observación:** para el nicho de pareja, esta base es fuerte y ya está en producción.

#### Feature: invitar asesor financiero/profesional

- **Monarch:** permite invitar advisor, coach, tax professional o estate planning attorney.
- **Finanzas Pareja:** **no implementado**.
- **Impacto/beneficio:** **bajo**.
- **Por qué:** implica permisos avanzados y un segmento distinto. No parece prioridad para una app de pareja en etapa actual.

#### Feature: asignar a la pareja para revisar transacciones

- **Monarch:** menciona taggear a la pareja para revisar transacciones.
- **Finanzas Pareja:** **no implementado**.
- **Impacto/beneficio:** **medio**.
- **Por qué:** podría mejorar la colaboración en movimientos dudosos, pero depende de tener estado de revisión y posiblemente comentarios/notificaciones.

#### Feature diferencial propio: quién pagó, quién asumió y liquidaciones

- **Monarch:** ofrece colaboración y presupuesto conjunto, pero su foco no es el cálculo fino de deuda interna por movimiento.
- **Finanzas Pareja:** **implementado**. Reparto personal/compartido, porcentajes configurables, balance pagado/asumido, deuda neta y liquidaciones.
- **Impacto si faltara:** no aplica.
- **Observación:** es el principal diferencial competitivo. Con presupuestos V1 ya entregados, el siguiente salto es conectar presupuesto y metas con esta lógica de compensación, no reemplazarla por un clon generalista de Monarch.

## Sección 2: Priorización Impacto-Beneficio

### Prioridad 1: presupuestos mensuales colaborativos

- **Segmento:** Budgeting.
- **Estado actual:** **implementado** (V1, junio 2026).
- **Impacto:** **muy alto**.
- **Beneficio esperado:** transforma la app de registro y compensación en una herramienta de control mensual.
- **Esfuerzo estimado:** medio (completado).
- **Entregado:** límite recurrente por categoría, scope `couple`, gastos compartidos, `/presupuesto`, dashboard, categorías, Dexie/Supabase/realtime, estados básicos de progreso.
- **Backlog relacionado:** presupuesto personal (V1.1), montos por mes, integración con metas/liquidaciones.

### Prioridad 2: alertas visuales de presupuesto

- **Segmento:** Budgeting.
- **Estado actual:** **parcialmente implementado**. V1 incluyó estados `ok` / `near` / `over` en presupuesto, dashboard y categorías; falta la capa avanzada como feature independiente.
- **Impacto:** **alto**.
- **Beneficio esperado:** hace más accionable el presupuesto sin depender de notificaciones push ni email.
- **Esfuerzo estimado:** bajo-medio.
- **Dependencias:** presupuesto y cálculo real vs presupuestado (ya disponibles).
- **Recomendación:** resumen global de categorías en riesgo, badges/banners en dashboard, mayor prominencia de excesos; sin push/email (fuera de alcance explícito).

### Prioridad 3: metas compartidas con progreso

- **Segmento:** Planning.
- **Estado actual:** no implementado.
- **Impacto:** **alto**.
- **Beneficio esperado:** suma motivación y planificación conjunta; alinea muy bien con parejas.
- **Esfuerzo estimado:** medio.
- **Dependencias:** modelo `Goal`, contribuciones y/o movimientos asociados.
- **Recomendación:** empezar con metas manuales simples: nombre, monto objetivo, fecha opcional, aportes por persona y progreso.

### Prioridad 4: gastos recurrentes y suscripciones

- **Segmento:** Tracking / Planning.
- **Estado actual:** no implementado.
- **Impacto:** **alto**.
- **Beneficio esperado:** anticipa cargos fijos y reduce olvidos.
- **Esfuerzo estimado:** medio.
- **Dependencias:** movimientos históricos, descripción normalizada, categorías.
- **Recomendación:** versión inicial manual + detección sugerida por similitud; calendario después.

### Prioridad 5: reglas persistentes de categorización

- **Segmento:** Tracking.
- **Estado actual:** parcialmente implementado por keywords hardcodeadas en importación.
- **Impacto:** **alto**.
- **Beneficio esperado:** reduce trabajo repetitivo y mejora importaciones.
- **Esfuerzo estimado:** medio.
- **Dependencias:** tabla/local store de reglas, UI de edición, aplicación durante importación.
- **Recomendación:** permitir crear regla desde una corrección en la revisión de importación: "si contiene X, usar categoría Y".

### Prioridad 6: estado de revisión de movimientos

- **Segmento:** Tracking / Collaboration.
- **Estado actual:** no implementado en movimientos finales.
- **Impacto:** **medio**.
- **Beneficio esperado:** facilita cierre mensual y control de importaciones.
- **Esfuerzo estimado:** bajo-medio.
- **Dependencias:** nuevo campo `reviewedAt` o `reviewStatus`; filtros y acciones rápidas.
- **Recomendación:** agregar después de reglas, porque ambas features se potencian.

### Prioridad 7: tendencias mensuales y reportes simples

- **Segmento:** Tracking.
- **Estado actual:** parcialmente implementado con resumen del período y comparación anterior.
- **Impacto:** **medio**.
- **Beneficio esperado:** permite detectar cambios de hábitos sin construir un motor de reportes complejo.
- **Esfuerzo estimado:** medio.
- **Dependencias:** agregaciones por mes/categoría.
- **Recomendación:** evolución mensual de gastos totales, ingresos, neto y top categorías.

### Prioridad 8: modelo simple de cuentas

- **Segmento:** Tracking.
- **Estado actual:** no implementado; solo `accountType` en importaciones.
- **Impacto:** **medio**.
- **Beneficio esperado:** mejora trazabilidad multi-banco/tarjeta y prepara saldo por cuenta.
- **Esfuerzo estimado:** medio-alto.
- **Dependencias:** migración de modelo y UI de importación/movimientos.
- **Recomendación:** posponer hasta que haya necesidad real de distinguir varias cuentas.

### Prioridad 9: offline-first con cola de sync

- **Segmento:** Tracking / Plataforma.
- **Estado actual:** no implementado; existe fallback local sin Supabase, pero no cola offline para producción.
- **Impacto:** **medio**.
- **Beneficio esperado:** mejor experiencia móvil y resiliencia.
- **Esfuerzo estimado:** alto.
- **Dependencias:** resolución de conflictos, cola local, reconciliación Supabase.
- **Recomendación:** importante a futuro, pero no aporta tanto valor visible como presupuestos/metas.

### Prioridad 10: patrimonio neto, inversiones y sync bancario completo

- **Segmento:** Tracking / Planning.
- **Estado actual:** no implementado.
- **Impacto:** **bajo-medio para Finanzas Pareja; alto para competir como Monarch generalista**.
- **Beneficio esperado:** visión financiera integral.
- **Esfuerzo estimado:** alto/muy alto.
- **Dependencias:** cuentas, activos, pasivos, integraciones, seguridad, proveedores externos.
- **Recomendación:** no priorizar salvo que cambie la estrategia de producto hacia una app financiera generalista.

## Resumen Ejecutivo

Finanzas Pareja cubre bien la capa de **tracking operativo de pareja**: movimientos, importación revisable, filtros, categorías, balance, liquidaciones, identidad Yo/Mi pareja, auth, nube y realtime. Con **presupuestos colaborativos V1** (junio 2026), la app ya convierte parte de ese tracking en **control mensual** para gastos compartidos. Frente a Monarch, las brechas más importantes pasan ahora a **planificación**, **alertas avanzadas** y **capas de budgeting más sofisticadas**.

La ruta recomendada no es copiar Monarch entero. El mejor ROI está en llevar el diferencial de pareja hacia lo que sigue pendiente:

1. **Budgeting:** alertas visuales avanzadas (Prioridad 2; V1 ya entregó estados básicos).
2. **Budgeting:** presupuesto personal por integrante (V1.1).
3. **Planning:** metas compartidas con progreso y aportes por persona.
4. **Tracking/Planning:** recurrentes y suscripciones.
5. **Tracking:** reglas persistentes de categorización y revisión de movimientos.
6. **Budgeting/Planning:** integración presupuesto ↔ metas/liquidaciones/cash flow (post-V1).

## Referencias

- [Monarch — sitio oficial](https://www.monarch.com/)
- [Monarch — Tracking](https://www.monarch.com/features/tracking)
- [Monarch — For Couples](https://www.monarch.com/for-couples)
- Resultados públicos de búsqueda sobre Flex Budgeting y Group Budgeting de Monarch.
- `README.md`
- `plan-implementacion-finanzas-pareja.md`
- `siguiente-sesion-implementacion.md`
- Plan V1: `.cursor/plans/presupuestos_colaborativos_d6b9cd86.plan.md`
- Migraciones: `supabase/migrations/006_category_budgets.sql`, `supabase/migrations/007_recurring_budgets.sql`
- Código revisado: `src/types/index.ts`, `src/lib/budget.ts`, `src/pages/BudgetPage.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/CategoriesPage.tsx`, `src/pages/MovementsPage.tsx`, `src/pages/ImportPage.tsx`, `src/pages/BalancePage.tsx`, `src/lib/import.ts`
