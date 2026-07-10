
-- Extend audit_logs with columns used by the enterprise audit lib
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS user_role text,
  ADD COLUMN IF NOT EXISTS module text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS old_value jsonb,
  ADD COLUMN IF NOT EXISTS new_value jsonb,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS os text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS device text,
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS request_id text,
  ADD COLUMN IF NOT EXISTS severity text DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS target_id uuid,
  ADD COLUMN IF NOT EXISTS target_type text,
  ADD COLUMN IF NOT EXISTS duration_ms integer;

-- Shared updated_at trigger function already exists (public.update_updated_at_column)

-- =========================================================
-- testimonials
-- =========================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  role text,
  company text,
  avatar_url text,
  content text NOT NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  location text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active testimonials" ON public.testimonials
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage testimonials" ON public.testimonials
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_testimonials_updated_at BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- roles / permissions / role_permissions
-- =========================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage roles" ON public.roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated view roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  module text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage permissions" ON public.permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage role_permissions" ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Add optional role_id to user_roles WITHOUT breaking existing enum flow
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE;

-- =========================================================
-- backup_logs / restore_logs
-- =========================================================
CREATE TABLE IF NOT EXISTS public.backup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text NOT NULL DEFAULT 'manual',
  backup_mode text NOT NULL DEFAULT 'full',
  status text NOT NULL DEFAULT 'pending',
  file_name text,
  file_size bigint,
  file_path text,
  compressed boolean NOT NULL DEFAULT true,
  encrypted boolean NOT NULL DEFAULT false,
  storage_location text NOT NULL DEFAULT 'local',
  database_version text,
  checksum text,
  retention_days integer NOT NULL DEFAULT 30,
  schedule_config jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_logs TO authenticated;
GRANT ALL ON public.backup_logs TO service_role;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage backup_logs" ON public.backup_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.restore_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id uuid REFERENCES public.backup_logs(id) ON DELETE SET NULL,
  restore_type text NOT NULL DEFAULT 'full',
  status text NOT NULL DEFAULT 'pending',
  database_version text,
  affected_tables text[] NOT NULL DEFAULT '{}',
  estimated_downtime integer NOT NULL DEFAULT 0,
  validation_passed boolean,
  error_message text,
  rollback_status text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restore_logs TO authenticated;
GRANT ALL ON public.restore_logs TO service_role;
ALTER TABLE public.restore_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage restore_logs" ON public.restore_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- error_logs / security_events / maintenance_events
-- =========================================================
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL DEFAULT 'unknown',
  severity text NOT NULL DEFAULT 'error',
  message text NOT NULL,
  code text,
  file text,
  function text,
  line integer,
  stack_trace text,
  environment text,
  browser text,
  os text,
  url text,
  method text,
  status_code integer,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id text,
  ip_address text,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  comment text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_logs TO authenticated;
GRANT ALL ON public.error_logs TO service_role;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage error_logs" ON public.error_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own errors" ON public.error_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  country text,
  device text,
  session_id text,
  details jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage security_events" ON public.security_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.maintenance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT false,
  maintenance_type text NOT NULL DEFAULT 'scheduled',
  reason text,
  custom_page_html text,
  countdown_ends_at timestamptz,
  allowed_ips text[] NOT NULL DEFAULT '{}',
  allowed_role text NOT NULL DEFAULT 'admin',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_events TO authenticated;
GRANT ALL ON public.maintenance_events TO service_role;
ALTER TABLE public.maintenance_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage maintenance_events" ON public.maintenance_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated view maintenance_events" ON public.maintenance_events
  FOR SELECT TO authenticated USING (true);

-- =========================================================
-- user_sessions
-- =========================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  ip_address text,
  user_agent text,
  browser text,
  os text,
  device text,
  country text,
  is_active boolean NOT NULL DEFAULT true,
  logged_in_at timestamptz NOT NULL DEFAULT now(),
  logged_out_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sessions" ON public.user_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage user_sessions" ON public.user_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- system_settings
