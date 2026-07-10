import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { fetchUserPermissions, checkPermission, invalidatePermissionsCache } from '@/lib/rbac';
import type { Role, Permission, AuditLog, ErrorLog, SecurityEvent, MaintenanceEvent, BackupLog, RestoreLog, UserSession } from '@/types/enterprise';

export function usePermission(permissionCode: string) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setHasPermission(false); setLoading(false); return; }
    let mounted = true;
    checkPermission(user.id, permissionCode).then(result => {
      if (mounted) setHasPermission(result);
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user?.id, permissionCode]);

  return { hasPermission, loading };
}

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPermissions(new Set()); setLoading(false); return; }
    let mounted = true;
    fetchUserPermissions(user.id).then(codes => {
      if (mounted) setPermissions(codes);
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user?.id]);

  const can = useCallback((code: string) => permissions.has(code), [permissions]);
  const canAny = useCallback((codes: string[]) => codes.some(c => permissions.has(c)), [permissions]);
  const refresh = useCallback(() => {
    invalidatePermissionsCache();
    if (!user) return;
    setLoading(true);
    fetchUserPermissions(user.id).then(codes => setPermissions(codes)).finally(() => setLoading(false));
  }, [user]);

  return { permissions, loading, can, canAny, refresh };
}

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');
    if (!error && data) setRoles(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createRole = async (name: string, description: string) => {
    const { data, error } = await (supabase as any).from('roles').insert({ name, description }).select().single();
    if (!error && data) { setRoles(p => [...p, data]); return data; }
    throw error;
  };

  const updateRole = async (id: string, updates: Partial<Role>) => {
    const { data, error } = await (supabase as any).from('roles').update(updates).eq('id', id).select().single();
    if (!error && data) { setRoles(p => p.map(r => r.id === id ? data : r)); return data; }
    throw error;
  };

  const deleteRole = async (id: string) => {
    const { error } = await (supabase as any).from('roles').delete().eq('id', id);
    if (!error) { setRoles(p => p.filter(r => r.id !== id)); }
    throw error;
  };

  return { roles, loading, refetch: fetch, createRole, updateRole, deleteRole };
}

