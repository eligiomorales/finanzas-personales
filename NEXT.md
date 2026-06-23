# NEXT — Estado actual

> Estado vivo del proyecto. **Corto a propósito** (máx. una pantalla). Cuando una fase termina, su detalle se muda a `docs/history/CHANGELOG.md`; este archivo solo dice *dónde estoy y qué sigue*.

**Prod:** https://finanzas-personales-ebon.vercel.app · Vercel + Supabase · migraciones `001`–`008` (aplicar `008` en prod)
**Rama actual:** `fix/mobile-input-zoom`
**Última fase cerrada:** Mobile PWA — inputs 16px en móvil para evitar zoom al enfocar (iOS + Android, sesión 2026-06-23)

---

## En curso

_Nada activo — elegir siguiente sesión del top 3._

## Siguiente (1–3, priorizado por dolor)

1. Epic Planning **`PLAN-1`** (proyección fin de mes — ready, sin deps)
2. Sueltas ready: **`TRK-1`** · **`DASH-2`** (elegir una por sesión)
3. Epic recurrentes **`REC-1`** (modelo + migración — prioridad #4)

_Epic Import by exception (IMP-1→IMP-5 + IMP-UI) cerrado._
_TRK-3 Tendencias cerrado (2026-06-21 + polish 2026-06-22)._
_Análisis simplificado: pestaña Categorías eliminada; presupuesto vs gasto en Tendencias._
_Movimientos: búsqueda + filtros/orden icon-only; sin filtro de fecha por defecto; carga inicial 30; liquidaciones ocultas al filtrar por categoría; período del home independiente; modal de filtros organizado en secciones._
_Mobile: inputs ≥16px en viewport estrecho (iOS Safari + Android Chrome); fallback CSS global + smoke en ambos._

_Prioridad completa:_ `backlog/product-ideas.md` → Prioridad por dolor

## Bloqueos / riesgos activos

- **Local = prod (con `.env.local`):** `npm run dev` usa las mismas `VITE_SUPABASE_*` que producción; un gasto en localhost es un row real en Postgres y aparece en la app desplegada (realtime). Sin `.env.local` → IndexedDB aislado, no toca prod.
- **RLS en prod:** revisar políticas antes de uso con datos reales; nunca `service_role` en el frontend.
- **`couple_settings.person_a/b_name`:** columnas legacy; fuente de verdad real = `profiles` + `couple_members`.
- **Migración `008_category_rules.sql`:** aplicar en Supabase SQL Editor antes de usar reglas en prod.

## Fuera de alcance (vigente)

Integraciones bancarias automáticas · IA real · permisos por rol · grupos > 2 personas · conflictos offline complejos · modo oscuro (salvo decisión explícita) · copiar marca/layout de Monarch.

---

## Cómo retomar una sesión

1. El agente lee `PLAYBOOK.md` + este archivo + `AGENTS.md`.
2. Completar `templates/feature-brief.md` para la feature elegida.
3. Pedir **Explore + Plan** antes de implementar.
4. Al cerrar: `npm run ci` + actualizar este archivo (sección Capture del brief).

## Prompt mínimo

```text
Quiero continuar Finanzas Pareja.
Lee AGENTS.md, PLAYBOOK.md, NEXT.md y el brief adjunto.
Objetivo (una sola cosa): [...]
Explore + Plan primero. Al final: npm run ci + actualizar NEXT.md.
```
