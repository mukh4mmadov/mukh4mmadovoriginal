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
