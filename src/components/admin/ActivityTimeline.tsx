import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isYesterday, startOfWeek, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Activity, UserCheck, CalendarDays, DollarSign, MessageCircle, HardDrive, RefreshCw, Wrench, Settings, Shield, AlertTriangle, Bell, Star } from 'lucide-react';
import type { AuditLog } from '@/types/enterprise';

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
  user_created: UserCheck, user_locked: Lock, user_unlocked: Unlock,
  security_event: Shield,
  notification_sent: Bell,
};

const groupIcons: Record<string, any> = { today: Activity, yesterday: Activity, week: Activity, month: Activity, older: Activity };

function getGroup(date: Date): string {
  if (isToday(date)) return 'today';
  if (isYesterday(date)) return 'yesterday';
  if (date > startOfWeek(new Date())) return 'week';
  if (date > startOfMonth(new Date())) return 'month';
  return 'older';
}

const defaultIcon = Activity;

export function ActivityTimeline() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (!error && data) setLogs(data as unknown as AuditLog[]);
      setLoading(false);
    })();
  }, []);

  const grouped: Record<string, AuditLog[]> = {};
  logs.forEach(log => {
    const group = getGroup(new Date(log.created_at));
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(log);
  });

  const groupLabels: Record<string, string> = {
    today: "Today's Activity",
    yesterday: 'Yesterday',
    week: 'This Week',
    month: 'This Month',
    older: 'Older',
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading timeline...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Activity Timeline</h2>
      {Object.entries(groupLabels).map(([key, label]) => {
        if (!grouped[key]?.length) return null;
        const GroupIcon = groupIcons[key] || Activity;
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-3">
              <GroupIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
            </div>
            <div className="space-y-1 relative before:absolute before:left-[15px] before:top-0 before:bottom-0 before:w-px before:bg-border ml-2">
              {grouped[key].map((log, i) => {
                const Icon = actionIcons[log.action] || defaultIcon;
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
      {logs.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">No activity recorded yet</div>
      )}
    </div>
  );
}

function Lock(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function Unlock(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>; }
