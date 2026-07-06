import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { error as logError } from "@/lib/logger";
import {
  Star,
  Trash2,
  Archive,
  Eye,
  Loader2,
  MessageSquare,
} from "lucide-react";

interface Feedback {
  id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  cleanliness_rating: number | null;
  punctuality_rating: number | null;
  professionalism_rating: number | null;
  is_verified_booking: boolean;
  is_archived: boolean;
  created_at: string;
  booking?: {
    full_name: string;
    service_type: string;
  } | null;
}

export const FeedbackManagement = () => {
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "archived">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feedback_ratings" as any)
        .select(`*, booking:bookings(full_name, service_type)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedbacks((data as Feedback[]) || []);
    } catch (err) {
      logError("Error fetching feedbacks:", err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les avis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleArchive = async (id: string, currentArchived: boolean) => {
    try {
      const { error } = await supabase
        .from("feedback_ratings" as any)
        .update({ is_archived: !currentArchived })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: currentArchived ? "Avis restauré" : "Avis archivé",
        description: `L'avis a été ${currentArchived ? "restauré" : "archivé"} avec succès.`,
      });
      fetchFeedbacks();
    } catch (err) {
      logError("Error toggling archive:", err);
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'avis",
        variant: "destructive",
      });
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet avis ?")) return;

    try {
      const { error } = await supabase
        .from("feedback_ratings" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Avis supprimé",
        description: "L'avis a été supprimé avec succès.",
      });
      fetchFeedbacks();
    } catch (err) {
      logError("Error deleting feedback:", err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'avis",
        variant: "destructive",
      });
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

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (filter === "active") return !fb.is_archived;
    if (filter === "archived") return fb.is_archived;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">
          Avis Clients ({feedbacks.length})
        </h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Tous
          </Button>
          <Button
            size="sm"
            variant={filter === "active" ? "default" : "outline"}
            onClick={() => setFilter("active")}
          >
            Actifs
          </Button>
          <Button
            size="sm"
            variant={filter === "archived" ? "default" : "outline"}
            onClick={() => setFilter("archived")}
          >
            Archivés
          </Button>
        </div>
      </div>

      {filteredFeedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun avis client pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredFeedbacks.map((feedback) => (
            <Card key={feedback.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-0.5">
                        {renderStars(feedback.rating)}
                      </div>
                      <span className="text-sm font-medium">
                        {feedback.rating}/5
                      </span>
                      <Badge
                        variant={feedback.is_archived ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {feedback.is_archived ? "Archivé" : "Actif"}
                      </Badge>
                    </div>

                    {feedback.comment && (
                      <div className="mb-2">
                        {expandedId === feedback.id ? (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {feedback.comment}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {feedback.comment}
                          </p>
                        )}
                        {feedback.comment.length > 100 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-accent"
                            onClick={() =>
                              setExpandedId(
                                expandedId === feedback.id ? null : feedback.id
                              )
                            }
                          >
                            {expandedId === feedback.id
                              ? "Voir moins"
                              : "Voir plus"}
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>
                        {feedback.booking?.full_name || "Client inconnu"}
                      </span>
                      {feedback.booking?.service_type && (
                        <>
                          <span className="text-muted-foreground/50">|</span>
                          <span>{feedback.booking.service_type}</span>
                        </>
                      )}
                      <span className="text-muted-foreground/50">|</span>
                      <span>
                        {new Date(feedback.created_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </div>

                    {feedback.cleanliness_rating && (
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          Propreté: {feedback.cleanliness_rating}/5
                        </span>
                        {feedback.punctuality_rating && (
                          <span>
                            Ponctualité: {feedback.punctuality_rating}/5
                          </span>
                        )}
                        {feedback.professionalism_rating && (
                          <span>
                            Professionnalisme:{" "}
                            {feedback.professionalism_rating}/5
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => toggleArchive(feedback.id, feedback.is_archived)}
                      title={feedback.is_archived ? "Restaurer" : "Archiver"}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteFeedback(feedback.id)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
