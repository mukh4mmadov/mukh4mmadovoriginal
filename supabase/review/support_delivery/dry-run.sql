-- Review-only complete dry run; ends with ROLLBACK.
BEGIN;
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
-- BEGIN REPLY RPC BODY (learner-reply-rpc.sql)
-- Optional follow-up script; not part of migration.sql.
-- Allows learners to reply without granting them UPDATE on support_tickets.

CREATE OR REPLACE FUNCTION public.set_support_ticket_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'resolved' THEN
      NEW.resolved_at := coalesce(NEW.resolved_at, pg_catalog.now());
    ELSIF OLD.status = 'resolved' THEN
      NEW.resolved_at := NULL;
    END IF;
  END IF;
  NEW.updated_at := GREATEST(
    pg_catalog.clock_timestamp(), OLD.updated_at + interval '1 microsecond'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_tickets_set_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_set_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_support_ticket_updated_at();

CREATE OR REPLACE FUNCTION public.reply_to_support_ticket(
  p_ticket_id uuid,
  p_body text,
  p_idempotency_key uuid
)
RETURNS public.support_ticket_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id uuid := auth.uid();
  ticket_row public.support_tickets%ROWTYPE;
  message_row public.support_ticket_messages%ROWTYPE;
  normalized_body text := btrim(p_body);
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_ticket_id IS NULL OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'Ticket and idempotency key are required' USING ERRCODE = '22023';
  END IF;
  IF normalized_body IS NULL OR pg_catalog.char_length(normalized_body) NOT BETWEEN 1 AND 10000 THEN
    RAISE EXCEPTION 'Reply must contain 1 to 10000 characters' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO ticket_row
  FROM public.support_tickets
  WHERE id = p_ticket_id AND owner_id = caller_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.support_ticket_messages
    (ticket_id, sender_id, sender_type, body, idempotency_key)
  VALUES
    (ticket_row.id, caller_id, 'learner', normalized_body, p_idempotency_key)
  ON CONFLICT (ticket_id, sender_id, idempotency_key) DO NOTHING
  RETURNING * INTO message_row;

  IF NOT FOUND THEN
    SELECT * INTO message_row
    FROM public.support_ticket_messages
    WHERE ticket_id = ticket_row.id
      AND sender_id = caller_id
      AND idempotency_key = p_idempotency_key;

    IF message_row.body IS DISTINCT FROM normalized_body THEN
      RAISE EXCEPTION 'Idempotency key was already used for a different reply'
        USING ERRCODE = '23505';
    END IF;
  END IF;

  UPDATE public.support_tickets
  SET status = CASE
        WHEN status IN ('waiting_on_learner', 'resolved') THEN 'in_progress'
        ELSE status
      END
  WHERE id = ticket_row.id;

  RETURN message_row;
END;
$$;

REVOKE ALL ON FUNCTION public.reply_to_support_ticket(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reply_to_support_ticket(uuid, text, uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.set_support_ticket_updated_at() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.touch_support_ticket_after_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.support_tickets
  SET updated_at = GREATEST(
    pg_catalog.clock_timestamp(), updated_at + interval '1 microsecond'
  )
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_support_ticket_after_message()
  FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS support_ticket_messages_touch_ticket
  ON public.support_ticket_messages;
CREATE TRIGGER support_ticket_messages_touch_ticket
  AFTER INSERT ON public.support_ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_support_ticket_after_message();

-- END REPLY RPC BODY
-- Baseline totals are captured after migration and before switching roles.
SELECT set_config('app.expected_ticket_total',
  (SELECT count(*)::text FROM public.support_tickets), true);
SELECT set_config('app.expected_message_total',
  (SELECT count(*)::text FROM public.support_ticket_messages), true);
SELECT set_config('app.expected_chat_total',
  (SELECT count(*)::text FROM public.ai_chat_history), true);
SELECT set_config('app.expected_notification_total',
  (SELECT count(*)::text FROM public.notifications), true);

-- (a) anon must have permission denied on SELECT from all four legacy/new tables.
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims','{"role":"anon"}',true);
DO $$
DECLARE denied boolean;
BEGIN
  denied := false;
  BEGIN PERFORM 1 FROM public.support_tickets LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'anon SELECT on support_tickets was not denied'; END IF;
  denied := false;
  BEGIN PERFORM 1 FROM public.support_ticket_messages LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'anon SELECT on support_ticket_messages was not denied'; END IF;
  denied := false;
  BEGIN PERFORM 1 FROM public.feedback_messages LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'anon SELECT on feedback_messages was not denied'; END IF;
  denied := false;
  BEGIN PERFORM 1 FROM public.support_messages LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'anon SELECT on support_messages was not denied'; END IF;
END
$$;

-- Anon is denied INSERT into the ticket tables and both legacy tables.
DO $$
DECLARE denied boolean;
BEGIN
  denied := false;
  BEGIN
    INSERT INTO public.support_tickets
      (contact_name,contact_email,category,subject,owner_id,idempotency_key)
    VALUES ('QA','qa@example.invalid','support','anon check',
      '5fc9493d-f7b3-4b64-b046-c5e291cf37b8',gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'anon INSERT on support_tickets was not denied'; END IF;
  denied := false;
  BEGIN
    INSERT INTO public.feedback_messages (name,email,subject,message,message_type)
    VALUES ('QA','qa@example.invalid','QA','anon insert','general');
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'anon INSERT on feedback_messages was not denied'; END IF;
  denied := false;
  BEGIN
    INSERT INTO public.support_messages (user_id,message,is_from_admin)
    VALUES ('5fc9493d-f7b3-4b64-b046-c5e291cf37b8','anon insert',false);
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'anon INSERT on support_messages was not denied'; END IF;
END
$$;

-- For these other tables anon may get a permission error or an RLS-filtered
-- zero; it must never see rows.
DO $$
DECLARE n bigint; denied boolean;
BEGIN
  denied := false;
  BEGIN SELECT count(*) INTO n FROM public.ai_chat_history;
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied AND n <> 0 THEN RAISE EXCEPTION 'anon saw chat history rows'; END IF;
  denied := false;
  BEGIN SELECT count(*) INTO n FROM public.notifications;
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied AND n <> 0 THEN RAISE EXCEPTION 'anon saw notification rows'; END IF;
END
$$;
RESET ROLE;

-- Learner A: non-recursive legacy reads; admin_users count works and is zero;
-- the two user tables return only rows owned by A.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"5fc9493d-f7b3-4b64-b046-c5e291cf37b8","role":"authenticated"}',true);
DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM public.support_messages;
  SELECT count(*) INTO n FROM public.feedback_messages;
  SELECT count(*) INTO n FROM public.admin_users;
  IF n <> 0 THEN RAISE EXCEPTION 'Non-admin can see admin_users rows'; END IF;
  SELECT count(*) INTO n FROM public.ai_chat_history;
  IF EXISTS (SELECT 1 FROM public.ai_chat_history WHERE user_id IS DISTINCT FROM auth.uid()) THEN
    RAISE EXCEPTION 'Learner A can see another user''s chat history';
  END IF;
  SELECT count(*) INTO n FROM public.notifications;
  IF EXISTS (SELECT 1 FROM public.notifications WHERE user_id IS DISTINCT FROM auth.uid()) THEN
    RAISE EXCEPTION 'Learner A can see another user''s notifications';
  END IF;
END
$$;

-- Learner A cannot set resolved status or an assignee on ticket creation.
DO $$
DECLARE denied boolean;
BEGIN
  denied := false;
  BEGIN
    INSERT INTO public.support_tickets
      (owner_id,contact_name,contact_email,category,subject,status,idempotency_key)
    VALUES (auth.uid(),'A','a@example.invalid','support','bad resolved','resolved',gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Learner A inserted a resolved ticket'; END IF;
  denied := false;
  BEGIN
    INSERT INTO public.support_tickets
      (owner_id,contact_name,contact_email,category,subject,assignee_id,idempotency_key)
    VALUES (auth.uid(),'A','a@example.invalid','support','bad assignee',
      '86a2c8f1-f785-432e-9f53-5f2c246bb898',gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Learner A assigned a ticket'; END IF;
END
$$;

-- Authenticated users cannot write to either legacy table.
DO $$
DECLARE denied boolean;
BEGIN
  denied := false;
  BEGIN
    INSERT INTO public.feedback_messages (name,email,subject,message,message_type,user_id)
    VALUES ('A','a@example.invalid','blocked','legacy write','general',auth.uid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Authenticated feedback insert was not denied'; END IF;
  denied := false;
  BEGIN
    INSERT INTO public.support_messages (user_id,message,is_from_admin)
    VALUES (auth.uid(),'legacy write',false);
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Authenticated support insert was not denied'; END IF;
END
$$;

-- Positive RLS path: A inserts a real ticket and learner message.
DO $$
DECLARE ticket_id uuid; message_id uuid;
BEGIN
  INSERT INTO public.support_tickets
    (owner_id,contact_name,contact_email,category,severity,subject,idempotency_key)
  VALUES (auth.uid(),'Learner A','a@example.invalid','support','medium',
    'RLS positive visibility check','a1000000-0000-4000-8000-000000000001')
  RETURNING id INTO ticket_id;
  INSERT INTO public.support_ticket_messages
    (ticket_id,sender_id,sender_type,body,idempotency_key)
  VALUES (ticket_id,auth.uid(),'learner','Learner A opening message',
    'a1000000-0000-4000-8000-000000000002')
  RETURNING id INTO message_id;
  PERFORM set_config('app.qa_ticket_id',ticket_id::text,true);
  PERFORM set_config('app.qa_learner_message_id',message_id::text,true);
  IF (SELECT count(*) FROM public.support_tickets WHERE id=ticket_id) <> 1
     OR (SELECT count(*) FROM public.support_ticket_messages WHERE id=message_id) <> 1 THEN
    RAISE EXCEPTION 'Learner A cannot see their inserted ticket/message';
  END IF;
END
$$;

-- Once the opening message exists, direct learner INSERT is blocked; replies
-- must use reply_to_support_ticket so ticket workflow timestamps stay correct.
DO $$
DECLARE denied boolean := false; ticket_id uuid := current_setting('app.qa_ticket_id')::uuid;
BEGIN
  BEGIN
    INSERT INTO public.support_ticket_messages
      (ticket_id,sender_id,sender_type,body,idempotency_key)
    VALUES (ticket_id,auth.uid(),'learner','direct reply bypass',gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Learner A inserted a later message without the RPC'; END IF;
END
$$;

-- On a fresh ticket with no messages, the has-messages condition is false.
-- These attempts therefore prove the sender/legacy policy conditions; then
-- the legitimate opening message succeeds and must advance updated_at.
DO $$
DECLARE fresh_id uuid; opening_id uuid; before_time timestamptz; after_time timestamptz;
  denied boolean;
BEGIN
  INSERT INTO public.support_tickets
    (owner_id,contact_name,contact_email,category,severity,subject,idempotency_key)
  VALUES (auth.uid(),'Learner A','a@example.invalid','support','medium',
    'Fresh sender-policy test','a1000000-0000-4000-8000-000000000006')
  RETURNING id INTO fresh_id;
  PERFORM set_config('app.qa_fresh_ticket_id',fresh_id::text,true);
  SELECT updated_at INTO before_time FROM public.support_tickets WHERE id=fresh_id;

  denied := false;
  BEGIN
    INSERT INTO public.support_ticket_messages
      (ticket_id,sender_id,sender_type,body,idempotency_key)
    VALUES (fresh_id,auth.uid(),'admin','forged admin',gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Fresh ticket accepted sender_type admin'; END IF;

  denied := false;
  BEGIN
    INSERT INTO public.support_ticket_messages
      (ticket_id,sender_id,sender_type,body,idempotency_key)
    VALUES (fresh_id,auth.uid(),'system','forged system',gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Fresh ticket accepted sender_type system'; END IF;

  denied := false;
  BEGIN
    INSERT INTO public.support_ticket_messages
      (ticket_id,sender_id,sender_type,body,idempotency_key,legacy_source,legacy_source_id)
    VALUES (fresh_id,auth.uid(),'learner','forged legacy',gen_random_uuid(),'feedback',gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Fresh ticket accepted legacy_source'; END IF;

  INSERT INTO public.support_ticket_messages
    (ticket_id,sender_id,sender_type,body,idempotency_key)
  VALUES (fresh_id,auth.uid(),'learner','legitimate opening message',gen_random_uuid())
  RETURNING id INTO opening_id;
  PERFORM set_config('app.qa_fresh_message_id',opening_id::text,true);
  SELECT updated_at INTO after_time FROM public.support_tickets WHERE id=fresh_id;
  IF after_time <= before_time THEN
    RAISE EXCEPTION 'Message INSERT did not advance support_tickets.updated_at';
  END IF;
  IF (SELECT count(*) FROM public.support_ticket_messages WHERE id=opening_id) <> 1 THEN
    RAISE EXCEPTION 'Legitimate opening message was not visible';
  END IF;
END
$$;

-- UPDATE and DELETE on A's own rows must touch zero rows.
DO $$
DECLARE affected bigint; ticket_id uuid := current_setting('app.qa_ticket_id')::uuid;
  message_id uuid := current_setting('app.qa_learner_message_id')::uuid;
BEGIN
  UPDATE public.support_tickets SET subject=subject WHERE id=ticket_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Learner A updated own ticket'; END IF;
  DELETE FROM public.support_tickets WHERE id=ticket_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Learner A deleted own ticket'; END IF;
  UPDATE public.support_ticket_messages SET body=body WHERE id=message_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Learner A updated own ticket message'; END IF;
  DELETE FROM public.support_ticket_messages WHERE id=message_id;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Learner A deleted own ticket message'; END IF;
END
$$;
RESET ROLE;

-- Learner B cannot read A's rows, add a message to A's ticket, or call the RPC.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"aff47889-799b-4e12-9c9b-744bda1da1d8","role":"authenticated"}',true);
DO $$
DECLARE denied boolean; ticket_id uuid := current_setting('app.qa_ticket_id')::uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.support_tickets WHERE id=ticket_id)
     OR EXISTS (SELECT 1 FROM public.support_ticket_messages
                WHERE id=current_setting('app.qa_learner_message_id')::uuid) THEN
    RAISE EXCEPTION 'Learner B can see Learner A ticket data';
  END IF;
  denied := false;
  BEGIN
    INSERT INTO public.support_ticket_messages
      (ticket_id,sender_id,sender_type,body,idempotency_key)
    VALUES (ticket_id,auth.uid(),'learner','cross-owner message',gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Learner B messaged Learner A ticket'; END IF;
  denied := false;
  BEGIN
    PERFORM public.reply_to_support_ticket(ticket_id,'not owner',gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Learner B replied to Learner A ticket'; END IF;
END
$$;
RESET ROLE;

-- Admin reads are non-recursive and see all relevant rows. Admin also posts a
-- reply that A must see below.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"86a2c8f1-f785-432e-9f53-5f2c246bb898","role":"authenticated"}',true);
DO $$
DECLARE n bigint; ticket_id uuid := current_setting('app.qa_ticket_id')::uuid;
  reply_id uuid;
BEGIN
  IF NOT public.is_admin_user(auth.uid()) THEN RAISE EXCEPTION 'Test UUID is not admin'; END IF;
  SELECT count(*) INTO n FROM public.support_messages;
  SELECT count(*) INTO n FROM public.feedback_messages;
  SELECT count(*) INTO n FROM public.admin_users;
  SELECT count(*) INTO n FROM public.ai_chat_history;
  SELECT count(*) INTO n FROM public.notifications;
  IF (SELECT count(*) FROM public.support_tickets WHERE id=ticket_id) <> 1
     OR (SELECT count(*) FROM public.support_ticket_messages
         WHERE id=current_setting('app.qa_learner_message_id')::uuid) <> 1 THEN
    RAISE EXCEPTION 'Admin cannot see Learner A ticket/message';
  END IF;

  INSERT INTO public.support_ticket_messages
    (ticket_id,sender_id,sender_type,body,idempotency_key)
  VALUES (ticket_id,auth.uid(),'admin','Admin reply visibility check',
    'a1000000-0000-4000-8000-000000000003')
  RETURNING id INTO reply_id;
  PERFORM set_config('app.qa_admin_reply_id',reply_id::text,true);

  -- Admin counts equal the privileged totals, including other owners' rows.
  IF (SELECT count(*) FROM public.ai_chat_history)
       <> current_setting('app.expected_chat_total')::bigint THEN
    RAISE EXCEPTION 'Admin did not see full ai_chat_history';
  END IF;
  IF (SELECT count(*) FROM public.notifications)
       <> current_setting('app.expected_notification_total')::bigint THEN
    RAISE EXCEPTION 'Admin did not see full notifications';
  END IF;
END
$$;

-- Admin moves the test ticket to waiting_on_learner before the learner RPC.
UPDATE public.support_tickets
SET status='waiting_on_learner'
WHERE id=current_setting('app.qa_ticket_id')::uuid;
DO $$
BEGIN
  IF (SELECT resolved_at FROM public.support_tickets
      WHERE id=current_setting('app.qa_ticket_id')::uuid) IS NOT NULL THEN
    RAISE EXCEPTION 'Non-resolved ticket retained resolved_at';
  END IF;
END
$$;
RESET ROLE;

-- Learner A sees the admin reply, replies through the SECURITY DEFINER RPC,
-- gets an idempotent replay for the same body, and receives an error for a
-- different body using the same key. Waiting and resolved tickets both reopen.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"5fc9493d-f7b3-4b64-b046-c5e291cf37b8","role":"authenticated"}',true);
DO $$
DECLARE first_reply public.support_ticket_messages%ROWTYPE;
  retry_reply public.support_ticket_messages%ROWTYPE;
  reopen_reply public.support_ticket_messages%ROWTYPE;
  denied boolean; ticket_id uuid := current_setting('app.qa_ticket_id')::uuid;
BEGIN
  IF (SELECT count(*) FROM public.support_ticket_messages
      WHERE id=current_setting('app.qa_admin_reply_id')::uuid AND sender_type='admin') <> 1 THEN
    RAISE EXCEPTION 'Learner A cannot see admin reply';
  END IF;

  SELECT * INTO first_reply FROM public.reply_to_support_ticket(
    ticket_id,'Reply through owner RPC','a1000000-0000-4000-8000-000000000004');
  SELECT * INTO retry_reply FROM public.reply_to_support_ticket(
    ticket_id,'Reply through owner RPC','a1000000-0000-4000-8000-000000000004');
  IF first_reply.id IS DISTINCT FROM retry_reply.id THEN
    RAISE EXCEPTION 'Same idempotency key/body did not return the same message';
  END IF;
  denied := false;
  BEGIN
    PERFORM public.reply_to_support_ticket(
      ticket_id,'Different body','a1000000-0000-4000-8000-000000000004');
  EXCEPTION WHEN unique_violation THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Reused idempotency key accepted a different body'; END IF;
  IF (SELECT status FROM public.support_tickets WHERE id=ticket_id) <> 'in_progress' THEN
    RAISE EXCEPTION 'Waiting ticket did not move to in_progress';
  END IF;
  IF (SELECT resolved_at FROM public.support_tickets WHERE id=ticket_id) IS NOT NULL THEN
    RAISE EXCEPTION 'Learner reply did not clear resolved_at';
  END IF;

  PERFORM set_config('app.qa_rpc_reply_id',first_reply.id::text,true);
  IF (SELECT count(*) FROM public.support_ticket_messages
      WHERE id=first_reply.id AND sender_type='learner') <> 1 THEN
    RAISE EXCEPTION 'Learner A cannot see its RPC reply';
  END IF;
END
$$;
RESET ROLE;

-- Admin resolves the ticket; the learner reply decision below reopens it.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"86a2c8f1-f785-432e-9f53-5f2c246bb898","role":"authenticated"}',true);
UPDATE public.support_tickets SET status='resolved'
WHERE id=current_setting('app.qa_ticket_id')::uuid;
DO $$
BEGIN
  IF (SELECT resolved_at FROM public.support_tickets
      WHERE id=current_setting('app.qa_ticket_id')::uuid) IS NULL THEN
    RAISE EXCEPTION 'Resolved transition did not set resolved_at';
  END IF;
END
$$;
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"5fc9493d-f7b3-4b64-b046-c5e291cf37b8","role":"authenticated"}',true);
DO $$
DECLARE reopen_reply public.support_ticket_messages%ROWTYPE;
  ticket_id uuid := current_setting('app.qa_ticket_id')::uuid;
BEGIN
  SELECT * INTO reopen_reply FROM public.reply_to_support_ticket(
    ticket_id,'Reopen resolved ticket','a1000000-0000-4000-8000-000000000005');
  IF (SELECT status FROM public.support_tickets WHERE id=ticket_id) <> 'in_progress' THEN
    RAISE EXCEPTION 'Resolved ticket did not reopen to in_progress';
  END IF;
  IF (SELECT resolved_at FROM public.support_tickets WHERE id=ticket_id) IS NOT NULL THEN
    RAISE EXCEPTION 'Resolved-ticket learner reply did not clear resolved_at';
  END IF;
END
$$;
RESET ROLE;

-- Anon has no EXECUTE on the reply RPC.
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims','{"role":"anon"}',true);
DO $$
DECLARE denied boolean := false;
BEGIN
  BEGIN
    PERFORM public.reply_to_support_ticket(
      current_setting('app.qa_ticket_id')::uuid,'anon reply',gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'anon executed reply_to_support_ticket'; END IF;
END
$$;
RESET ROLE;

-- Admin sees initial migrated rows plus two dry-run tickets and five messages:
-- two learner openings, one admin reply, and two unique learner RPC replies.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"86a2c8f1-f785-432e-9f53-5f2c246bb898","role":"authenticated"}',true);
DO $$
BEGIN
  IF (SELECT count(*) FROM public.support_tickets)
       <> current_setting('app.expected_ticket_total')::bigint + 2
     OR (SELECT count(*) FROM public.support_ticket_messages)
       <> current_setting('app.expected_message_total')::bigint + 5 THEN
    RAISE EXCEPTION 'Admin full visibility count check failed';
  END IF;
END
$$;
RESET ROLE;

ROLLBACK;
