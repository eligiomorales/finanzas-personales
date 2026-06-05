# Siguiente Sesion De Implementacion

## Estado: Fase 4.1 completada y en producción

La app está en Vercel con Supabase configurado. Movimientos, categorías, settings, importaciones, invitaciones e **identidad por cuenta** (Yo/Mi pareja, perfiles) desplegados en prod. Migración `005` aplicada; pruebas manuales completadas en ambas cuentas.

**URL producción:** https://finanzas-personales-ebon.vercel.app

---

## Hecho

### Fase 2 — Supabase, auth y pareja

| Area | Detalle |
|------|---------|
| **Modelo remoto** | Tablas en `supabase/migrations/001_initial_schema.sql`: `profiles`, `couples`, `couple_members`, `categories`, `movements`, `couple_settings`, `imports`, `pending_import_movements` |
| **RLS** | Row Level Security por `couple_id`; políticas extra en `002_fix_auth_and_join.sql` (perfil, invitaciones, membresía) |
| **Auth** | Email + contraseña; login, registro, cierre de sesión |
| **Pareja** | Crear pareja (personA) o unirse con código (personB); código visible en Ajustes |
| **Capa de datos** | Repositorios Dexie + Supabase en `src/lib/repositories/`; hooks en `useData.ts` |
| **CRUD remoto** | Movimientos, categorías, settings (nombres, moneda, cotización) |
| **Liquidaciones** | Movimientos `type = settlement` en nube; visibles en ambos navegadores |
| **Balance** | Sin cambios en `src/lib/balance.ts`; tests pasando |
| **Realtime** | Suscripción compartida por tabla/pareja (`realtime-subscribe.ts`) |
| **Recuperación** | Detección de pareja existente al login; ErrorBoundary para errores de UI |
| **Migración local → nube** | UI en Ajustes con preview (`src/lib/migration/local-to-remote.ts`) — **no usada** (datos locales eran dummy) |
| **Modo fallback** | Sin `.env.local` sigue funcionando en IndexedDB con seed de ejemplo |

### Fase 3 — Deploy a producción

| Area | Detalle |
|------|---------|
| **Hosting** | Vercel — proyecto `finanzas-personales`, scope `eligiomorales-1082s-projects` |
| **Config SPA** | `vercel.json` (build Vite, rewrites React Router) |
| **Variables prod** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` en entorno **production** de Vercel |
| **Scripts** | `scripts/deploy-production.sh`, `scripts/configure-supabase-auth.sh`, `npm run deploy` |
| **Deploy** | https://finanzas-personales-ebon.vercel.app — login Supabase visible en prod |
| **Docs** | README con URL, pasos de deploy, checklist dos dispositivos |
| **Build y tests** | `npm run build` y `npm test` OK |
| **Auth URLs** | Site URL + redirect URLs prod y localhost configurados en Supabase |
| **Smoke test prod** | Login, pareja y movimiento verificados en dos dispositivos |

### Fase 4 — Importaciones en nube + códigos de invitación

| Area | Detalle |
|------|---------|
| **Importaciones Supabase** | Repositorio remoto en `supabase-repositories.ts`; hooks `useImports` / `usePendingImports`; realtime en `003_imports_realtime.sql` |
| **Revisión y duplicados** | Lógica compartida en `import-confirm.ts`; flujo de `ImportPage` sin cambios de UX |
| **Expiración de códigos** | Columna `invite_code_expires_at` en `004_invite_code_expiration.sql`; parejas nuevas: 7 días; parejas existentes: NULL (sin vencimiento) |
| **Revocación** | Desde Ajustes; marca `expires_at = now()` |
| **Regeneración** | Desde Ajustes; código nuevo + 7 días de validez |
| **Auto-expiración al unirse** | Cuando personB se une, el código queda invalidado |
| **Prod** | Migración `004` aplicada en Supabase; UI desplegada en Vercel |
| **Tests** | `invite-code.test.ts`, `import-confirm.test.ts` |

### Fase 4.1 — Identidad por cuenta (Yo / Mi pareja)

| Area | Detalle |
|------|---------|
| **Hook `useCouplePersons`** | Nombres desde `couple_members` + `profiles`; fallback a `couple_settings` para parejas existentes |
| **Etiquetas UI** | Formularios, importación, liquidaciones y filtros: **Yo (nombre)** / **Mi pareja (nombre)** |
| **Defaults** | Pagador por defecto = rol del usuario logueado (movimientos, importación, liquidación) |
| **Ajustes** | Cada usuario edita solo su `display_name`; nombre de la pareja solo lectura |
| **Sincronización legacy** | Al guardar nombre o unirse con código, se actualiza `couple_settings` para backup/export |
| **RLS** | `005_couple_profile_read.sql` — miembros pueden leer perfiles de su pareja |
| **Prod** | Migración `005` aplicada; UI desplegada; smoke test con dos cuentas OK |
| **Tests** | `person-labels.test.ts` (+ suite existente: 81 tests) |

### Archivos clave (Fase 2–4.1)

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_fix_auth_and_join.sql
supabase/migrations/003_imports_realtime.sql
supabase/migrations/004_invite_code_expiration.sql
supabase/migrations/005_couple_profile_read.sql
src/hooks/useCouplePersons.ts
src/lib/couple/persons.ts
src/lib/couple/person-labels.ts
src/lib/couple/service.ts
src/lib/couple/invite-code.ts
src/lib/repositories/supabase-repositories.ts
src/lib/repositories/import-confirm.ts
src/pages/ImportPage.tsx
src/pages/SettingsPage.tsx
src/pages/MovementFormPage.tsx
src/pages/BalancePage.tsx
src/contexts/AuthContext.tsx
src/hooks/useData.ts
```

