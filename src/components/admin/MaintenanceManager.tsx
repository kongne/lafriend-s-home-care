import React, { useState } from 'react';
import { useMaintenanceMode } from '@/hooks/useRBAC';
import { useAuth } from '@/hooks/useAuth';
import { writeAuditLog } from '@/lib/audit';
import { Wrench, AlertTriangle, Play, StopCircle, Clock, History, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export function MaintenanceManager() {
  const { user } = useAuth();
  const { event, loading, enable, disable } = useMaintenanceMode();
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'scheduled' | 'emergency'>('scheduled');
  const [saving, setSaving] = useState(false);

  const handleEnable = async () => {
    if (!reason) return;
    setSaving(true);
    try {
      await enable(reason, type);
      await writeAuditLog({
        action: 'maintenance_enabled', module: 'maintenance',
        description: `Maintenance mode enabled: ${reason}`,
        new_value: { reason, type }, severity: 'warning',
      }, user?.id);
      setReason('');
    } finally { setSaving(false); }
  };

  const handleDisable = async () => {
    setSaving(true);
    try {
      await disable();
      await writeAuditLog({
        action: 'maintenance_disabled', module: 'maintenance',
        description: 'Maintenance mode disabled',
        severity: 'info',
      }, user?.id);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Maintenance Management</h2>
        <Badge variant={event?.is_active ? 'destructive' : 'secondary'}>
          {event?.is_active ? 'Maintenance Active' : 'System Operational'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="py-3"><CardTitle className="text-sm">Maintenance Controls</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {event?.is_active ? (
              <div className="space-y-3">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Maintenance Mode is Active</span>
                  </div>
                  <p className="text-sm text-yellow-700">Reason: {event.reason}</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Started: {event.started_at ? format(new Date(event.started_at), 'PPp') : 'N/A'}
                  </p>
                </div>
                <Button variant="outline" onClick={handleDisable} disabled={saving}>
                  <StopCircle className="h-4 w-4 mr-2" />Disable Maintenance Mode
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Maintenance Type</label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled"><Clock className="h-4 w-4 mr-2" />Scheduled</SelectItem>
                      <SelectItem value="emergency"><AlertTriangle className="h-4 w-4 mr-2" />Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Reason</label>
                  <Textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Describe the reason for maintenance..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleEnable} disabled={!reason || saving}>
                  <Play className="h-4 w-4 mr-2" />Enable Maintenance Mode
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm">Custom Maintenance Page</label>
              <Switch />
            </div>
            <div>
              <label className="text-sm font-medium">Allowed IPs</label>
              <Input placeholder="e.g. 192.168.1.1, 10.0.0.1" className="mt-1 text-xs" />
            </div>
            <div>
              <label className="text-sm font-medium">Allowed Role</label>
              <Select defaultValue="super_admin">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
