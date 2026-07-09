import { writeAuditLog } from './audit';
import type { BulkActionResult } from '@/types/enterprise';

export interface BulkOperation {
  label: string;
  value: string;
  destructive?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface BulkActionsConfig {
  operations: BulkOperation[];
  onExecute: (action: string, ids: string[]) => Promise<BulkActionResult>;
}

export async function executeSequential(
  ids: string[],
  operation: (id: string) => Promise<void>,
  onProgress?: (completed: number, total: number) => void,
): Promise<BulkActionResult> {
  const errors: string[] = [];
  let success = 0;

  for (let i = 0; i < ids.length; i++) {
    try {
      await operation(ids[i]);
      success++;
    } catch (err: any) {
      errors.push(`Item ${ids[i].slice(0, 8)}: ${err.message || 'Unknown error'}`);
    }
    onProgress?.(i + 1, ids.length);
  }

  return { success, failed: errors.length, total: ids.length, errors };
}

export async function executeBulkAction(
  action: string,
  ids: string[],
  table: string,
  userId: string,
  operations: Record<string, (id: string) => Promise<void>>,
  onProgress?: (completed: number, total: number) => void,
): Promise<BulkActionResult> {
  const op = operations[action];
  if (!op) {
    return { success: 0, failed: ids.length, total: ids.length, errors: [`Unknown action: ${action}`] };
  }

  const result = await executeSequential(ids, op, onProgress);

  await writeAuditLog({
    action: `${table}_bulk_${action}`,
    module: table,
    description: `Bulk ${action} performed on ${result.success} ${table} (${result.failed} failed)`,
    new_value: { action, ids, result },
    severity: result.failed > 0 ? 'warning' : 'info',
    status: result.failed > 0 && result.success === 0 ? 'failure' : 'success',
  }, userId);

  return result;
}

export const DEFAULT_BULK_OPERATIONS: BulkOperation[] = [
  { label: 'Delete', value: 'delete', destructive: true, requiresConfirmation: true, confirmationMessage: 'Are you sure you want to delete the selected items? This action cannot be undone.' },
  { label: 'Archive', value: 'archive', requiresConfirmation: true, confirmationMessage: 'Archive selected items?' },
  { label: 'Restore', value: 'restore', requiresConfirmation: false },
  { label: 'Export CSV', value: 'export_csv' },
  { label: 'Export PDF', value: 'export_pdf' },
];

export function exportToCSV<T extends Record<string, any>>(data: T[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportToJSON<T>(data: T[], filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}
