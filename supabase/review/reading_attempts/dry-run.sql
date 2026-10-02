-- Self-contained transactional verification copy of migration.sql.
BEGIN;
DO $baseline$
BEGIN
  PERFORM set_config('app.baseline_reading_history', (SELECT count(*)::text FROM public.reading_history), true);
  PERFORM set_config('app.baseline_reading_progress', (SELECT count(*)::text FROM public.reading_progress), true);
  PERFORM set_config('app.baseline_highlights', (SELECT count(*)::text FROM public.highlights), true);
  PERFORM set_config('app.baseline_profiles', (SELECT count(*)::text FROM public.profiles), true);
  RAISE NOTICE 'BASELINE rows: reading_history %, reading_progress %, highlights %, profiles %',
    current_setting('app.baseline_reading_history'), current_setting('app.baseline_reading_progress'),
    current_setting('app.baseline_highlights'), current_setting('app.baseline_profiles');
END
$baseline$;
SAVEPOINT migration_sandbox;
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
  IF length(p_passage_id) > 200 THEN RAISE EXCEPTION 'passage id exceeds the 200 character limit'; END IF;
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
    IF length(v_row->>'question_id') > 100 THEN RAISE EXCEPTION 'question id exceeds the 100 character limit'; END IF;
    IF length(v_row->>'question_type') > 50 THEN RAISE EXCEPTION 'question type exceeds the 50 character limit'; END IF;
  END LOOP;
  SELECT count(*)::integer,
         count(*) FILTER (WHERE NULLIF(btrim(left(value->>'selected_answer', 500)), '') IS NOT NULL)::integer,
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
         NULLIF(left(value->>'selected_answer',500),''),
         NULLIF(btrim(left(value->>'selected_answer',500)), '') IS NOT NULL,
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
  IF has_function_privilege('anon','public.guard_reading_history_exact_attempt_update()','EXECUTE')
     OR has_function_privilege('authenticated','public.guard_reading_history_exact_attempt_update()','EXECUTE') THEN
    RAISE EXCEPTION 'Verification failed: app roles can directly execute the attempt update trigger function';
  END IF;
  IF (SELECT prosecdef FROM pg_proc WHERE oid='public.guard_reading_history_exact_attempt_update()'::regprocedure) THEN
    RAISE EXCEPTION 'Verification failed: attempt update trigger function must remain SECURITY INVOKER';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.reading_history'::regclass
      AND tgname='reading_history_exact_attempt_immutable'
      AND NOT tgisinternal AND tgenabled <> 'D'
  ) THEN
    RAISE EXCEPTION 'Verification failed: exact-attempt update trigger is missing or disabled';
  END IF;
  RAISE NOTICE 'PASS: anon has no privileges on new table or functions';
END
$verify$;

-- Test fixture ids stay transaction-local. No temporary table is used.
DO $fixtures$
DECLARE a uuid; b uuid; admin_id uuid; non_admin uuid;
BEGIN
  SELECT p.id INTO a FROM public.profiles p WHERE coalesce((to_jsonb(p)->>'is_guest')::boolean,false)=false AND coalesce(p.is_admin,false)=false ORDER BY p.created_at LIMIT 1;
  SELECT p.id INTO b FROM public.profiles p WHERE coalesce((to_jsonb(p)->>'is_guest')::boolean,false)=false AND coalesce(p.is_admin,false)=false AND p.id<>a ORDER BY p.created_at LIMIT 1;
  SELECT p.id INTO admin_id FROM public.profiles p WHERE p.is_admin=true ORDER BY p.created_at LIMIT 1;
  non_admin := a;
  IF a IS NULL OR b IS NULL OR admin_id IS NULL THEN RAISE EXCEPTION 'Dry-run needs two non-admin learners and one admin profile'; END IF;
  PERFORM set_config('app.reading_test_a',a::text,true);
  PERFORM set_config('app.reading_test_b',b::text,true);
  PERFORM set_config('app.reading_test_admin',admin_id::text,true);
  PERFORM set_config('app.reading_test_non_admin',non_admin::text,true);
  RAISE NOTICE 'PASS: found test users';
END
$fixtures$;

SET LOCAL ROLE anon;
DO $anon_tests$
BEGIN
  IF has_table_privilege(current_user,'public.reading_attempt_answers','SELECT') OR has_table_privilege(current_user,'public.reading_attempt_answers','INSERT') THEN
    RAISE EXCEPTION 'FAIL: anon has answer-table access';
  END IF;
  BEGIN PERFORM public.get_admin_reading_metrics(7); RAISE EXCEPTION 'FAIL: anon ran admin RPC';
  EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: anon cannot execute admin RPC'; END;
  RAISE NOTICE 'PASS: anon cannot access answer table';
