-- Refresh the existing admin metrics RPC with a server-side AI usage series.
-- This updates one function only; it does not modify attempt or analytics rows.
BEGIN;

DO $preconditions$
BEGIN
  IF to_regprocedure('public.get_admin_reading_metrics(integer)') IS NULL
     OR to_regclass('public.analytics_events') IS NULL THEN
    RAISE EXCEPTION 'Precondition failed: the admin metrics function or analytics_events table is missing';
  END IF;
END
$preconditions$;

CREATE OR REPLACE FUNCTION public.get_admin_reading_metrics(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_days integer := greatest(1, least(180, coalesce(p_days, 30)));
  v_today date := (now() AT TIME ZONE 'Asia/Tashkent')::date;
  v_result jsonb;
BEGIN
  IF NOT public.is_admin_user((select auth.uid())) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  WITH exact_attempts AS (
    SELECT * FROM public.reading_history WHERE attempt_key IS NOT NULL
  ),
  day_series AS (
    SELECT (v_today - offs)::date AS activity_date FROM generate_series(v_days - 1, 0, -1) offs
  ),
  per_day AS (
    SELECT (a.completed_at AT TIME ZONE 'Asia/Tashkent')::date AS activity_date,
           count(*) AS attempts, coalesce(sum(a.time_spent_seconds),0) AS seconds,
           coalesce(sum(a.correct_count),0) AS correct, coalesce(sum(a.question_count),0) AS questions
    FROM exact_attempts a
    WHERE a.completed_at >= ((v_today - (v_days - 1))::timestamp AT TIME ZONE 'Asia/Tashkent')
      AND a.completed_at < ((v_today + 1)::timestamp AT TIME ZONE 'Asia/Tashkent')
    GROUP BY 1
  ),
  daily AS (
    SELECT jsonb_agg(jsonb_build_object('date', s.activity_date, 'attempts', coalesce(d.attempts,0),
      'seconds', coalesce(d.seconds,0), 'accuracy_percent',
      CASE WHEN coalesce(d.questions,0)=0 THEN 0 ELSE round(100.0*d.correct/d.questions) END)
      ORDER BY s.activity_date) AS value
    FROM day_series s LEFT JOIN per_day d USING (activity_date)
  ),
  ai_usage AS (
    SELECT jsonb_agg(jsonb_build_object('date', s.activity_date, 'count', coalesce(a.total,0))
      ORDER BY s.activity_date) AS value
    FROM day_series s LEFT JOIN (
      SELECT (e.created_at AT TIME ZONE 'Asia/Tashkent')::date AS activity_date, count(*) AS total
      FROM public.analytics_events e
      WHERE e.event_type='ai_message_sent'
        AND e.created_at >= ((v_today - (v_days - 1))::timestamp AT TIME ZONE 'Asia/Tashkent')
        AND e.created_at < ((v_today + 1)::timestamp AT TIME ZONE 'Asia/Tashkent')
      GROUP BY 1
    ) a USING (activity_date)
  ),
  registrations AS (
    SELECT jsonb_agg(jsonb_build_object('date', s.activity_date, 'registrations', coalesce(r.total,0))
      ORDER BY s.activity_date) AS value
    FROM day_series s LEFT JOIN (
      SELECT (created_at AT TIME ZONE 'Asia/Tashkent')::date AS activity_date, count(*) AS total
      FROM public.profiles
      WHERE created_at >= ((v_today - (v_days - 1))::timestamp AT TIME ZONE 'Asia/Tashkent')
        AND created_at < ((v_today + 1)::timestamp AT TIME ZONE 'Asia/Tashkent')
        AND coalesce((to_jsonb(profiles)->>'is_guest')::boolean,false) = false
      GROUP BY 1
    ) r USING (activity_date)
  ),
  types AS (
    SELECT coalesce(jsonb_agg(jsonb_build_object('question_type', t.question_type,
      'exposures',t.exposures,'answered',t.answered,'correct',t.correct,
      'accuracy_percent',CASE WHEN t.exposures=0 THEN 0 ELSE round(100.0*t.correct/t.exposures) END)
      ORDER BY t.question_type),'[]'::jsonb) AS value
    FROM (
      SELECT aa.question_type, count(*) AS exposures,
             count(*) FILTER (WHERE aa.is_answered) AS answered,
             count(*) FILTER (WHERE aa.is_correct) AS correct
      FROM public.reading_attempt_answers aa JOIN exact_attempts a ON a.id=aa.attempt_id
      GROUP BY aa.question_type
    ) t
  ),
  profile_counts AS (
    SELECT count(*) FILTER (WHERE coalesce((to_jsonb(profiles)->>'is_guest')::boolean,false)=false) AS learners,
           count(*) FILTER (WHERE coalesce((to_jsonb(profiles)->>'is_guest')::boolean,false)=true) AS guests
    FROM public.profiles
  ),
  overall AS (
    SELECT count(*) AS attempts, coalesce(sum(question_count),0) AS exposures,
           coalesce(sum(answered_count),0) AS answered, coalesce(sum(correct_count),0) AS correct,
           coalesce(sum(time_spent_seconds),0) AS seconds,
           coalesce(sum(time_spent_seconds) FILTER (WHERE time_spent_seconds > 0),0) AS positive_seconds,
           count(*) FILTER (WHERE time_spent_seconds > 0) AS timed_attempts,
           count(*) FILTER (WHERE completed_at >= (v_today::timestamp AT TIME ZONE 'Asia/Tashkent')
             AND completed_at < ((v_today+1)::timestamp AT TIME ZONE 'Asia/Tashkent')) AS attempts_today,
           count(DISTINCT user_id) FILTER (WHERE completed_at >= (v_today::timestamp AT TIME ZONE 'Asia/Tashkent')
             AND completed_at < ((v_today+1)::timestamp AT TIME ZONE 'Asia/Tashkent')) AS active_today
    FROM exact_attempts
  )
  SELECT jsonb_build_object(
    'total_profiles', pc.learners, 'guest_profiles', pc.guests,
    'total_attempts', o.attempts, 'question_exposures', o.exposures, 'answered', o.answered, 'correct', o.correct,
    'accuracy_percent', CASE WHEN o.exposures=0 THEN 0 ELSE round(100.0*o.correct/o.exposures) END,
    'avg_seconds_per_attempt', CASE WHEN o.timed_attempts=0 THEN 0 ELSE round(o.positive_seconds::numeric/o.timed_attempts) END,
    'active_learners_today', o.active_today, 'attempts_today', o.attempts_today,
    'daily', d.value, 'ai_usage_daily', ai.value,
    'registrations_daily', r.value, 'question_types', t.value
  ) INTO v_result
  FROM profile_counts pc CROSS JOIN overall o CROSS JOIN daily d CROSS JOIN ai_usage ai CROSS JOIN registrations r CROSS JOIN types t;
  RETURN v_result;
END
$function$;

REVOKE ALL ON FUNCTION public.get_admin_reading_metrics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_reading_metrics(integer) TO authenticated;

DO $verify$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef('public.get_admin_reading_metrics(integer)'::regprocedure) INTO definition;
  IF NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.get_admin_reading_metrics(integer)'::regprocedure)
     OR definition NOT LIKE '%is_admin_user%'
     OR definition NOT LIKE '%ai_usage_daily%'
     OR has_function_privilege('anon','public.get_admin_reading_metrics(integer)','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.get_admin_reading_metrics(integer)','EXECUTE') THEN
    RAISE EXCEPTION 'Verification failed: admin metrics RPC security or AI series is incorrect';
  END IF;
END
$verify$;

COMMIT;
