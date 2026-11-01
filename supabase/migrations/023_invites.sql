-- Invite a friend: every learner has an invite link. A friend who opens it,
-- signs up and finishes two real practice tests counts for the inviter once
-- an admin approves it; every 3 approved friends give 1 free AI Premium
-- check. All checks run in the database so they can't be skipped from the
-- browser. Device ids and network addresses are only stored as hashes.

-- Keep in sync with src/lib/invites/invites.mjs.
--   INVITE_FRIENDS_PER_CREDIT = 3, INVITE_TESTS_NEEDED = 2,
--   INVITE_NEW_ACCOUNT_DAYS = 7, INVITE_MONTHLY_LIMIT = 20.

CREATE TABLE IF NOT EXISTS public.invite_codes (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9]{8}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.invite_codes TO authenticated;

DROP POLICY IF EXISTS "Learners read own invite code" ON public.invite_codes;
CREATE POLICY "Learners read own invite code"
  ON public.invite_codes FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin_user(auth.uid()));

-- Devices and networks a learner used, so a friend joining from the
-- inviter's own phone or Wi-Fi can be recognised.
CREATE TABLE IF NOT EXISTS public.invite_sightings (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('device', 'network')),
  hash TEXT NOT NULL CHECK (char_length(hash) = 32),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, kind, hash)
);
ALTER TABLE public.invite_sightings ENABLE ROW LEVEL SECURITY;
-- No policies for learners: only the functions below read and write it.
DROP POLICY IF EXISTS "Admins read invite sightings" ON public.invite_sightings;
CREATE POLICY "Admins read invite sightings"
  ON public.invite_sightings FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
GRANT SELECT ON public.invite_sightings TO authenticated;

CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'joined'
    CHECK (status IN ('joined', 'qualified', 'approved', 'rejected')),
  -- Warnings for the admin: same_network, device_reused, busy_network.
  flags TEXT[] NOT NULL DEFAULT '{}',
  device_hash TEXT,
  network_hash TEXT,
  tests_done SMALLINT NOT NULL DEFAULT 0,
  admin_note TEXT CHECK (admin_note IS NULL OR char_length(admin_note) <= 500),
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qualified_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  CHECK (inviter_id <> invitee_id)
);
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE, DELETE ON public.invites TO authenticated;

-- Learners see their invites through my_invite(); admins see and review all.
DROP POLICY IF EXISTS "Admins read invites" ON public.invites;
CREATE POLICY "Admins read invites"
  ON public.invites FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins review invites" ON public.invites;
CREATE POLICY "Admins review invites"
  ON public.invites FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins delete invites" ON public.invites;
CREATE POLICY "Admins delete invites"
  ON public.invites FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE INDEX IF NOT EXISTS invites_inviter_idx ON public.invites (inviter_id, claimed_at DESC);
CREATE INDEX IF NOT EXISTS invites_status_idx ON public.invites (status, claimed_at DESC);

-- The caller's network address as seen by the API gateway, hashed. The
-- browser can't set these headers for the request that reaches the database.
CREATE OR REPLACE FUNCTION public.invite_network_hash()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog, public
AS $$
DECLARE
  headers JSON := NULLIF(current_setting('request.headers', true), '')::json;
  address TEXT;
BEGIN
  IF headers IS NULL THEN RETURN NULL; END IF;
  address := COALESCE(
    NULLIF(headers->>'cf-connecting-ip', ''),
    NULLIF(trim(split_part(headers->>'x-forwarded-for', ',', 1)), ''),
    NULLIF(headers->>'x-real-ip', '')
  );
  IF address IS NULL THEN RETURN NULL; END IF;
  RETURN md5('invite-network:' || address);
