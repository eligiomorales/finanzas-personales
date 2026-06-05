-- Expiración y revocación de códigos de invitación
-- Idempotente: se puede ejecutar más de una vez

alter table public.couples
  add column if not exists invite_code_expires_at timestamptz;

comment on column public.couples.invite_code_expires_at is
  'NULL = sin vencimiento (parejas existentes). Pasada la fecha, el código no permite unirse.';

-- Parejas nuevas: vencimiento a 7 días (solo filas sin fecha previa creadas después del deploy)
-- Las parejas ya existentes quedan con NULL y no se ven afectadas.

drop policy if exists "Members can update invite code" on public.couples;
create policy "Members can update invite code"
  on public.couples for update
  to authenticated
  using (id = public.get_my_couple_id())
  with check (id = public.get_my_couple_id());
