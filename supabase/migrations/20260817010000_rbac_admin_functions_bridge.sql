-- Bridge old app_role enum and new RBAC permission system
-- These functions now accept EITHER the old has_role('admin') OR the new has_permission() check

-- 1) admin_toggle_user_ban: bridge old+new RBAC
CREATE OR REPLACE FUNCTION public.admin_toggle_user_ban(_user_id UUID, _lock BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_permission(auth.uid(), 'users.edit')
  ) THEN
    RAISE EXCEPTION 'forbidden: admin role or users.edit permission required';
  END IF;
  IF _lock THEN
    UPDATE auth.users SET banned_until = now() + interval '24 hours' WHERE id = _user_id;
  ELSE
    UPDATE auth.users SET banned_until = NULL WHERE id = _user_id;
  END IF;
END;
$$;

-- 2) admin_get_user_email: bridge old+new RBAC
CREATE OR REPLACE FUNCTION public.admin_get_user_email(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_permission(auth.uid(), 'users.view')
  ) THEN
    RAISE EXCEPTION 'forbidden: admin role or users.view permission required';
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = _user_id;
  RETURN v_email;
END;
$$;

-- 3) admin_revoke_user_sessions: NEW function
CREATE OR REPLACE FUNCTION public.admin_revoke_user_sessions(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_permission(auth.uid(), 'users.edit')
  ) THEN
    RAISE EXCEPTION 'forbidden: admin role or users.edit permission required';
  END IF;
  UPDATE public.user_sessions
    SET is_active = false,
        logged_out_at = now()
    WHERE user_id = _user_id
      AND is_active = true;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_revoke_user_sessions(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_revoke_user_sessions(UUID) TO authenticated;
