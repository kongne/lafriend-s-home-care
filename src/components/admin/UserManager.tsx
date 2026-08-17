import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoles, useUserRoles, usePermissions } from '@/hooks/useRBAC';
import { writeAuditLog } from '@/lib/audit';
import { useToast } from '@/hooks/use-toast';
import { Users, UserCheck, UserX, Lock, Unlock, Shield, Key, Activity, LogOut, Eye, Loader2, ChevronLeft, ChevronRight, X as XIcon, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email?: string;
  phone: string | null;
  is_verified: boolean;
  created_at: string;
  last_sign_in?: string;
  is_locked?: boolean;
  is_suspended?: boolean;
}

interface ConfirmState {
  type: 'lock' | 'unlock' | 'bulkLock' | 'bulkUnlock' | 'resetPassword' | 'forceLogout' | 'removeRole';
  userId?: string;
  userName?: string;
  lock?: boolean;
  roleId?: string;
  roleName?: string;
  count?: number;
}

export function UserManager() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [bulkAction, setBulkAction] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [acting, setActing] = useState(false);
  const pageSize = 20;

  const canEdit = can('users.edit');

  const fetchProfiles = async () => {
    setLoading(true);
    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && profilesData) {
      const userIds = profilesData.map((p: any) => p.user_id);
      const emailMap = new Map<string, string>();
      const batchSize = 10;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (uid: string) => {
            const { data } = await supabase.rpc("admin_get_user_email", { _user_id: uid });
            return { uid, email: data || 'unknown' };
          })
        );
        results.forEach(r => {
          if (r.status === 'fulfilled') emailMap.set(r.value.uid, r.value.email);
        });
      }
      const enriched = profilesData.map((p: any) => ({
        ...p,
        email: emailMap.get(p.user_id) || 'unknown',
        last_sign_in: null,
      })) as UserProfile[];
      setProfiles(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'verified' && p.is_verified) ||
      (statusFilter === 'unverified' && !p.is_verified);
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const toggleSelect = (id: string) => {
    setSelectedIds(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const selectAll = () => {
    if (selectedIds.size === paginated.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map(p => p.user_id)));
  };

  const handleBulkApply = () => {
    if (!canEdit) {
      toast({ title: "Accès refusé", description: "Permission requise: users.edit", variant: "destructive" });
      return;
    }
    if (!bulkAction || selectedIds.size === 0) return;
    setConfirm({
      type: bulkAction === 'lock' ? 'bulkLock' : 'bulkUnlock',
      count: selectedIds.size,
    });
  };

  const executeBulkAction = async () => {
    if (!confirm || !confirm.type.startsWith('bulk')) return;
    const lock = confirm.type === 'bulkLock';
    const ids = Array.from(selectedIds);
    setActing(true);
    let success = 0;
    let failed = 0;
    for (const uid of ids) {
      try {
        const { error } = await supabase.rpc("admin_toggle_user_ban", { _user_id: uid, _lock: lock });
        if (error) throw error;
        success++;
      } catch {
        failed++;
      }
    }
    await writeAuditLog({ action: `user_bulk_${lock ? 'lock' : 'unlock'}`, module: 'users', description: `Bulk ${lock ? 'lock' : 'unlock'}: ${success} ok, ${failed} failed`, new_value: { ids, action: lock ? 'lock' : 'unlock', success, failed } }, user?.id);
    setSelectedIds(new Set());
    setBulkAction('');
    fetchProfiles();
    toast({
      title: failed === 0 ? "Action effectuée" : "Action partielle",
      description: failed === 0
        ? `${lock ? 'Verrouillage' : 'Déverrouillage'} appliqué à ${success} utilisateur(s).`
        : `${success} réussi(s), ${failed} échoué(s).`,
      variant: failed > 0 ? "destructive" : "default",
    });
    setConfirm(null);
    setActing(false);
  };

  const handleLockToggle = (uid: string, lock: boolean) => {
    if (!canEdit) {
      toast({ title: "Accès refusé", description: "Permission requise: users.edit", variant: "destructive" });
      return;
    }
    const target = profiles.find(p => p.user_id === uid);
    setConfirm({ type: lock ? 'lock' : 'unlock', userId: uid, userName: target?.full_name || uid.slice(0, 8), lock });
  };

  const executeLockToggle = async () => {
    if (!confirm || !confirm.userId || confirm.type !== 'lock' && confirm.type !== 'unlock') return;
    setActing(true);
    try {
      const { error } = await supabase.rpc("admin_toggle_user_ban", { _user_id: confirm.userId, _lock: confirm.lock });
      if (error) throw error;
      await writeAuditLog({ action: confirm.lock ? 'user_locked' : 'user_unlocked', module: 'users', description: `${confirm.lock ? 'Locked' : 'Unlocked'} user ${confirm.userName}` }, user?.id);
      fetchProfiles();
      toast({ title: confirm.lock ? "Utilisateur verrouillé" : "Utilisateur déverrouillé", description: `${confirm.userName} a été ${confirm.lock ? 'verrouillé' : 'déverrouillé'}.` });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Action échouée.", variant: "destructive" });
    } finally {
      setActing(false);
      setConfirm(null);
    }
  };

  const getConfirmTitle = () => {
    if (!confirm) return '';
    switch (confirm.type) {
      case 'lock': return 'Verrouiller le compte';
      case 'unlock': return 'Déverrouiller le compte';
      case 'bulkLock': return `Verrouiller ${confirm.count} compte(s)`;
      case 'bulkUnlock': return `Déverrouiller ${confirm.count} compte(s)`;
      case 'resetPassword': return 'Réinitialiser le mot de passe';
      case 'forceLogout': return 'Forcer la déconnexion';
      case 'removeRole': return 'Retirer le rôle';
      default: return 'Confirmer';
    }
  };

  const getConfirmDescription = () => {
    if (!confirm) return '';
    switch (confirm.type) {
      case 'lock': return `Êtes-vous sûr de vouloir verrouiller le compte de ${confirm.userName} ? L'utilisateur ne pourra plus se connecter.`;
      case 'unlock': return `Êtes-vous sûr de vouloir déverrouiller le compte de ${confirm.userName} ?`;
      case 'bulkLock': return `Verrouiller ${confirm.count} compte(s) sélectionné(s) ? Les utilisateurs ne pourront plus se connecter.`;
      case 'bulkUnlock': return `Déverrouiller ${confirm.count} compte(s) sélectionné(s) ?`;
      case 'resetPassword': return `Envoyer un email de réinitialisation du mot de passe à ${confirm.userName} ?`;
      case 'forceLogout': return `Forcer la déconnexion de ${confirm.userName} ? Toutes ses sessions actives seront terminées.`;
      case 'removeRole': return `Retirer le rôle « ${confirm.roleName} » de ${confirm.userName} ?`;
      default: return '';
    }
  };

  const executeConfirm = async () => {
    if (!confirm) return;
    switch (confirm.type) {
      case 'lock':
      case 'unlock':
        await executeLockToggle();
        break;
      case 'bulkLock':
      case 'bulkUnlock':
        await executeBulkAction();
        break;
      case 'resetPassword':
        await executeResetPassword();
        break;
      case 'forceLogout':
        await executeForceLogout();
        break;
      case 'removeRole':
        await executeRemoveRole();
        break;
    }
  };

  const executeResetPassword = async () => {
    if (!confirm?.userId || !selectedUser) return;
    setActing(true);
    try {
      if (!selectedUser.email || selectedUser.email === 'unknown') {
        throw new Error("Email inconnu — impossible d'envoyer la réinitialisation.");
      }
      const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      await writeAuditLog({ action: 'password_reset_sent', module: 'users', description: `Password reset sent to ${selectedUser.email}`, severity: 'info' }, user?.id);
      toast({ title: "Email envoyé", description: `Un lien de réinitialisation a été envoyé à ${selectedUser.email}.` });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Échec de l'envoi.", variant: "destructive" });
    } finally {
      setActing(false);
      setConfirm(null);
    }
  };

  const executeForceLogout = async () => {
    if (!confirm?.userId || !selectedUser) return;
    setActing(true);
    try {
      const { data, error } = await supabase.rpc('admin_revoke_user_sessions', { _user_id: selectedUser.user_id });
      if (error) throw error;
      await writeAuditLog({ action: 'user_force_logout', module: 'users', description: `Force logout on ${selectedUser.full_name || selectedUser.user_id.slice(0, 8)}`, severity: 'warning' }, user?.id);
      toast({ title: "Déconnexion forcée", description: `${data || 0} session(s) active(s) terminée(s).` });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Échec de la déconnexion forcée.", variant: "destructive" });
    } finally {
      setActing(false);
      setConfirm(null);
    }
  };

  const executeRemoveRole = async () => {
    if (!confirm?.userId || !confirm?.roleId) return;
    setActing(true);
    try {
      const { error } = await supabase.from('user_roles').delete()
        .eq('user_id', confirm.userId).eq('role_id', confirm.roleId);
      if (error) throw error;
      await writeAuditLog({ action: 'role_changed', module: 'rbac', description: `Removed role '${confirm.roleName}' from user ${confirm.userId.slice(0, 8)}`, severity: 'warning' }, user?.id);
      toast({ title: "Rôle retiré", description: `Le rôle « ${confirm.roleName} » a été retiré.` });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Échec du retrait.", variant: "destructive" });
    } finally {
      setActing(false);
      setConfirm(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Badge variant="outline">{profiles.length} users</Badge>
      </div>

      {!canEdit && (
        <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm text-muted-foreground">
          Mode lecture seule — la modification des utilisateurs requiert la permission <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">users.edit</code>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && canEdit && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Bulk action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lock">Lock Accounts</SelectItem>
                <SelectItem value="unlock">Unlock Accounts</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleBulkApply} disabled={!bulkAction}>Apply</Button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="p-3 text-left w-8">
                  <input type="checkbox" checked={selectedIds.size === paginated.length && paginated.length > 0} onChange={selectAll} className="accent-primary" />
                </th>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left hidden md:table-cell">Email</th>
                <th className="p-3 text-left hidden lg:table-cell">Phone</th>
                <th className="p-3 text-left hidden md:table-cell">Status</th>
                <th className="p-3 text-left hidden lg:table-cell">Joined</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(p => (
                <tr key={p.user_id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3">
                    <input type="checkbox" checked={selectedIds.has(p.user_id)} onChange={() => toggleSelect(p.user_id)} className="accent-primary" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{(p.full_name || '?').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{p.full_name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground font-mono">{p.user_id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm hidden md:table-cell">{p.email}</td>
                  <td className="p-3 text-sm hidden lg:table-cell">{p.phone || '-'}</td>
                  <td className="p-3 hidden md:table-cell">
                    <Badge variant={p.is_verified ? 'default' : 'secondary'} className="text-[10px]">
                      {p.is_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">
                    {format(new Date(p.created_at), 'PP')}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedUser(p)} title="View details">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleLockToggle(p.user_id, true)} title="Lock account">
                            <Lock className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleLockToggle(p.user_id, false)} title="Unlock account">
                            <Unlock className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(totalPages > 1) && (
            <div className="flex items-center justify-between p-3 border-t">
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDetailDialog
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        canEdit={canEdit}
        onConfirm={(c) => setConfirm(c)}
      />

      {/* Global confirmation dialog */}
      <Dialog open={!!confirm} onOpenChange={() => !acting && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {getConfirmTitle()}
            </DialogTitle>
            <DialogDescription>{getConfirmDescription()}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)} disabled={acting}>Annuler</Button>
            <Button variant="destructive" onClick={executeConfirm} disabled={acting}>
              {acting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserDetailDialog({
  user: userProfile,
  onClose,
  canEdit,
  onConfirm,
}: {
  user: UserProfile | null;
  onClose: () => void;
  canEdit: boolean;
  onConfirm: (state: ConfirmState) => void;
}) {
  const { roles } = useRoles();
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<{ role_id: string; role_name: string; assigned_at: string }[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const fetchUserRoles = async (userId: string) => {
    setRolesLoading(true);
    const { data, error } = await (supabase as any).rpc('get_user_roles_with_details', { _user_id: userId });
    if (!error && data) setUserRoles(data);
    setRolesLoading(false);
  };

  useEffect(() => {
    if (!userProfile) { setUserRoles([]); return; }
    fetchUserRoles(userProfile.user_id);
  }, [userProfile?.user_id]);

  const handleAssignRole = async (roleId: string) => {
    if (!canEdit || !userProfile) return;
    try {
      const { error } = await (supabase as any).from('user_roles').upsert(
        { user_id: userProfile.user_id, role_id: roleId },
        { onConflict: 'user_id,role_id', ignoreDuplicates: false }
      );
      if (error) throw error;
      await writeAuditLog({ action: 'role_changed', module: 'rbac', description: `Assigned role to user ${userProfile.user_id.slice(0, 8)}`, new_value: { user_id: userProfile.user_id, role_id: roleId } }, user?.id);
      await fetchUserRoles(userProfile.user_id);
      toast({ title: "Rôle assigné", description: "Le rôle a été assigné avec succès." });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Échec de l'assignation.", variant: "destructive" });
    }
  };

  if (!userProfile) return null;

  return (
    <Dialog open={!!userProfile} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{(userProfile.full_name || '?').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            {userProfile.full_name || 'Unknown'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">User ID:</span> <span className="font-mono text-xs">{userProfile.user_id}</span></div>
            <div><span className="text-muted-foreground">Email:</span> {userProfile.email}</div>
            <div><span className="text-muted-foreground">Phone:</span> {userProfile.phone || '-'}</div>
            <div><span className="text-muted-foreground">Joined:</span> {format(new Date(userProfile.created_at), 'PP')}</div>
            <div><span className="text-muted-foreground">Verified:</span> {userProfile.is_verified ? 'Yes' : 'No'}</div>
            <div><span className="text-muted-foreground">Last Login:</span> {userProfile.last_sign_in ? format(new Date(userProfile.last_sign_in), 'PPp') : 'Never'}</div>
          </div>

          {canEdit && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => onConfirm({ type: 'resetPassword', userId: userProfile.user_id, userName: userProfile.full_name || userProfile.user_id.slice(0, 8) })}>
                <Key className="h-4 w-4 mr-2" />Reset Password
              </Button>
              <Button variant="outline" size="sm" onClick={() => onConfirm({ type: 'forceLogout', userId: userProfile.user_id, userName: userProfile.full_name || userProfile.user_id.slice(0, 8) })} className="text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />Force Logout
              </Button>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Roles</h4>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {rolesLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : userRoles.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                ) : (
                  userRoles.map(ur => (
                    <Badge key={ur.role_id} variant="secondary" className="flex items-center gap-2">
                      {ur.role_name || ur.role_id.slice(0, 8)}
                      {canEdit && (
                        <button
                          onClick={() => onConfirm({
                            type: 'removeRole',
                            userId: userProfile.user_id,
                            userName: userProfile.full_name || userProfile.user_id.slice(0, 8),
                            roleId: ur.role_id,
                            roleName: ur.role_name || ur.role_id.slice(0, 8),
                          })}
                          className="hover:text-destructive transition-colors"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))
                )}
              </div>
              {canEdit && (
                <Select onValueChange={handleAssignRole}>
                  <SelectTrigger><SelectValue placeholder="Assign a role..." /></SelectTrigger>
                  <SelectContent>
                    {roles.filter(r => !userRoles.find(ur => ur.role_id === r.id)).map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Sessions</h4>
            <UserSessions userId={userProfile.user_id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UserSessions({ userId }: { userId: string }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (supabase as any).from('user_sessions').select('*').eq('user_id', userId).order('logged_in_at', { ascending: false }).limit(5).then(({ data }) => {
      if (data) setSessions(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;

  if (sessions.length === 0) return <p className="text-sm text-muted-foreground">No active sessions</p>;

  return (
    <div className="space-y-2">
      {sessions.map(s => (
        <div key={s.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className={s.is_active ? 'text-green-500' : 'text-muted-foreground'}>
                {s.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
              </span>
              <span>{s.browser || 'Unknown'} on {s.os || 'Unknown'}</span>
            </div>
            <div className="text-xs text-muted-foreground">{s.ip_address || 'N/A'} · {format(new Date(s.logged_in_at), 'PPp')}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
