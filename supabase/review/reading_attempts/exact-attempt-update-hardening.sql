-- Follow-up hardening for an already-migrated production database.
-- Blocks learner UPDATEs of exact attempts while preserving legacy-row updates.
BEGIN;

DO $preconditions$
BEGIN
  IF to_regclass('public.reading_history') IS NULL
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='attempt_key' AND data_type='uuid')
     OR to_regprocedure('public.submit_reading_attempt(uuid,text,integer,jsonb,timestamp with time zone)') IS NULL THEN
    RAISE EXCEPTION 'Precondition failed: reading-attempt migration is not installed';
  END IF;
END
$preconditions$;

CREATE OR REPLACE FUNCTION public.guard_reading_history_exact_attempt_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Exact reading attempts are immutable';
  RETURN NEW;
END
$function$;
REVOKE ALL ON FUNCTION public.guard_reading_history_exact_attempt_update() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS reading_history_exact_attempt_immutable ON public.reading_history;
CREATE TRIGGER reading_history_exact_attempt_immutable
  BEFORE UPDATE ON public.reading_history
  FOR EACH ROW WHEN (OLD.attempt_key IS NOT NULL)
  EXECUTE FUNCTION public.guard_reading_history_exact_attempt_update();

DO $verify$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.reading_history'::regclass
      AND tgname='reading_history_exact_attempt_immutable'
      AND NOT tgisinternal AND tgenabled <> 'D'
  ) THEN
    RAISE EXCEPTION 'Verification failed: exact-attempt update trigger is missing or disabled';
  END IF;
  IF has_function_privilege('anon','public.guard_reading_history_exact_attempt_update()','EXECUTE')
     OR has_function_privilege('authenticated','public.guard_reading_history_exact_attempt_update()','EXECUTE') THEN
    RAISE EXCEPTION 'Verification failed: users can directly execute the trigger function';
  END IF;
  IF (SELECT prosecdef FROM pg_proc WHERE oid='public.guard_reading_history_exact_attempt_update()'::regprocedure) THEN
    RAISE EXCEPTION 'Verification failed: trigger helper must remain SECURITY INVOKER';
  END IF;
END
$verify$;

COMMIT;