END;
$$;
REVOKE ALL ON FUNCTION public.invite_network_hash() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.invite_device_hash(p_device TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p_device ~ '^[A-Za-z0-9-]{16,64}$' THEN md5('invite-device:' || p_device) END;
$$;
REVOKE ALL ON FUNCTION public.invite_device_hash(TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.invite_record_sighting(p_user UUID, p_device_hash TEXT, p_network_hash TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  INSERT INTO public.invite_sightings (user_id, kind, hash)
  SELECT p_user, kind, hash FROM (VALUES ('device', p_device_hash), ('network', p_network_hash)) AS seen(kind, hash)
  WHERE hash IS NOT NULL
  ON CONFLICT (user_id, kind, hash) DO UPDATE SET last_seen_at = NOW();
$$;
REVOKE ALL ON FUNCTION public.invite_record_sighting(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- Real practice tests: a Listening test with at least 10 correct, a Reading
-- mock with at least 10 correct, a Writing answer of 150+ words, or a full
-- mock. Empty submissions don't count.
CREATE OR REPLACE FUNCTION public.invite_real_tests(p_user UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT (
    (SELECT count(*) FROM public.listening_attempts WHERE user_id = p_user AND score >= 10)
    + (SELECT count(*) FROM public.reading_mock_attempts
        WHERE user_id = p_user
          AND COALESCE(NULLIF(result_data->>'rawScore', '')::numeric, 0) >= 10)
    + (SELECT count(*) FROM public.writing_submissions WHERE user_id = p_user AND word_count >= 150)
    + (SELECT count(*) FROM public.full_mock_results WHERE user_id = p_user)
  )::INTEGER;
$$;
REVOKE ALL ON FUNCTION public.invite_real_tests(UUID) FROM PUBLIC, anon, authenticated;

-- Moves invites of one inviter (or all, for admins) from joined to
-- qualified once the friend has done two real tests and their account is
-- at least a day old.
CREATE OR REPLACE FUNCTION public.invite_refresh(p_inviter UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.invites i
  SET tests_done = LEAST(public.invite_real_tests(i.invitee_id), 99)
  WHERE i.status = 'joined' AND (p_inviter IS NULL OR i.inviter_id = p_inviter);

  UPDATE public.invites i
  SET status = 'qualified', qualified_at = NOW()
  FROM auth.users u
  WHERE u.id = i.invitee_id
    AND i.status = 'joined'
    AND (p_inviter IS NULL OR i.inviter_id = p_inviter)
    AND i.tests_done >= 2
    AND u.created_at <= NOW() - INTERVAL '1 day';
END;
$$;
REVOKE ALL ON FUNCTION public.invite_refresh(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.invite_new_code()
RETURNS TEXT
LANGUAGE sql
VOLATILE
AS $$
  -- No 0/O or 1/I, so a code read aloud or retyped stays right.
  SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  FROM generate_series(1, 8);
$$;
REVOKE ALL ON FUNCTION public.invite_new_code() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.invite_is_real_account(p_user UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u JOIN public.profiles p ON p.id = u.id
    WHERE u.id = p_user
      AND COALESCE(u.is_anonymous, false) = false
      AND COALESCE(p.is_guest, false) = false
      AND u.email IS NOT NULL
      AND (u.email_confirmed_at IS NOT NULL OR u.confirmed_at IS NOT NULL)
  );
$$;
REVOKE ALL ON FUNCTION public.invite_is_real_account(UUID) FROM PUBLIC, anon, authenticated;

-- The caller's invite code (created on first use), friends and reward.
CREATE OR REPLACE FUNCTION public.my_invite(p_device TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  caller UUID := auth.uid();
  my_code TEXT;
  approved INTEGER;
BEGIN
  IF caller IS NULL OR NOT public.invite_is_real_account(caller) THEN
    RAISE EXCEPTION 'sign in with your account first' USING ERRCODE = '42501';
  END IF;
  PERFORM public.invite_record_sighting(caller, public.invite_device_hash(p_device), public.invite_network_hash());

  SELECT code INTO my_code FROM public.invite_codes WHERE user_id = caller;
  WHILE my_code IS NULL LOOP
    BEGIN
      INSERT INTO public.invite_codes (user_id, code) VALUES (caller, public.invite_new_code())
      RETURNING code INTO my_code;
    EXCEPTION WHEN unique_violation THEN
      SELECT code INTO my_code FROM public.invite_codes WHERE user_id = caller;
    END;
  END LOOP;

  PERFORM public.invite_refresh(caller);
  SELECT count(*) INTO approved FROM public.invites WHERE inviter_id = caller AND status = 'approved';

  RETURN jsonb_build_object(
    'code', my_code,
    'approved', approved,
    'friends', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id,
        -- Only the first name, so a learner doesn't see other people's details.
        'name', COALESCE(NULLIF(split_part(trim(p.full_name), ' ', 1), ''), 'A friend'),
        'status', i.status,
        'testsDone', LEAST(i.tests_done, 2),
        'joinedAt', i.claimed_at
      ) ORDER BY i.claimed_at DESC)
      FROM public.invites i JOIN public.profiles p ON p.id = i.invitee_id
      WHERE i.inviter_id = caller
    ), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.my_invite(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_invite(TEXT) TO authenticated;

-- A new learner joins with a friend's code. Returns one of: joined,
-- invalid_code, own_code, already_joined, not_new, same_device,
-- circular, limit_reached, not_signed_in.
CREATE OR REPLACE FUNCTION public.claim_invite(p_code TEXT, p_device TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  caller UUID := auth.uid();
  inviter UUID;
  caller_created TIMESTAMPTZ;
  inviter_created TIMESTAMPTZ;
  device TEXT := public.invite_device_hash(p_device);
  network TEXT := public.invite_network_hash();
  warnings TEXT[] := '{}';
BEGIN
  IF caller IS NULL OR NOT public.invite_is_real_account(caller) THEN
    RETURN 'not_signed_in';
  END IF;
  SELECT user_id INTO inviter FROM public.invite_codes WHERE code = upper(trim(COALESCE(p_code, '')));
  IF inviter IS NULL THEN RETURN 'invalid_code'; END IF;
  IF inviter = caller THEN RETURN 'own_code'; END IF;

  -- One claim at a time per inviter, so the monthly limit holds.
  PERFORM pg_advisory_xact_lock(hashtext('invites:' || inviter::text));
  PERFORM public.invite_record_sighting(caller, device, network);

  IF EXISTS (SELECT 1 FROM public.invites WHERE invitee_id = caller) THEN RETURN 'already_joined'; END IF;

  SELECT created_at INTO caller_created FROM auth.users WHERE id = caller;
  SELECT created_at INTO inviter_created FROM auth.users WHERE id = inviter;
  IF caller_created < NOW() - INTERVAL '7 days' OR caller_created <= inviter_created THEN
    RETURN 'not_new';
  END IF;
  -- Two people can't invite each other.
  IF EXISTS (SELECT 1 FROM public.invites WHERE inviter_id = caller AND invitee_id = inviter) THEN
    RETURN 'circular';
  END IF;
  -- Opening your own link on your own phone in a second account.
  IF device IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.invite_sightings WHERE user_id = inviter AND kind = 'device' AND hash = device
  ) THEN
    RETURN 'same_device';
  END IF;
  IF (SELECT count(*) FROM public.invites WHERE inviter_id = inviter AND claimed_at > NOW() - INTERVAL '30 days') >= 20 THEN
    RETURN 'limit_reached';
  END IF;

  -- Warnings for the admin, not blocks: classmates can share Wi-Fi or a
  -- computer in a learning centre.
  IF network IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.invite_sightings WHERE user_id = inviter AND kind = 'network' AND hash = network
  ) THEN
    warnings := array_append(warnings, 'same_network');
  END IF;
  IF device IS NOT NULL AND EXISTS (SELECT 1 FROM public.invites WHERE device_hash = device) THEN
    warnings := array_append(warnings, 'device_reused');
  END IF;
  IF device IS NULL THEN
    warnings := array_append(warnings, 'no_device');
  END IF;
  IF network IS NOT NULL AND (
    SELECT count(*) FROM public.invites WHERE inviter_id = inviter AND network_hash = network
  ) >= 2 THEN
    warnings := array_append(warnings, 'busy_network');
  END IF;

  INSERT INTO public.invites (inviter_id, invitee_id, flags, device_hash, network_hash)
  VALUES (inviter, caller, warnings, device, network);
  RETURN 'joined';
END;
$$;
REVOKE ALL ON FUNCTION public.claim_invite(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_invite(TEXT, TEXT) TO authenticated;

-- Admin list: every invite with both learners' names and emails, the
-- friend's test count and the warnings.
CREATE OR REPLACE FUNCTION public.admin_list_invites()
RETURNS TABLE (
  id UUID, status TEXT, flags TEXT[], tests_done SMALLINT, admin_note TEXT,
  claimed_at TIMESTAMPTZ, qualified_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ,
  inviter_id UUID, inviter_name TEXT, inviter_email TEXT, inviter_approved BIGINT,
  invitee_id UUID, invitee_name TEXT, invitee_email TEXT, invitee_created_at TIMESTAMPTZ,
  invitee_last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'administrators only' USING ERRCODE = '42501';
  END IF;
  PERFORM public.invite_refresh(NULL);
  RETURN QUERY
    SELECT i.id, i.status, i.flags, i.tests_done, i.admin_note,
      i.claimed_at, i.qualified_at, i.reviewed_at,
      i.inviter_id, a.full_name, a.email,
      (SELECT count(*) FROM public.invites x WHERE x.inviter_id = i.inviter_id AND x.status = 'approved'),
      i.invitee_id, b.full_name, b.email, ub.created_at, ub.last_sign_in_at
    FROM public.invites i
    JOIN public.profiles a ON a.id = i.inviter_id
    JOIN public.profiles b ON b.id = i.invitee_id
    LEFT JOIN auth.users ub ON ub.id = i.invitee_id
    ORDER BY (i.status = 'qualified') DESC, i.claimed_at DESC
    LIMIT 500;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_invites() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_invites() TO authenticated;

-- Approving or rejecting needs a qualified invite (or undoing a decision).
CREATE OR REPLACE FUNCTION public.admin_review_invite(p_id UUID, p_approve BOOLEAN, p_note TEXT DEFAULT NULL)
RETURNS public.invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  result public.invites;
BEGIN
  IF NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'administrators only' USING ERRCODE = '42501';
  END IF;
  UPDATE public.invites
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      reviewed_at = NOW(),
      admin_note = NULLIF(left(trim(COALESCE(p_note, '')), 500), '')
  WHERE id = p_id AND (status IN ('qualified', 'approved', 'rejected') OR NOT p_approve)
  RETURNING * INTO result;
  IF result.id IS NULL THEN
    RAISE EXCEPTION 'this friend has not finished two tests yet' USING ERRCODE = 'P0001';
  END IF;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_review_invite(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_invite(UUID, BOOLEAN, TEXT) TO authenticated;

-- Credits: bought packs + 1 per 3 approved friends - credits used.
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
       + (SELECT count(*) FROM public.invites WHERE inviter_id = target AND status = 'approved')::INTEGER / 3
       - COALESCE((SELECT sum(credits_used) FROM public.premium_writing_requests WHERE user_id = target AND status <> 'rejected'), 0);
END;
$$;
REVOKE ALL ON FUNCTION public.premium_credit_balance(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.premium_credit_balance(UUID) TO authenticated;
