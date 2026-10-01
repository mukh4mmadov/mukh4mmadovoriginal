-- Review-only rollback.
-- Safe by default: set each flag to true only when the pre-change snapshot
-- showed that table was not already a publication member.
BEGIN;

DO $publication$
DECLARE
  v_drop_support_tickets boolean := false;
  v_drop_support_ticket_messages boolean := false;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    IF v_drop_support_tickets AND EXISTS (
      SELECT 1 FROM pg_catalog.pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'support_tickets'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.support_tickets';
    END IF;

    IF v_drop_support_ticket_messages AND EXISTS (
      SELECT 1 FROM pg_catalog.pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'support_ticket_messages'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.support_ticket_messages';
    END IF;
  END IF;
END;
$publication$;

COMMIT;
