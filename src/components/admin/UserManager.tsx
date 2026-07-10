import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoles, useUserRoles } from '@/hooks/useRBAC';
import { writeAuditLog } from '@/lib/audit';
import { Search, Filter, Users, UserCheck, UserX, Lock, Unlock, RotateCcw, Shield, Key, Activity, LogOut, Eye, Loader2, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export function UserManager() {
  const { user } = useAuth();
  const { roles } = useRoles();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [bulkAction, setBulkAction] = useState('');
  const pageSize = 20;

  const fetchProfiles = async () => {
    setLoading(true);
    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && profilesData) {
      const enriched = await Promise.all(
        profilesData.map(async (p: any) => {
          const { data: email } = await supabase.rpc("admin_get_user_email", { _user_id: p.user_id });
          return {
            ...p,
            email: email || 'unknown',
            last_sign_in: null,
          } as UserProfile;
        })
      );
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

  const handleBulkAction = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length || !bulkAction) return;
    for (const uid of ids) {
      try {
        if (bulkAction === 'lock') {
          await supabase.rpc("admin_toggle_user_ban", { _user_id: uid, _lock: true });
        } else if (bulkAction === 'unlock') {
          await supabase.rpc("admin_toggle_user_ban", { _user_id: uid, _lock: false });
        }
      } catch (err) { console.error(err); }
    }
    await writeAuditLog({ action: `user_bulk_${bulkAction}`, module: 'users', description: `Bulk ${bulkAction} on ${ids.length} users`, new_value: { ids, action: bulkAction } }, user?.id);
    setSelectedIds(new Set());
    fetchProfiles();
  };

  const handleLockToggle = async (uid: string, lock: boolean) => {
    await supabase.rpc("admin_toggle_user_ban", { _user_id: uid, _lock: lock });
    await writeAuditLog({ action: lock ? 'user_locked' : 'user_unlocked', module: 'users', description: `${lock ? 'Locked' : 'Unlocked'} user ${uid.slice(0, 8)}` }, user?.id);
    fetchProfiles();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Badge variant="outline">{profiles.length} users</Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Bulk action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lock">Lock Accounts</SelectItem>
                <SelectItem value="unlock">Unlock Accounts</SelectItem>
                <SelectItem value="email">Send Email</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleBulkAction} disabled={!bulkAction}>Apply</Button>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedUser(p)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleLockToggle(p.user_id, true)}>
                        <Lock className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleLockToggle(p.user_id, false)}>
                        <Unlock className="h-3.5 w-3.5" />
                      </Button>
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

      <UserDetailDialog user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
}

function UserDetailDialog({ user: userProfile, onClose }: { user: UserProfile | null; onClose: () => void }) {
  const { roles } = useRoles();
  const { userRoles, assignRole, removeRole } = useUserRoles(userProfile?.user_id || null);
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!userProfile) return;
    (supabase as any).from('user_sessions').select('*').eq('user_id', userProfile.user_id).order('logged_in_at', { ascending: false }).limit(5).then(({ data }) => {
      if (data) setSessions(data);
    });
  }, [userProfile]);

  const handleAssignRole = async (roleId: string) => {
    await assignRole(roleId);
    await writeAuditLog({ action: 'role_changed', module: 'rbac', description: `Assigned role to user ${userProfile?.user_id?.slice(0, 8)}`, new_value: { user_id: userProfile?.user_id, role_id: roleId } }, user?.id);
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
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details"><UserCheck className="h-4 w-4 mr-2" />Details</TabsTrigger>
            <TabsTrigger value="roles"><Shield className="h-4 w-4 mr-2" />Roles</TabsTrigger>
            <TabsTrigger value="sessions"><Activity className="h-4 w-4 mr-2" />Sessions</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">User ID:</span> {userProfile.user_id}</div>
              <div><span className="text-muted-foreground">Email:</span> {userProfile.email}</div>
              <div><span className="text-muted-foreground">Phone:</span> {userProfile.phone || '-'}</div>
              <div><span className="text-muted-foreground">Joined:</span> {format(new Date(userProfile.created_at), 'PP')}</div>
              <div><span className="text-muted-foreground">Verified:</span> {userProfile.is_verified ? 'Yes' : 'No'}</div>
              <div><span className="text-muted-foreground">Last Login:</span> {userProfile.last_sign_in ? format(new Date(userProfile.last_sign_in), 'PPp') : 'Never'}</div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-2" />Send Email</Button>
              <Button variant="outline" size="sm"><Key className="h-4 w-4 mr-2" />Reset Password</Button>
              <Button variant="outline" size="sm"><RotateCcw className="h-4 w-4 mr-2" />Reset MFA</Button>
              <Button variant="outline" size="sm" className="text-destructive"><LogOut className="h-4 w-4 mr-2" />Force Logout</Button>
            </div>
          </TabsContent>
          <TabsContent value="roles" className="pt-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {userRoles.map(ur => (
                  <Badge key={ur.role_id} variant="secondary" className="flex items-center gap-2">
                    {ur.role_name}
                    <button onClick={() => removeRole(ur.role_id)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <Select onValueChange={handleAssignRole}>
                <SelectTrigger><SelectValue placeholder="Assign a role..." /></SelectTrigger>
                <SelectContent>
                  {roles.filter(r => !userRoles.find(ur => ur.role_id === r.id)).map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          <TabsContent value="sessions" className="pt-4">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active sessions</p>
            ) : (
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
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