### Criterios de aceptación

**Fase 2–3**

- [x] Login funcional
- [x] Pareja creada o seleccionada
- [x] Movimientos en backend compartido
- [x] Misma lista visible en dos navegadores
- [x] Deploy en Vercel con variables prod
- [x] Smoke test prod (login + pareja + movimiento)

**Fase 4**

- [x] Importaciones compartidas entre usuarios de la pareja
- [x] Revisión previa, duplicados y confirmación sin regresiones
- [x] Códigos con expiración (7 días en parejas nuevas)
- [x] Regenerar y revocar desde Ajustes
- [x] Parejas existentes no afectadas (expires_at NULL)
- [x] Migración `004` aplicada en Supabase prod
- [x] Deploy con UI de invitaciones en prod

**Fase 4.1**

- [x] Nombres derivados de perfiles + rol de `couple_members` (no edición cruzada en Ajustes)
- [x] UI Yo / Mi pareja en formularios, importación, balance y listas
- [x] Pagador por defecto = usuario logueado
- [x] Migración `005` aplicada en Supabase prod
- [x] Smoke test prod con dos cuentas (nombres, defaults, balance)

---

## Pendiente

### Próxima sesión de código (prioridad)

| Prioridad | Tarea |
|-----------|-------|
| 1 | **Presupuestos mensuales por categoría** |
| 2 | Metas compartidas y gastos recurrentes |
| 3 | Tests de integración contra Supabase (opcional) |
| 4 | Offline-first con cola de sync (arquitectura) |

### Fuera de alcance

- Integraciones bancarias automáticas
- IA real
- Permisos avanzados por rol
- Multi-pareja o grupos de más de dos personas
- Resolución compleja de conflictos offline

---

## Riesgos vigentes

- **RLS en producción**: revisar políticas antes de uso real con datos sensibles; no usar `service_role` en el frontend.
- **`couple_settings.person_a/b_name`**: columnas legacy sincronizadas al guardar perfil; la fuente de verdad en UI es `profiles` + `couple_members`. Deprecación completa opcional en fase futura.

---

## Prompt sugerido para la próxima sesión

```text
Quiero continuar Finanzas Pareja después de Fase 4.1 (identidad por cuenta).

Lee:
- README.md
- siguiente-sesion-implementacion.md

Contexto:
- Producción: https://finanzas-personales-ebon.vercel.app (Vercel + Supabase).
- Todo en nube: movimientos, categorías, settings, importaciones.
- Identidad por cuenta: Yo/Mi pareja, nombres desde perfiles, migración 005 en prod.
- Códigos de invitación con expiración/revocación/regeneración.

Objetivo:
- Implementar presupuestos mensuales por categoría (definir monto, ver progreso vs gastos del mes).

Ejecuta build y tests al final.
```

---

## Referencia histórica (plan original Fase 2)

<details>
<summary>Objetivo y decisiones originales</summary>

Evolucionar desde IndexedDB hacia datos compartidos, backup confiable, auth simple y fuente única de verdad.

**Decisión tomada:** Supabase primero, sin offline-first completo. IndexedDB queda como fallback local.

</details>
