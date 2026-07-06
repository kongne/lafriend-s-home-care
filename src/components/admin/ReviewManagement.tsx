import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  Pin,
  Home,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
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
import { error as logError } from "@/lib/logger";

interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  staff_id: string | null;
  rating: number;
  comment: string | null;
  status: string; // 'approved' | 'pending' | 'rejected'
  is_pinned: boolean;
  is_featured: boolean;
  created_at: string;
  booking?: {
    full_name: string;
    service_type: string;
    preferred_date: string;
  } | null;
}

export const ReviewManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Edit Review Modal state
  const [editReview, setEditReview] = useState<Review | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Custom Alert Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Query reviews table and join bookings table
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          booking:bookings (
            full_name,
            service_type,
            preferred_date
          )
        `)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews((data as any[]) || []);
    } catch (err) {
      logError("Error fetching reviews:", err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les avis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const writeAuditLog = async (action: string, metadata: any) => {
    try {
      await supabase.from("audit_logs").insert({
        user_id: user?.id || null,
        action,
        category: "reviews",
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      logError("Failed to write audit log:", err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const actionLabel = newStatus === "approved" ? "approuver" : "rejeter";
    
    setConfirmDialog({
      isOpen: true,
      title: `Confirmer la modération`,
      description: `Êtes-vous sûr de vouloir ${actionLabel} cet avis ?`,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("reviews")
            .update({ status: newStatus })
            .eq("id", id);

          if (error) throw error;

          toast({
            title: newStatus === "approved" ? "Avis approuvé" : "Avis rejeté",
            description: `L'avis a été mis à jour avec succès.`,
          });

          // Log to audit log
          const review = reviews.find(r => r.id === id);
          await writeAuditLog(newStatus === "approved" ? "approve_review" : "reject_review", {
            review_id: id,
            comment: review?.comment,
            rating: review?.rating,
            customer_name: review?.booking?.full_name,
          });

          fetchReviews();
        } catch (err) {
          logError(`Error updating review status to ${newStatus}:`, err);
          toast({
            title: "Erreur",
            description: "Impossible de mettre à jour le statut de l'avis.",
            variant: "destructive",
          });
        }
      },
    });
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    const actionLabel = currentPinned ? "désépingler" : "épingler";
    
    setConfirmDialog({
      isOpen: true,
      title: `Confirmer l'action`,
      description: `Êtes-vous sûr de vouloir ${actionLabel} cet avis ? Il apparaîtra ${currentPinned ? "normalement" : "en premier"} pour les visiteurs.`,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("reviews")
            .update({ is_pinned: !currentPinned })
            .eq("id", id);

          if (error) throw error;

          toast({
            title: currentPinned ? "Avis désépinglé" : "Avis épinglé",
            description: `L'affichage de l'avis a été modifié.`,
          });

          await writeAuditLog(currentPinned ? "unpin_review" : "pin_review", { review_id: id });
          fetchReviews();
        } catch (err) {
          logError("Error toggling pin:", err);
          toast({
            title: "Erreur",
            description: "Impossible de modifier l'état épinglé.",
            variant: "destructive",
          });
        }
      },
    });
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    const actionLabel = currentFeatured ? "retirer de la page d'accueil" : "mettre en avant sur la page d'accueil";
    
    setConfirmDialog({
      isOpen: true,
      title: `Confirmer l'action`,
      description: `Êtes-vous sûr de vouloir ${actionLabel} cet avis ?`,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("reviews")
            .update({ is_featured: !currentFeatured })
            .eq("id", id);

          if (error) throw error;

          toast({
            title: currentFeatured ? "Retiré de l'accueil" : "Mis en avant",
            description: `Les préférences d'affichage ont été enregistrées.`,
          });

          await writeAuditLog(currentFeatured ? "unfeature_review" : "feature_review", { review_id: id });
          fetchReviews();
        } catch (err) {
          logError("Error toggling featured:", err);
          toast({
            title: "Erreur",
            description: "Impossible de modifier la mise en avant.",
            variant: "destructive",
          });
        }
      },
    });
  };

  const handleDeleteReview = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer définitivement",
      description: "Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("reviews")
            .delete()
            .eq("id", id);

          if (error) throw error;

          toast({
            title: "Avis supprimé",
            description: "L'avis a été retiré de la base de données.",
          });

          await writeAuditLog("delete_review", { review_id: id });
          fetchReviews();
        } catch (err) {
          logError("Error deleting review:", err);
          toast({
            title: "Erreur",
            description: "Impossible de supprimer l'avis.",
            variant: "destructive",
          });
        }
      },
    });
  };

  const handleOpenEdit = (review: Review) => {
    setEditReview(review);
    setEditComment(review.comment || "");
    setEditRating(review.rating);
  };

  const handleSaveEdit = async () => {
    if (!editReview) return;
    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          comment: editComment.trim() || null,
          rating: editRating,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editReview.id);

      if (error) throw error;

      toast({
        title: "Avis modifié",
        description: "Les modifications ont été enregistrées.",
      });

      await writeAuditLog("edit_review", {
        review_id: editReview.id,
        old_comment: editReview.comment,
        new_comment: editComment,
        old_rating: editReview.rating,
        new_rating: editRating,
      });

      setEditReview(null);
      fetchReviews();
    } catch (err) {
      logError("Error saving review edit:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les modifications.",
        variant: "destructive",
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-gray-200 text-gray-200"
        }`}
      />
    ));
  };

  // Filtering reviews
  const filteredReviews = reviews.filter((review) => {
    // Status Filter
    if (statusFilter !== "all" && review.status !== statusFilter) return false;

    // Search Query (name or comment)
    const name = review.booking?.full_name?.toLowerCase() || "";
    const comment = review.comment?.toLowerCase() || "";
    const service = review.booking?.service_type?.toLowerCase() || "";
    const search = searchQuery.toLowerCase();

    return name.includes(search) || comment.includes(search) || service.includes(search);
  });

  // Paginated reviews
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl shadow-sm border">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par client, service, avis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
          >
            Tous ({reviews.length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "pending" ? "default" : "outline"}
            className={statusFilter === "pending" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
            onClick={() => setStatusFilter("pending")}
          >
            En attente ({reviews.filter((r) => r.status === "pending").length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "approved" ? "default" : "outline"}
            className={statusFilter === "approved" ? "bg-green-600 hover:bg-green-700" : ""}
            onClick={() => setStatusFilter("approved")}
          >
            Approuvés ({reviews.filter((r) => r.status === "approved").length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "rejected" ? "default" : "outline"}
            className={statusFilter === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}
            onClick={() => setStatusFilter("rejected")}
          >
            Rejetés ({reviews.filter((r) => r.status === "rejected").length})
          </Button>
        </div>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paginatedReviews.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center">
            <MessageSquare className="h-12 w-12 opacity-50 mb-3" />
            <p className="text-base font-semibold">Aucun avis trouvé</p>
            <p className="text-sm">Essayez de modifier votre recherche ou vos filtres.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {paginatedReviews.map((review) => {
            const statusBadgeColors: Record<string, string> = {
              pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
              approved: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
              rejected: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300",
            };

            return (
              <Card
                key={review.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-md border ${
                  review.is_pinned
                    ? "border-accent shadow-sm"
                    : "border-border"
                }`}
              >
                {/* Visual Indicators */}
                <div className="absolute top-0 left-0 right-0 h-1 flex">
                  {review.is_pinned && <div className="flex-1 bg-accent" />}
                  {review.is_featured && <div className="flex-1 bg-amber-500" />}
                </div>

                <CardContent className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-semibold text-base text-foreground">
                        {review.booking?.full_name || "Client Anonyme"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Service : <span className="font-medium">{review.booking?.service_type || "Non spécifié"}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant="outline" className={statusBadgeColors[review.status]}>
                        {review.status === "pending" && "En attente"}
                        {review.status === "approved" && "Approuvé"}
                        {review.status === "rejected" && "Rejeté"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {review.is_pinned && (
                          <Badge variant="secondary" className="bg-accent/10 text-accent text-[10px] gap-1 px-1.5 h-5">
                            <Pin className="h-3 w-3 fill-accent" /> Épinglé
                          </Badge>
                        )}
                        {review.is_featured && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] gap-1 px-1.5 h-5">
                            <Home className="h-3 w-3" /> Accueil
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stars & Date */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2">
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <span>
                      Soumis le {new Date(review.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  {/* Comment */}
                  <div className="min-h-[48px]">
                    {review.comment ? (
                      <p className="text-sm text-foreground italic leading-relaxed whitespace-pre-wrap">
                        "{review.comment}"
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        (Aucun commentaire rédigé)
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between pt-3 border-t gap-2">
                    {/* Status Mod Buttons */}
                    <div className="flex items-center gap-1">
                      {review.status !== "approved" && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                          onClick={() => handleUpdateStatus(review.id, "approved")}
                          title="Approuver l'avis"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {review.status !== "rejected" && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => handleUpdateStatus(review.id, "rejected")}
                          title="Rejeter l'avis"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Meta Preferences (Pin/Feature/Edit/Delete) */}
                    <div className="flex items-center gap-1 ml-auto">
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`h-8 w-8 ${review.is_pinned ? "text-accent" : "text-muted-foreground"}`}
                        onClick={() => handleTogglePin(review.id, review.is_pinned)}
                        title={review.is_pinned ? "Désépingler du haut" : "Épingler en haut"}
                      >
                        <Pin className={`h-4 w-4 ${review.is_pinned ? "fill-accent" : ""}`} />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className={`h-8 w-8 ${review.is_featured ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground"}`}
                        onClick={() => handleToggleFeatured(review.id, review.is_featured)}
                        title={review.is_featured ? "Retirer de la page d'accueil" : "Mettre en avant sur la page d'accueil"}
                      >
                        <Home className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenEdit(review)}
                        title="Modifier le contenu"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteReview(review.id)}
                        title="Supprimer l'avis"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
          <span>
            Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, filteredReviews.length)} sur {filteredReviews.length} avis
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Review Dialog */}
      <Dialog open={!!editReview} onOpenChange={(o) => !o && setEditReview(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l'avis client</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (Étoiles)</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= editRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-comment" className="text-sm font-medium">Commentaire</label>
              <Textarea
                id="edit-comment"
                placeholder="Rédiger le commentaire..."
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {editComment.length}/1000 caractères
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditReview(null)} disabled={isSavingEdit}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="bg-accent text-accent-foreground">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unified AlertDialog confirmation */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(o) => setConfirmDialog(prev => ({ ...prev, isOpen: o }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-accent text-accent-foreground"
              onClick={async () => {
                await confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReviewManagement;
