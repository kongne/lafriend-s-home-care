-- Assign super_admin role to lafriendsservices@gmail.com

-- Add super_admin to the app_role enum safely
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE 'super_admin';
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;

-- Look up the user by email and assign super_admin role
DO $$
DECLARE
  _user_id UUID;
  _role_id UUID;
BEGIN
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = 'lafriendsservices@gmail.com';

  IF _user_id IS NULL THEN
    RAISE WARNING 'User lafriendsservices@gmail.com not found in auth.users';
    RETURN;
  END IF;

  -- Try to set role_id if the column exists (enterprise RBAC)
  SELECT id INTO _role_id FROM public.roles WHERE name = 'super_admin';

  BEGIN
    INSERT INTO public.user_roles (user_id, role, role_id)
    VALUES (_user_id, 'super_admin'::app_role, _role_id)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN undefined_column THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END;

  RAISE NOTICE 'Assigned super_admin to lafriendsservices@gmail.com (%)', _user_id;
END;
$$;
