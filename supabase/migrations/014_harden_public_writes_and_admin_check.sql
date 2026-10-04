-- Notifications are created by trusted database/server functions only.
-- Keep the migration safe for environments where this legacy table is absent.
DO $$
DECLARE
  policy_row RECORD;
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    FOR policy_row IN
      SELECT policy.polname
      FROM pg_policy AS policy
      WHERE policy.polrelid = 'public.notifications'::regclass
        AND policy.polcmd = 'a'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.notifications', policy_row.polname);
    END LOOP;

    REVOKE INSERT ON public.notifications FROM PUBLIC, anon, authenticated;
  END IF;
END;
$$;

-- Keep optional analytics for signed-in accounts and anonymous-auth guest
-- accounts, but reject direct writes from visitors without an auth session.
DROP POLICY IF EXISTS "Anonymous analytics must not contain a user id" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert their own analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Validated account analytics only" ON public.analytics_events;

REVOKE INSERT ON public.analytics_events FROM PUBLIC, anon;
GRANT INSERT ON public.analytics_events TO authenticated;

CREATE INDEX IF NOT EXISTS analytics_events_user_created_idx
  ON public.analytics_events (user_id, created_at DESC);

CREATE POLICY "Validated account analytics only"
  ON public.analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND jsonb_typeof(COALESCE(event_data, '{}'::jsonb)) = 'object'
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_each(COALESCE(event_data, '{}'::jsonb)) AS item(key, value)
      WHERE item.key NOT IN ('passageId', 'score', 'timeSpent', 'questionId', 'isCorrect', 'quoteId', 'feedbackId')
        OR jsonb_typeof(item.value) NOT IN ('string', 'number', 'boolean')
        OR (jsonb_typeof(item.value) = 'string' AND char_length(item.value #>> '{}') > 128)
    )
    AND jsonb_typeof(COALESCE(browser_info, '{}'::jsonb)) = 'object'
    AND (COALESCE(browser_info, '{}'::jsonb) - ARRAY['language']) = '{}'::jsonb
    AND COALESCE(browser_info ->> 'language', '') <> ''
    AND char_length(COALESCE(browser_info ->> 'language', '')) <= 35
    AND jsonb_typeof(COALESCE(device_info, '{}'::jsonb)) = 'object'
    AND (COALESCE(device_info, '{}'::jsonb) - ARRAY['category']) = '{}'::jsonb
    AND COALESCE(device_info ->> 'category', '') IN ('mobile', 'tablet', 'desktop')
    AND (
      page_url IS NULL
      OR (
        char_length(page_url) <= 256
        AND left(page_url, 1) = '/'
        AND position('?' IN page_url) = 0
        AND position('#' IN page_url) = 0
      )
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_analytics_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  caller_id UUID := auth.uid();
  recent_event_count INTEGER;
BEGIN
  -- Service-role maintenance imports have no end-user JWT and are unaffected.
  IF caller_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(caller_id::TEXT, 0));

  SELECT count(*)
  INTO recent_event_count
  FROM public.analytics_events
  WHERE user_id = caller_id
    AND created_at > now() - interval '1 minute';

  IF recent_event_count >= 60 THEN
    RAISE EXCEPTION 'Analytics event rate limit exceeded'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS analytics_events_rate_limit ON public.analytics_events;
CREATE TRIGGER analytics_events_rate_limit
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_analytics_rate_limit();

REVOKE ALL ON FUNCTION public.enforce_analytics_rate_limit() FROM PUBLIC, anon, authenticated;

-- Preserve the existing function signature for RLS policies, but evaluate
-- only the caller's own admin status. Pin the SECURITY DEFINER search path.
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS profile_row
      WHERE profile_row.id = auth.uid()
        AND profile_row.is_admin IS TRUE
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated, service_role;
