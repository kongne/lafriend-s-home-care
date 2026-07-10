import React, { useState } from 'react';
import { useAuditLogs } from '@/hooks/useRBAC';
import { Search, Filter, Download, Eye, ChevronDown, ChevronUp, AlertTriangle, Info, AlertCircle, Activity, UserCheck, CalendarDays, DollarSign, MessageCircle, HardDrive, RefreshCw, Wrench, Settings, Shield, Bell, Star, Clock, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { format, isToday, isYesterday, startOfWeek, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AuditLog } from '@/types/enterprise';

const severityConfig: Record<string, { color: string; icon: any }> = {
  info: { color: 'bg-blue-100 text-blue-800', icon: Info },
  warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  error: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
  critical: { color: 'bg-red-200 text-red-900', icon: AlertCircle },
};

const actionIcons: Record<string, any> = {
  login: UserCheck, logout: UserCheck, failed_login: AlertTriangle,
  booking_created: CalendarDays, booking_updated: CalendarDays, booking_deleted: CalendarDays, booking_cancelled: CalendarDays,
  payment: DollarSign, refund: DollarSign,
  review: MessageCircle,
  backup_created: HardDrive, backup_deleted: HardDrive,
  restore_performed: RefreshCw,
  maintenance_enabled: Wrench, maintenance_disabled: Wrench,
  settings_updated: Settings,
  role_changed: Shield, permission_changed: Shield,
  user_created: UserCheck,
  security_event: Shield,
  notification_sent: Bell,
};

function getGroup(date: Date): string {
  if (isToday(date)) return 'today';
  if (isYesterday(date)) return 'yesterday';
  if (date > startOfWeek(new Date())) return 'week';
  if (date > startOfMonth(new Date())) return 'month';
  return 'older';
}

const groupLabels: Record<string, string> = {
  today: "Today's Activity", yesterday: 'Yesterday', week: 'This Week', month: 'This Month', older: 'Older',
};

function Lock(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function Unlock(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>; }

const allActionIcons: Record<string, any> = { ...actionIcons, user_locked: Lock, user_unlocked: Unlock };

export function ActivityAuditViewer() {
  const [view, setView] = useState<'table' | 'timeline'>('table');
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 50;

  const { logs, loading, total } = useAuditLogs({
    module: module !== 'all' ? module : undefined,
    severity: severity !== 'all' ? severity : undefined,
    limit: limit * page,
  });

  const filtered = logs.filter(l =>
    !search || l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.description?.toLowerCase().includes(search.toLowerCase()) ||
    l.module?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Action', 'Module', 'User', 'Severity', 'Status', 'Description'].join(','),
      ...logs.map(l => [
        l.created_at, l.action, l.module, l.user_id || '', l.severity, l.status,
        `"${(l.description || '').replace(/"/g, '""')}"`,
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const grouped: Record<string, AuditLog[]> = {};
  filtered.forEach(log => {
    const group = getGroup(new Date(log.created_at));
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(log);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold">Audit Logs & Activity</h2>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as typeof view)}>
            <ToggleGroupItem value="table" aria-label="Table view"><List className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="timeline" aria-label="Timeline view"><Clock className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={module} onValueChange={setModule}>
          <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {['dashboard', 'users', 'bookings', 'payments', 'reviews', 'services', 'staff', 'feedback', 'rbac', 'audit', 'backups', 'security', 'settings', 'notifications', 'system'].map(m => (
              <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="px-3 py-1.5">{total} total logs</Badge>
      </div>

      {view === 'table' ? (
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm font-medium text-muted-foreground">{filtered.length} entries</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No audit logs found</div>
              ) : (
                filtered.map(log => {
                  const SevIcon = severityConfig[log.severity]?.icon || Info;
                  const isExpanded = expandedId === log.id;
                  return (
                    <div key={log.id} className="hover:bg-muted/50 transition-colors">
                      <button onClick={() => setExpandedId(isExpanded ? null : log.id)} className="w-full flex items-center gap-3 p-3 text-left">
                        <SevIcon className={`h-4 w-4 shrink-0 ${severityConfig[log.severity]?.color?.split(' ')[1] || ''}`} />
                        <Badge variant="outline" className="shrink-0 text-xs font-mono">{log.action}</Badge>
                        <span className="flex-1 text-sm truncate">{log.description || log.module}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{format(new Date(log.created_at), 'PPp', { locale: fr })}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div><span className="text-muted-foreground">Module:</span> {log.module}</div>
                          <div><span className="text-muted-foreground">Severity:</span> {log.severity}</div>
                          <div><span className="text-muted-foreground">Status:</span> {log.status}</div>
                          <div><span className="text-muted-foreground">User ID:</span> {log.user_id?.slice(0, 8) || 'N/A'}</div>
                          <div><span className="text-muted-foreground">Browser:</span> {log.browser || 'N/A'}</div>
                          <div><span className="text-muted-foreground">OS:</span> {log.os || 'N/A'}</div>
                          <div><span className="text-muted-foreground">Device:</span> {log.device || 'N/A'}</div>
                          <div><span className="text-muted-foreground">Duration:</span> {log.duration_ms ? `${log.duration_ms}ms` : 'N/A'}</div>
                          {log.old_value && <div className="col-span-2"><span className="text-muted-foreground">Old Value:</span><pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-20">{JSON.stringify(log.old_value, null, 2)}</pre></div>}
                          {log.new_value && <div className="col-span-2"><span className="text-muted-foreground">New Value:</span><pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-20">{JSON.stringify(log.new_value, null, 2)}</pre></div>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupLabels).map(([key, label]) => {
            if (!grouped[key]?.length) return null;
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
                </div>
                <div className="space-y-1 relative before:absolute before:left-[15px] before:top-0 before:bottom-0 before:w-px before:bg-border ml-2">
                  {grouped[key].map((log, i) => {
                    const Icon = actionIcons[log.action] || Activity;
                    return (
                      <div key={log.id || i} className="flex items-start gap-3 pl-8 relative pb-2">
                        <div className="absolute left-2 top-1 w-[26px] h-[26px] bg-background border rounded-full flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm">{log.description || log.action}</div>
                          <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                            <span>{log.module}</span>
                            <span>{format(new Date(log.created_at), 'HH:mm')}</span>
                            {log.user_id && <span className="font-mono">{log.user_id.slice(0, 8)}...</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div className="p-8 text-center text-muted-foreground">No activity recorded yet</div>
          )}
        </div>
      )}
    </div>
  );
}

export default ActivityAuditViewer;