END
$anon_tests$;
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('app.reading_test_a'), true);
SELECT set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('app.reading_test_a'),'role','authenticated')::text, true);
DO $learner_a$
DECLARE v_attempt_id uuid; replay_id uuid; key_id uuid := gen_random_uuid(); duration_id uuid; payload jsonb := '[{"question_id":"dry-run-q1","question_type":"multiple-choice","selected_answer":"A","is_correct":true},{"question_id":"dry-run-q2","question_type":"matching-headings","selected_answer":null,"is_correct":false}]'::jsonb;
  v_one jsonb := '[{"question_id":"q","question_type":"multiple-choice","selected_answer":null,"is_correct":false}]'::jsonb;
  future_id uuid; old_id uuid; null_id uuid; past_id uuid; limit_id uuid;
BEGIN
  v_attempt_id := public.submit_reading_attempt(key_id,'dry-run-passage',60,payload);
  replay_id := public.submit_reading_attempt(key_id,'dry-run-passage',60,payload);
  IF v_attempt_id<>replay_id THEN RAISE EXCEPTION 'FAIL: repeated key returned a different id'; END IF;
  IF (SELECT count(*) FROM public.reading_history WHERE id=v_attempt_id)<>1 OR (SELECT count(*) FROM public.reading_attempt_answers aa WHERE aa.attempt_id=v_attempt_id)<>2 THEN RAISE EXCEPTION 'FAIL: attempt or answer row counts are wrong'; END IF;
  PERFORM set_config('app.reading_test_attempt',v_attempt_id::text,true);
  IF (SELECT count(*) FROM public.reading_history WHERE id=v_attempt_id)<>1 THEN RAISE EXCEPTION 'FAIL: learner cannot read own attempt'; END IF;
  IF (SELECT count(*) FROM public.reading_attempt_answers aa WHERE aa.attempt_id=v_attempt_id)<>2 THEN RAISE EXCEPTION 'FAIL: learner cannot read own answers'; END IF;
  INSERT INTO public.reading_history(user_id,passage_id,score,time_spent_seconds) VALUES(auth.uid(),'dry-run-legacy-flow',1,1);
  IF NOT EXISTS (SELECT 1 FROM public.reading_history WHERE user_id=auth.uid() AND passage_id='dry-run-legacy-flow') THEN RAISE EXCEPTION 'FAIL: basic reading_history insert/select flow broke'; END IF;
  BEGIN
    UPDATE public.reading_history SET time_spent_seconds=61 WHERE id=v_attempt_id;
    RAISE EXCEPTION 'FAIL: learner updated an exact reading attempt';
  EXCEPTION WHEN insufficient_privilege THEN
    IF SQLERRM<>'Exact reading attempts are immutable' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: learner cannot update an exact attempt';
  END;
  IF (SELECT time_spent_seconds FROM public.reading_history WHERE id=v_attempt_id)<>60 THEN RAISE EXCEPTION 'FAIL: rejected exact-attempt update changed stored data'; END IF;
  UPDATE public.reading_history SET time_spent_seconds=2 WHERE user_id=auth.uid() AND passage_id='dry-run-legacy-flow';
  IF (SELECT time_spent_seconds FROM public.reading_history WHERE user_id=auth.uid() AND passage_id='dry-run-legacy-flow')<>2 THEN RAISE EXCEPTION 'FAIL: legacy history update was unexpectedly blocked'; END IF;
  RAISE NOTICE 'PASS: legacy history updates remain available';
  duration_id := public.submit_reading_attempt(gen_random_uuid(),'dry-run-clamp',99999,v_one);
  IF (SELECT time_spent_seconds FROM public.reading_history WHERE id=duration_id)<>7200 THEN RAISE EXCEPTION 'FAIL: duration was not clamped'; END IF;
  future_id := public.submit_reading_attempt(gen_random_uuid(),'dry-run-future-time',1,v_one,now()+interval '3 days');
  IF (SELECT completed_at > now()+interval '1 second' FROM public.reading_history WHERE id=future_id) THEN RAISE EXCEPTION 'FAIL: future completion timestamp was not clamped'; END IF;
  old_id := public.submit_reading_attempt(gen_random_uuid(),'dry-run-old-time',1,v_one,now()-interval '3 years');
  IF abs(extract(epoch FROM ((SELECT completed_at FROM public.reading_history WHERE id=old_id) - (now()-interval '400 days'))))>2 THEN RAISE EXCEPTION 'FAIL: old completion timestamp was not clamped to 400 days'; END IF;
  null_id := public.submit_reading_attempt(gen_random_uuid(),'dry-run-null-time',1,v_one,NULL);
  IF abs(extract(epoch FROM ((SELECT completed_at FROM public.reading_history WHERE id=null_id)-now())))>2 THEN RAISE EXCEPTION 'FAIL: NULL completion timestamp did not use now()'; END IF;
  past_id := public.submit_reading_attempt(gen_random_uuid(),'dry-run-past-time',1,v_one,now()-interval '5 seconds');
  PERFORM set_config('app.reading_test_past_attempt',past_id::text,true);
  IF abs(extract(epoch FROM ((SELECT completed_at FROM public.reading_history WHERE id=past_id)-(now()-interval '5 seconds'))))>2 THEN RAISE EXCEPTION 'FAIL: in-range past completion timestamp changed'; END IF;
  RAISE NOTICE 'PASS: learner A insert, idempotent retry, own reads, legacy insert/select, duration clamp, and completion timestamp clamps';
  BEGIN PERFORM public.submit_reading_attempt(gen_random_uuid(),'dry-run-passage',0,'[]'::jsonb); RAISE EXCEPTION 'FAIL: empty answers accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='FAIL: empty answers accepted' THEN RAISE; END IF; RAISE NOTICE 'PASS: empty answers rejected'; END;
  BEGIN PERFORM public.submit_reading_attempt(gen_random_uuid(),'dry-run-passage',0,(SELECT jsonb_agg(jsonb_build_object('question_id','q'||n,'question_type','multiple-choice','selected_answer',null,'is_correct',false)) FROM generate_series(1,201)n)); RAISE EXCEPTION 'FAIL: 201 answers accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='FAIL: 201 answers accepted' THEN RAISE; END IF; RAISE NOTICE 'PASS: 201 answers rejected'; END;
  BEGIN PERFORM public.submit_reading_attempt(gen_random_uuid(),repeat('p',201),1,v_one); RAISE EXCEPTION 'FAIL: oversized passage id accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='FAIL: oversized passage id accepted' THEN RAISE; END IF; RAISE NOTICE 'PASS: passage id over 200 characters rejected'; END;
  BEGIN PERFORM public.submit_reading_attempt(gen_random_uuid(),'dry-run-limit-qid',1,jsonb_build_array(jsonb_build_object('question_id',repeat('q',101),'question_type','multiple-choice','selected_answer',null,'is_correct',false))); RAISE EXCEPTION 'FAIL: oversized question id accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='FAIL: oversized question id accepted' THEN RAISE; END IF; RAISE NOTICE 'PASS: question id over 100 characters rejected'; END;
  BEGIN PERFORM public.submit_reading_attempt(gen_random_uuid(),'dry-run-limit-type',1,jsonb_build_array(jsonb_build_object('question_id','q','question_type',repeat('t',51),'selected_answer',null,'is_correct',false))); RAISE EXCEPTION 'FAIL: oversized question type accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='FAIL: oversized question type accepted' THEN RAISE; END IF; RAISE NOTICE 'PASS: question type over 50 characters rejected'; END;
  limit_id := public.submit_reading_attempt(gen_random_uuid(),'dry-run-limit-answer',1,jsonb_build_array(jsonb_build_object('question_id','q','question_type','multiple-choice','selected_answer',repeat('a',501),'is_correct',false)));
  IF (SELECT length(selected_answer) FROM public.reading_attempt_answers WHERE attempt_id=limit_id)<>500 OR (SELECT answered_count FROM public.reading_history WHERE id=limit_id)<>1 THEN RAISE EXCEPTION 'FAIL: selected answer was not truncated before storage and counting'; END IF;
  RAISE NOTICE 'PASS: selected answer truncated to 500 before storage and count';
