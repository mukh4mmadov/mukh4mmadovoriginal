-- Targeted fix for installations whose RPC silently truncated answers at 500 characters.
-- Run only after selected-answer-limit-dry-run.sql completes without an error.
BEGIN;

DO $preconditions$
BEGIN
  IF to_regprocedure('public.submit_reading_attempt(uuid,text,integer,jsonb,timestamp with time zone)') IS NULL
     OR to_regclass('public.reading_attempt_answers') IS NULL THEN
    RAISE EXCEPTION 'Precondition failed: reading-attempt RPC or answer table is missing';
  END IF;
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

DO $verify$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef('public.submit_reading_attempt(uuid,text,integer,jsonb,timestamp with time zone)'::regprocedure)
    INTO definition;
  IF definition NOT LIKE '%selected answer exceeds the 500 character limit%'
     OR definition LIKE '%left(value->>''selected_answer'', 500)%'
     OR has_function_privilege('anon','public.submit_reading_attempt(uuid,text,integer,jsonb,timestamp with time zone)','EXECUTE')
     OR NOT has_function_privilege('authenticated','public.submit_reading_attempt(uuid,text,integer,jsonb,timestamp with time zone)','EXECUTE') THEN
    RAISE EXCEPTION 'Verification failed: selected-answer validation or RPC grants are incorrect';
  END IF;
END
$verify$;

COMMIT;
