import React, { useState } from 'react';
import { useSystemSettings } from '@/hooks/useRBAC';
import { useAuth } from '@/hooks/useAuth';
import { writeAuditLog } from '@/lib/audit';
import { Settings, Globe, CreditCard, Bell, Shield, Palette, DollarSign, Languages, Server, Wrench, Building, CalendarDays, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const modules = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'business', label: 'Business', icon: Building },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'taxes', label: 'Taxes', icon: DollarSign },
  { id: 'currencies', label: 'Currencies', icon: DollarSign },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'email', label: 'Email', icon: Activity },
  { id: 'localization', label: 'Localization', icon: Globe },
  { id: 'languages', label: 'Languages', icon: Languages },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'backups', label: 'Backups', icon: RefreshCw },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'api', label: 'API', icon: Server },
  { id: 'integrations', label: 'Integrations', icon: Activity },
];

function SettingsTab({ module }: { module: string }) {
  const { user } = useAuth();
  const { settings, loading, updateSetting, getSetting } = useSystemSettings(module);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (key: string, value: any) => {
    setSaving(true);
    try {
      await updateSetting(key, value);
      await writeAuditLog({
        action: 'settings_updated', module: 'settings',
        description: `Updated setting '${key}' in ${module}`,
        new_value: { module, key, value }, severity: 'info',
      }, user?.id);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

  const renderField = (key: string, label: string, type: 'text' | 'number' | 'boolean' | 'select' | 'textarea', options?: string[]) => {
    const value = getSetting(key);
    return (
      <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
        <div>
          <label className="text-sm font-medium">{label}</label>
          <p className="text-xs text-muted-foreground">{key}</p>
        </div>
        <div className="w-48">
          {type === 'boolean' ? (
            <Switch checked={!!value} onCheckedChange={v => handleUpdate(key, v)} />
          ) : type === 'select' && options ? (
            <Select value={String(value || '')} onValueChange={v => handleUpdate(key, v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : type === 'textarea' ? (
            <Textarea value={String(value || '')} onChange={e => handleUpdate(key, e.target.value)} rows={2} className="text-xs" />
          ) : (
            <Input type={type} value={String(value || '')} onChange={e => handleUpdate(key, type === 'number' ? Number(e.target.value) : e.target.value)} className="text-xs" />
          )}
        </div>
      </div>
    );
  };

  const settingsMap: Record<string, { label: string; type: 'text' | 'number' | 'boolean' | 'select' | 'textarea'; options?: string[] }[]> = {
    general: [
      { key: 'site_name', label: 'Site Name', type: 'text' },
      { key: 'site_description', label: 'Site Description', type: 'textarea' },
      { key: 'support_email', label: 'Support Email', type: 'text' },
      { key: 'support_phone', label: 'Support Phone', type: 'text' },
      { key: 'timezone', label: 'Timezone', type: 'select', options: ['Africa/Douala', 'UTC', 'America/New_York', 'Europe/Paris'] },
    ],
    business: [
      { key: 'company_name', label: 'Company Name', type: 'text' },
      { key: 'company_address', label: 'Company Address', type: 'textarea' },
      { key: 'company_registration', label: 'Registration Number', type: 'text' },
      { key: 'vat_number', label: 'VAT Number', type: 'text' },
    ],
    bookings: [
      { key: 'auto_confirm', label: 'Auto-confirm Bookings', type: 'boolean' },
      { key: 'min_notice_hours', label: 'Minimum Notice (hours)', type: 'number' },
      { key: 'max_advance_days', label: 'Max Advance Booking (days)', type: 'number' },
      { key: 'cancellation_policy', label: 'Cancellation Policy', type: 'select', options: ['flexible', 'moderate', 'strict'] },
    ],
    payments: [
      { key: 'currency', label: 'Currency', type: 'select', options: ['XAF', 'USD', 'EUR'] },
      { key: 'deposit_percentage', label: 'Deposit %', type: 'number' },
      { key: 'payment_methods', label: 'Payment Methods', type: 'textarea' },
    ],
    security: [
      { key: 'session_timeout_minutes', label: 'Session Timeout (minutes)', type: 'number' },
      { key: 'max_login_attempts', label: 'Max Login Attempts', type: 'number' },
      { key: 'require_mfa', label: 'Require MFA for Admins', type: 'boolean' },
      { key: 'password_min_length', label: 'Minimum Password Length', type: 'number' },
      { key: 'rate_limit_enabled', label: 'Rate Limiting', type: 'boolean' },
    ],
    notifications: [
      { key: 'email_notifications', label: 'Email Notifications', type: 'boolean' },
      { key: 'sms_notifications', label: 'SMS Notifications', type: 'boolean' },
      { key: 'push_notifications', label: 'Push Notifications', type: 'boolean' },
      { key: 'slack_webhook_url', label: 'Slack Webhook URL', type: 'text' },
    ],
    backups: [
      { key: 'auto_backup_enabled', label: 'Automatic Backups', type: 'boolean' },
      { key: 'backup_frequency', label: 'Backup Frequency', type: 'select', options: ['daily', 'weekly', 'monthly'] },
      { key: 'retention_days', label: 'Retention Period (days)', type: 'number' },
      { key: 'compression_enabled', label: 'Compression', type: 'boolean' },
      { key: 'encryption_enabled', label: 'Encryption', type: 'boolean' },
    ],
    localization: [
      { key: 'default_language', label: 'Default Language', type: 'select', options: ['fr', 'en'] },
      { key: 'date_format', label: 'Date Format', type: 'select', options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
      { key: 'time_format', label: 'Time Format', type: 'select', options: ['24h', '12h'] },
    ],
  };

  const fields = settingsMap[module] || settingsMap.general || [];
  return (
    <div className="space-y-1">
      {fields.map(f => renderField(f.key, f.label, f.type, f.options))}
      {fields.length === 0 && (
        <div className="p-8 text-center text-muted-foreground text-sm">No settings available for this module</div>
      )}
    </div>
  );
}

export function SettingsManager() {
  const [activeModule, setActiveModule] = useState('general');

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {modules.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveModule(m.id)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              activeModule === m.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm capitalize">{activeModule} Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsTab module={activeModule} />
        </CardContent>
      </Card>
    </div>
  );
}
