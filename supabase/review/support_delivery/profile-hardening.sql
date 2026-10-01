-- Separate optional hardening proposal. Not included in migration.sql.
BEGIN;

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND coalesce(is_admin, false) = false
  );

CREATE OR REPLACE FUNCTION public.guard_profile_is_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      IF coalesce(NEW.is_admin, false) THEN
        RAISE EXCEPTION 'Only service_role may create an admin profile'
          USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      RAISE EXCEPTION 'Only service_role may change profiles.is_admin'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_profile_is_admin() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_profile_is_admin ON public.profiles;
CREATE TRIGGER guard_profile_is_admin
  BEFORE INSERT OR UPDATE OF is_admin ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_is_admin();

COMMIT;
