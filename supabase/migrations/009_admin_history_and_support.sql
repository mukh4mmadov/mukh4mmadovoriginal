-- Keep admin history reads scoped to verified admins. Existing user-owned
-- conversation policies continue to control each learner's own data.
DROP POLICY IF EXISTS "Admins can read AI conversations" ON public.ai_conversations;
CREATE POLICY "Admins can read AI conversations"
  ON public.ai_conversations
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- Persist support conversations used by the learner and admin chat panels.
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL CHECK (char_length(trim(message)) BETWEEN 1 AND 10000),
  is_from_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_user_created
  ON public.support_messages(user_id, created_at);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own support messages" ON public.support_messages;
CREATE POLICY "Users can read own support messages"
  ON public.support_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can send own support messages" ON public.support_messages;
CREATE POLICY "Users can send own support messages"
  ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_from_admin = FALSE AND admin_id IS NULL);

DROP POLICY IF EXISTS "Admins can read support messages" ON public.support_messages;
CREATE POLICY "Admins can read support messages"
  ON public.support_messages FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can reply to support messages" ON public.support_messages;
CREATE POLICY "Admins can reply to support messages"
  ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()) AND is_from_admin = TRUE AND admin_id = auth.uid());

-- An earlier deployment may have created this function with a return value;
-- PostgreSQL requires dropping it before changing its return type to VOID.
DROP FUNCTION IF EXISTS public.mark_support_messages_read(UUID);

CREATE FUNCTION public.mark_support_messages_read(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not allowed to mark another user’s messages as read';
  END IF;

  UPDATE public.support_messages
  SET is_read = TRUE
  WHERE user_id = p_user_id AND is_from_admin = TRUE AND is_read = FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_support_messages_read(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_support_messages_read(UUID) TO authenticated;
