import { supabase } from "@/integrations/supabase/client";

type AuditPayload = {
  action: string;
  module: string;
  description?: string;
  old_value?: any;
  new_value?: any;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  status?: 'success' | 'failure' | 'pending';
  target_id?: string;
  target_type?: string;
  duration_ms?: number;
};

let requestCounter = 0;
function generateRequestId(): string {
  return `req_${Date.now()}_${++requestCounter}`;
}

function getBrowser(): string {
  if (typeof navigator === 'undefined') return 'server';
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getOS(): string {
  if (typeof navigator === 'undefined') return 'server';
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
}

function getDevice(): string {
  if (typeof navigator === 'undefined') return 'server';
  const ua = navigator.userAgent;
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) return 'Mobile';
  if (/Tablet|iPad/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

export async function writeAuditLog(
  payload: AuditPayload,
  userId?: string | null,
  userRole?: string | null,
): Promise<string | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userId ?? userData?.user?.id;
    if (!uid) return null;

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role, roles!inner(name)')
      .eq('user_id', uid)
      .limit(1);

    const roleName = userRole ??
      (roles?.[0] as any)?.roles?.name ??
      (roles?.[0] as any)?.role ??
      null;

    const { data, error } = await (supabase as any)
      .from('audit_logs')
      .insert({
        user_id: uid,
        user_role: roleName,
        action: payload.action,
        module: payload.module,
        description: payload.description ?? null,
        old_value: payload.old_value ? JSON.parse(JSON.stringify(payload.old_value)) : null,
        new_value: payload.new_value ? JSON.parse(JSON.stringify(payload.new_value)) : null,
        ip_address: null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        browser: getBrowser(),
        os: getOS(),
        device: getDevice(),
        session_id: null,
        request_id: generateRequestId(),
        severity: payload.severity ?? 'info',
        status: payload.status ?? 'success',
        target_id: payload.target_id ?? null,
        target_type: payload.target_type ?? null,
        duration_ms: payload.duration_ms ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Audit log write failed:', error);
      return null;
    }
    return data.id;
  } catch (err) {
    console.error('Audit log error:', err);
    return null;
  }
}