END
$learner_a$;
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('app.reading_test_b'), true);
SELECT set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('app.reading_test_b'),'role','authenticated')::text, true);
DO $learner_b$
DECLARE parent_id uuid := current_setting('app.reading_test_attempt')::uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.reading_history WHERE id=parent_id) OR EXISTS (SELECT 1 FROM public.reading_attempt_answers WHERE attempt_id=parent_id) THEN RAISE EXCEPTION 'FAIL: learner B can see learner A data'; END IF;
  BEGIN INSERT INTO public.reading_attempt_answers(attempt_id,question_id,question_type,selected_answer,is_answered,is_correct) VALUES(parent_id,'forbidden','multiple-choice','A',true,false); RAISE EXCEPTION 'FAIL: learner B inserted an answer under learner A'; EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: learner B cannot insert answers for learner A'; END;
  RAISE NOTICE 'PASS: learner B cannot read learner A data';
END
$learner_b$;
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('app.reading_test_admin'), true);
SELECT set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('app.reading_test_admin'),'role','authenticated')::text, true);
DO $admin_tests$
DECLARE metrics jsonb; expected_average numeric;
BEGIN
  IF NOT public.is_admin_user((select auth.uid())) THEN RAISE EXCEPTION 'Selected admin fixture is not an admin'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.reading_history WHERE id=current_setting('app.reading_test_attempt')::uuid) THEN RAISE EXCEPTION 'FAIL: admin cannot read all attempts'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.reading_attempt_answers WHERE attempt_id=current_setting('app.reading_test_attempt')::uuid) THEN RAISE EXCEPTION 'FAIL: admin cannot read all answer rows'; END IF;
  INSERT INTO public.analytics_events(user_id,event_type,event_data)
    VALUES (auth.uid(),'ai_message_sent','{}'::jsonb);
  metrics := public.get_admin_reading_metrics(7);
  IF metrics IS NULL THEN RAISE EXCEPTION 'FAIL: admin metrics returned null'; END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(metrics->'ai_usage_daily') d
      WHERE d->>'date'=(now() AT TIME ZONE 'Asia/Tashkent')::date::text AND (d->>'count')::integer>0)
  THEN RAISE EXCEPTION 'FAIL: server-side AI event aggregation did not include today'; END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(metrics->'daily') d WHERE d->>'date'=(now() AT TIME ZONE 'Asia/Tashkent')::date::text AND (d->>'attempts')::integer>0) THEN RAISE EXCEPTION 'FAIL: recent completion did not appear on the Tashkent day'; END IF;
  SELECT CASE WHEN count(*) FILTER (WHERE time_spent_seconds>0)=0 THEN 0 ELSE round(avg(time_spent_seconds) FILTER (WHERE time_spent_seconds>0)) END
    INTO expected_average FROM public.reading_history WHERE attempt_key IS NOT NULL;
  IF (metrics->>'avg_seconds_per_attempt')::numeric<>expected_average THEN RAISE EXCEPTION 'FAIL: admin average included zero or negative durations'; END IF;
  IF coalesce((SELECT (d->>'seconds')::bigint FROM jsonb_array_elements(metrics->'daily') d WHERE d->>'date'=(now() AT TIME ZONE 'Asia/Tashkent')::date::text),0)
     <> (SELECT coalesce(sum(time_spent_seconds),0) FROM public.reading_history WHERE attempt_key IS NOT NULL
         AND completed_at >= ((now() AT TIME ZONE 'Asia/Tashkent')::date::timestamp AT TIME ZONE 'Asia/Tashkent')
         AND completed_at < (((now() AT TIME ZONE 'Asia/Tashkent')::date+1)::timestamp AT TIME ZONE 'Asia/Tashkent'))
  THEN RAISE EXCEPTION 'FAIL: daily total duration changed'; END IF;
  RAISE NOTICE 'PASS: admin can read attempts and call admin metrics';