-- =========================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL DEFAULT 'general',
  key text NOT NULL,
  value jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module, key)
);
GRANT SELECT ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view system_settings" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage system_settings" ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_system_settings_updated_at BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- RBAC helper RPCs
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS TABLE (code text, name text, module text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT p.code, p.name, p.module
  FROM public.permissions p
  JOIN public.role_permissions rp ON rp.permission_id = p.id
  JOIN public.user_roles ur ON ur.role_id = rp.role_id
  WHERE ur.user_id = _user_id
  UNION
  -- Legacy admin enum grant: admins get all permissions
  SELECT p.code, p.name, p.module FROM public.permissions p
  WHERE public.has_role(_user_id, 'admin'::app_role);
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.get_user_permissions(_user_id) gp WHERE gp.code = _permission_code)
    OR public.has_role(_user_id, 'admin'::app_role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_permission(_user_id uuid, _permission_codes text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.get_user_permissions(_user_id) gp WHERE gp.code = ANY(_permission_codes))
    OR public.has_role(_user_id, 'admin'::app_role);
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles_with_details(_user_id uuid)
RETURNS TABLE (role_id uuid, role_name text, assigned_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.name, ur.created_at
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = _user_id AND ur.role_id IS NOT NULL;
$$;

-- =========================================================
-- Seed roles + permissions catalog
-- =========================================================
INSERT INTO public.roles (name, description, is_system) VALUES
  ('super_admin','Full unrestricted access',true),
  ('admin','Administrative access',true),
  ('manager','Manage bookings, staff, services',true),
  ('staff','Staff member',true),
  ('customer','Regular customer',true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.permissions (code, name, module) VALUES
  ('users.view','View users','users'),('users.manage','Manage users','users'),
  ('bookings.view','View bookings','bookings'),('bookings.manage','Manage bookings','bookings'),
  ('services.view','View services','services'),('services.manage','Manage services','services'),
  ('staff.view','View staff','staff'),('staff.manage','Manage staff','staff'),
  ('reviews.view','View reviews','reviews'),('reviews.manage','Manage reviews','reviews'),
  ('feedback.view','View feedback','feedback'),('feedback.manage','Manage feedback','feedback'),
  ('projects.view','View projects','projects'),('projects.manage','Manage projects','projects'),
  ('announcements.view','View announcements','announcements'),('announcements.manage','Manage announcements','announcements'),
  ('reports.view','View reports','reports'),('reports.export','Export reports','reports'),
  ('settings.view','View settings','settings'),('settings.manage','Manage settings','settings'),
  ('rbac.view','View roles & permissions','rbac'),('rbac.manage','Manage roles & permissions','rbac'),
  ('audit.view','View audit logs','audit'),
  ('backups.view','View backups','backups'),('backups.manage','Manage backups','backups'),
  ('maintenance.view','View maintenance','maintenance'),('maintenance.manage','Manage maintenance','maintenance'),
  ('security.view','View security events','security'),('security.manage','Manage security events','security'),
  ('notifications.view','View notifications','notifications'),('notifications.manage','Manage notifications','notifications'),
  ('errors.view','View error logs','errors'),('errors.manage','Manage error logs','errors'),
  ('system.view','View system','system'),('system.manage','Manage system','system')
ON CONFLICT (code) DO NOTHING;

-- Grant all permissions to super_admin and admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('super_admin','admin')
ON CONFLICT DO NOTHING;

-- Grant a sensible subset to manager
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'manager'
  AND p.code IN (
    'users.view','bookings.view','bookings.manage','services.view','services.manage',
    'staff.view','staff.manage','reviews.view','feedback.view','projects.view','projects.manage',
    'announcements.view','reports.view','settings.view','notifications.view','notifications.manage'
  )
ON CONFLICT DO NOTHING;

-- Grant read-only basics to staff
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'staff'
  AND p.code IN ('bookings.view','services.view','staff.view','notifications.view')
ON CONFLICT DO NOTHING;
