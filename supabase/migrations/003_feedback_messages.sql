-- Feedback messages table
CREATE TABLE IF NOT EXISTS feedback_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'general' CHECK (message_type IN ('bug', 'feature', 'incorrect_answer', 'general')),
  page_url TEXT,
  browser_info JSONB,
  screen_size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_messages_user_id ON feedback_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_messages_created_at ON feedback_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_messages_status ON feedback_messages(status);

-- Enable RLS
ALTER TABLE feedback_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to insert feedback (including guests)
CREATE POLICY "Anyone can insert feedback"
  ON feedback_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to see their own feedback
CREATE POLICY "Users can see own feedback"
  ON feedback_messages
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow service role to see all feedback (for admin)
CREATE POLICY "Service role can see all feedback"
  ON feedback_messages
  FOR ALL
  TO service_role
  USING (true);

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM feedback_messages
  WHERE email = user_email
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  RETURN recent_count < 3; -- Allow max 3 messages per 5 minutes
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated trigger for automatic timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
