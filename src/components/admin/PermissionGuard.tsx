import React from 'react';
import { usePermission } from '@/hooks/useRBAC';
import { ShieldOff, Loader2 } from 'lucide-react';

interface PermissionGuardProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ permission, fallback, children }: PermissionGuardProps) {
  const { hasPermission, loading } = usePermission(permission);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasPermission) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShieldOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Access Denied</h3>
        <p className="text-sm text-muted-foreground">
          You don't have permission to access this module.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

interface WithPermissionProps {
  permission: string;
  children: React.ReactNode;
}

export function WithPermission({ permission, children }: WithPermissionProps) {
  const { hasPermission, loading } = usePermission(permission);
  if (loading || !hasPermission) return null;
  return <>{children}</>;
}
