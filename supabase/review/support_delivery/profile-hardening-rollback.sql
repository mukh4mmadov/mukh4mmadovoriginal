-- Rollback for profile-hardening.sql only.
BEGIN;

DROP TRIGGER IF EXISTS guard_profile_is_admin ON public.profiles;
DROP FUNCTION IF EXISTS public.guard_profile_is_admin();
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

COMMIT;
