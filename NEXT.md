# NEXT — Estado actual

> Estado vivo del proyecto. **Corto a propósito** (máx. una pantalla). Cuando una fase termina, su detalle se muda a `docs/history/CHANGELOG.md`; este archivo solo dice *dónde estoy y qué sigue*.

**Prod:** https://finanzas-personales-ebon.vercel.app · Vercel + Supabase · migraciones `001`–`008` (aplicar `008` en prod)
**Rama de trabajo:** `redesign/budget-category` (verificar con `git status`)
**Última fase cerrada:** Local vs prod — ¿localhost escribe en producción? (sesión 2026-06-20)

---

## En curso

- (nada activo / anotar la feature de la sesión)

## Siguiente (1–3, priorizado)

1. Gastos recurrentes manuales
2. Metas compartidas simples
3. Estado de revisión de movimientos

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

## Capture — sesión 2026-06-20 (Local vs prod)

**Pregunta:** ¿Cargar gastos en localhost puede escribir datos reales en producción?

**Respuesta:** **Sí**, si tenés `.env.local` con las credenciales del proyecto Supabase de prod (setup habitual del repo). Local y Vercel comparten la misma base; el frontend solo cambia el host (`localhost:5173` vs Vercel), no el backend. Login con tu cuenta real → `DataContext` en modo `remote` → inserts vía `supabase-repositories` a Postgres. El otro navegador en prod lo ve por realtime.

**Excepción:** sin `.env.local`, la app arranca en modo IndexedDB (`seedDatabase`); ahí los movimientos quedan solo en el dispositivo.

**Mitigación documentada:** `docs/deploy.md` § "Importante: local y prod comparten datos" — usar movimientos/cuentas de test o un proyecto Supabase aparte para pruebas destructivas.

**Entregable:** investigación (sin cambios de código). `npm run ci` verde.

**Aprendizaje:** el riesgo no es Vercel ni el deploy; es que `.env.local` y Vercel apuntan al mismo Supabase por diseño. Conviene asumir "estoy en prod" cada vez que corrés `npm run dev` con credenciales.
