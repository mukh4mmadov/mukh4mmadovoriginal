-- Saved IELTS Listening practice results for signed-in learners.
-- Mirrors reading_mock_attempts (011/012): learners manage their own rows,
-- verified administrators can read all rows.
CREATE TABLE IF NOT EXISTS public.listening_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_key UUID NOT NULL,
  test_slug TEXT NOT NULL CHECK (char_length(test_slug) BETWEEN 1 AND 100),
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 40),
  total SMALLINT NOT NULL CHECK (total BETWEEN 1 AND 40),
  result_data JSONB NOT NULL CHECK (pg_column_size(result_data) <= 65536),
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, attempt_key)
);

ALTER TABLE public.listening_attempts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.listening_attempts TO authenticated;

DROP POLICY IF EXISTS "Learners read own listening attempts" ON public.listening_attempts;
CREATE POLICY "Learners read own listening attempts"
  ON public.listening_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners insert own listening attempts" ON public.listening_attempts;
CREATE POLICY "Learners insert own listening attempts"
  ON public.listening_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners update own listening attempts" ON public.listening_attempts;
CREATE POLICY "Learners update own listening attempts"
  ON public.listening_attempts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all listening attempts" ON public.listening_attempts;
CREATE POLICY "Admins read all listening attempts"
  ON public.listening_attempts FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE INDEX IF NOT EXISTS listening_attempts_user_completed_idx
  ON public.listening_attempts (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS listening_attempts_completed_idx
  ON public.listening_attempts (completed_at DESC);
