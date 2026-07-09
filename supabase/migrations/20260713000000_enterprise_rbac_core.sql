-- Enterprise RBAC, Audit Logs, Security, Backup, Maintenance, Error Logs
-- Phase 1: Database foundation for enterprise-grade admin platform

-- ============================================================================
-- 1. ENTERPRISE RBAC
-- ============================================================================

-- Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Role-Permission junction
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role_id, permission_id)
);

-- Upgrade user_roles to reference roles table
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- -- Seed default permissions
INSERT INTO public.permissions (code, name, description, module) VALUES
  -- Dashboard
  ('dashboard.view', 'View Dashboard', 'Access the admin dashboard', 'dashboard'),

  -- Users
  ('users.view', 'View Users', 'View user list and details', 'users'),
  ('users.create', 'Create Users', 'Create new user accounts', 'users'),
  ('users.edit', 'Edit Users', 'Modify user account details', 'users'),
  ('users.delete', 'Delete Users', 'Delete user accounts', 'users'),
  ('users.export', 'Export Users', 'Export user data', 'users'),
  ('users.restore', 'Restore Users', 'Restore deleted users', 'users'),
  ('users.impersonate', 'Impersonate Users', 'Login as another user', 'users'),
  ('users.force_logout', 'Force Logout', 'Force logout other users', 'users'),
  ('users.reset_mfa', 'Reset MFA', 'Reset multi-factor authentication', 'users'),
  ('users.manage_roles', 'Manage Roles', 'Assign roles to users', 'users'),

  -- Bookings
  ('bookings.view', 'View Bookings', 'View booking list and details', 'bookings'),
  ('bookings.create', 'Create Bookings', 'Create new bookings', 'bookings'),
  ('bookings.edit', 'Edit Bookings', 'Modify existing bookings', 'bookings'),
  ('bookings.delete', 'Delete Bookings', 'Delete bookings', 'bookings'),
  ('bookings.assign', 'Assign Bookings', 'Assign staff to bookings', 'bookings'),
  ('bookings.cancel', 'Cancel Bookings', 'Cancel bookings', 'bookings'),
  ('bookings.refund', 'Refund Bookings', 'Process booking refunds', 'bookings'),
  ('bookings.export', 'Export Bookings', 'Export booking data', 'bookings'),

  -- Payments
  ('payments.view', 'View Payments', 'View payment records', 'payments'),
  ('payments.refund', 'Refund Payments', 'Process payment refunds', 'payments'),
  ('payments.export', 'Export Payments', 'Export payment data', 'payments'),

  -- Reviews
  ('reviews.view', 'View Reviews', 'View customer reviews', 'reviews'),
  ('reviews.moderate', 'Moderate Reviews', 'Approve/reject reviews', 'reviews'),
  ('reviews.delete', 'Delete Reviews', 'Delete reviews', 'reviews'),

  -- Services
  ('services.view', 'View Services', 'View service catalog', 'services'),
  ('services.manage', 'Manage Services', 'Create/edit/delete services', 'services'),

  -- Staff
  ('staff.view', 'View Staff', 'View staff members', 'staff'),
  ('staff.manage', 'Manage Staff', 'Create/edit/delete staff', 'staff'),
  ('staff.assign', 'Assign Staff', 'Assign staff to bookings', 'staff'),

  -- Projects/Gallery
  ('projects.view', 'View Projects', 'View project gallery', 'projects'),
  ('projects.manage', 'Manage Projects', 'Create/edit/delete projects', 'projects'),

  -- Feedback
  ('feedback.view', 'View Feedback', 'View customer feedback', 'feedback'),
  ('feedback.manage', 'Manage Feedback', 'Respond to/manage feedback', 'feedback'),

  -- Announcements
  ('announcements.view', 'View Announcements', 'View announcements', 'announcements'),
  ('announcements.manage', 'Manage Announcements', 'Create/edit/delete announcements', 'announcements'),

  -- Reports
  ('reports.view', 'View Reports', 'Access reports', 'reports'),
  ('reports.export', 'Export Reports', 'Export report data', 'reports'),

  -- Settings
  ('settings.view', 'View Settings', 'Access settings page', 'settings'),
  ('settings.manage', 'Manage Settings', 'Modify system settings', 'settings'),

  -- RBAC
  ('rbac.view', 'View RBAC', 'View roles and permissions', 'rbac'),
  ('rbac.manage', 'Manage RBAC', 'Create/edit roles and permissions', 'rbac'),

  -- Audit
  ('audit.view', 'View Audit Logs', 'Access audit logs', 'audit'),
  ('audit.export', 'Export Audit Logs', 'Export audit log data', 'audit'),

  -- Backups
  ('backups.create', 'Create Backups', 'Create database backups', 'backups'),
  ('backups.restore', 'Restore Backups', 'Restore from backups', 'backups'),
  ('backups.delete', 'Delete Backups', 'Delete backup files', 'backups'),
  ('backups.download', 'Download Backups', 'Download backup files', 'backups'),
  ('backups.schedule', 'Schedule Backups', 'Configure backup schedules', 'backups'),

  -- Maintenance
  ('maintenance.manage', 'Manage Maintenance', 'Toggle maintenance mode', 'maintenance'),
  ('maintenance.schedule', 'Schedule Maintenance', 'Schedule maintenance windows', 'maintenance'),

  -- Security
  ('security.view', 'View Security', 'View security dashboard', 'security'),
  ('security.manage', 'Manage Security', 'Modify security settings', 'security'),

  -- System
  ('system.backup', 'System Backup', 'Perform system backups', 'system'),
  ('system.restore', 'System Restore', 'Perform system restores', 'system'),
  ('system.logs', 'System Logs', 'View system logs', 'system'),
  ('system.maintenance', 'System Maintenance', 'System maintenance operations', 'system'),

  -- Notifications
  ('notifications.view', 'View Notifications', 'View notifications', 'notifications'),
  ('notifications.send', 'Send Notifications', 'Send broadcast notifications', 'notifications'),

  -- Error Logs
  ('errors.view', 'View Error Logs', 'Access error logs', 'errors'),
  ('errors.manage', 'Manage Error Logs', 'Resolve/assign errors', 'errors')
