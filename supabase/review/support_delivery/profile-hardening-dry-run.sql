-- Separate optional profile hardening dry run; signup checks; ends with ROLLBACK.
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


-- Exercise the existing AFTER INSERT auth.users trigger with ordinary and
-- guest signup metadata. The transaction rolls auth and profile rows back.
DO $$
DECLARE normal_id uuid := gen_random_uuid();
  guest_id uuid := gen_random_uuid();
BEGIN
  PERFORM set_config('request.jwt.claims','{"role":"authenticated"}',true);
  INSERT INTO auth.users
    (id,aud,role,email,encrypted_password,raw_user_meta_data,created_at,updated_at)
  VALUES
    (normal_id,'authenticated','authenticated',
      'qa-' || normal_id::text || '@example.invalid','',
      '{"full_name":"Signup QA"}'::jsonb,now(),now()),
    (guest_id,'authenticated','authenticated',
      'qa-' || guest_id::text || '@example.invalid','',
      '{"full_name":"Guest QA","is_guest":true}'::jsonb,now(),now());

  IF NOT EXISTS (SELECT 1 FROM public.profiles
                 WHERE id=normal_id AND is_guest=false AND coalesce(is_admin,false)=false)
     OR NOT EXISTS (SELECT 1 FROM public.profiles
                    WHERE id=guest_id AND is_guest=true AND coalesce(is_admin,false)=false) THEN
    RAISE EXCEPTION 'Signup trigger did not create normal and guest profiles safely';
  END IF;

  -- Simulate an authenticated request against the trigger while retaining
  -- table-owner execution so the trigger, rather than RLS, is what rejects it.
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub',normal_id::text,'role','authenticated')::text,true);
  BEGIN
    UPDATE public.profiles SET is_admin=true WHERE id=normal_id;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  IF coalesce((SELECT is_admin FROM public.profiles WHERE id=normal_id),false) THEN
    RAISE EXCEPTION 'Non-service role changed is_admin';
  END IF;

  -- A service-role request is permitted to change the flag.
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub',normal_id::text,'role','service_role')::text,true);
  UPDATE public.profiles SET is_admin=true WHERE id=normal_id;
  IF NOT (SELECT is_admin FROM public.profiles WHERE id=normal_id) THEN
    RAISE EXCEPTION 'service_role could not change is_admin';
  END IF;
END
$$;

ROLLBACK;
