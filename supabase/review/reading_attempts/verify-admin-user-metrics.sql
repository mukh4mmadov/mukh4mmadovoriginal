-- Read-only check after admin-user-metrics-followup.sql.
WITH function_state AS (
  SELECT to_regprocedure('public.get_admin_user_reading_metrics()') AS function_oid
), definition AS (
  SELECT function_oid,
         CASE WHEN function_oid IS NULL THEN NULL ELSE pg_get_functiondef(function_oid) END AS function_definition
  FROM function_state
)
SELECT jsonb_build_object(
  'rpc_exists', function_oid IS NOT NULL,
  'rpc_is_security_definer', coalesce((SELECT prosecdef FROM pg_proc WHERE oid=definition.function_oid), false),
  'rpc_has_admin_guard', coalesce(function_definition ILIKE '%is_admin_user%', false),
  'rpc_uses_exact_attempts_only', coalesce(function_definition ILIKE '%attempt_key IS NOT NULL%', false),
  'anon_cannot_execute_rpc', function_oid IS NOT NULL AND NOT has_function_privilege('anon',function_oid,'EXECUTE'),
  'authenticated_can_execute_rpc', function_oid IS NOT NULL AND has_function_privilege('authenticated',function_oid,'EXECUTE')
) AS verification
FROM definition;
