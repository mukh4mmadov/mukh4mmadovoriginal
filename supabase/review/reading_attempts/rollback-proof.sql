-- Run after dry-run.sql has completed. A successful dry-run must have rolled back.
DO $proof$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reading_history' AND column_name IN ('attempt_key','question_count','answered_count','correct_count')) THEN
    RAISE EXCEPTION 'FAIL: dry-run left attempt columns behind';
  END IF;
  IF to_regclass('public.reading_attempt_answers') IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: dry-run left reading_attempt_answers behind';
  END IF;
  IF to_regprocedure('public.submit_reading_attempt(uuid,text,integer,jsonb)') IS NOT NULL
     OR to_regprocedure('public.get_my_reading_metrics(timestamp with time zone,timestamp with time zone)') IS NOT NULL
     OR to_regprocedure('public.get_admin_reading_metrics(integer)') IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: dry-run left a function behind';
  END IF;
  RAISE NOTICE 'PASS: no attempt schema objects remain after dry-run';
END
$proof$;

select 'reading_history' as table_name, count(*) as rows from public.reading_history
union all select 'reading_progress', count(*) from public.reading_progress
union all select 'highlights', count(*) from public.highlights
union all select 'profiles', count(*) from public.profiles;
