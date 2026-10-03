CREATE TABLE IF NOT EXISTS public.reading_mock_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_key UUID NOT NULL,
  result_data JSONB NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, attempt_key)
);

ALTER TABLE public.reading_mock_attempts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.reading_mock_attempts TO authenticated;

DROP POLICY IF EXISTS "Learners read own mock attempts" ON public.reading_mock_attempts;
CREATE POLICY "Learners read own mock attempts"
  ON public.reading_mock_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners insert own mock attempts" ON public.reading_mock_attempts;
CREATE POLICY "Learners insert own mock attempts"
  ON public.reading_mock_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners update own mock attempts" ON public.reading_mock_attempts;
CREATE POLICY "Learners update own mock attempts"
  ON public.reading_mock_attempts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS reading_mock_attempts_user_completed_idx
  ON public.reading_mock_attempts (user_id, completed_at DESC);
