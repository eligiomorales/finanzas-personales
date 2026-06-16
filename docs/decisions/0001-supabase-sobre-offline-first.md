# ADR 0001 — Supabase sobre offline-first

**Fecha:** 2026-04 · **Estado:** vigente

## Contexto

El MVP arrancó local (IndexedDB). Para que la pareja comparta datos entre dispositivos hacía falta backend: datos compartidos, backup confiable, auth simple y fuente única de verdad.

## Decisión

Supabase primero (Postgres + auth + realtime + RLS). IndexedDB (Dexie) queda como **fallback local** sin `.env.local`, no como modo offline-first sincronizado.

## Alternativas consideradas

- **Offline-first completo con cola de sync:** mayor resiliencia móvil, pero alta complejidad de reconciliación de conflictos para dos usuarios. Postergado (ver `backlog/`).
- **Firebase:** viable, pero Postgres + RLS encaja mejor con el modelo relacional pareja/movimientos.

## Consecuencias

- ✅ Realtime y auth resueltos; RLS por `couple_id`.
- ✅ Modo local sigue sirviendo para desarrollo de UI sin credenciales.
- ⚠️ Sin offline-first real: si no hay red, no hay cola de sync (deuda conocida).
- ⚠️ Local y prod comparten el mismo proyecto Supabase salvo que se cree uno aparte (ver `docs/deploy.md`).
