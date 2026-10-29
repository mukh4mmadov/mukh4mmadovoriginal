-- AI Premium Writing checks, paid on Telegram and approved by an administrator.
-- Learners create a request (awaiting payment), read their own requests and
-- may cancel one that is not paid yet. Verified administrators read every
-- request, confirm or reject payments and publish the premium feedback.
CREATE TABLE IF NOT EXISTS public.premium_writing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(gen_random_uuid()::text), 1, 6))
    CHECK (code ~ '^[A-Z0-9]{6}$'),
  -- [{ taskSlug, taskNumber, essay, wordCount }], one entry per task.
  essays JSONB NOT NULL CHECK (
    jsonb_typeof(essays) = 'array'
    AND jsonb_array_length(essays) BETWEEN 1 AND 2
    AND pg_column_size(essays) <= 40000
  ),
  price_uzs INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('awaiting_payment', 'paid', 'done', 'rejected')),
  -- One premium feedback object per essay, in the same order as essays.
  feedback JSONB CHECK (feedback IS NULL OR (jsonb_typeof(feedback) = 'array' AND pg_column_size(feedback) <= 200000)),
  admin_note TEXT CHECK (admin_note IS NULL OR char_length(admin_note) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- 5,000 UZS per essay; keep in sync with PREMIUM_PRICE_UZS in src/lib/writing/premium.mjs.
  CONSTRAINT premium_writing_price CHECK (price_uzs = 5000 * jsonb_array_length(essays))
);

ALTER TABLE public.premium_writing_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.premium_writing_requests TO authenticated;

DROP POLICY IF EXISTS "Learners read own premium writing requests" ON public.premium_writing_requests;
CREATE POLICY "Learners read own premium writing requests"
  ON public.premium_writing_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- New requests always start unpaid and without feedback, and a learner can
-- have at most five unpaid requests at a time.
DROP POLICY IF EXISTS "Learners create own premium writing requests" ON public.premium_writing_requests;
CREATE POLICY "Learners create own premium writing requests"
  ON public.premium_writing_requests FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'awaiting_payment'
    AND feedback IS NULL
    AND admin_note IS NULL
    AND approved_at IS NULL
    AND completed_at IS NULL
    AND (
      SELECT count(*) FROM public.premium_writing_requests existing
      WHERE existing.user_id = auth.uid() AND existing.status = 'awaiting_payment'
    ) < 5
  );

DROP POLICY IF EXISTS "Learners cancel own unpaid premium writing requests" ON public.premium_writing_requests;
CREATE POLICY "Learners cancel own unpaid premium writing requests"
  ON public.premium_writing_requests FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'awaiting_payment');

DROP POLICY IF EXISTS "Admins read all premium writing requests" ON public.premium_writing_requests;
CREATE POLICY "Admins read all premium writing requests"
  ON public.premium_writing_requests FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins update premium writing requests" ON public.premium_writing_requests;
CREATE POLICY "Admins update premium writing requests"
  ON public.premium_writing_requests FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

CREATE INDEX IF NOT EXISTS premium_writing_requests_user_created_idx
  ON public.premium_writing_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS premium_writing_requests_status_created_idx
  ON public.premium_writing_requests (status, created_at DESC);
