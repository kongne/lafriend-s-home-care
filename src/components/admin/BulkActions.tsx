import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, CheckCircle, XCircle, Trash2, Clock } from "lucide-react";

interface BulkActionsProps {
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  allSelected: boolean;
  someSelected: boolean;
  onBulkAction: (action: string, ids: string[]) => Promise<void>;
  type: 'bookings' | 'contacts';
}

export const BulkActions = ({ 
  selectedIds, 
  onSelectAll, 
  allSelected, 
  someSelected,
  onBulkAction,
  type
}: BulkActionsProps) => {
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string; label: string }>({
    open: false,
    action: '',
    label: ''
  });
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await onBulkAction(confirmDialog.action, selectedIds);
    } finally {
      setLoading(false);
      setConfirmDialog({ open: false, action: '', label: '' });
    }
  };

  const bookingActions = [
    { action: 'confirmed', label: 'Confirmer', icon: CheckCircle, color: 'text-green-500' },
    { action: 'completed', label: 'Marquer terminé', icon: Clock, color: 'text-blue-500' },
    { action: 'cancelled', label: 'Annuler', icon: XCircle, color: 'text-red-500' },
    { action: 'delete', label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
  ];

  const contactActions = [
    { action: 'read', label: 'Marquer lu', icon: CheckCircle, color: 'text-blue-500' },
    { action: 'replied', label: 'Marquer répondu', icon: CheckCircle, color: 'text-green-500' },
    { action: 'delete', label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
  ];

  const actions = type === 'bookings' ? bookingActions : contactActions;

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg mb-4">
      <div className="flex items-center gap-2">
        <Checkbox 
          checked={allSelected}
          onCheckedChange={onSelectAll}
          className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
        />
        <span className="text-sm text-muted-foreground">
          {selectedIds.length > 0 
            ? `${selectedIds.length} sélectionné(s)` 
            : 'Tout sélectionner'}
        </span>
      </div>

      {selectedIds.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Actions groupées
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {actions.map(({ action, label, icon: Icon, color }) => (
              <DropdownMenuItem
                key={action}
                onClick={() => setConfirmDialog({ open: true, action, label })}
                className="cursor-pointer"
              >
                <Icon className={`h-4 w-4 mr-2 ${color}`} />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'action</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir {confirmDialog.label.toLowerCase()} {selectedIds.length} élément(s) ?
              {confirmDialog.action === 'delete' && (
                <span className="block mt-2 text-destructive font-medium">
                  Cette action est irréversible.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAction}
              disabled={loading}
              className={confirmDialog.action === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {loading ? 'En cours...' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface SelectableItemProps {
  id: string;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  children: React.ReactNode;
}

export const SelectableItem = ({ id, selected, onSelect, children }: SelectableItemProps) => {
  return (
    <div className="flex items-start gap-3">
      <div className="pt-6">
        <Checkbox 
          checked={selected}
          onCheckedChange={(checked) => onSelect(id, checked as boolean)}
          className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
        />
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
