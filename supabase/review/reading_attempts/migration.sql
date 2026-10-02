-- Review only. Do not apply until inspect-production.sql and dry-run.sql have passed.
BEGIN;

DO $preconditions$
BEGIN
  IF to_regclass('public.reading_history') IS NULL THEN
    RAISE EXCEPTION 'Precondition failed: public.reading_history does not exist';
  END IF;
  IF to_regclass('public.highlights') IS NULL THEN
    RAISE EXCEPTION 'Precondition failed: public.highlights does not exist';
  END IF;
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'Precondition failed: public.profiles does not exist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='id' AND data_type='uuid')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='user_id' AND data_type='uuid')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='passage_id' AND data_type='text')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='score')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='time_spent_seconds')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='completed_at' AND data_type='timestamp with time zone')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name='question_breakdown' AND data_type='jsonb') THEN
    RAISE EXCEPTION 'Precondition failed: reading_history must have id uuid, user_id uuid, passage_id text, score, time_spent_seconds, completed_at timestamptz, and question_breakdown jsonb';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='highlights' AND column_name='user_id' AND data_type='uuid')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='highlights' AND column_name='created_at' AND data_type='timestamp with time zone') THEN
    RAISE EXCEPTION 'Precondition failed: highlights must have user_id uuid and created_at timestamptz';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='id' AND data_type='uuid')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='created_at' AND data_type='timestamp with time zone')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_admin' AND data_type='boolean') THEN
    RAISE EXCEPTION 'Precondition failed: profiles must have id uuid, created_at timestamptz, and is_admin boolean';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_guest' AND data_type<>'boolean') THEN
    RAISE EXCEPTION 'Precondition failed: profiles.is_guest exists but is not boolean';
  END IF;
  IF to_regprocedure('public.is_admin_user(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Precondition failed: public.is_admin_user(uuid) does not exist';
  END IF;
END
$preconditions$;

ALTER TABLE public.reading_history
  ADD COLUMN IF NOT EXISTS attempt_key uuid,
  ADD COLUMN IF NOT EXISTS question_count integer,
  ADD COLUMN IF NOT EXISTS answered_count integer,
  ADD COLUMN IF NOT EXISTS correct_count integer;

CREATE UNIQUE INDEX IF NOT EXISTS reading_history_user_attempt_key_uidx
  ON public.reading_history(user_id, attempt_key) WHERE attempt_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS reading_history_user_completed_at_idx
  ON public.reading_history(user_id, completed_at DESC);

DO $constraints$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.reading_history'::regclass AND conname='reading_history_exact_counts_check') THEN
    ALTER TABLE public.reading_history ADD CONSTRAINT reading_history_exact_counts_check
      CHECK (attempt_key IS NULL OR (question_count > 0 AND answered_count >= 0 AND correct_count >= 0 AND correct_count <= answered_count AND answered_count <= question_count)) NOT VALID;
  END IF;
END
$constraints$;

DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reading_history' AND policyname='reading_history_admin_select_attempt_metrics') THEN
    CREATE POLICY reading_history_admin_select_attempt_metrics
      ON public.reading_history FOR SELECT TO authenticated
      USING (public.is_admin_user((select auth.uid())));
  END IF;
END
$policy$;

CREATE TABLE IF NOT EXISTS public.reading_attempt_answers (
  attempt_id uuid NOT NULL REFERENCES public.reading_history(id) ON DELETE CASCADE,
  question_id text NOT NULL CHECK (length(btrim(question_id)) > 0),
  question_type text NOT NULL CHECK (length(btrim(question_type)) > 0),
  selected_answer text,
  is_answered boolean NOT NULL,
  is_correct boolean NOT NULL,
  PRIMARY KEY (attempt_id, question_id),
  CHECK (is_answered = (selected_answer IS NOT NULL AND length(btrim(selected_answer)) > 0)),
  CHECK (is_answered OR NOT is_correct)
);
CREATE INDEX IF NOT EXISTS reading_attempt_answers_attempt_id_idx
  ON public.reading_attempt_answers(attempt_id);
ALTER TABLE public.reading_attempt_answers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.reading_attempt_answers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.reading_attempt_answers TO authenticated;
DO $answer_policies$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reading_attempt_answers' AND policyname='reading_attempt_answers_owner_select') THEN
    CREATE POLICY reading_attempt_answers_owner_select ON public.reading_attempt_answers
      FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.reading_history h WHERE h.id = attempt_id AND h.user_id = (select auth.uid()))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reading_attempt_answers' AND policyname='reading_attempt_answers_owner_insert') THEN
    CREATE POLICY reading_attempt_answers_owner_insert ON public.reading_attempt_answers
      FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.reading_history h WHERE h.id = attempt_id AND h.user_id = (select auth.uid()))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reading_attempt_answers' AND policyname='reading_attempt_answers_admin_select') THEN
    CREATE POLICY reading_attempt_answers_admin_select ON public.reading_attempt_answers
      FOR SELECT TO authenticated USING (public.is_admin_user((select auth.uid())));
  END IF;