ON CONFLICT (code) DO NOTHING;

-- Seed default roles
INSERT INTO public.roles (name, description, is_system) VALUES
  ('super_admin', 'Super Administrator - full system access', true),
  ('admin', 'Administrator - broad administrative access', true),
  ('moderator', 'Moderator - limited administrative access', true),
  ('support', 'Support Agent - customer support access', true),
  ('analyst', 'Analyst - read-only report access', true)
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to super_admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Assign broad permissions to admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'admin'
  AND p.code NOT IN (
    'users.impersonate', 'users.force_logout', 'users.reset_mfa',
    'system.backup', 'system.restore',
    'rbac.manage',
    'backups.create', 'backups.restore', 'backups.delete', 'backups.download', 'backups.schedule',
    'maintenance.manage', 'maintenance.schedule',
    'security.manage',
    'settings.manage'
  )
ON CONFLICT DO NOTHING;

-- Assign permissions to moderator
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'moderator'
  AND p.code IN (
    'dashboard.view',
    'bookings.view', 'bookings.edit', 'bookings.assign', 'bookings.cancel',
    'reviews.view', 'reviews.moderate',
    'feedback.view', 'feedback.manage',
    'announcements.view', 'announcements.manage',
    'services.view',
    'staff.view',
    'projects.view', 'projects.manage',
    'notifications.view', 'notifications.send'
  )
ON CONFLICT DO NOTHING;

-- Assign permissions to support
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'support'
  AND p.code IN (
    'dashboard.view',
    'bookings.view', 'bookings.edit', 'bookings.assign',
    'users.view',
    'reviews.view',
    'feedback.view',
    'notifications.view', 'notifications.send'
  )
ON CONFLICT DO NOTHING;

