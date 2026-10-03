-- Read-only production check: an authenticated non-admin profile cannot read
-- another profile's exact attempt rows or their per-question answers.
-- It uses transaction-local settings only; ROLLBACK restores role and claims.
BEGIN;

SELECT set_config(
  'app.reading_attempt_isolation_owner_id',
  COALESCE((
    SELECT user_id::text
    FROM public.reading_history
    WHERE attempt_key IS NOT NULL
    ORDER BY completed_at DESC, id
    LIMIT 1
  ), ''),
  true
);

SELECT set_config(
  'app.reading_attempt_isolation_reader_id',
  COALESCE((
    SELECT p.id::text
    FROM public.profiles AS p
    WHERE p.id <> NULLIF(current_setting('app.reading_attempt_isolation_owner_id', true), '')::uuid
      AND COALESCE((to_jsonb(p)->>'is_guest')::boolean, false) = false
      AND NOT COALESCE(public.is_admin_user(p.id), false)
    ORDER BY p.created_at DESC, p.id
    LIMIT 1
  ), ''),
  true
);

SELECT set_config('app.reading_attempt_isolation_result', 'SKIP: no qualifying profile pair was available', true);
SET LOCAL ROLE authenticated;

DO $verify$
DECLARE
  owner_id uuid;
  reader_id uuid;
  own_attempts bigint;
  visible_attempts bigint;
  visible_answers bigint;
BEGIN
  owner_id := NULLIF(current_setting('app.reading_attempt_isolation_owner_id', true), '')::uuid;
  reader_id := NULLIF(current_setting('app.reading_attempt_isolation_reader_id', true), '')::uuid;

  IF owner_id IS NULL THEN
    PERFORM set_config('app.reading_attempt_isolation_result', 'SKIP: no exact saved attempt exists', true);
    RETURN;
  END IF;

  IF reader_id IS NULL THEN
    PERFORM set_config('app.reading_attempt_isolation_result', 'SKIP: no second non-guest, non-admin profile exists', true);
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

  PERFORM set_config(
    'app.reading_attempt_isolation_result',
    'PASS: owner sees own exact attempts; another non-admin profile sees none of those attempts or answers',
    true
  );
END
$verify$;

RESET ROLE;
SELECT current_setting('app.reading_attempt_isolation_result', true) AS result;
ROLLBACK;
