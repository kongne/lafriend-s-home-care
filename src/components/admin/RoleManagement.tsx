import React, { useState } from 'react';
import { useRoles, usePermissionsList, useRolePermissions } from '@/hooks/useRBAC';
import { writeAuditLog } from '@/lib/audit';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Shield, Users, Check, X, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Role, Permission } from '@/types/enterprise';

function PermissionMatrix({ roleId, roleName }: { roleId: string; roleName: string }) {
  const { permissions, modules, getModulePermissions } = usePermissionsList();
  const { assignedIds, togglePermission } = useRolePermissions(roleId);
  const { user } = useAuth();
  const [saving, setSaving] = useState<string | null>(null);

  const handleToggle = async (permId: string, assign: boolean) => {
    setSaving(permId);
    try {
      await togglePermission(permId, assign);
      await writeAuditLog({
        action: assign ? 'permission_changed' : 'permission_changed',
        module: 'rbac',
        description: `${assign ? 'Granted' : 'Revoked'} permission to role '${roleName}'`,
        new_value: { role_id: roleId, permission_id: permId, assigned: assign },
        severity: 'info',
      }, user?.id);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      {modules.map(mod => {
        const modPerms = getModulePermissions(mod);
        return (
          <Card key={mod}>
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm capitalize">{mod}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {modPerms.map(p => {
                  const assigned = assignedIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleToggle(p.id, !assigned)}
                      disabled={saving === p.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        assigned
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted border-border text-muted-foreground hover:border-muted-foreground'
                      }`}
                    >
                      {saving === p.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : assigned ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function RoleManagement() {
  const { user } = useAuth();
  const { roles, loading, createRole, deleteRole } = useRoles();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      const role = await createRole(newName, newDesc);
      await writeAuditLog({ action: 'role_changed', module: 'rbac', description: `Created role '${newName}'`, new_value: { name: newName } }, user?.id);
      setCreateOpen(false);
      setNewName('');
      setNewDesc('');
      setSelectedRole(role as any);
    } catch (err: any) { console.error(err); }
  };

  const handleDelete = async (role: Role) => {
    if (role.is_system) return;
    try {
      await deleteRole(role.id);
      await writeAuditLog({ action: 'role_changed', module: 'rbac', description: `Deleted role '${role.name}'`, severity: 'warning' }, user?.id);
      if (selectedRole?.id === role.id) setSelectedRole(null);
    } catch (err: any) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Role Management</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Create Role</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Role</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Role Name</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. editor" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Role description" />
              </div>
              <Button onClick={handleCreate} disabled={!newName}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="py-3"><CardTitle className="text-sm">Roles</CardTitle></CardHeader>
          <CardContent className="p-2">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-1">
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      selectedRole?.id === r.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <Shield className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.description}</div>
                    </div>
                    {r.is_system && <Badge variant="outline" className="text-[10px]">System</Badge>}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {selectedRole ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">{selectedRole.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRole.description || 'No description'}</p>
                </div>
                {!selectedRole.is_system && (
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedRole)}>
                    Delete Role
                  </Button>
                )}
              </div>
              <PermissionMatrix roleId={selectedRole.id} roleName={selectedRole.name} />
            </>
          ) : (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Shield className="h-8 w-8 mr-3" />
              <span>Select a role to manage its permissions</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
