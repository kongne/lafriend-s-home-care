import React, { useState } from 'react';
import { useErrorLogs } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { writeAuditLog } from '@/lib/audit';
import { Search, Filter, AlertTriangle, AlertCircle, Info, Bug, CheckCircle, XCircle, ChevronDown, ChevronUp, Download, Eye, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

const severityColor: Record<string, string> = {
  debug: 'bg-gray-100 text-gray-800',
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900',
};

const typeIcon: Record<string, any> = {
  frontend: Bug, backend: Bug, api: AlertCircle, database: AlertTriangle,
  authentication: AlertCircle, validation: AlertTriangle, cron: AlertCircle,
  queue: AlertCircle, email: AlertCircle, unknown: AlertTriangle,
};

export function ErrorLogCenter() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [resolvedFilter, setResolvedFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { logs, loading } = useErrorLogs({
    resolved: resolvedFilter === 'all' ? undefined : resolvedFilter === 'resolved',
    type: typeFilter !== 'all' ? typeFilter : undefined,
    severity: severityFilter !== 'all' ? severityFilter : undefined,
    limit: page * 50,
  });

  const filtered = logs.filter(l =>
    !search || l.message?.toLowerCase().includes(search.toLowerCase()) ||
    l.file?.toLowerCase().includes(search.toLowerCase()) ||
    l.code?.toLowerCase().includes(search.toLowerCase())
  );

  const handleResolve = async (id: string) => {
    await (supabase as any).from('error_logs').update({ resolved: true, resolved_at: new Date().toISOString(), resolved_by: user?.id }).eq('id', id);
    await writeAuditLog({ action: 'error_resolved', module: 'errors', description: `Resolved error log ${id.slice(0, 8)}`, severity: 'info' }, user?.id);
  };

  const handleExport = () => {
    const csv = [['Timestamp', 'Type', 'Severity', 'Message', 'Code', 'File', 'Function', 'Line', 'URL', 'Status'].join(',')];
    filtered.forEach(l => {
      csv.push([l.created_at, l.error_type, l.severity, `"${l.message.replace(/"/g, '""')}"`, l.code || '', l.file || '', l.function || '', String(l.line || ''), l.url || '', l.resolved ? 'Resolved' : 'Open'].join(','));
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `error_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Error Log Center</h2>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />Export
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search errors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {['frontend', 'backend', 'api', 'database', 'authentication', 'validation', 'cron', 'queue', 'email'].map(t => (
              <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No errors found</div>
            ) : (
              filtered.map(log => {
                const TypeIcon = typeIcon[log.error_type] || AlertTriangle;
                const isExpanded = expandedId === log.id;
                return (
                  <div key={log.id} className="hover:bg-muted/30 transition-colors">
                    <button onClick={() => setExpandedId(isExpanded ? null : log.id)} className="w-full flex items-center gap-3 p-3 text-left">
                      <TypeIcon className={`h-4 w-4 shrink-0 ${log.resolved ? 'opacity-40' : ''}`} />
                      <Badge className={`text-[10px] shrink-0 ${severityColor[log.severity] || ''}`}>{log.severity}</Badge>
                      <span className="flex-1 text-sm truncate">{log.message}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{log.error_type}</Badge>
                      <span className="text-xs text-muted-foreground shrink-0 hidden md:inline">{format(new Date(log.created_at), 'PPp')}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2">
                        {log.stack_trace && (
                          <div>
                            <span className="text-xs text-muted-foreground">Stack Trace:</span>
                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-40">{log.stack_trace}</pre>
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div><span className="text-muted-foreground">Code:</span> {log.code || 'N/A'}</div>
                          <div><span className="text-muted-foreground">File:</span> {log.file || 'N/A'}</div>
                          <div><span className="text-muted-foreground">Function:</span> {log.function || 'N/A'}</div>
                          <div><span className="text-muted-foreground">Line:</span> {log.line || 'N/A'}</div>
                          <div><span className="text-muted-foreground">URL:</span> {log.url || 'N/A'}</div>
                          <div><span className="text-muted-foreground">Method:</span> {log.method || 'N/A'}</div>
                          <div><span className="text-muted-foreground">Status:</span> {log.status_code || 'N/A'}</div>
                          <div><span className="text-muted-foreground">Environment:</span> {log.environment || 'N/A'}</div>
                          <div><span className="text-muted-foreground">Browser:</span> {log.browser || 'N/A'}</div>
                          <div><span className="text-muted-foreground">OS:</span> {log.os || 'N/A'}</div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          {!log.resolved && (
                            <Button variant="outline" size="sm" onClick={() => handleResolve(log.id)}>
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />Resolve
                            </Button>
                          )}
                          <Button variant="ghost" size="sm"><User className="h-3.5 w-3.5 mr-1" />Assign</Button>
                          <Badge variant={log.resolved ? 'default' : 'secondary'} className="text-[10px] ml-auto">
                            {log.resolved ? 'Resolved' : 'Open'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