END
$admin_tests$;
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('app.reading_test_non_admin'), true);
SELECT set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('app.reading_test_non_admin'),'role','authenticated')::text, true);
DO $non_admin_test$
BEGIN
  BEGIN PERFORM public.get_admin_reading_metrics(7); RAISE EXCEPTION 'FAIL: learner ran admin RPC';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM='FAIL: learner ran admin RPC' THEN RAISE; END IF; RAISE NOTICE 'PASS: non-admin cannot call admin metrics'; END;
END
$non_admin_test$;
RESET ROLE;

ROLLBACK TO SAVEPOINT migration_sandbox;
DO $rollback_assertions$
BEGIN
  IF (SELECT count(*)::text FROM public.reading_history) <> current_setting('app.baseline_reading_history')
     OR (SELECT count(*)::text FROM public.reading_progress) <> current_setting('app.baseline_reading_progress')
     OR (SELECT count(*)::text FROM public.highlights) <> current_setting('app.baseline_highlights')
     OR (SELECT count(*)::text FROM public.profiles) <> current_setting('app.baseline_profiles') THEN
    RAISE EXCEPTION 'FAIL: row counts differ from pre-test baseline';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name IN ('attempt_key','question_count','answered_count','correct_count'))
     OR to_regclass('public.reading_attempt_answers') IS NOT NULL
     OR to_regprocedure('public.guard_reading_history_exact_attempt_update()') IS NOT NULL
     OR EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.reading_history'::regclass AND tgname='reading_history_exact_attempt_immutable' AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'FAIL: migration objects survived savepoint rollback';
  END IF;
  RAISE NOTICE 'PASS: savepoint rollback restored schema and row counts to the printed baseline';
END
$rollback_assertions$;
ROLLBACK;
