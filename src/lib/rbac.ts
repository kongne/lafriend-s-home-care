import { supabase } from "@/integrations/supabase/client";

let permissionsCache: { userId: string; codes: Set<string>; timestamp: number } | null = null;
const CACHE_TTL = 30000;

export async function fetchUserPermissions(userId: string): Promise<Set<string>> {
  if (permissionsCache && permissionsCache.userId === userId && Date.now() - permissionsCache.timestamp < CACHE_TTL) {
    return permissionsCache.codes;
  }
  const { data, error } = await (supabase as any)
    .rpc('get_user_permissions', { _user_id: userId });
  if (error || !data) {
    console.error('Failed to fetch permissions:', error);
    return new Set();
  }
  const codes = new Set<string>(data.map((p: any) => p.code));
  permissionsCache = { userId, codes, timestamp: Date.now() };
  return codes;
}

export function invalidatePermissionsCache() {
  permissionsCache = null;
}

export async function checkPermission(userId: string, permissionCode: string): Promise<boolean> {
  const { data, error } = await (supabase as any)
    .rpc('has_permission', { _user_id: userId, _permission_code: permissionCode });
  if (error) return false;
  return !!data;
}

export async function checkAnyPermission(userId: string, permissionCodes: string[]): Promise<boolean> {
  const { data, error } = await (supabase as any)
    .rpc('has_any_permission', { _user_id: userId, _permission_codes: permissionCodes });
  if (error) return false;
  return !!data;
}