END
$answer_policies$;

DROP FUNCTION IF EXISTS public.submit_reading_attempt(uuid, text, integer, jsonb);
CREATE OR REPLACE FUNCTION public.submit_reading_attempt(
  p_attempt_key uuid, p_passage_id text, p_duration_seconds integer, p_answers jsonb,
  p_completed_at timestamptz DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_attempt_id uuid;
  v_question_count integer;
  v_answered_count integer;
  v_correct_count integer;
  v_duration integer;
  v_row jsonb;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Sign in is required to save reading attempts'; END IF;
  IF p_attempt_key IS NULL THEN RAISE EXCEPTION 'attempt key is required'; END IF;
  IF p_passage_id IS NULL OR length(btrim(p_passage_id)) = 0 THEN RAISE EXCEPTION 'passage id is required'; END IF;
  IF jsonb_typeof(p_answers) <> 'array' OR jsonb_array_length(p_answers) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'answers must be an array containing 1 to 200 questions';
  END IF;
  IF p_duration_seconds IS NULL THEN RAISE EXCEPTION 'duration is required'; END IF;
  v_duration := greatest(0, least(7200, p_duration_seconds));
  FOR v_row IN SELECT value FROM jsonb_array_elements(p_answers) AS items(value) LOOP
    IF jsonb_typeof(v_row) <> 'object'
       OR COALESCE(v_row->>'question_id','') = ''
       OR COALESCE(v_row->>'question_type','') = ''
       OR jsonb_typeof(v_row->'is_correct') IS DISTINCT FROM 'boolean'
       OR NOT (v_row ? 'selected_answer')
       OR jsonb_typeof(v_row->'selected_answer') NOT IN ('string','null') THEN
      RAISE EXCEPTION 'each answer needs question_id, question_type, selected_answer string or null, and boolean is_correct';
    END IF;
  END LOOP;
  SELECT count(*)::integer,
         count(*) FILTER (WHERE NULLIF(btrim(value->>'selected_answer'), '') IS NOT NULL)::integer,
         count(*) FILTER (WHERE value->>'is_correct' = 'true')::integer
    INTO v_question_count, v_answered_count, v_correct_count
  FROM jsonb_array_elements(p_answers) AS items(value);
  IF v_question_count <= 0 THEN RAISE EXCEPTION 'question count must be greater than zero'; END IF;

  INSERT INTO public.reading_history
    (user_id, passage_id, score, time_spent_seconds, completed_at, question_breakdown,
     attempt_key, question_count, answered_count, correct_count)
  VALUES
    (v_user_id, p_passage_id, v_correct_count, v_duration,
     CASE WHEN p_completed_at IS NULL THEN now()
          ELSE least(now(), greatest(p_completed_at, now() - interval '400 days')) END,
     jsonb_build_object('question_count', v_question_count, 'answered_count', v_answered_count, 'correct_count', v_correct_count),
     p_attempt_key, v_question_count, v_answered_count, v_correct_count)
  ON CONFLICT (user_id, attempt_key) WHERE attempt_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_attempt_id;

  IF v_attempt_id IS NULL THEN
    SELECT id INTO v_attempt_id FROM public.reading_history
    WHERE user_id = v_user_id AND attempt_key = p_attempt_key;
    IF v_attempt_id IS NULL THEN RAISE EXCEPTION 'Could not confirm saved reading attempt'; END IF;
    RETURN v_attempt_id;
  END IF;

  INSERT INTO public.reading_attempt_answers
    (attempt_id, question_id, question_type, selected_answer, is_answered, is_correct)
  SELECT v_attempt_id, value->>'question_id', value->>'question_type',
         NULLIF(value->>'selected_answer',''),
         NULLIF(btrim(value->>'selected_answer'), '') IS NOT NULL,
         (value->>'is_correct')::boolean
  FROM jsonb_array_elements(p_answers) AS items(value);
  RETURN v_attempt_id;
END
$function$;

CREATE OR REPLACE FUNCTION public.get_my_reading_metrics(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(attempts bigint, question_exposures bigint, answered bigint, correct bigint,
              accuracy_percent numeric, total_seconds bigint, highlights_count bigint)
LANGUAGE sql SECURITY INVOKER STABLE
SET search_path = public, pg_temp
AS $function$
  SELECT count(h.id), coalesce(sum(h.question_count),0), coalesce(sum(h.answered_count),0),
         coalesce(sum(h.correct_count),0),
         CASE WHEN coalesce(sum(h.question_count),0) = 0 THEN 0
              ELSE round(100.0 * sum(h.correct_count) / sum(h.question_count)) END,
         coalesce(sum(h.time_spent_seconds),0),
         (SELECT count(*) FROM public.highlights x
          WHERE x.user_id = (select auth.uid()) AND x.created_at >= p_from AND x.created_at < p_to)
  FROM public.reading_history h
  WHERE h.user_id = (select auth.uid()) AND h.attempt_key IS NOT NULL
    AND h.completed_at >= p_from AND h.completed_at < p_to
$function$;

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
    'avg_seconds_per_attempt', CASE WHEN o.attempts=0 THEN 0 ELSE round(o.seconds::numeric/o.attempts) END,
    'active_learners_today', o.active_today, 'attempts_today', o.attempts_today,
    'daily', d.value, 'registrations_daily', r.value, 'question_types', t.value
  ) INTO v_result
  FROM profile_counts pc CROSS JOIN overall o CROSS JOIN daily d CROSS JOIN registrations r CROSS JOIN types t;
  RETURN v_result;
END
$function$;

REVOKE ALL ON FUNCTION public.submit_reading_attempt(uuid,text,integer,jsonb,timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_reading_metrics(timestamptz,timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_reading_metrics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_reading_attempt(uuid,text,integer,jsonb,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_reading_metrics(timestamptz,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_reading_metrics(integer) TO authenticated;

DO $verify$
BEGIN
  IF has_table_privilege('anon','public.reading_attempt_answers','SELECT')
     OR has_table_privilege('anon','public.reading_attempt_answers','INSERT')
     OR has_table_privilege('anon','public.reading_attempt_answers','UPDATE')
     OR has_table_privilege('anon','public.reading_attempt_answers','DELETE')
     OR has_table_privilege('anon','public.reading_attempt_answers','TRUNCATE')
     OR has_table_privilege('anon','public.reading_attempt_answers','REFERENCES')
     OR has_table_privilege('anon','public.reading_attempt_answers','TRIGGER') THEN
    RAISE EXCEPTION 'Verification failed: anon has privileges on reading_attempt_answers';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.reading_attempt_answers'::regclass) THEN
    RAISE EXCEPTION 'Verification failed: RLS is not enabled on reading_attempt_answers';
  END IF;
  IF has_function_privilege('anon','public.submit_reading_attempt(uuid,text,integer,jsonb,timestamp with time zone)','EXECUTE')
     OR has_function_privilege('anon','public.get_my_reading_metrics(timestamp with time zone,timestamp with time zone)','EXECUTE')
     OR has_function_privilege('anon','public.get_admin_reading_metrics(integer)','EXECUTE') THEN
    RAISE EXCEPTION 'Verification failed: anon can execute a new reading-attempt function';
  END IF;
  RAISE NOTICE 'PASS: anon has no privileges on new table or functions';
END
$verify$;
COMMIT;
