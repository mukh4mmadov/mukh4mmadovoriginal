-- Review-only rollback. This restores the audited legacy policy behavior,
-- including its recursion, so use only to reverse the migration itself.
-- Refuses to drop application-created tickets or replies.
BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE legacy_feedback_id IS NULL AND legacy_support_user_id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.support_ticket_messages
    WHERE legacy_source IS NULL
  ) THEN
    RAISE EXCEPTION
      'Rollback stopped: post-migration ticket data exists; export/reconcile it first';
  END IF;
END
$$;

-- Remove every policy created by migration.sql before restoring legacy ones.
DROP POLICY IF EXISTS "Admins can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;

DROP POLICY IF EXISTS "Admins can view all chat history" ON public.ai_chat_history;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;

DROP POLICY IF EXISTS "Users can read own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can read support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can send own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can reply to support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can update support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can delete support messages" ON public.support_messages;

DROP POLICY IF EXISTS "Ticket owners and admins read tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Learners create own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins manage tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Ticket participants read messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Learners add own ticket messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Admins add ticket messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Admins manage ticket messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Admins delete ticket messages" ON public.support_ticket_messages;

DROP POLICY IF EXISTS "Authenticated users can insert own feedback" ON public.feedback_messages;

-- Restore the exact legacy admin_users policy names and public role scope.
CREATE POLICY "Admins can insert admin_users" ON public.admin_users
  FOR INSERT TO public
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can view admin_users" ON public.admin_users
  FOR SELECT TO public
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all chat history" ON public.ai_chat_history
  AS PERMISSIVE FOR SELECT TO public
  USING (EXISTS ( SELECT 1 FROM admin_users WHERE (admin_users.user_id = auth.uid())));
CREATE POLICY "Admins can view all notifications" ON public.notifications
  AS PERMISSIVE FOR SELECT TO public
  USING (EXISTS ( SELECT 1 FROM admin_users WHERE (admin_users.user_id = auth.uid())));

-- Restore the audited support policy names and roles. This intentionally
-- recreates the recursive ALL policy as it existed before this migration.
DROP POLICY IF EXISTS "Users can read own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can send own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can update support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can delete support messages" ON public.support_messages;

CREATE POLICY "Admins can view all support messages" ON public.support_messages
  FOR ALL TO public
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own support messages" ON public.support_messages
  FOR INSERT TO public
  WITH CHECK (user_id = auth.uid() AND is_from_admin = false AND admin_id IS NULL);
CREATE POLICY "Users can view own support messages" ON public.support_messages
  FOR SELECT TO public USING (user_id = auth.uid());
CREATE POLICY "Users can read own support messages" ON public.support_messages
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can send own support messages" ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_from_admin = false AND admin_id IS NULL);
CREATE POLICY "Admins can read support messages" ON public.support_messages
  FOR SELECT TO authenticated USING (public.is_admin_user(auth.uid()));
CREATE POLICY "Admins can reply to support messages" ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_user(auth.uid()) AND is_from_admin = true AND admin_id = auth.uid()
  );

-- Restore the previously open feedback insert policy and corresponding grants.
DROP POLICY IF EXISTS "Authenticated users can insert own feedback" ON public.feedback_messages;
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback_messages;
CREATE POLICY "Anyone can insert feedback" ON public.feedback_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT ALL ON public.feedback_messages TO anon, authenticated;
GRANT ALL ON public.support_messages TO anon, authenticated;

-- Remove optional reply support objects before dropping their return/table type.
DROP FUNCTION IF EXISTS public.reply_to_support_ticket(uuid, text, uuid);
DROP TRIGGER IF EXISTS support_tickets_set_updated_at ON public.support_tickets;
DROP FUNCTION IF EXISTS public.set_support_ticket_updated_at();
DROP TRIGGER IF EXISTS support_ticket_messages_touch_ticket
  ON public.support_ticket_messages;
DROP FUNCTION IF EXISTS public.touch_support_ticket_after_message();
DROP FUNCTION IF EXISTS public.support_ticket_has_messages(uuid);

DROP TABLE public.support_ticket_messages;
DROP TABLE public.support_tickets;

NOTIFY pgrst, 'reload schema';
COMMIT;
