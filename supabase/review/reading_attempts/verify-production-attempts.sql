-- Read-only verification after selected-answer-limit-fix.sql.
WITH rpc_definitions AS (
  SELECT
    pg_get_functiondef('public.submit_reading_attempt(uuid,text,integer,jsonb,timestamp with time zone)'::regprocedure) AS submit_definition,
    pg_get_functiondef('public.get_admin_reading_metrics(integer)'::regprocedure) AS admin_definition
), attempt_counts AS (
  SELECT count(*) FILTER (WHERE attempt_key IS NOT NULL) AS exact_attempts,
         count(*) FILTER (WHERE attempt_key IS NULL) AS legacy_attempts
  FROM public.reading_history
)
SELECT jsonb_build_object(
  'exact_attempts', attempt_counts.exact_attempts,
  'legacy_attempts', attempt_counts.legacy_attempts,
  'submit_rejects_answers_over_500', rpc_definitions.submit_definition ~ $$length\s*\(\s*v_row\s*->>\s*'selected_answer'\s*\)\s*>\s*500$$,
  'submit_still_truncates_answers', rpc_definitions.submit_definition ~ $$left\s*\(\s*value\s*->>\s*'selected_answer'\s*,\s*500\s*\)$$,
  'submit_has_400_day_timestamp_clamp', rpc_definitions.submit_definition ILIKE '%p_completed_at%' AND rpc_definitions.submit_definition ILIKE '%400 days%',
  'anon_cannot_execute_submit_rpc', NOT has_function_privilege('anon','public.submit_reading_attempt(uuid,text,integer,jsonb,timestamp with time zone)','EXECUTE'),
  'authenticated_can_execute_submit_rpc', has_function_privilege('authenticated','public.submit_reading_attempt(uuid,text,integer,jsonb,timestamp with time zone)','EXECUTE'),
  'admin_average_excludes_zero_duration', rpc_definitions.admin_definition ILIKE '%time_spent_seconds > 0%',
  'admin_metrics_use_tashkent_days', rpc_definitions.admin_definition ILIKE '%Asia/Tashkent%',
  'admin_metrics_include_server_ai_series', rpc_definitions.admin_definition ILIKE '%ai_usage_daily%'
) AS verification
FROM rpc_definitions
CROSS JOIN attempt_counts;
