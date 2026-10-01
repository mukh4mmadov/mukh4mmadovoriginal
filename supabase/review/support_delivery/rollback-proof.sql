-- Review-only rollback proof A; ends with ROLLBACK.
BEGIN;

SELECT set_config('app.original_policies', coalesce((
  SELECT string_agg(
    schemaname::text || '.' || tablename::text || '.' || policyname::text || ':' || roles::text,
    E'\n' ORDER BY schemaname, tablename, policyname
  )
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename IN ('admin_users','support_messages','feedback_messages',
                      'ai_chat_history','notifications')
), ''), true);
-- BEGIN MIGRATION BODY (identical to migration.sql)


-- Canonical tickets. Contacts are retained for historical guest submissions;
-- new client submissions must be authenticated and set owner_id to auth.uid().
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  contact_name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  category text NOT NULL CHECK (category IN ('bug','feature','incorrect_answer','general','support')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  subject text NOT NULL CHECK (char_length(btrim(subject)) BETWEEN 1 AND 200),
  reproduction_steps text,
  expected_behavior text,
  actual_behavior text,
  page_url text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','waiting_on_learner','resolved')),
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  idempotency_key uuid,
  legacy_feedback_id uuid UNIQUE,
  legacy_support_user_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CHECK (char_length(contact_name) <= 200),
  CHECK (char_length(contact_email) <= 320),
  CHECK (reproduction_steps IS NULL OR char_length(reproduction_steps) <= 10000),
  CHECK (expected_behavior IS NULL OR char_length(expected_behavior) <= 5000),
  CHECK (actual_behavior IS NULL OR char_length(actual_behavior) <= 5000),
  CHECK (page_url IS NULL OR char_length(page_url) <= 2048),
  UNIQUE (owner_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('learner','admin','guest','system')),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 10000),
  idempotency_key uuid,
  legacy_source text,
  legacy_source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticket_id, sender_id, idempotency_key),
  UNIQUE (legacy_source, legacy_source_id)
);

CREATE INDEX IF NOT EXISTS support_tickets_owner_created_idx
  ON public.support_tickets(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_category_idx
  ON public.support_tickets(status, category, created_at DESC);
CREATE INDEX IF NOT EXISTS support_ticket_messages_ticket_created_idx
  ON public.support_ticket_messages(ticket_id, created_at);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_tickets, public.support_ticket_messages FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.support_tickets, public.support_ticket_messages TO authenticated;

-- A learner may insert only the opening message. This SECURITY DEFINER helper
-- avoids self-referential message-table RLS and only reports on owned tickets.
CREATE OR REPLACE FUNCTION public.support_ticket_has_messages(p_ticket_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.support_tickets AS t
    JOIN public.support_ticket_messages AS m ON m.ticket_id = t.id
    WHERE t.id = p_ticket_id AND t.owner_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.support_ticket_has_messages(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.support_ticket_has_messages(uuid) TO authenticated;

-- Idempotently replace both recursive admin_users policies.
DROP POLICY IF EXISTS "Admins can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can insert admin_users" ON public.admin_users
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "Admins can view admin_users" ON public.admin_users
  FOR SELECT TO authenticated USING (public.is_admin_user(auth.uid()));

-- Remove the remaining recursive admin_users lookups from these tables.
DROP POLICY IF EXISTS "Admins can view all chat history" ON public.ai_chat_history;
CREATE POLICY "Admins can view all chat history" ON public.ai_chat_history
  FOR SELECT TO authenticated USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT TO authenticated USING (public.is_admin_user(auth.uid()));

-- Replace the recursive ALL policy and consolidate the known duplicate user
-- policies. The four learner policy names and two admin policy names below are
-- taken from the live policy audit.
DROP POLICY IF EXISTS "Admins can view all support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can read support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can reply to support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can update support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can delete support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can insert own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can view own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can read own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can send own support messages" ON public.support_messages;
CREATE POLICY "Users can read own support messages" ON public.support_messages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins can read support messages" ON public.support_messages
  FOR SELECT TO authenticated USING (public.is_admin_user(auth.uid()));
CREATE POLICY "Users can send own support messages" ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_from_admin = false AND admin_id IS NULL);
CREATE POLICY "Admins can reply to support messages" ON public.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()) AND is_from_admin = true AND admin_id = auth.uid());
CREATE POLICY "Admins can update support messages" ON public.support_messages
  FOR UPDATE TO authenticated USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "Admins can delete support messages" ON public.support_messages
  FOR DELETE TO authenticated USING (public.is_admin_user(auth.uid()));

