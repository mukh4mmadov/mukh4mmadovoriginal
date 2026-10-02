-- Read-only production inspection. Returns one row with one JSON cell.
WITH wanted(table_name) AS (
  VALUES ('reading_history'), ('reading_progress'), ('highlights'), ('profiles'), ('reading_attempt_answers')
),
columns_json AS (
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'table', c.table_name,
    'column', c.column_name,
    'type', c.data_type,
    'udt_name', c.udt_name,
    'nullable', c.is_nullable,
    'default', c.column_default
  ) ORDER BY c.table_name, c.ordinal_position), '[]'::jsonb) AS value
  FROM information_schema.columns c
  JOIN wanted w ON w.table_name = c.table_name
  WHERE c.table_schema = 'public'
),
history_constraints AS (
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'name', con.conname,
    'type', con.contype,
    'definition', pg_get_constraintdef(con.oid, true)
  ) ORDER BY con.conname), '[]'::jsonb) AS value
  FROM pg_constraint con
  WHERE con.conrelid = to_regclass('public.reading_history')
),
history_indexes AS (
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'name', idx.relname,
    'definition', pg_get_indexdef(i.indexrelid),
    'unique', i.indisunique,
    'valid', i.indisvalid
  ) ORDER BY idx.relname), '[]'::jsonb) AS value
  FROM pg_index i
  JOIN pg_class tbl ON tbl.oid = i.indrelid
  JOIN pg_class idx ON idx.oid = i.indexrelid
  WHERE tbl.oid = to_regclass('public.reading_history')
),
policies_json AS (
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'table', p.tablename,
    'name', p.policyname,
    'cmd', p.cmd,
    'roles', p.roles,
    'permissive', p.permissive,
    'qual', p.qual,
    'with_check', p.with_check
  ) ORDER BY p.tablename, p.policyname), '[]'::jsonb) AS value
  FROM pg_policies p
  JOIN wanted w ON w.table_name = p.tablename
  WHERE p.schemaname = 'public'
),
grants_json AS (
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'table', w.table_name,
    'role', role_name,
    'privileges', privileges
  ) ORDER BY w.table_name, role_name), '[]'::jsonb) AS value
  FROM wanted w
  JOIN pg_class tbl ON tbl.oid = to_regclass(format('public.%I', w.table_name))
  CROSS JOIN (VALUES ('anon'), ('authenticated')) AS roles(role_name)
  CROSS JOIN LATERAL (
    SELECT coalesce(jsonb_agg(privilege ORDER BY privilege), '[]'::jsonb) AS privileges
    FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) AS p(privilege)
    WHERE has_table_privilege(role_name, tbl.oid, privilege)
  ) effective
),
triggers_json AS (
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'name', t.tgname,
    'enabled', t.tgenabled,
    'definition', pg_get_triggerdef(t.oid, true)
  ) ORDER BY t.tgname), '[]'::jsonb) AS value
  FROM pg_trigger t
  WHERE t.tgrelid = to_regclass('public.reading_history')
    AND NOT t.tgisinternal
),
row_counts_json AS (
  SELECT coalesce(jsonb_object_agg(w.table_name,
    CASE WHEN to_regclass(format('public.%I', w.table_name)) IS NULL THEN NULL
    ELSE (
      SELECT ((xpath('/table/row/count/text()', query_to_xml(
        format('SELECT count(*) AS count FROM public.%I', w.table_name), false, false, ''
      )))[1]::text)::bigint
    ) END
  ), '{}'::jsonb) AS value
  FROM wanted w
  WHERE w.table_name IN ('reading_history', 'reading_progress', 'highlights', 'profiles')
),
functions_json AS (
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'name', p.oid::regprocedure::text,
    'security_definer', p.prosecdef,
    'args', pg_get_function_arguments(p.oid),
    'result', pg_get_function_result(p.oid)
  ) ORDER BY p.proname, p.oid::regprocedure::text), '[]'::jsonb) AS value
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND (p.proname = 'is_admin_user' OR p.proname ILIKE '%reading%')
),
reading_history_sample AS (
  SELECT CASE
    WHEN to_regclass('public.reading_history') IS NULL THEN '[]'::jsonb
    WHEN (SELECT count(*) FROM information_schema.columns
          WHERE table_schema='public' AND table_name='reading_history'
            AND column_name IN ('passage_id','score','time_spent_seconds','completed_at')) < 4 THEN '[]'::jsonb
    ELSE (
      SELECT ((xpath('/table/row/sample_shape/text()', query_to_xml($sample$
        SELECT coalesce(jsonb_agg(to_jsonb(sample_row)), '[]'::jsonb) AS sample_shape
        FROM (
          SELECT passage_id, score, time_spent_seconds, completed_at
          FROM public.reading_history
          ORDER BY completed_at DESC
          LIMIT 3
        ) sample_row
      $sample$, false, false, '')))[1]::text)::jsonb
    )
  END AS value
)
SELECT jsonb_build_object(
  'columns', columns_json.value,
  'reading_history_constraints', history_constraints.value,
  'reading_history_indexes', history_indexes.value,
  'policies', policies_json.value,
  'table_grants', grants_json.value,
  'reading_history_triggers', triggers_json.value,
  'row_counts', row_counts_json.value,
  'profiles_has_is_guest', EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='is_guest'
  ),
  'functions', functions_json.value,
  'reading_attempt_answers_exists', to_regclass('public.reading_attempt_answers') IS NOT NULL,
  'attempt_key_exists', EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='reading_history' AND column_name='attempt_key'
  ),
  'reading_history_rls_enabled', coalesce((
    SELECT c.relrowsecurity FROM pg_class c WHERE c.oid=to_regclass('public.reading_history')
  ), false),
  'reading_attempt_answers_rls_enabled', coalesce((
    SELECT c.relrowsecurity FROM pg_class c WHERE c.oid=to_regclass('public.reading_attempt_answers')
  ), false),
  'sample_shape', reading_history_sample.value
) AS inspection
FROM columns_json
CROSS JOIN history_constraints
CROSS JOIN history_indexes
CROSS JOIN policies_json
CROSS JOIN grants_json
CROSS JOIN triggers_json
CROSS JOIN row_counts_json
CROSS JOIN functions_json
CROSS JOIN reading_history_sample;
