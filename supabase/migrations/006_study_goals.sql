CREATE TABLE IF NOT EXISTS public.study_goals (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  target_band NUMERIC(2,1) NOT NULL DEFAULT 6.5 CHECK (target_band >= 4.0 AND target_band <= 9.0),
  exam_date DATE,
  study_days_per_week INTEGER NOT NULL DEFAULT 4 CHECK (study_days_per_week >= 1 AND study_days_per_week <= 7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study goals"
  ON public.study_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own study goals"
  ON public.study_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study goals"
  ON public.study_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study goals"
  ON public.study_goals FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_study_goals_updated_at
  BEFORE UPDATE ON public.study_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
