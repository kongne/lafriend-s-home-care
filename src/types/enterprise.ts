export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  permission_count?: number;
  user_count?: number;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
  created_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_role: string | null;
  action: string;
  module: string;
  description: string | null;
  old_value: any | null;
  new_value: any | null;
  ip_address: string | null;
  user_agent: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  device: string | null;
  session_id: string | null;
  request_id: string | null;
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'success' | 'failure' | 'pending';
  target_id: string | null;
  target_type: string | null;
  duration_ms: number | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface ErrorLog {
  id: string;
  error_type: 'frontend' | 'backend' | 'api' | 'database' | 'authentication' | 'validation' | 'cron' | 'queue' | 'email' | 'unknown';
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  message: string;
  code: string | null;
  file: string | null;
  function: string | null;
  line: number | null;
  stack_trace: string | null;
  environment: string | null;
  browser: string | null;
  os: string | null;
  url: string | null;
  method: string | null;
  status_code: number | null;
  user_id: string | null;
  request_id: string | null;
  ip_address: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  assigned_to: string | null;
  comment: string | null;
  metadata: any | null;
  created_at: string;
}

export interface MaintenanceEvent {
  id: string;
  is_active: boolean;
  maintenance_type: 'scheduled' | 'emergency';
  reason: string | null;
  custom_page_html: string | null;
  countdown_ends_at: string | null;
  allowed_ips: string[];
  allowed_role: string;
  created_by: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface BackupLog {
  id: string;
  backup_type: 'manual' | 'automatic' | 'scheduled';
  backup_mode: 'full' | 'incremental';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  file_name: string | null;
  file_size: number | null;
  file_path: string | null;
  compressed: boolean;
  encrypted: boolean;
  storage_location: 'local' | 'cloud' | 'both';
  database_version: string | null;
  checksum: string | null;
  retention_days: number;
  schedule_config: any | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface RestoreLog {
  id: string;
  backup_id: string | null;
  restore_type: 'full' | 'partial' | 'dry_run';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  database_version: string | null;
  affected_tables: string[];
  estimated_downtime: number;
  validation_passed: boolean | null;
  error_message: string | null;
  rollback_status: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  backup?: BackupLog;
}

export interface SecurityEvent {
  id: string;
  event_type: 'failed_login' | 'locked_account' | 'password_change' | 'suspicious_activity' | 'unknown_device' | 'api_abuse' | 'rate_limit_exceeded' | 'brute_force_detected' | 'session_expired' | 'mfa_reset' | 'impersonation' | 'force_logout' | 'permission_change' | 'role_change' | 'token_refresh' | 'password_reset';
  severity: 'info' | 'warning' | 'error' | 'critical';
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  country: string | null;
  device: string | null;
  session_id: string | null;
  details: any | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_id: string;
  ip_address: string | null;
  user_agent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  country: string | null;
  is_active: boolean;
  last_activity: string | null;
  logged_in_at: string;
  logged_out_at: string | null;
}

export interface SystemSetting {
  id: string;
  module: string;
  key: string;
  value: any;
  description: string | null;
  updated_at: string;
}

export interface BulkActionResult {
  success: number;
  failed: number;
  total: number;
  errors: string[];
}

export interface BulkActionConfig {
  label: string;
  value: string;
  icon?: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  destructive?: boolean;
}

export interface ModuleInfo {
  code: string;
  name: string;
  icon: string;
  description: string;
}

export const MODULES: ModuleInfo[] = [
  { code: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard', description: 'Admin dashboard' },
  { code: 'users', name: 'Users', icon: 'Users', description: 'User management' },
  { code: 'bookings', name: 'Bookings', icon: 'CalendarDays', description: 'Booking management' },
  { code: 'payments', name: 'Payments', icon: 'DollarSign', description: 'Payment management' },
  { code: 'reviews', name: 'Reviews', icon: 'MessageCircle', description: 'Review moderation' },
  { code: 'services', name: 'Services', icon: 'Wrench', description: 'Service management' },
  { code: 'staff', name: 'Staff', icon: 'UserCog', description: 'Staff management' },
  { code: 'projects', name: 'Projects', icon: 'ImageIcon', description: 'Project gallery' },
  { code: 'feedback', name: 'Feedback', icon: 'MessageSquare', description: 'Customer feedback' },
  { code: 'announcements', name: 'Announcements', icon: 'Bell', description: 'Announcement banners' },
  { code: 'reports', name: 'Reports', icon: 'FileText', description: 'Reports and exports' },
  { code: 'settings', name: 'Settings', icon: 'Settings', description: 'System settings' },
  { code: 'rbac', name: 'RBAC', icon: 'Shield', description: 'Roles and permissions' },
  { code: 'audit', name: 'Audit', icon: 'ClipboardList', description: 'Audit logs' },
  { code: 'backups', name: 'Backups', icon: 'HardDrive', description: 'Database backups' },
  { code: 'maintenance', name: 'Maintenance', icon: 'Wrench', description: 'Maintenance mode' },
  { code: 'security', name: 'Security', icon: 'ShieldAlert', description: 'Security center' },
  { code: 'notifications', name: 'Notifications', icon: 'Bell', description: 'Notifications' },
  { code: 'errors', name: 'Error Logs', icon: 'AlertTriangle', description: 'Error log center' },
  { code: 'system', name: 'System', icon: 'Server', description: 'System operations' },
];

export const AUDIT_ACTIONS = [
  'login', 'logout', 'failed_login', 'password_change',
  'booking_created', 'booking_updated', 'booking_deleted', 'booking_cancelled',
  'payment', 'refund',
  'role_changed', 'permission_changed',
  'backup_created', 'backup_deleted', 'backup_downloaded',
  'restore_performed',
  'maintenance_enabled', 'maintenance_disabled',
  'settings_updated',
  'user_created', 'user_updated', 'user_deleted', 'user_locked', 'user_unlocked',
  'user_suspended', 'user_unsuspended', 'user_impersonated', 'user_force_logout',
  'export_performed', 'import_performed',
  'error_resolved', 'error_assigned',
  'notification_sent',
  'security_event',
] as const;

export type AuditAction = typeof AUDIT_ACTIONS[number];
