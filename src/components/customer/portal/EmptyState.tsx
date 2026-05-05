import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <Card className="p-10 sm:p-12 text-center">
    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
      <Icon className="h-8 w-8 text-accent/60" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    {description && <p className="text-muted-foreground mb-4 max-w-sm mx-auto">{description}</p>}
    {actionLabel && onAction && (
      <Button onClick={onAction} className="bg-accent text-accent-foreground hover:bg-accent/90">
        {actionLabel}
      </Button>
    )}
  </Card>
);
