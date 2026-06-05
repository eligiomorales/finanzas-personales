-- Permitir leer el perfil de la pareja (nombre visible) sin exponer datos a terceros

DROP POLICY IF EXISTS "Members can read partner profiles" ON public.profiles;
CREATE POLICY "Members can read partner profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT cm.user_id
    FROM public.couple_members cm
    WHERE cm.couple_id = public.get_my_couple_id()
  )
);
