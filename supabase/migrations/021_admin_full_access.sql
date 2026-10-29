-- Full administrator access: verified admins can read every learner table,
-- edit any profile (including admin status) and delete learner data. Also
-- adds site settings (announcement banner) and synced full mock results,
-- and stops learners from creating notifications for other people.

-- 1. Admins read every learner table that had no admin read policy yet.
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'achievements', 'daily_missions', 'highlights', 'push_subscriptions',
    'reading_progress', 'review_queue_items', 'saved_quotes', 'streaks',
    'study_goals', 'study_statistics', 'user_settings', 'vocabulary_items', 'xp'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins read all %1$s" ON public.%1$I', table_name);
    EXECUTE format(
      'CREATE POLICY "Admins read all %1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.is_admin_user(auth.uid()))',
      table_name
    );
  END LOOP;
END $$;

-- 2. Admins delete learner data (single records, or everything for a learner).
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'achievements', 'ai_conversations', 'daily_missions', 'highlights',
    'listening_attempts', 'premium_writing_requests', 'reading_history',
    'reading_mock_attempts', 'reading_progress', 'review_queue_items',
    'saved_quotes', 'streaks', 'study_goals', 'study_statistics',
    'vocabulary_items', 'writing_submissions', 'xp'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins delete %1$s" ON public.%1$I', table_name);
    EXECUTE format(
      'CREATE POLICY "Admins delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.is_admin_user(auth.uid()))',
      table_name
    );
    EXECUTE format('GRANT DELETE ON public.%I TO authenticated', table_name);
  END LOOP;
END $$;

-- 3. Admins edit any profile, including making someone an admin.
DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- 4. Only admins (or the server) create notifications; learners could
-- previously insert notifications for any user.
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins create notifications" ON public.notifications;
CREATE POLICY "Admins create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

-- 5. Site settings edited from the admin panel, readable by everyone.
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY CHECK (char_length(key) BETWEEN 1 AND 60),
  value JSONB NOT NULL CHECK (pg_column_size(value) <= 8192),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

DROP POLICY IF EXISTS "Anyone reads site settings" ON public.site_settings;
CREATE POLICY "Anyone reads site settings"
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- 6. Finished full mocks (Listening + Reading + Writing), synced for
-- signed-in learners so they and admins can see them on any device.
CREATE TABLE IF NOT EXISTS public.full_mock_results (
  id TEXT NOT NULL CHECK (char_length(id) BETWEEN 1 AND 60),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_band NUMERIC(2, 1) CHECK (overall_band BETWEEN 0 AND 9),
  listening_band NUMERIC(2, 1) CHECK (listening_band BETWEEN 0 AND 9),
  reading_band NUMERIC(2, 1) CHECK (reading_band BETWEEN 0 AND 9),
  writing_band NUMERIC(2, 1) CHECK (writing_band BETWEEN 0 AND 9),
  result_data JSONB NOT NULL CHECK (pg_column_size(result_data) <= 16384),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.full_mock_results ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.full_mock_results TO authenticated;

DROP POLICY IF EXISTS "Learners manage own full mock results" ON public.full_mock_results;
CREATE POLICY "Learners manage own full mock results"
  ON public.full_mock_results FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all full mock results" ON public.full_mock_results;
CREATE POLICY "Admins read all full mock results"
  ON public.full_mock_results FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins delete full mock results" ON public.full_mock_results;
CREATE POLICY "Admins delete full mock results"
  ON public.full_mock_results FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE INDEX IF NOT EXISTS full_mock_results_completed_idx
  ON public.full_mock_results (completed_at DESC);

-- 7. The legacy admin_users policies referred to admin_users itself, so any
-- query touching it (including every notifications read) failed with
-- "infinite recursion". Use the same admin check as everything else.
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can insert admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
  ON public.admin_users FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
CREATE POLICY "Admins can insert admin_users"
  ON public.admin_users FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