-- Assign permissions to analyst
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'analyst'
  AND p.code IN (
    'dashboard.view',
    'bookings.view',
    'reports.view', 'reports.export',
    'audit.view',
    'users.view'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. IMMUTABLE AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  device TEXT,
  session_id TEXT,
  request_id TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
  target_id TEXT,
  target_type TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON public.audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_module ON public.audit_logs(user_id, module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON public.audit_logs(action, created_at DESC);

-- Immutable audit log trigger (prevents UPDATE)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_update ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_update
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- RLS: admins can INSERT and SELECT audit logs, no one can UPDATE/DELETE
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;
CREATE POLICY "Admins view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 3. ERROR LOG CENTER
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL CHECK (error_type IN (
    'frontend', 'backend', 'api', 'database', 'authentication',
    'validation', 'cron', 'queue', 'email', 'unknown'
  )),
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  code TEXT,
  file TEXT,
  function TEXT,
  line INTEGER,
  stack_trace TEXT,
  environment TEXT DEFAULT 'production',
  browser TEXT,
  os TEXT,
  url TEXT,
  method TEXT,
  status_code INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id TEXT,
  ip_address TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  comment TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON public.error_logs(user_id);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage error logs" ON public.error_logs;
CREATE POLICY "Admins manage error logs" ON public.error_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 4. MAINTENANCE MODE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.maintenance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT false,
  maintenance_type TEXT NOT NULL DEFAULT 'scheduled' CHECK (maintenance_type IN ('scheduled', 'emergency')),
  reason TEXT,
  custom_page_html TEXT,
  countdown_ends_at TIMESTAMPTZ,
  allowed_ips TEXT[] DEFAULT '{}',
  allowed_role TEXT DEFAULT 'super_admin',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage maintenance" ON public.maintenance_events;
CREATE POLICY "Admins manage maintenance" ON public.maintenance_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone read maintenance status" ON public.maintenance_events;
CREATE POLICY "Anyone read maintenance status" ON public.maintenance_events
  FOR SELECT TO authenticated, anon
  USING (true);

-- ============================================================================
-- 5. BACKUP LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'automatic', 'scheduled')),
  backup_mode TEXT NOT NULL CHECK (backup_mode IN ('full', 'incremental')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  file_name TEXT,
  file_size BIGINT,
  file_path TEXT,
  compressed BOOLEAN DEFAULT false,
  encrypted BOOLEAN DEFAULT false,
  storage_location TEXT NOT NULL DEFAULT 'local' CHECK (storage_location IN ('local', 'cloud', 'both')),
  database_version TEXT,
  checksum TEXT,
  retention_days INTEGER DEFAULT 30,
  schedule_config JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON public.backup_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_type ON public.backup_logs(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created ON public.backup_logs(created_at DESC);

-- Restore history
CREATE TABLE IF NOT EXISTS public.restore_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID REFERENCES public.backup_logs(id) ON DELETE SET NULL,
  restore_type TEXT NOT NULL CHECK (restore_type IN ('full', 'partial', 'dry_run')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'rolled_back')),
  database_version TEXT,
  affected_tables TEXT[],
  estimated_downtime INTEGER,
  validation_passed BOOLEAN,
  error_message TEXT,
  rollback_status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restore_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage backup_logs" ON public.backup_logs;
CREATE POLICY "Admins manage backup_logs" ON public.backup_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage restore_logs" ON public.restore_logs;
CREATE POLICY "Admins manage restore_logs" ON public.restore_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 6. SECURITY EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'failed_login', 'locked_account', 'password_change', 'suspicious_activity',
    'unknown_device', 'api_abuse', 'rate_limit_exceeded', 'brute_force_detected',
    'session_expired', 'mfa_reset', 'impersonation', 'force_logout',
    'permission_change', 'role_change', 'token_refresh', 'password_reset'
  )),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  device TEXT,
  session_id TEXT,
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON public.security_events(resolved);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage security events" ON public.security_events;
CREATE POLICY "Admins manage security events" ON public.security_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 7. RBAC HELPER FUNCTIONS
-- ============================================================================

