-- Transactional post-migration proof for exact-attempt update hardening.
-- Requires the reading-attempt migration and at least one non-guest learner.
BEGIN;

DO $preconditions$
BEGIN
  IF to_regclass('public.reading_history') IS NULL
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='attempt_key' AND data_type='uuid')
     OR to_regprocedure('public.submit_reading_attempt(uuid,text,integer,jsonb,timestamp with time zone)') IS NULL THEN
    RAISE EXCEPTION 'Precondition failed: reading-attempt migration is not installed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE coalesce((to_jsonb(profiles)->>'is_guest')::boolean,false)=false AND coalesce(is_admin,false)=false) THEN
    RAISE EXCEPTION 'Dry-run needs one non-guest learner profile';
  END IF;
  PERFORM set_config('app.hardening_test_user', (
    SELECT id::text FROM public.profiles
    WHERE coalesce((to_jsonb(profiles)->>'is_guest')::boolean,false)=false
      AND coalesce(is_admin,false)=false
    ORDER BY created_at LIMIT 1
  ), true);
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

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('app.hardening_test_user'), true);
SELECT set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('app.hardening_test_user'),'role','authenticated')::text, true);
DO $learner_test$
DECLARE exact_id uuid; legacy_id uuid;
BEGIN
  exact_id := public.submit_reading_attempt(
    gen_random_uuid(), 'hardening-dry-run-passage', 30,
    '[{"question_id":"q1","question_type":"multiple-choice","selected_answer":"A","is_correct":true}]'::jsonb
  );

  BEGIN
    UPDATE public.reading_history SET time_spent_seconds=31 WHERE id=exact_id;
    RAISE EXCEPTION 'FAIL: learner updated an exact reading attempt';
  EXCEPTION WHEN insufficient_privilege THEN
    IF SQLERRM <> 'Exact reading attempts are immutable' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: learner cannot update an exact attempt';
  END;
  IF (SELECT time_spent_seconds FROM public.reading_history WHERE id=exact_id) <> 30 THEN
    RAISE EXCEPTION 'FAIL: rejected exact-attempt update changed stored data';
  END IF;

  INSERT INTO public.reading_history(user_id,passage_id,score,time_spent_seconds)
  VALUES (auth.uid(),'hardening-dry-run-legacy',1,1) RETURNING id INTO legacy_id;
  UPDATE public.reading_history SET time_spent_seconds=2 WHERE id=legacy_id;
  IF (SELECT time_spent_seconds FROM public.reading_history WHERE id=legacy_id) <> 2 THEN
    RAISE EXCEPTION 'FAIL: legacy history update was unexpectedly blocked';
  END IF;
  RAISE NOTICE 'PASS: legacy history updates remain available';
END
$learner_test$;
RESET ROLE;

DO $verify$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.reading_history'::regclass
      AND tgname='reading_history_exact_attempt_immutable'
      AND NOT tgisinternal AND tgenabled <> 'D'
  ) THEN
    RAISE EXCEPTION 'FAIL: exact-attempt update trigger is missing or disabled';
  END IF;
  IF has_function_privilege('anon','public.guard_reading_history_exact_attempt_update()','EXECUTE')
     OR has_function_privilege('authenticated','public.guard_reading_history_exact_attempt_update()','EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: users can directly execute the trigger function';
  END IF;
  IF (SELECT prosecdef FROM pg_proc WHERE oid='public.guard_reading_history_exact_attempt_update()'::regprocedure) THEN
    RAISE EXCEPTION 'FAIL: trigger helper must remain SECURITY INVOKER';
  END IF;
  RAISE NOTICE 'PASS: trigger is enabled and its helper is not directly executable by app roles';
END
$verify$;

ROLLBACK;
