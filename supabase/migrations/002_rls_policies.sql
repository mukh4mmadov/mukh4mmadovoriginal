-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Reading progress policies
CREATE POLICY "Users can view own reading progress"
  ON public.reading_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading progress"
  ON public.reading_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading progress"
  ON public.reading_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading progress"
  ON public.reading_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Reading history policies
CREATE POLICY "Users can view own reading history"
  ON public.reading_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading history"
  ON public.reading_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading history"
  ON public.reading_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Highlights policies
CREATE POLICY "Users can view own highlights"
  ON public.highlights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own highlights"
  ON public.highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlights"
  ON public.highlights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights"
  ON public.highlights FOR DELETE
  USING (auth.uid() = user_id);

-- AI conversations policies
CREATE POLICY "Users can view own AI conversations"
  ON public.ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI conversations"
  ON public.ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI conversations"
  ON public.ai_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI conversations"
  ON public.ai_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON public.achievements FOR UPDATE
  USING (auth.uid() = user_id);

-- Streaks policies
CREATE POLICY "Users can view own streaks"
  ON public.streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON public.streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON public.streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- XP policies
CREATE POLICY "Users can view own XP"
  ON public.xp FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own XP"
  ON public.xp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own XP"
  ON public.xp FOR UPDATE
  USING (auth.uid() = user_id);

-- Saved quotes policies
CREATE POLICY "Users can view own saved quotes"
  ON public.saved_quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved quotes"
  ON public.saved_quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved quotes"
  ON public.saved_quotes FOR DELETE
  USING (auth.uid() = user_id);

-- Study statistics policies
CREATE POLICY "Users can view own study statistics"
  ON public.study_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study statistics"
  ON public.study_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study statistics"
  ON public.study_statistics FOR UPDATE
  USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Daily missions policies
CREATE POLICY "Users can view own daily missions"
  ON public.daily_missions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily missions"
  ON public.daily_missions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily missions"
  ON public.daily_missions FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, is_guest)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'is_guest')::boolean, FALSE)
  );
  
  -- Initialize user data
  INSERT INTO public.streaks (user_id) VALUES (NEW.id);
  INSERT INTO public.xp (user_id) VALUES (NEW.id);
  INSERT INTO public.study_statistics (user_id) VALUES (NEW.id);
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
