-- Read-only production check: an authenticated non-admin profile cannot read
-- another profile's exact attempt rows or their per-question answers.
-- All fixtures are temporary; role and JWT claim changes are rolled back.
BEGIN;

CREATE TEMP TABLE reading_attempt_isolation_ids ON COMMIT DROP AS
WITH attempt_owner AS (
  SELECT user_id
  FROM public.reading_history
  WHERE attempt_key IS NOT NULL
  ORDER BY completed_at DESC, id
  LIMIT 1
)
SELECT
  (SELECT user_id FROM attempt_owner) AS owner_id,
  (
    SELECT p.id
    FROM public.profiles AS p
    CROSS JOIN attempt_owner AS attempt_user
    WHERE p.id <> attempt_user.user_id
      AND COALESCE((to_jsonb(p)->>'is_guest')::boolean, false) = false
      AND NOT COALESCE(public.is_admin_user(p.id), false)
    ORDER BY p.created_at DESC, p.id
    LIMIT 1
  ) AS reader_id;

CREATE TEMP TABLE reading_attempt_isolation_result (result text NOT NULL) ON COMMIT DROP;
INSERT INTO reading_attempt_isolation_result
VALUES ('SKIP: no qualifying profile pair was available');

GRANT SELECT ON reading_attempt_isolation_ids TO authenticated;
GRANT UPDATE ON reading_attempt_isolation_result TO authenticated;
SET LOCAL ROLE authenticated;

DO $verify$
DECLARE
  owner_id uuid;
  reader_id uuid;
  own_attempts bigint;
  visible_attempts bigint;
  visible_answers bigint;
BEGIN
  SELECT ids.owner_id, ids.reader_id
  INTO owner_id, reader_id
  FROM pg_temp.reading_attempt_isolation_ids AS ids;

  IF owner_id IS NULL THEN
    UPDATE pg_temp.reading_attempt_isolation_result
    SET result = 'SKIP: no exact saved attempt exists';
    RETURN;
  END IF;

  IF reader_id IS NULL THEN
    UPDATE pg_temp.reading_attempt_isolation_result
    SET result = 'SKIP: no second non-guest, non-admin profile exists';
    RETURN;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', owner_id::text, true);
  SELECT count(*) INTO own_attempts
  FROM public.reading_history
  WHERE user_id = owner_id AND attempt_key IS NOT NULL;
  IF own_attempts = 0 THEN
    RAISE EXCEPTION 'FAIL: attempt owner could not read their own exact attempts';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', reader_id::text, true);
  SELECT count(*) INTO visible_attempts
  FROM public.reading_history
  WHERE user_id = owner_id AND attempt_key IS NOT NULL;

  SELECT count(*) INTO visible_answers
  FROM public.reading_attempt_answers AS answer
  JOIN public.reading_history AS attempt ON attempt.id = answer.attempt_id
  WHERE attempt.user_id = owner_id AND attempt.attempt_key IS NOT NULL;

  IF visible_attempts <> 0 OR visible_answers <> 0 THEN
    RAISE EXCEPTION 'FAIL: another non-admin profile can see exact attempts (%) or answers (%)',
      visible_attempts, visible_answers;
  END IF;

  UPDATE pg_temp.reading_attempt_isolation_result
  SET result = 'PASS: owner sees own exact attempts; another non-admin profile sees none of those attempts or answers';
END
$verify$;

RESET ROLE;
SELECT result FROM pg_temp.reading_attempt_isolation_result;
ROLLBACK;