export function usePermissionsList() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (supabase as any).from('permissions').select('*').order('module').order('code').then(({ data, error }) => {
      if (mounted && !error && data) {
        setPermissions(data);
        setModules([...new Set(data.map(p => p.module))]);
      }
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const getModulePermissions = (module: string) => permissions.filter(p => p.module === module);
  return { permissions, loading, modules, getModulePermissions };
}

export function useRolePermissions(roleId: string | null) {
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleId) { setAssignedIds(new Set()); setLoading(false); return; }
    let mounted = true;
    (supabase as any).from('role_permissions').select('permission_id').eq('role_id', roleId).then(({ data, error }) => {
      if (mounted && !error && data) {
        setAssignedIds(new Set(data.map(rp => rp.permission_id)));
      }
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [roleId]);

  const togglePermission = async (permissionId: string, assign: boolean) => {
    if (!roleId) return;
    if (assign) {
      await (supabase as any).from('role_permissions').insert({ role_id: roleId, permission_id: permissionId });
      setAssignedIds(p => new Set(p).add(permissionId));
    } else {
      await (supabase as any).from('role_permissions').delete()
        .eq('role_id', roleId).eq('permission_id', permissionId);
      setAssignedIds(p => { const n = new Set(p); n.delete(permissionId); return n; });
    }
  };

  return { assignedIds, loading, togglePermission };
}

export function useUserRoles(userId: string | null) {
  const [userRoles, setUserRoles] = useState<{ role_id: string; role_name: string; assigned_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setUserRoles([]); setLoading(false); return; }
    let mounted = true;
    supabase.rpc('get_user_roles_with_details', { _user_id: userId }).then(({ data, error }) => {
      if (mounted && !error && data) setUserRoles(data);
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [userId]);

  const assignRole = async (roleId: string) => {
    if (!userId) return;
    await (supabase as any).from('user_roles').upsert(
      { user_id: userId, role_id: roleId },
      { onConflict: 'user_id,role_id', ignoreDuplicates: false }
    );
    setUserRoles(p => [...p.filter(r => r.role_id !== roleId), { role_id: roleId, role_name: '', assigned_at: new Date().toISOString() }]);
  };

  const removeRole = async (roleId: string) => {
    if (!userId) return;
    await (supabase as any).from('user_roles').delete().eq('user_id', userId).eq('role_id', roleId);
    setUserRoles(p => p.filter(r => r.role_id !== roleId));
  };

  return { userRoles, loading, assignRole, removeRole };
}

export function useAuditLogs(filters?: { module?: string; action?: string; severity?: string; userId?: string; limit?: number }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    let query = (supabase as any).from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(filters?.limit ?? 50);
    if (filters?.module) query = query.eq('module', filters.module);
    if (filters?.action) query = query.eq('action', filters.action);
    if (filters?.severity) query = query.eq('severity', filters.severity);
    if (filters?.userId) query = query.eq('user_id', filters.userId);
    query.then(({ data, error, count }) => {
      if (mounted && !error && data) { setLogs(data); setTotal(count ?? data.length); }
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [filters?.module, filters?.action, filters?.severity, filters?.userId, filters?.limit]);

  return { logs, loading, total };
}

export function useErrorLogs(filters?: { resolved?: boolean; type?: string; severity?: string; limit?: number }) {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    let query = (supabase as any).from('error_logs').select('*').order('created_at', { ascending: false }).limit(filters?.limit ?? 50);
    if (filters?.resolved !== undefined) query = query.eq('resolved', filters.resolved);
    if (filters?.type) query = query.eq('error_type', filters.type);
    if (filters?.severity) query = query.eq('severity', filters.severity);
    query.then(({ data, error }) => {
      if (mounted && !error && data) setLogs(data);
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [filters?.resolved, filters?.type, filters?.severity, filters?.limit]);

  return { logs, loading };
}

export function useSecurityEvents(filters?: { resolved?: boolean; type?: string; severity?: string; limit?: number }) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    let query = (supabase as any).from('security_events').select('*').order('created_at', { ascending: false }).limit(filters?.limit ?? 50);
    if (filters?.resolved !== undefined) query = query.eq('resolved', filters.resolved);
    if (filters?.type) query = query.eq('event_type', filters.type);
    if (filters?.severity) query = query.eq('severity', filters.severity);
    query.then(({ data, error }) => {
      if (mounted && !error && data) setEvents(data);
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [filters?.resolved, filters?.type, filters?.severity, filters?.limit]);

  return { events, loading };
}

export function useMaintenanceMode() {
  const [event, setEvent] = useState<MaintenanceEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (supabase as any).from('maintenance_events').select('*').order('created_at', { ascending: false }).limit(1).then(({ data, error }) => {
      if (mounted && !error && data && data.length > 0) setEvent(data[0]);
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const enable = async (reason: string, type: 'scheduled' | 'emergency' = 'scheduled') => {
    const { data, error } = await (supabase as any).from('maintenance_events').insert({
      is_active: true, reason, maintenance_type: type,
    }).select().single();
    if (!error && data) setEvent(data);
    return { data, error };
  };

  const disable = async () => {
    if (!event) return;
    const { error } = await (supabase as any).from('maintenance_events').update({
      is_active: false, ended_at: new Date().toISOString(),
    }).eq('id', event.id);
    if (!error) setEvent(null);
    return { error };
  };

  return { event, loading, enable, disable };
}

export function useBackupLogs(limit = 20) {
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from('backup_logs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (!error && data) setLogs(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [limit]);

  return { logs, loading, refetch: fetch };
}

export function useRestoreLogs(limit = 20) {
  const [logs, setLogs] = useState<RestoreLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (supabase as any).from('restore_logs').select('*, backup:backup_id(*)').order('created_at', { ascending: false }).limit(limit).then(({ data, error }) => {
      if (!error && data) setLogs(data);
    }).finally(() => setLoading(false));
  }, [limit]);

  return { logs, loading };
}

export function useUserSessions(userId: string | null) {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setSessions([]); setLoading(false); return; }
    let mounted = true;
    (supabase as any).from('user_sessions').select('*').eq('user_id', userId).order('logged_in_at', { ascending: false }).then(({ data, error }) => {
      if (mounted && !error && data) setSessions(data);
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [userId]);

  const forceLogout = async (sessionId: string) => {
    await (supabase as any).from('user_sessions').update({ is_active: false, logged_out_at: new Date().toISOString() }).eq('id', sessionId);
    setSessions(p => p.map(s => s.id === sessionId ? { ...s, is_active: false, logged_out_at: new Date().toISOString() } : s));
  };

  return { sessions, loading, forceLogout };
}

export function useSystemSettings(module?: string) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    let query = (supabase as any).from('system_settings').select('*');
    if (module) query = query.eq('module', module);
    const { data, error } = await query;
    if (!error && data) {
      const map: Record<string, any> = {};
      data.forEach(s => { map[s.key] = s.value; });
      setSettings(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [module]);

  const updateSetting = async (key: string, value: any) => {
    await (supabase as any).from('system_settings').upsert(
      { module: module ?? 'general', key, value: JSON.parse(JSON.stringify(value)) },
      { onConflict: 'module,key' }
    );
    setSettings(p => ({ ...p, [key]: value }));
  };

  const getSetting = (key: string, defaultValue?: any) => settings[key] ?? defaultValue;

  return { settings, loading, refetch: fetch, updateSetting, getSetting };
}
