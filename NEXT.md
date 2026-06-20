# NEXT — Estado actual

> Estado vivo del proyecto. **Corto a propósito** (máx. una pantalla). Cuando una fase termina, su detalle se muda a `docs/history/CHANGELOG.md`; este archivo solo dice *dónde estoy y qué sigue*.

**Prod:** https://finanzas-personales-ebon.vercel.app · Vercel + Supabase · migraciones `001`–`008` (aplicar `008` en prod)
**Rama de trabajo:** `redesign/budget-category` (verificar con `git status`)
**Última fase cerrada:** Fix teclado iOS en formulario de movimiento (sesión 2026-06-20)

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

## Capture — sesión 2026-06-20 (iOS keyboard fix)

**Objetivo:** En iPhone, al tocar el FAB para registrar un nuevo gasto, el teclado numérico no se activaba automáticamente (funciona en Android).

**Causa raíz:** iOS Safari ignora el atributo HTML `autoFocus` y no abre el teclado virtual. Solo lo abre si `.focus()` ocurre durante un gesto del usuario (tap).

**Entregado — focus-proxy pattern:**
- **Layout.tsx:** FAB cambia de `<NavLink>` a `<button>`. Al tocar, foca un `<input inputMode="decimal">` oculto (gesto del usuario → teclado se abre), luego navega a `/movimientos/nuevo`.
- **CurrencyAmountInput.tsx:** `autoFocus` HTML reemplazado por `useRef` + `useEffect` con `.focus()` al montar. El foco se transfiere del proxy al input real y el teclado queda abierto.

**Archivos:** `Layout.tsx`, `CurrencyAmountInput.tsx`.

**Verificación:** `npm run ci` verde (219 tests, build OK).

**Aprendizaje:** iOS nunca honra `autoFocus` en inputs para abrir el teclado virtual; el workaround estándar es pre-focar un input invisible durante el gesto del usuario y transferir foco al input real al montar el componente destino.