-- Ticket reads and writes are tied to ticket ownership. Learners cannot set
-- workflow/admin fields when creating a ticket.
DROP POLICY IF EXISTS "Ticket owners and admins read tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Learners create own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins manage tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Ticket participants read messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Learners add own ticket messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Admins add ticket messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Admins manage ticket messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Admins delete ticket messages" ON public.support_ticket_messages;
CREATE POLICY "Ticket owners and admins read tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin_user(auth.uid()));
CREATE POLICY "Learners create own tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND status = 'new' AND assignee_id IS NULL
    AND resolved_at IS NULL AND legacy_feedback_id IS NULL
    AND legacy_support_user_id IS NULL AND idempotency_key IS NOT NULL
  );
CREATE POLICY "Admins manage tickets" ON public.support_tickets
  FOR ALL TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "Ticket participants read messages" ON public.support_ticket_messages
  FOR SELECT TO authenticated
  USING (
    public.is_admin_user(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.owner_id = auth.uid()
    )
  );
CREATE POLICY "Learners add own ticket messages" ON public.support_ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND sender_type = 'learner'
    AND idempotency_key IS NOT NULL AND legacy_source IS NULL
    AND legacy_source_id IS NULL
    AND NOT public.support_ticket_has_messages(ticket_id)
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.owner_id = auth.uid()
    )
  );
CREATE POLICY "Admins add ticket messages" ON public.support_ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_user(auth.uid()) AND sender_id = auth.uid()
    AND sender_type = 'admin' AND legacy_source IS NULL
    AND legacy_source_id IS NULL
  );
CREATE POLICY "Admins manage ticket messages" ON public.support_ticket_messages
  FOR UPDATE TO authenticated USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "Admins delete ticket messages" ON public.support_ticket_messages
  FOR DELETE TO authenticated USING (public.is_admin_user(auth.uid()));

-- Migrate every legacy feedback row. Only columns from the original table
-- definition are referenced. All three audited rows have status 'replied'.
INSERT INTO public.support_tickets (
  owner_id, contact_name, contact_email, category, severity, subject, page_url,
  status, legacy_feedback_id, created_at, updated_at, resolved_at
)
SELECT p.id, coalesce(f.name, ''), coalesce(f.email, ''),
  CASE WHEN f.message_type IN ('bug','feature','incorrect_answer','general')
       THEN f.message_type ELSE 'general' END,
  'medium', left(coalesce(nullif(btrim(f.subject), ''), 'Feedback'), 200),
  f.page_url,
  CASE WHEN f.status = 'replied' THEN 'resolved'
       WHEN f.status = 'read' THEN 'in_progress' ELSE 'new' END,
  f.id, coalesce(f.created_at, now()), coalesce(f.created_at, now()),
  CASE WHEN f.status = 'replied' THEN coalesce(f.created_at, now()) END
FROM public.feedback_messages f
LEFT JOIN public.profiles p ON p.id = f.user_id
ON CONFLICT (legacy_feedback_id) DO NOTHING;

INSERT INTO public.support_ticket_messages (
  ticket_id, sender_id, sender_type, body, legacy_source, legacy_source_id, created_at
)
SELECT t.id, p.id, CASE WHEN p.id IS NULL THEN 'guest' ELSE 'learner' END,
  left(coalesce(nullif(btrim(f.message), ''), f.subject, 'Feedback'), 10000),
  'feedback', f.id, coalesce(f.created_at, now())
FROM public.feedback_messages f
JOIN public.support_tickets t ON t.legacy_feedback_id = f.id
LEFT JOIN public.profiles p ON p.id = f.user_id
ON CONFLICT (legacy_source, legacy_source_id) DO NOTHING;

