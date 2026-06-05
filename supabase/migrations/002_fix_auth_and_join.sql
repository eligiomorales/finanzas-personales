-- Fix: perfil propio, invitaciones y creación de pareja
-- Idempotente: se puede ejecutar más de una vez

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can find couple by invite code" ON public.couples;
CREATE POLICY "Authenticated users can find couple by invite code"
ON public.couples
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can check members for join" ON public.couple_members;
CREATE POLICY "Authenticated users can check members for join"
ON public.couple_members
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can read own membership" ON public.couple_members;
CREATE POLICY "Users can read own membership"
ON public.couple_members
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
