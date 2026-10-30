-- AI Premium bundles: learners buy a pack of checks in advance (paid on
-- Telegram, confirmed by an admin) and then use one credit per essay
-- without paying each time. The database enforces the balance.

CREATE TABLE IF NOT EXISTS public.premium_credit_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(gen_random_uuid()::text), 1, 6))
    CHECK (code ~ '^[A-Z0-9]{6}$'),
  pack TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_uzs INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('awaiting_payment', 'paid', 'rejected')),
  admin_note TEXT CHECK (admin_note IS NULL OR char_length(admin_note) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  -- Keep in sync with PREMIUM_PACKS in src/lib/writing/premium.mjs.
  CONSTRAINT premium_credit_pack CHECK (
    (pack = 'pack5' AND credits = 5 AND price_uzs = 20000)
    OR (pack = 'pack10' AND credits = 10 AND price_uzs = 35000)
  )
);
ALTER TABLE public.premium_credit_orders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.premium_credit_orders TO authenticated;

DROP POLICY IF EXISTS "Learners read own credit orders" ON public.premium_credit_orders;
CREATE POLICY "Learners read own credit orders"
  ON public.premium_credit_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Learners create own credit orders" ON public.premium_credit_orders;
CREATE POLICY "Learners create own credit orders"
  ON public.premium_credit_orders FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'awaiting_payment'
    AND admin_note IS NULL
    AND approved_at IS NULL
    AND (
      SELECT count(*) FROM public.premium_credit_orders existing
      WHERE existing.user_id = auth.uid() AND existing.status = 'awaiting_payment'
    ) < 3
  );

DROP POLICY IF EXISTS "Learners cancel own unpaid credit orders" ON public.premium_credit_orders;
CREATE POLICY "Learners cancel own unpaid credit orders"
  ON public.premium_credit_orders FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'awaiting_payment');

DROP POLICY IF EXISTS "Admins read all credit orders" ON public.premium_credit_orders;
CREATE POLICY "Admins read all credit orders"
  ON public.premium_credit_orders FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins update credit orders" ON public.premium_credit_orders;
CREATE POLICY "Admins update credit orders"
  ON public.premium_credit_orders FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins delete credit orders" ON public.premium_credit_orders;
CREATE POLICY "Admins delete credit orders"
  ON public.premium_credit_orders FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE INDEX IF NOT EXISTS premium_credit_orders_user_idx ON public.premium_credit_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS premium_credit_orders_status_idx ON public.premium_credit_orders (status, created_at DESC);

-- Requests record how many credits paid for them (one per essay).
ALTER TABLE public.premium_writing_requests
  ADD COLUMN IF NOT EXISTS credits_used SMALLINT NOT NULL DEFAULT 0 CHECK (credits_used BETWEEN 0 AND 2);

-- Learners can only create unpaid requests themselves; requests paid with
-- credits go through create_premium_request_with_credits below.
DROP POLICY IF EXISTS "Learners create own premium writing requests" ON public.premium_writing_requests;
CREATE POLICY "Learners create own premium writing requests"
  ON public.premium_writing_requests FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'awaiting_payment'
    AND credits_used = 0
    AND feedback IS NULL
    AND admin_note IS NULL
    AND approved_at IS NULL
    AND completed_at IS NULL
    AND (
      SELECT count(*) FROM public.premium_writing_requests existing
      WHERE existing.user_id = auth.uid() AND existing.status = 'awaiting_payment'
    ) < 5
  );

-- Credits bought (paid orders) minus credits used (requests that were not
-- rejected; a rejected request gives its credits back).
CREATE OR REPLACE FUNCTION public.premium_credit_balance(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target UUID := COALESCE(p_user_id, auth.uid());
BEGIN
  IF target IS NULL OR (target <> auth.uid() AND NOT public.is_admin_user(auth.uid())) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE((SELECT sum(credits) FROM public.premium_credit_orders WHERE user_id = target AND status = 'paid'), 0)
       - COALESCE((SELECT sum(credits_used) FROM public.premium_writing_requests WHERE user_id = target AND status <> 'rejected'), 0);
END;
$$;
REVOKE ALL ON FUNCTION public.premium_credit_balance(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.premium_credit_balance(UUID) TO authenticated;

-- Creates a request already marked paid, using one credit per essay.
CREATE OR REPLACE FUNCTION public.create_premium_request_with_credits(p_essays JSONB)
RETURNS SETOF public.premium_writing_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  caller UUID := auth.uid();
  needed INTEGER;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'sign in first' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_essays) <> 'array' OR jsonb_array_length(p_essays) NOT BETWEEN 1 AND 2 THEN
    RAISE EXCEPTION 'invalid essays' USING ERRCODE = '22023';
  END IF;
  needed := jsonb_array_length(p_essays);
  -- One credit spend at a time per learner, so two tabs can't overspend.
  PERFORM pg_advisory_xact_lock(hashtext('premium-credits:' || caller::text));
  IF public.premium_credit_balance(caller) < needed THEN
    RAISE EXCEPTION 'not enough credits' USING ERRCODE = 'P0001';
  END IF;
  RETURN QUERY
    INSERT INTO public.premium_writing_requests (user_id, essays, price_uzs, status, approved_at, credits_used)
    VALUES (caller, p_essays, 5000 * needed, 'paid', NOW(), needed)
    RETURNING *;
END;
$$;
REVOKE ALL ON FUNCTION public.create_premium_request_with_credits(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_premium_request_with_credits(JSONB) TO authenticated;
