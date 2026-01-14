import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Star, User, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { error as logError } from "@/lib/logger";

interface FeedbackRating {
  id: string;
  rating: number;
  cleanliness_rating: number;
  punctuality_rating: number;
  professionalism_rating: number;
  comment: string | null;
  is_verified_booking: boolean;
  created_at: string;
}

interface FeedbackListProps {
  bookingId?: string;
  limit?: number;
}

export const FeedbackList = ({ bookingId, limit = 10 }: FeedbackListProps) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    fetchFeedbacks();
  }, [bookingId]);

  const fetchFeedbacks = async () => {
    try {
      let query = supabase
        .from("feedback_ratings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (bookingId) {
        query = query.eq("booking_id", bookingId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFeedbacks(data || []);

      // Calculate stats
      if (data && data.length > 0) {
        const avgRating =
          data.reduce((sum, f) => sum + f.rating, 0) / data.length;
        setStats({
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: data.length,
        });
      }
    } catch (err) {
      logError("Error fetching feedbacks:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={`${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Chargement des évaluations...
        </div>
      </Card>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          Aucune évaluation disponible pour le moment.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      {!bookingId && (
        <Card className="p-6 bg-gradient-to-r from-accent/10 to-accent/5">
          <div className="flex items-center gap-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">
                {stats.averageRating}
              </span>
              <span className="text-muted-foreground">/5</span>
            </div>
            <div className="space-y-2">
              {renderStars(Math.round(stats.averageRating))}
              <p className="text-sm text-muted-foreground">
                Basé sur {stats.totalReviews} évaluation
                {stats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Feedback Cards */}
      <div className="space-y-4">
        {feedbacks.map((feedback) => (
          <Card key={feedback.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <User size={16} className="text-accent" />
                  </div>
                  <div>
                    {feedback.is_verified_booking && (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded mb-1">
                        Client Vérifié
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDistanceToNow(new Date(feedback.created_at), {
                    locale: fr,
                    addSuffix: true,
                  })}
                </div>
              </div>

              {/* Overall Rating */}
              <div className="flex items-center gap-2">
                {renderStars(feedback.rating)}
                <span className="text-sm font-medium">{feedback.rating}/5</span>
              </div>

              {/* Detailed Ratings */}
              <div className="grid grid-cols-3 gap-3 py-2 border-y text-xs">
                <div>
                  <p className="text-muted-foreground font-medium">Propreté</p>
                  <div className="flex items-center gap-1 mt-1">
                    {renderStars(feedback.cleanliness_rating)}
                    <span className="font-semibold">
                      {feedback.cleanliness_rating}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">
                    Ponctualité
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {renderStars(feedback.punctuality_rating)}
                    <span className="font-semibold">
                      {feedback.punctuality_rating}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">
                    Professionnalisme
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {renderStars(feedback.professionalism_rating)}
                    <span className="font-semibold">
                      {feedback.professionalism_rating}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comment */}
              {feedback.comment && (
                <p className="text-sm text-foreground leading-relaxed">
                  "{feedback.comment}"
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeedbackList;