-- Check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id UUID,
  _permission_code TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND p.code = _permission_code
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.name = 'super_admin'
  )
$$;

-- Check if user has any of the given permissions
CREATE OR REPLACE FUNCTION public.has_any_permission(
  _user_id UUID,
  _permission_codes TEXT[]
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND p.code = ANY(_permission_codes)
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.name = 'super_admin'
  )
$$;

-- Get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TABLE (
  code TEXT,
  name TEXT,
  module TEXT,
  description TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.code, p.name, p.module, p.description
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role_id = ur.role_id
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = _user_id
  UNION
  SELECT p.code, p.name, p.module, p.description
  FROM public.permissions p
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id AND r.name = 'super_admin'
  )
  ORDER BY module, code;
$$;

-- Get user's roles with details
CREATE OR REPLACE FUNCTION public.get_user_roles_with_details(_user_id UUID)
RETURNS TABLE (
  role_id UUID,
  role_name TEXT,
  role_description TEXT,
  is_system BOOLEAN,
  assigned_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.name, r.description, r.is_system, ur.created_at
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = _user_id;
$$;

-- Log audit event (called by application)
CREATE OR REPLACE FUNCTION public.log_audit(
  _user_id UUID,
  _user_role TEXT,
  _action TEXT,
  _module TEXT,
  _description TEXT DEFAULT NULL,
  _old_value JSONB DEFAULT NULL,
  _new_value JSONB DEFAULT NULL,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _severity TEXT DEFAULT 'info',
  _status TEXT DEFAULT 'success',
  _target_id TEXT DEFAULT NULL,
  _target_type TEXT DEFAULT NULL,
  _duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.audit_logs (
    user_id, user_role, action, module, description,
    old_value, new_value, ip_address, user_agent,
    severity, status, target_id, target_type, duration_ms
  ) VALUES (
    _user_id, _user_role, _action, _module, _description,
    _old_value, _new_value, _ip_address, _user_agent,
    _severity, _status, _target_id, _target_type, _duration_ms
  )
  RETURNING id;
$$;

-- ============================================================================
-- 8. RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- RLS for roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage roles" ON public.roles;
CREATE POLICY "Admins manage roles" ON public.roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone view roles" ON public.roles;
CREATE POLICY "Anyone view roles" ON public.roles
  FOR SELECT TO authenticated
  USING (true);

-- RLS for permissions table
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage permissions" ON public.permissions;
CREATE POLICY "Admins manage permissions" ON public.permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone view permissions" ON public.permissions;
CREATE POLICY "Anyone view permissions" ON public.permissions
  FOR SELECT TO authenticated
  USING (true);

-- RLS for role_permissions table
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage role_permissions" ON public.role_permissions;
CREATE POLICY "Admins manage role_permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone view role_permissions" ON public.role_permissions;
CREATE POLICY "Anyone view role_permissions" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- 9. SYSTEM SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module, key)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_module ON public.system_settings(module);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage system_settings" ON public.system_settings;
CREATE POLICY "Admins manage system_settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone view system_settings" ON public.system_settings;
CREATE POLICY "Anyone view system_settings" ON public.system_settings
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- 10. USER SESSION LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  country TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ,
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  logged_out_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session ON public.user_sessions(session_id);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage user_sessions" ON public.user_sessions;
CREATE POLICY "Admins manage user_sessions" ON public.user_sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users view own sessions" ON public.user_sessions;
CREATE POLICY "Users view own sessions" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 11. UPDATE EXISTING user_roles RLS FOR NEW ROLE_ID
-- ============================================================================

-- Update the admin user_roles policy to use role_id
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;

DROP POLICY IF EXISTS "User roles admin manage" ON public.user_roles;
CREATE POLICY "User roles admin manage" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'users.manage_roles')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_permission(auth.uid(), 'users.manage_roles')
  );
