-- Read-only inventory. Safe to run in the production SQL Editor.
-- Each query checks catalog metadata first so optional columns do not break this file.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('reading_history', 'reading_progress', 'highlights', 'profiles', 'reading_attempt_answers')
order by table_name, ordinal_position;

select c.relname as table_name, con.conname, con.contype,
       pg_get_constraintdef(con.oid) as definition
from pg_constraint con join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'reading_history'
order by con.conname;

select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'reading_history'
order by indexname;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('reading_history', 'reading_progress', 'highlights', 'profiles', 'reading_attempt_answers')
order by tablename, policyname;

select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('reading_history', 'reading_progress', 'highlights', 'profiles', 'reading_attempt_answers')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

select t.tgname, pg_get_triggerdef(t.oid) as definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'reading_history' and not t.tgisinternal
order by t.tgname;

select 'reading_history' as table_name, count(*) as row_count from public.reading_history
union all select 'reading_progress', count(*) from public.reading_progress
union all select 'highlights', count(*) from public.highlights
union all select 'profiles', count(*) from public.profiles;

select exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_guest'
) as profiles_has_is_guest;

select p.proname, p.prosecdef as security_definer,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_function_result(p.oid) as result
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (p.proname = 'is_admin_user' or p.proname ilike '%reading%')
order by p.proname;

select exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'reading_attempt_answers'
) as reading_attempt_answers_exists,
exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'reading_history' and column_name = 'attempt_key'
) as reading_history_attempt_key_exists;

select c.relname as table_name, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('reading_history','reading_attempt_answers');
