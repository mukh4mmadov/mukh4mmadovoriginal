-- Replaces the legacy Admin > Users summary source with exact saved attempts.
-- Only an authenticated admin may read per-user metrics; no rows are changed.
BEGIN;

DO $preconditions$
BEGIN
  IF to_regclass('public.profiles') IS NULL OR to_regclass('public.reading_history') IS NULL
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
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='time_spent_seconds')
     OR to_regprocedure('public.is_admin_user(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Precondition failed: profiles, exact reading-history columns, or admin checker is missing';
  END IF;
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

COMMIT;
NOTIFY pgrst, 'reload schema';
