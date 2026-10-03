-- Transactional production check for the selected-answer length fix.
-- Updates only the RPC definition inside this transaction and rolls it back.
BEGIN;

DO $preconditions$
BEGIN
  IF to_regprocedure('public.submit_reading_attempt(uuid,text,integer,jsonb,timestamp with time zone)') IS NULL
     OR to_regclass('public.reading_attempt_answers') IS NULL THEN
    RAISE EXCEPTION 'Precondition failed: reading-attempt RPC or answer table is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE coalesce((to_jsonb(profiles)->>'is_guest')::boolean,false)=false
      AND coalesce(is_admin,false)=false
  ) THEN
    RAISE EXCEPTION 'Dry-run needs one non-guest learner profile';
  END IF;
  PERFORM set_config('app.answer_limit_test_user', (
    SELECT id::text FROM public.profiles
    WHERE coalesce((to_jsonb(profiles)->>'is_guest')::boolean,false)=false
      AND coalesce(is_admin,false)=false
    ORDER BY created_at LIMIT 1
  ), true);
END
$preconditions$;

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
    IF length(v_row->>'selected_answer') > 500 THEN RAISE EXCEPTION 'selected answer exceeds the 500 character limit'; END IF;
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

REVOKE ALL ON FUNCTION public.submit_reading_attempt(uuid,text,integer,jsonb,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_reading_attempt(uuid,text,integer,jsonb,timestamptz) TO authenticated;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('app.answer_limit_test_user'), true);
SELECT set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('app.answer_limit_test_user'),'role','authenticated')::text, true);

DO $answer_limit_tests$
DECLARE
  accepted_key uuid := gen_random_uuid();
  rejected_key uuid := gen_random_uuid();
  accepted_attempt uuid;
  accepted_length integer;
BEGIN
  accepted_attempt := public.submit_reading_attempt(
    accepted_key, 'answer-limit-dry-run-500', 30,
    jsonb_build_array(jsonb_build_object(
      'question_id','answer-limit-q500','question_type','multiple-choice',
      'selected_answer',repeat('x',500),'is_correct',false
    ))
  );
  SELECT length(selected_answer) INTO accepted_length
  FROM public.reading_attempt_answers
  WHERE attempt_id=accepted_attempt AND question_id='answer-limit-q500';
  IF accepted_length <> 500 THEN
    RAISE EXCEPTION 'FAIL: a 500-character answer was not stored intact';
  END IF;

  BEGIN
    PERFORM public.submit_reading_attempt(
      rejected_key, 'answer-limit-dry-run-501', 30,
      jsonb_build_array(jsonb_build_object(
        'question_id','answer-limit-q501','question_type','multiple-choice',
        'selected_answer',repeat('x',501),'is_correct',false
      ))
    );
    RAISE EXCEPTION 'FAIL: a 501-character answer was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'FAIL: a 501-character answer was accepted' THEN RAISE; END IF;
    IF SQLERRM <> 'selected answer exceeds the 500 character limit' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM public.reading_history WHERE user_id=auth.uid() AND attempt_key=rejected_key) THEN
    RAISE EXCEPTION 'FAIL: the rejected answer left an attempt row';
  END IF;
  RAISE NOTICE 'PASS: 500-character answers are preserved and 501-character answers are rejected without truncation';
END
$answer_limit_tests$;

RESET ROLE;
ROLLBACK;
SELECT 'PASS: 500-character answers are preserved, 501-character answers are rejected, and all test changes were rolled back.' AS result;
