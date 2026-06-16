# ADR 0002 — Identidad y rol fijo por cuenta

**Fecha:** 2026-05 · **Estado:** vigente

## Contexto

Los nombres de la pareja se guardaban en `couple_settings` (editables por cualquiera). Eso permitía que un miembro editara el nombre del otro y no ataba la identidad a la cuenta logueada.

## Decisión

La identidad se deriva de `profiles` + `couple_members`. El **rol** (personA / personB) queda fijado al crear o unirse a la pareja. Cada usuario edita solo su `display_name`; el de la pareja es solo lectura. UI con etiquetas **Yo / Mi pareja** y pagador por defecto = usuario logueado.

## Consecuencias

- ✅ Identidad consistente y no editable de forma cruzada.
- ✅ Defaults de formularios más naturales (Yo paga por defecto).
- ⚠️ `couple_settings.person_a/b_name` quedan como columnas legacy sincronizadas para backup/export; fuente de verdad real = `profiles` + `couple_members`.
- ⚠️ Requiere `005_couple_profile_read.sql` (RLS para leer el perfil de la pareja).
