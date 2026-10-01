-- Dry-run: snapshot publication membership, add both ticket tables, verify,
-- simulate rollback while preserving preexisting memberships, then ROLLBACK.
BEGIN;

DO $snapshot$
DECLARE
  v_publication_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication
    WHERE pubname = 'supabase_realtime'
  ) INTO v_publication_exists;

  IF NOT v_publication_exists THEN
    RAISE EXCEPTION 'Publication supabase_realtime does not exist';
  END IF;

  PERFORM pg_catalog.set_config('app.realtime_before_support_tickets', (
    SELECT EXISTS (
      SELECT 1 FROM pg_catalog.pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'support_tickets'
    )::text
  ), true);
  PERFORM pg_catalog.set_config('app.realtime_before_support_ticket_messages', (
    SELECT EXISTS (
      SELECT 1 FROM pg_catalog.pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'support_ticket_messages'
    )::text
  ), true);

  RAISE NOTICE 'Before: support_tickets=%, support_ticket_messages=%',
    current_setting('app.realtime_before_support_tickets'),
    current_setting('app.realtime_before_support_ticket_messages');
END;
$snapshot$;

DO $assert_before$
BEGIN
  IF (
    SELECT EXISTS (
      SELECT 1 FROM pg_catalog.pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'support_tickets'
    )::text
  ) <> current_setting('app.realtime_before_support_tickets') THEN
    RAISE EXCEPTION 'support_tickets baseline membership snapshot changed';
  END IF;
  IF (
    SELECT EXISTS (
      SELECT 1 FROM pg_catalog.pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'support_ticket_messages'
    )::text
  ) <> current_setting('app.realtime_before_support_ticket_messages') THEN
    RAISE EXCEPTION 'support_ticket_messages baseline membership snapshot changed';
  END IF;
END;
$assert_before$;

-- Same idempotent addition body as realtime-publication.sql.
DO $publication$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    RAISE EXCEPTION 'Publication supabase_realtime does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'support_tickets'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'support_ticket_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages';
  END IF;
END;
$publication$;

DO $assert_added$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'support_tickets'
  ) THEN
    RAISE EXCEPTION 'support_tickets is not in supabase_realtime after add';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'support_ticket_messages'
  ) THEN
    RAISE EXCEPTION 'support_ticket_messages is not in supabase_realtime after add';
  END IF;
END;
$assert_added$;

-- Simulate rollback only for memberships introduced by this transaction.
DO $rollback$
BEGIN
  IF current_setting('app.realtime_before_support_tickets') = 'false'
     AND EXISTS (
       SELECT 1 FROM pg_catalog.pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'support_tickets'
     ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.support_tickets';
  END IF;

  IF current_setting('app.realtime_before_support_ticket_messages') = 'false'
     AND EXISTS (
       SELECT 1 FROM pg_catalog.pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'support_ticket_messages'
     ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.support_ticket_messages';
  END IF;
END;
$rollback$;

DO $assert_restored$
DECLARE
  v_tickets boolean;
  v_messages boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'support_tickets'
  ) INTO v_tickets;
  SELECT EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'support_ticket_messages'
  ) INTO v_messages;

  IF v_tickets::text <> current_setting('app.realtime_before_support_tickets') THEN
    RAISE EXCEPTION 'support_tickets publication membership was not restored';
  END IF;
  IF v_messages::text <> current_setting('app.realtime_before_support_ticket_messages') THEN
    RAISE EXCEPTION 'support_ticket_messages publication membership was not restored';
  END IF;
END;
$assert_restored$;

ROLLBACK;
