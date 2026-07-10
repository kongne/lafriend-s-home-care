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
import { ChevronDown, CheckCircle, XCircle, Trash2, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BulkActionsProps {
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  allSelected: boolean;
  someSelected: boolean;
  onBulkAction: (action: string, ids: string[]) => Promise<{ success: number; failed: number }>;
  type: 'bookings' | 'contacts' | 'referrals' | 'reminders' | 'announcements' | 'reviews' | 'customer-feedback' | 'feedback' | 'staff' | 'projects' | 'testimonials';
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
      const result = await onBulkAction(confirmDialog.action, selectedIds);
      if (result.failed === 0) {
        toast.success(`${result.success} élément(s) traité(s) avec succès`);
      } else {
        toast.warning(`${result.success} réussi(s), ${result.failed} échoué(s)`);
      }
    } catch {
      toast.error("Erreur lors de l'action groupée");
    } finally {
      setLoading(false);
      setConfirmDialog({ open: false, action: '', label: '' });
    }
  };

  const actionsMap: Record<string, { action: string; label: string; icon: typeof CheckCircle; color: string }[]> = {
    bookings: [
      { action: 'confirmed', label: 'Confirmer', icon: CheckCircle, color: 'text-green-500' },
      { action: 'completed', label: 'Marquer terminé', icon: Clock, color: 'text-blue-500' },
      { action: 'cancelled', label: 'Annuler', icon: XCircle, color: 'text-red-500' },
      { action: 'delete', label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
    ],
    contacts: [
      { action: 'read', label: 'Marquer lu', icon: CheckCircle, color: 'text-blue-500' },
      { action: 'replied', label: 'Marquer répondu', icon: CheckCircle, color: 'text-green-500' },
      { action: 'delete', label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
    ],
    referrals: [
      { action: 'completed', label: 'Marquer complété', icon: CheckCircle, color: 'text-green-500' },
      { action: 'delete', label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
    ],
    reminders: [
      { action: 'cancelled', label: 'Annuler', icon: XCircle, color: 'text-red-500' },
      { action: 'delete', label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
    ],
    announcements: [
      { action: 'active', label: 'Activer', icon: CheckCircle, color: 'text-green-500' },
      { action: 'inactive', label: 'Désactiver', icon: XCircle, color: 'text-amber-500' },
      { action: 'archived', label: 'Archiver', icon: Clock, color: 'text-gray-500' },
      { action: 'delete', label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
    ],
    reviews: [
      { action: 'approved', label: 'Approuver', icon: CheckCircle, color: 'text-green-500' },
      { action: 'rejected', label: 'Rejeter', icon: XCircle, color: 'text-red-500' },
      { action: 'delete', label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
    ],
    'customer-feedback': [
      { action: 'read', label: 'Marquer lu', icon: CheckCircle, color: 'text-blue-500' },
      { action: 'replied', label: 'Marquer résolu', icon: CheckCircle, color: 'text-green-500' },
      { action: 'archived', label: 'Archiver', icon: Clock, color: 'text-gray-500' },
      { action: 'delete', label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
    ],
    feedback: [
      { action: 'archived', label: 'Archiver', icon: Clock, color: 'text-gray-500' },
      { action: 'active', label: 'Restaurer', icon: CheckCircle, color: 'text-green-500' },
      { action: 'delete', label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
    ],
    staff: [
      { action: 'active', label: 'Activer', icon: CheckCircle, color: 'text-green-500' },
      { action: 'inactive', label: 'Désactiver', icon: XCircle, color: 'text-amber-500' },
      { action: 'delete', label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
    ],
    projects: [
      { action: 'published', label: 'Publier', icon: CheckCircle, color: 'text-green-500' },
      { action: 'draft', label: 'Passer en brouillon', icon: Clock, color: 'text-gray-500' },
      { action: 'archived', label: 'Archiver', icon: XCircle, color: 'text-amber-500' },
      { action: 'delete', label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
    ],
    testimonials: [
      { action: 'activate', label: 'Activer', icon: CheckCircle, color: 'text-green-500' },
      { action: 'deactivate', label: 'Désactiver', icon: XCircle, color: 'text-amber-500' },
      { action: 'delete', label: 'Supprimer', icon: Trash2, color: 'text-destructive' },
    ],
  };

  const actions = actionsMap[type] || [];

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg bg-muted/50 p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Checkbox 
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={(checked) => onSelectAll(Boolean(checked))}
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
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
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
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  En cours...
                </>
              ) : 'Confirmer'}
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
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
};
