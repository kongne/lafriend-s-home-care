import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Search,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  Archive,
  Trash2,
  Eye,
  RefreshCw,
  Clock,
  Inbox,
} from "lucide-react";
import { error as logError } from "@/lib/logger";
import { BulkActions, SelectableItem } from "./BulkActions";

interface Feedback {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  unread: "Nouveau",
  read: "En cours",
  replied: "Résolu",
  archived: "Archivé",
};

const STATUS_BADGE: Record<string, string> = {
  unread: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
  read: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  replied: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
  archived: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_NEXT: Record<string, string> = {
  unread: "read",
  read: "replied",
  replied: "archived",
};

const STATUS_PREV: Record<string, string> = {
  read: "unread",
  replied: "read",
};

export const CustomerFeedbackManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [viewFeedback, setViewFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState("");

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({ isOpen: false, title: "", description: "", onConfirm: async () => {} });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedbacks((data as Feedback[]) || []);
    } catch (err) {
      logError("Error fetching feedback:", err);
      toast({ title: "Erreur", description: "Impossible de charger les feedbacks.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const writeAuditLog = async (action: string, metadata: any) => {
    try {
      await supabase.from("audit_logs").insert({
        user_id: user?.id || null,
        action,
        category: "customer_feedback",
        metadata: { ...metadata, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      logError("Failed to write audit log:", err);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Statut mis à jour", description: `Feedback passé à "${STATUS_LABELS[newStatus] || newStatus}"` });
      await writeAuditLog("update_feedback_status", { feedback_id: id, new_status: newStatus });
      fetchFeedbacks();
    } catch (err) {
      logError("Error updating feedback status:", err);
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
    }
  };

  const handleStatusChange = (id: string, currentStatus: string, action: "next" | "prev") => {
    const map = action === "next" ? STATUS_NEXT : STATUS_PREV;
    const nextStatus = map[currentStatus];
    if (!nextStatus) return;

    setConfirmDialog({
      isOpen: true,
      title: `Marquer comme "${STATUS_LABELS[nextStatus]}"`,
      description: `Voulez-vous marquer ce feedback comme "${STATUS_LABELS[nextStatus]}" ?`,
      onConfirm: async () => { await updateStatus(id, nextStatus); },
    });
  };

  const handleArchive = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Archiver le feedback",
      description: "Archiver ce feedback ? Il pourra être restauré plus tard.",
      onConfirm: async () => { await updateStatus(id, "archived"); },
    });
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer définitivement",
      description: "Êtes-vous sûr de vouloir supprimer ce feedback ? Cette action est irréversible.",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
          if (error) throw error;
          toast({ title: "Feedback supprimé" });
          await writeAuditLog("delete_feedback", { feedback_id: id });
          fetchFeedbacks();
        } catch (err) {
          logError("Error deleting feedback:", err);
          toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
        }
      },
    });
  };

  const counters = useMemo(() => ({
    all: feedbacks.length,
    new: feedbacks.filter((f) => f.status === "unread").length,
    inProgress: feedbacks.filter((f) => f.status === "read").length,
    resolved: feedbacks.filter((f) => f.status === "replied").length,
    archived: feedbacks.filter((f) => f.status === "archived").length,
  }), [feedbacks]);

  const filtered = useMemo(() => {
    return feedbacks.filter((f) => {
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      const q = searchQuery.toLowerCase();
      return (
        f.full_name.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        f.subject.toLowerCase().includes(q) ||
        f.message.toLowerCase().includes(q)
      );
    });
  }, [feedbacks, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const allSelected = paginated.length > 0 && paginated.every(f => selectedIds.has(f.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(paginated.map(f => f.id)));
    else setSelectedIds(new Set());
  };

  const handleBulkAction = async (action: string, ids: string[]) => {
    let success = 0;
    for (const id of ids) {
      try {
        if (action === 'read' || action === 'replied' || action === 'archived') {
          const { error } = await supabase.from("contact_submissions").update({ status: action }).eq("id", id);
          if (error) throw error;
          await writeAuditLog("update_feedback_status", { feedback_id: id, new_status: action });
        } else if (action === 'delete') {
          const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
          if (error) throw error;
          await writeAuditLog("delete_feedback", { feedback_id: id });
        }
        success++;
      } catch { /* skip failed */ }
    }
    setSelectedIds(new Set());
    fetchFeedbacks();
    return { success, failed: ids.length - success };
  };

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const filterTabs = [
    { key: "all", label: "Tous", count: counters.all },
    { key: "unread", label: "Nouveau", count: counters.new },
    { key: "read", label: "En cours", count: counters.inProgress },
    { key: "replied", label: "Résolu", count: counters.resolved },
    { key: "archived", label: "Archivé", count: counters.archived },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border-0 shadow-sm bg-accent/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-accent/10"><Inbox className="h-5 w-5 text-accent" /></div>
            <div><p className="text-2xl font-bold">{counters.all}</p><p className="text-xs text-muted-foreground">Total</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30"><Clock className="h-5 w-5 text-yellow-600" /></div>
            <div><p className="text-2xl font-bold">{counters.new}</p><p className="text-xs text-muted-foreground">Nouveau</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/30"><Clock className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{counters.inProgress}</p><p className="text-xs text-muted-foreground">En cours</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-900/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-green-100 dark:bg-green-900/30"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{counters.resolved}</p><p className="text-xs text-muted-foreground">Résolu</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gray-50 dark:bg-gray-900/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800"><Archive className="h-5 w-5 text-gray-600" /></div>
            <div><p className="text-2xl font-bold">{counters.archived}</p><p className="text-xs text-muted-foreground">Archivé</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl shadow-sm border">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, sujet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          {filterTabs.map((tab) => (
            <Button
              key={tab.key}
              size="sm"
              variant={statusFilter === tab.key ? "default" : "outline"}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label} ({tab.count})
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5 space-y-3">
              <div className="flex justify-between"><Skeleton className="h-5 w-40" /><Skeleton className="h-5 w-24" /></div>
              <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between"><Skeleton className="h-4 w-32" /><Skeleton className="h-8 w-20" /></div>
            </CardContent></Card>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center">
            <Mail className="h-12 w-12 opacity-50 mb-3" />
            <p className="text-base font-semibold">Aucun feedback trouvé</p>
            <p className="text-sm">Essayez de modifier votre recherche ou vos filtres.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <BulkActions
            selectedIds={Array.from(selectedIds)}
            onSelectAll={toggleSelectAll}
            allSelected={allSelected}
            someSelected={someSelected}
            onBulkAction={handleBulkAction}
            type="customer-feedback"
          />
          {paginated.map((fb) => (
            <SelectableItem key={fb.id} id={fb.id} selected={selectedIds.has(fb.id)} onSelect={toggleSelect}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{fb.full_name}</h3>
                      <Badge variant="outline" className={STATUS_BADGE[fb.status] || ""}>
                        {STATUS_LABELS[fb.status] || fb.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2 flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{fb.email}</span>
                      {fb.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{fb.phone}</span>}
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
                        {new Date(fb.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground/80 mb-1">
                      Sujet: <span className="font-semibold">{fb.subject}</span>
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{fb.message}</p>
                  </div>

                  <div className="flex sm:flex-col gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setViewFeedback(fb)} title="Lire le message">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {fb.status !== "archived" && (
                      <>
                        {STATUS_NEXT[fb.status] && (
                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleStatusChange(fb.id, fb.status, "next")} title={`Marquer: ${STATUS_LABELS[STATUS_NEXT[fb.status]]}`}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleArchive(fb.id)} title="Archiver">
                          <Archive className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {fb.status === "archived" && STATUS_PREV[fb.status] && (
                      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleStatusChange(fb.id, fb.status, "prev")} title="Restaurer">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive hover:text-destructive" onClick={() => handleDelete(fb.id)} title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            </SelectableItem>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <span>{(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 3, totalPages - 6));
              const page = start + i;
              if (page > totalPages) return null;
              return (
                <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)}>
                  {page}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewFeedback} onOpenChange={(o) => { if (!o) setViewFeedback(null); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Message de {viewFeedback?.full_name}
              {viewFeedback && <Badge variant="outline" className={STATUS_BADGE[viewFeedback.status]}>{STATUS_LABELS[viewFeedback.status]}</Badge>}
            </DialogTitle>
          </DialogHeader>
          {viewFeedback && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Email:</span> <a href={`mailto:${viewFeedback.email}`} className="text-accent hover:underline">{viewFeedback.email}</a></div>
                {viewFeedback.phone && <div><span className="text-muted-foreground">Tél:</span> {viewFeedback.phone}</div>}
                <div><span className="text-muted-foreground">Sujet:</span> <span className="font-medium">{viewFeedback.subject}</span></div>
                <div><span className="text-muted-foreground">Date:</span> {new Date(viewFeedback.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{viewFeedback.message}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Réponse (email)</label>
                <Textarea
                  placeholder="Rédiger une réponse..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">L'intégration email sera disponible prochainement.</p>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => window.open(`mailto:${viewFeedback.email}?subject=Re: ${encodeURIComponent(viewFeedback.subject)}`, "_blank")}>
                  Ouvrir dans le client email
                </Button>
                <Button variant="default" onClick={() => setViewFeedback(null)}>Fermer</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(o) => setConfirmDialog((prev) => ({ ...prev, isOpen: o }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { await confirmDialog.onConfirm(); setConfirmDialog((prev) => ({ ...prev, isOpen: false })); }}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomerFeedbackManagement;
