-- Approved retention periods:
--   analytics events: 12 months
--   AI conversations: 12 months after last activity
--   resolved support conversations: 12 months after resolution/last activity
--   donation proof images: 3 months after a final review decision

ALTER TABLE public.donation_conversations
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

UPDATE public.donation_conversations AS conversation
SET resolved_at = COALESCE(
  (
    SELECT max(message.created_at)
    FROM public.donation_messages AS message
    WHERE message.conversation_id = conversation.id
      AND message.is_from_admin IS TRUE
  ),
  conversation.created_at
)
WHERE conversation.status IN ('confirmed', 'not_confirmed')
  AND conversation.resolved_at IS NULL;

CREATE OR REPLACE FUNCTION public.track_donation_review_resolution()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status IN ('confirmed', 'not_confirmed') THEN
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
      NEW.resolved_at := now();
    END IF;
  ELSE
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS donation_review_resolution_timestamp
  ON public.donation_conversations;
CREATE TRIGGER donation_review_resolution_timestamp
  BEFORE INSERT OR UPDATE OF status ON public.donation_conversations
  FOR EACH ROW EXECUTE FUNCTION public.track_donation_review_resolution();

DROP POLICY IF EXISTS "Learners create own donation conversations"
  ON public.donation_conversations;
CREATE POLICY "Learners create own donation conversations"
  ON public.donation_conversations FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND resolved_at IS NULL
  );

-- A proof path must belong to the submitting account and its conversation.
DROP POLICY IF EXISTS "Learners send donation messages" ON public.donation_messages;
CREATE POLICY "Learners send donation messages"
  ON public.donation_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND is_from_admin = FALSE
    AND (
      attachment_path IS NULL
      OR attachment_path LIKE auth.uid()::TEXT || '/' || conversation_id::TEXT || '/%'
    )
    AND EXISTS (
      SELECT 1 FROM public.donation_conversations AS conversation_row
      WHERE conversation_row.id = conversation_id
        AND conversation_row.user_id = auth.uid()
    )
  );

-- Legacy feedback rows have a "replied" state but no resolution timestamp.
-- Start their retention period when this migration is enabled, then track
-- future state changes using the recorded resolution time.
ALTER TABLE public.feedback_messages
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

UPDATE public.feedback_messages
SET resolved_at = now()
WHERE status = 'replied' AND resolved_at IS NULL;

CREATE OR REPLACE FUNCTION public.track_feedback_resolution()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status = 'replied' THEN
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
      NEW.resolved_at := now();
    END IF;
  ELSE
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feedback_resolution_timestamp ON public.feedback_messages;
CREATE TRIGGER feedback_resolution_timestamp
  BEFORE INSERT OR UPDATE OF status ON public.feedback_messages
  FOR EACH ROW EXECUTE FUNCTION public.track_feedback_resolution();

CREATE OR REPLACE FUNCTION public.track_support_ticket_resolution()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status = 'resolved' THEN
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
      NEW.resolved_at := now();
    END IF;
  ELSE
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.support_tickets') IS NOT NULL THEN
    ALTER TABLE public.support_tickets
      ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

    UPDATE public.support_tickets
    SET resolved_at = COALESCE(updated_at, created_at)
    WHERE status = 'resolved' AND resolved_at IS NULL;

    DROP TRIGGER IF EXISTS support_ticket_resolution_timestamp
      ON public.support_tickets;
    CREATE TRIGGER support_ticket_resolution_timestamp
      BEFORE INSERT OR UPDATE OF status ON public.support_tickets
      FOR EACH ROW EXECUTE FUNCTION public.track_support_ticket_resolution();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_expired_user_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  analytics_removed INTEGER := 0;
  ai_removed INTEGER := 0;
  support_removed INTEGER := 0;
  legacy_feedback_removed INTEGER := 0;
  linked_feedback_removed INTEGER := 0;
  old_support_messages_removed INTEGER := 0;
BEGIN
  DELETE FROM public.analytics_events
  WHERE created_at < now() - interval '12 months';
  GET DIAGNOSTICS analytics_removed = ROW_COUNT;

  DELETE FROM public.ai_conversations
  WHERE updated_at < now() - interval '12 months';
  GET DIAGNOSTICS ai_removed = ROW_COUNT;

  IF to_regclass('public.support_tickets') IS NOT NULL THEN
    EXECUTE $query$
      DELETE FROM public.feedback_messages AS feedback
      WHERE feedback.id IN (
        SELECT legacy_feedback_id
        FROM public.support_tickets
        WHERE status = 'resolved'
          AND resolved_at < now() - interval '12 months'
          AND legacy_feedback_id IS NOT NULL
      )
    $query$;
    GET DIAGNOSTICS linked_feedback_removed = ROW_COUNT;

    EXECUTE $query$
      DELETE FROM public.support_tickets
      WHERE status = 'resolved'
        AND resolved_at < now() - interval '12 months'
    $query$;
    GET DIAGNOSTICS support_removed = ROW_COUNT;
  END IF;

  DELETE FROM public.feedback_messages
  WHERE status = 'replied'
    AND resolved_at IS NOT NULL
    AND resolved_at < now() - interval '12 months';
  GET DIAGNOSTICS legacy_feedback_removed = ROW_COUNT;
  legacy_feedback_removed := legacy_feedback_removed + linked_feedback_removed;

  IF to_regclass('public.support_messages') IS NOT NULL THEN
    EXECUTE $query$
      DELETE FROM public.support_messages AS message
      WHERE message.user_id IN (
        SELECT user_id
        FROM public.support_messages
        GROUP BY user_id
        HAVING max(created_at) < now() - interval '12 months'
      )
    $query$;
    GET DIAGNOSTICS old_support_messages_removed = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'analytics_events', analytics_removed,
    'ai_conversations', ai_removed,
    'resolved_support_tickets', support_removed,
    'legacy_feedback', legacy_feedback_removed,
    'inactive_support_messages', old_support_messages_removed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_user_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_user_data() TO service_role;

REVOKE ALL ON FUNCTION public.track_donation_review_resolution() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.track_feedback_resolution() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.track_support_ticket_resolution() FROM PUBLIC, anon, authenticated;
