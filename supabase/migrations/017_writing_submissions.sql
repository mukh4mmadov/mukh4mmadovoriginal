-- IELTS Writing practice submissions with AI feedback.
-- Rows are inserted by /api/writing-feedback using the learner's session;
-- learners read their own rows and verified administrators read all rows.
CREATE TABLE IF NOT EXISTS public.writing_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_slug TEXT NOT NULL CHECK (char_length(task_slug) BETWEEN 1 AND 100),
  task_number SMALLINT NOT NULL CHECK (task_number IN (1, 2)),
  essay TEXT NOT NULL CHECK (char_length(essay) <= 12000),
  word_count INTEGER NOT NULL CHECK (word_count BETWEEN 0 AND 2000),
  time_spent_seconds INTEGER CHECK (time_spent_seconds BETWEEN 0 AND 14400),
  overall_band NUMERIC(2, 1) CHECK (overall_band BETWEEN 0 AND 9),
  feedback JSONB NOT NULL CHECK (pg_column_size(feedback) <= 65536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.writing_submissions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.writing_submissions TO authenticated;

DROP POLICY IF EXISTS "Learners read own writing submissions" ON public.writing_submissions;
CREATE POLICY "Learners read own writing submissions"
  ON public.writing_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners insert own writing submissions" ON public.writing_submissions;
CREATE POLICY "Learners insert own writing submissions"
  ON public.writing_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all writing submissions" ON public.writing_submissions;
CREATE POLICY "Admins read all writing submissions"
  ON public.writing_submissions FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE INDEX IF NOT EXISTS writing_submissions_user_created_idx
  ON public.writing_submissions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS writing_submissions_created_idx
  ON public.writing_submissions (created_at DESC);