-- Keep the legacy support migration step. It is harmless with the audited
-- zero-row table and remains idempotent if there are rows at deployment time.
INSERT INTO public.support_tickets (
  owner_id, contact_name, contact_email, category, severity, subject, status,
  legacy_support_user_id, created_at, updated_at
)
SELECT p.id, coalesce(p.full_name, ''), coalesce(p.email, ''), 'support',
  'medium', 'Support conversation', 'new', sm.user_id,
  min(sm.created_at), max(coalesce(sm.updated_at, sm.created_at))
FROM public.support_messages sm
LEFT JOIN public.profiles p ON p.id = sm.user_id
GROUP BY p.id, p.full_name, p.email, sm.user_id
ON CONFLICT (legacy_support_user_id) DO NOTHING;

INSERT INTO public.support_ticket_messages (
  ticket_id, sender_id, sender_type, body, legacy_source, legacy_source_id, created_at
)
SELECT t.id, p.id,
  CASE WHEN sm.is_from_admin THEN 'admin'
       WHEN p.id IS NULL THEN 'guest' ELSE 'learner' END,
  left(sm.message, 10000), 'support_message', sm.id, sm.created_at
FROM public.support_messages sm
JOIN public.support_tickets t ON t.legacy_support_user_id = sm.user_id
LEFT JOIN public.profiles p
  ON p.id = CASE WHEN sm.is_from_admin THEN sm.admin_id ELSE sm.user_id END
ON CONFLICT (legacy_source, legacy_source_id) DO NOTHING;

-- Remove the open guest insert policy. The legacy table becomes read-only;
-- new submissions go through the authenticated ticket flow.
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback_messages;
DROP POLICY IF EXISTS "Authenticated users can insert own feedback" ON public.feedback_messages;
REVOKE ALL ON public.feedback_messages FROM anon;
REVOKE ALL ON public.feedback_messages FROM authenticated;
GRANT SELECT ON public.feedback_messages TO authenticated;

-- Legacy support_messages and feedback_messages are read-only for client roles.
REVOKE ALL ON public.support_messages FROM anon;
REVOKE ALL ON public.support_messages FROM authenticated;
GRANT SELECT ON public.support_messages TO authenticated;

NOTIFY pgrst, 'reload schema';

-- END MIGRATION BODY

-- Rollback body, transaction wrapper omitted.


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

DO $$
DECLARE current_snapshot text;
BEGIN
  IF to_regclass('public.support_tickets') IS NOT NULL
     OR to_regclass('public.support_ticket_messages') IS NOT NULL THEN
    RAISE EXCEPTION 'Rollback left a ticket table behind';
  END IF;
  IF to_regprocedure('public.reply_to_support_ticket(uuid,text,uuid)') IS NOT NULL
     OR to_regprocedure('public.set_support_ticket_updated_at()') IS NOT NULL
     OR to_regprocedure('public.touch_support_ticket_after_message()') IS NOT NULL
     OR to_regprocedure('public.support_ticket_has_messages(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'Rollback left a ticket function behind';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_trigger AS tr
    JOIN pg_class AS c ON c.oid = tr.tgrelid
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname='public'
      AND tr.tgname='support_ticket_messages_touch_ticket'
      AND NOT tr.tgisinternal
  ) THEN
    RAISE EXCEPTION 'Rollback left the ticket-message timestamp trigger';
  END IF;
  SELECT coalesce(string_agg(
    schemaname::text || '.' || tablename::text || '.' || policyname::text || ':' || roles::text,
    E'\n' ORDER BY schemaname, tablename, policyname
  ), '') INTO current_snapshot
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename IN ('admin_users','support_messages','feedback_messages',
                      'ai_chat_history','notifications');
  IF current_snapshot IS DISTINCT FROM current_setting('app.original_policies') THEN
    RAISE EXCEPTION 'Rollback policy names/roles differ from original snapshot';
  END IF;
  IF NOT has_table_privilege('anon','public.feedback_messages','INSERT')
     OR NOT has_table_privilege('anon','public.feedback_messages','SELECT') THEN
    RAISE EXCEPTION 'Rollback did not restore anon feedback INSERT/SELECT';
  END IF;
END
$$;
ROLLBACK;
