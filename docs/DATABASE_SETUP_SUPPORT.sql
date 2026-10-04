-- =====================================================================
-- DATABASE SETUP FOR SUPPORT CHAT, NOTIFICATIONS, AND ADMIN FEATURES
-- =====================================================================
-- Run each section separately to avoid deadlocks
-- =====================================================================

-- SECTION 1: Admin Users Table
-- =====================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin_users" ON admin_users;

CREATE POLICY "Admins can view admin_users" 
ON admin_users FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert admin_users" 
ON admin_users FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

COMMIT;

-- Grant access to current user (make yourself admin)
INSERT INTO admin_users (user_id) 
SELECT id FROM auth.users 
WHERE email = 'omuhammadov467@gmail.com' 
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================================
-- SECTION 2: Support Messages Table
-- =====================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_admin_id ON support_messages(admin_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at DESC);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own support messages" ON support_messages;
DROP POLICY IF EXISTS "Users can insert own support messages" ON support_messages;
DROP POLICY IF EXISTS "Admins can view all support messages" ON support_messages;
DROP POLICY IF EXISTS "Admins can reply to support messages" ON support_messages;

CREATE POLICY "Users can view own support messages" 
ON support_messages FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own support messages" 
ON support_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id AND is_from_admin = FALSE);

CREATE POLICY "Admins can view all support messages" 
ON support_messages FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can reply to support messages" 
ON support_messages FOR INSERT 
WITH CHECK (
  is_from_admin = TRUE AND 
  admin_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

COMMIT;

-- =====================================================================
-- SECTION 3: Notifications Table
-- =====================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('support_reply', 'system', 'achievement', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;

CREATE POLICY "Users can view own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
ON notifications FOR UPDATE 
USING (auth.uid() = user_id AND is_read = FALSE);

CREATE POLICY "System can insert notifications" 
ON notifications FOR INSERT 
WITH CHECK (TRUE);

CREATE POLICY "Admins can view all notifications" 
ON notifications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

COMMIT;

-- =====================================================================
-- SECTION 4: AI Chat History Table
-- =====================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  passage_slug TEXT NOT NULL,
  question_id TEXT,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  personality TEXT CHECK (personality IN ('friendly', 'strict', 'savage')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_created_at ON ai_chat_history(created_at DESC);

ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chat history" ON ai_chat_history;
DROP POLICY IF EXISTS "Users can insert own chat history" ON ai_chat_history;
DROP POLICY IF EXISTS "Admins can view all chat history" ON ai_chat_history;

CREATE POLICY "Users can view own chat history" 
ON ai_chat_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat history" 
ON ai_chat_history FOR INSERT 
WITH CHECK (auth.uid() = user_id AND role = 'user');

CREATE POLICY "Admins can view all chat history" 
ON ai_chat_history FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

COMMIT;

-- =====================================================================
-- SECTION 5: Functions
-- =====================================================================
BEGIN;

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, action_url)
  VALUES (p_user_id, p_type, p_title, p_message, p_action_url)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_support_messages_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  marked_count INTEGER;
BEGIN
  UPDATE support_messages
  SET is_read = TRUE
  WHERE user_id = p_user_id AND is_from_admin = TRUE AND is_read = FALSE;
  
  GET DIAGNOSTICS marked_count = ROW_COUNT;
  RETURN marked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE
  WHERE id = p_notification_id AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- =====================================================================
-- SECTION 6: Views
-- =====================================================================
BEGIN;

CREATE OR REPLACE VIEW admin_user_statistics AS
SELECT 
  u.id as user_id,
  u.email,
  p.full_name,
  p.username,
  COUNT(DISTINCT sm.id) as support_messages_count,
  MAX(sm.created_at) as last_activity
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN support_messages sm ON u.id = sm.user_id
GROUP BY u.id, u.email, p.full_name, p.username;

CREATE OR REPLACE VIEW admin_user_ai_summary AS
SELECT 
  user_id,
  COUNT(*) as total_ai_messages,
  COUNT(DISTINCT passage_slug) as passages_with_ai_help,
  MAX(created_at) as last_ai_interaction,
  STRING_AGG(DISTINCT personality, ', ') as personalities_used
FROM ai_chat_history
GROUP BY user_id;

COMMIT;
