-- Realtime para historial de importaciones compartido entre la pareja
alter publication supabase_realtime add table public.imports;
alter publication supabase_realtime add table public.pending_import_movements;
