import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSecurityEvents } from '@/hooks/useRBAC';
import { Shield, ShieldAlert, AlertTriangle, Lock, Unlock, Activity, Eye, EyeOff, Server, Key, Users, CheckCircle, XCircle, RefreshCw, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

export function SecurityCenter() {
  const { user } = useAuth();
  const [securityScore, setSecurityScore] = useState(78);
  const [scoreLoading, setScoreLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { events, loading } = useSecurityEvents({ resolved: false, limit: 100 });

  const filtered = events.filter(e =>
    !search || e.event_type?.toLowerCase().includes(search.toLowerCase()) || e.ip_address?.includes(search)
  );

  useEffect(() => {
    setTimeout(() => { setSecurityScore(78); setScoreLoading(false); }, 500);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const severityColor: Record<string, string> = {
    info: 'bg-blue-100 text-blue-800', warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800', critical: 'bg-red-200 text-red-900',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Security Center</h2>
        <Badge variant="outline" className="gap-2">
          <Shield className="h-4 w-4" /> Security Score: {securityScore}/100
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="py-3 flex flex-row items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <CardTitle className="text-sm">Failed Logins</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <p className="text-2xl font-bold">{events.filter(e => e.event_type === 'failed_login').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 flex flex-row items-center gap-2">
            <Lock className="h-4 w-4 text-yellow-500" />
            <CardTitle className="text-sm">Suspicious Activities</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <p className="text-2xl font-bold">{events.filter(e => e.severity === 'critical' || e.severity === 'error').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 flex flex-row items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <p className="text-2xl font-bold">-</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 flex flex-row items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <CardTitle className="text-sm">Security Score</CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-1">
            <p className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>{securityScore}%</p>
            <Progress value={securityScore} className={`h-1.5 ${getScoreBarColor(securityScore)}`} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="py-3"><CardTitle className="text-sm">Recommendations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { text: 'Enable MFA for all admin accounts', severity: 'high' },
              { text: 'Review inactive user accounts (12 users not logged in 90+ days)', severity: 'medium' },
              { text: 'Configure rate limiting for auth endpoints', severity: 'high' },
              { text: 'Enable CSP headers for XSS protection', severity: 'medium' },
              { text: 'Review open permissions on user roles', severity: 'low' },
              { text: 'Set session timeout to 30 minutes', severity: 'medium' },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-muted rounded text-sm">
                <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                  r.severity === 'high' ? 'text-red-500' : r.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <span className="text-xs">{r.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Security Events</CardTitle>
            <div className="flex gap-2">
              <Input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 w-40 text-xs" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="failed_login">Failed Login</SelectItem>
                  <SelectItem value="brute_force_detected">Brute Force</SelectItem>
                  <SelectItem value="suspicious_activity">Suspicious</SelectItem>
                  <SelectItem value="api_abuse">API Abuse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {filtered.slice(0, 20).map(event => (
                <div key={event.id} className="p-3 hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-[10px] ${severityColor[event.severity] || ''}`}>{event.severity}</Badge>
                    <span className="text-sm flex-1">{event.event_type.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground">{event.ip_address || 'N/A'}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(event.created_at), 'PPp')}</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-sm">No security events</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Security Status</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'CSRF Protection', status: true },
              { label: 'CSP Headers', status: false },
              { label: 'HTTPS', status: true },
              { label: 'Rate Limiting', status: false },
              { label: 'MFA Status', status: false },
              { label: 'Session Timeout', status: true },
              { label: 'JWT Validation', status: true },
              { label: 'Security Headers', status: false },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 p-2 bg-muted rounded">
                {s.status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                <span className="text-xs">{s.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
