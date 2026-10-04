CREATE TABLE IF NOT EXISTS public.donation_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'not_confirmed', 'needs_info')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS donation_conversations_user_created_idx
  ON public.donation_conversations (user_id, created_at DESC);

ALTER TABLE public.donation_conversations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.donation_conversations TO authenticated;
GRANT UPDATE (status) ON public.donation_conversations TO authenticated;

DROP POLICY IF EXISTS "Learners read own donation conversations" ON public.donation_conversations;
CREATE POLICY "Learners read own donation conversations"
  ON public.donation_conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read donation conversations" ON public.donation_conversations;
CREATE POLICY "Admins read donation conversations"
  ON public.donation_conversations FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Learners create own donation conversations" ON public.donation_conversations;
CREATE POLICY "Learners create own donation conversations"
  ON public.donation_conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners delete own donation conversations" ON public.donation_conversations;
CREATE POLICY "Learners delete own donation conversations"
  ON public.donation_conversations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update donation conversation status" ON public.donation_conversations;
CREATE POLICY "Admins update donation conversation status"
  ON public.donation_conversations FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

CREATE TABLE IF NOT EXISTS public.donation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.donation_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_from_admin BOOLEAN NOT NULL DEFAULT FALSE,
  body TEXT NOT NULL DEFAULT '' CHECK (char_length(body) <= 5000),
  attachment_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (char_length(trim(body)) > 0 OR attachment_path IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS donation_messages_conversation_created_idx
  ON public.donation_messages (conversation_id, created_at);

ALTER TABLE public.donation_messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.donation_messages TO authenticated;

DROP POLICY IF EXISTS "Learners and admins read donation messages" ON public.donation_messages;
CREATE POLICY "Learners and admins read donation messages"
  ON public.donation_messages FOR SELECT TO authenticated
  USING (
    public.is_admin_user(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.donation_conversations AS conversation_row
      WHERE conversation_row.id = conversation_id
        AND conversation_row.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Learners send donation messages" ON public.donation_messages;
CREATE POLICY "Learners send donation messages"
  ON public.donation_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND is_from_admin = FALSE
    AND EXISTS (
      SELECT 1 FROM public.donation_conversations AS conversation_row
      WHERE conversation_row.id = conversation_id
        AND conversation_row.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins reply to donation messages" ON public.donation_messages;
CREATE POLICY "Admins reply to donation messages"
  ON public.donation_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()) AND is_from_admin = TRUE AND sender_id = auth.uid());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('donation-proofs', 'donation-proofs', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Users upload own donation screenshots" ON storage.objects;
CREATE POLICY "Users upload own donation screenshots"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'donation-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "Users and admins view donation screenshots" ON storage.objects;
CREATE POLICY "Users and admins view donation screenshots"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'donation-proofs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR public.is_admin_user(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users delete own donation screenshots" ON storage.objects;
CREATE POLICY "Users delete own donation screenshots"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'donation-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
