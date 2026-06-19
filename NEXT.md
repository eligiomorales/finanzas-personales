# NEXT — Estado actual

> Estado vivo del proyecto. **Corto a propósito** (máx. una pantalla). Cuando una fase termina, su detalle se muda a `docs/history/CHANGELOG.md`; este archivo solo dice *dónde estoy y qué sigue*.

**Prod:** https://finanzas-personales-ebon.vercel.app · Vercel + Supabase · migraciones `001`–`008` (aplicar `008` en prod)
**Rama de trabajo:** `redesign/budget-category` (verificar con `git status`)
**Última fase cerrada:** Inferir reglas desde historial (sesión 2026-06-19)

---

## En curso

- (nada activo / anotar la feature de la sesión)

## Siguiente (1–3, priorizado)

1. Gastos recurrentes manuales
2. Metas compartidas simples
3. Estado de revisión de movimientos

## Bloqueos / riesgos activos

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

## Capture — sesión 2026-06-19 (Inferir reglas desde historial)

**Entregado:** `inferRulesFromHistory()` en `infer-rules.ts` — tokeniza descripciones de gastos categorizados, filtra por dominancia (≥80%, ≥2 usos), descarta reglas existentes y keywords hardcodeadas redundantes; botón "Sugerir desde historial" + preview con checkboxes en `CategorySettingsPage`; guardado batch vía `addRule`. `npm run ci` verde (219 tests).

**Archivos clave:** `infer-rules.ts`, `infer-rules.test.ts`, `CategorySettingsPage.tsx`.

**Aprendizaje:** inferencia 100% front sobre movimientos ya cargados; preview con confirmación evita reglas basura sin necesitar back ni RPC.
