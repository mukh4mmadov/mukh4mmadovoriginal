-- Transactional validation for the Admin > Users exact-attempt metrics RPC.
-- The function and grants are rolled back; no profiles or attempts are written.
BEGIN;

DO $preconditions$
DECLARE admin_id uuid; learner_id uuid;
BEGIN
  IF to_regclass('public.profiles') IS NULL OR to_regclass('public.reading_history') IS NULL
     OR to_regprocedure('public.is_admin_user(uuid)') IS NULL
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='id' AND data_type='uuid')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email' AND data_type='text')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='full_name' AND data_type='text')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='created_at' AND data_type='timestamp with time zone')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_admin' AND data_type='boolean')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='attempt_key')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='question_count')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='answered_count')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='correct_count')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='completed_at' AND data_type='timestamp with time zone')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='time_spent_seconds') THEN
    RAISE EXCEPTION 'Precondition failed: profiles, attempt columns, or admin checker is missing';
  END IF;
  SELECT id INTO admin_id FROM public.profiles WHERE coalesce(is_admin,false)=true ORDER BY created_at LIMIT 1;
  SELECT p.id INTO learner_id FROM public.profiles p JOIN public.reading_history h ON h.user_id=p.id
    WHERE coalesce(p.is_admin,false)=false AND coalesce((to_jsonb(p)->>'is_guest')::boolean,false)=false AND h.attempt_key IS NOT NULL
    ORDER BY h.completed_at DESC LIMIT 1;
  IF admin_id IS NULL OR learner_id IS NULL THEN RAISE EXCEPTION 'Dry-run requires an admin and a non-admin learner with an exact attempt'; END IF;
  PERFORM set_config('app.admin_user_metrics_test_admin', admin_id::text, true);
  PERFORM set_config('app.admin_user_metrics_test_learner', learner_id::text, true);
END
$preconditions$;

CREATE OR REPLACE FUNCTION public.get_admin_user_reading_metrics()
RETURNS TABLE (
  user_id uuid, email text, full_name text, username text,
  passages_completed bigint, average_score numeric, highest_score numeric,
  total_time_spent bigint, last_activity timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT COALESCE(public.is_admin_user((select auth.uid())), false) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH per_user AS (
    SELECT h.user_id,
           count(*)::bigint AS passages_completed,
           round(100.0 * sum(h.correct_count) / nullif(sum(h.question_count), 0)) AS average_score,
           max(round(100.0 * h.correct_count / nullif(h.question_count, 0))) AS highest_score,
           coalesce(sum(greatest(coalesce(h.time_spent_seconds, 0), 0)), 0)::bigint AS total_time_spent,
           max(h.completed_at) AS last_activity
    FROM public.reading_history AS h
    WHERE h.attempt_key IS NOT NULL
    GROUP BY h.user_id
  )
  SELECT p.id, p.email, p.full_name, to_jsonb(p)->>'username',
         coalesce(r.passages_completed, 0), r.average_score, r.highest_score,
         coalesce(r.total_time_spent, 0), r.last_activity
  FROM public.profiles AS p
  LEFT JOIN per_user AS r ON r.user_id = p.id
  WHERE coalesce((to_jsonb(p)->>'is_guest')::boolean, false) = false
  ORDER BY r.last_activity DESC NULLS LAST, p.created_at DESC, p.id;
END
$function$;

REVOKE ALL ON FUNCTION public.get_admin_user_reading_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_user_reading_metrics() TO authenticated;

DO $verify$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef('public.get_admin_user_reading_metrics()'::regprocedure) INTO definition;
  IF NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.get_admin_user_reading_metrics()'::regprocedure)
     OR definition NOT LIKE '%is_admin_user%'
     OR definition NOT LIKE '%attempt_key IS NOT NULL%'
     OR has_function_privilege('anon','public.get_admin_user_reading_metrics()','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.get_admin_user_reading_metrics()','EXECUTE') THEN
    RAISE EXCEPTION 'Verification failed: per-user metrics RPC security or exact-attempt source is incorrect';
  END IF;
END
$verify$;

SET LOCAL ROLE authenticated;
DO $admin_claims$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', current_setting('app.admin_user_metrics_test_admin'), true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('app.admin_user_metrics_test_admin'),'role','authenticated')::text, true);
END
$admin_claims$;

DO $admin_assertions$
DECLARE
  target_id uuid := current_setting('app.admin_user_metrics_test_learner')::uuid;
  actual record;
  expected_count bigint;
  expected_accuracy numeric;
  expected_highest numeric;
  expected_time bigint;
  expected_last timestamptz;
BEGIN
  SELECT count(*)::bigint,
         round(100.0 * sum(correct_count) / nullif(sum(question_count),0)),
         max(round(100.0 * correct_count / nullif(question_count,0))),
         coalesce(sum(greatest(coalesce(time_spent_seconds,0),0)),0)::bigint,
         max(completed_at)
    INTO expected_count,expected_accuracy,expected_highest,expected_time,expected_last
    FROM public.reading_history WHERE user_id=target_id AND attempt_key IS NOT NULL;
  SELECT * INTO actual FROM public.get_admin_user_reading_metrics() WHERE user_id=target_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: admin per-user metrics omitted a learner with an exact attempt'; END IF;
  IF actual.passages_completed<>expected_count
     OR actual.average_score IS DISTINCT FROM expected_accuracy
     OR actual.highest_score IS DISTINCT FROM expected_highest
     OR actual.total_time_spent<>expected_time
     OR actual.last_activity IS DISTINCT FROM expected_last THEN
    RAISE EXCEPTION 'FAIL: admin per-user metrics differ from exact attempts';
  END IF;
END
$admin_assertions$;

DO $learner_claims$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', current_setting('app.admin_user_metrics_test_learner'), true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('app.admin_user_metrics_test_learner'),'role','authenticated')::text, true);
END
$learner_claims$;

DO $non_admin_assertion$
BEGIN
  BEGIN
    PERFORM * FROM public.get_admin_user_reading_metrics();
    RAISE EXCEPTION 'FAIL: non-admin read per-user admin metrics';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END
$non_admin_assertion$;

RESET ROLE;
ROLLBACK;
SELECT 'PASS: per-user exact attempt totals and admin-only RPC access verified; all changes rolled back' AS result;
