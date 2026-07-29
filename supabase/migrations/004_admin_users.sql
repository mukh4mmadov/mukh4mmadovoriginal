-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create admin role function
CREATE OR REPLACE FUNCTION make_admin(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET is_admin = TRUE WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policy for profiles to allow service role to update is_admin
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile (except admin)"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid()))
  );

-- Allow service role to update is_admin
CREATE POLICY "Service role can update admin status"
  ON profiles
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create analytics tables
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('reading_session', 'ai_conversation', 'passage_completed', 'signup', 'login')),
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Enable RLS for analytics
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics
CREATE POLICY "Anyone can insert analytics"
  ON analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can read analytics"
  ON analytics_events
  FOR SELECT
  TO service_role
  USING (true);

-- Create changelog table
CREATE TABLE IF NOT EXISTS changelog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  fixes JSONB DEFAULT '[]'::jsonb,
  breaking_changes JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_changelog_published_at ON changelog(published_at DESC);

-- Enable RLS for changelog
ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;

-- RLS policies for changelog
CREATE POLICY "Anyone can read changelog"
  ON changelog
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can insert changelog"
  ON changelog
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admin can update changelog"
  ON changelog
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admin can delete changelog"
  ON changelog
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Create roadmap table
CREATE TABLE IF NOT EXISTS roadmap (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('completed', 'in_progress', 'planned')),
  category TEXT NOT NULL CHECK (category IN ('feature', 'improvement', 'bug_fix')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_status ON roadmap(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_priority ON roadmap(priority);

-- Enable RLS for roadmap
ALTER TABLE roadmap ENABLE ROW LEVEL SECURITY;

-- RLS policies for roadmap
CREATE POLICY "Anyone can read roadmap"
  ON roadmap
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can insert roadmap"
  ON roadmap
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admin can update roadmap"
  ON roadmap
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admin can delete roadmap"
  ON roadmap
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Update trigger for roadmap
CREATE OR REPLACE FUNCTION update_roadmap_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roadmap_updated_at
  BEFORE UPDATE ON roadmap
  FOR EACH ROW
  EXECUTE FUNCTION update_roadmap_updated_at();
