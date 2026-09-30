-- Read a single user's support history through an explicit admin check.
-- This avoids coupling User Details to broader table-wide support policies.
CREATE OR REPLACE FUNCTION public.admin_get_user_support_messages(p_user_id UUID)
RETURNS SETOF public.support_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT COALESCE(public.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'Administrator access required'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT message_row.*
    FROM public.support_messages AS message_row
    WHERE message_row.user_id = p_user_id
    ORDER BY message_row.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_support_messages(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_user_support_messages(UUID) TO authenticated;
