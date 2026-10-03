-- Allow verified administrators to review all saved mock results.
-- Learner policies from 011 remain in place and continue to limit learners to their own rows.
DROP POLICY IF EXISTS "Admins read all mock attempts" ON public.reading_mock_attempts;
CREATE POLICY "Admins read all mock attempts"
  ON public.reading_mock_attempts
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));
