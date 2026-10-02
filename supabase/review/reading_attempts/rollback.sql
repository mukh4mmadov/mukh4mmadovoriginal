-- Reversible only while no exact attempts have been collected.
BEGIN;
DO $guard$
BEGIN
  IF to_regclass('public.reading_history') IS NULL THEN RAISE EXCEPTION 'Refusing rollback: reading_history is missing'; END IF;
  IF EXISTS (SELECT 1 FROM public.reading_history WHERE attempt_key IS NOT NULL)
     OR (to_regclass('public.reading_attempt_answers') IS NOT NULL AND EXISTS (SELECT 1 FROM public.reading_attempt_answers)) THEN
    RAISE EXCEPTION 'Refusing rollback: exact attempts or answer rows exist; preserve data and roll back app code first';
  END IF;
END
$guard$;
DROP FUNCTION IF EXISTS public.get_admin_reading_metrics(integer);
DROP FUNCTION IF EXISTS public.get_my_reading_metrics(timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.submit_reading_attempt(uuid, text, integer, jsonb, timestamptz);
DROP TRIGGER IF EXISTS reading_history_exact_attempt_immutable ON public.reading_history;
DROP FUNCTION IF EXISTS public.guard_reading_history_exact_attempt_update();
DROP POLICY IF EXISTS reading_attempt_answers_owner_select ON public.reading_attempt_answers;
DROP POLICY IF EXISTS reading_attempt_answers_owner_insert ON public.reading_attempt_answers;
DROP POLICY IF EXISTS reading_attempt_answers_admin_select ON public.reading_attempt_answers;
DROP POLICY IF EXISTS reading_history_admin_select_attempt_metrics ON public.reading_history;
DROP TABLE IF EXISTS public.reading_attempt_answers;
DROP INDEX IF EXISTS public.reading_history_user_attempt_key_uidx;
DROP INDEX IF EXISTS public.reading_history_user_completed_at_idx;
ALTER TABLE public.reading_history DROP CONSTRAINT IF EXISTS reading_history_exact_counts_check;
ALTER TABLE public.reading_history DROP COLUMN IF EXISTS attempt_key;
ALTER TABLE public.reading_history DROP COLUMN IF EXISTS question_count;
ALTER TABLE public.reading_history DROP COLUMN IF EXISTS answered_count;
ALTER TABLE public.reading_history DROP COLUMN IF EXISTS correct_count;
COMMIT;
