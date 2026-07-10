-- SECURITY DEFINER RPC for admin user lock/unlock via auth.users.banned_until
-- Requires caller to have the 'admin' app_role (checked by has_role)

CREATE OR REPLACE FUNCTION public.admin_toggle_user_ban(_user_id UUID, _lock BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;
  IF _lock THEN
    UPDATE auth.users SET banned_until = now() + interval '24 hours' WHERE id = _user_id;
  ELSE
    UPDATE auth.users SET banned_until = NULL WHERE id = _user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_toggle_user_ban(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_ban(UUID, BOOLEAN) TO authenticated;

-- Also grant execute on admin_get_user_email to authenticated if not already done
GRANT EXECUTE ON FUNCTION public.admin_get_user_email(UUID) TO authenticated;
