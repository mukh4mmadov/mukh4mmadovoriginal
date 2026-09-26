DROP POLICY IF EXISTS "Admins can read all feedback" ON public.feedback_messages;
CREATE POLICY "Admins can read all feedback"
  ON public.feedback_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback_messages;
CREATE POLICY "Admins can update feedback"
  ON public.feedback_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins can delete feedback" ON public.feedback_messages;
CREATE POLICY "Admins can delete feedback"
  ON public.feedback_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
    )
  );

REVOKE ALL ON FUNCTION public.make_admin(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.make_admin(uuid) TO service_role;

DROP POLICY IF EXISTS "Admins can read analytics" ON public.analytics_events;
CREATE POLICY "Admins can read analytics"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));
