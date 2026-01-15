import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Star } from "lucide-react";
import { error as logError } from "@/lib/logger";

interface FeedbackFormProps {
  bookingId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const FeedbackForm = ({ bookingId, onSuccess, onCancel }: FeedbackFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    rating: 5,
    comment: "",
    cleanlinessRating: 5,
    punctualityRating: 5,
    professionalismRating: 5,
  });

  const renderStarRating = (
    label: string,
    value: number,
    onChange: (val: number) => void
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              size={24}
              className={`${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              } transition-colors`}
            />
          </button>
        ))}
        <span className="text-sm text-muted-foreground ml-2">{value}/5</span>
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("feedback_ratings" as any).insert({
        booking_id: bookingId,
        user_id: user?.id || null,
        rating: formData.rating,
        comment: formData.comment || null,
        cleanliness_rating: formData.cleanlinessRating,
        punctuality_rating: formData.punctualityRating,
        professionalism_rating: formData.professionalismRating,
        is_verified_booking: !!user?.id,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Merci!",
        description: "Votre évaluation a été enregistrée avec succès.",
        duration: 5000,
      });

      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      logError("Feedback submission error:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre évaluation. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-6 text-center bg-green-50 border-green-200">
        <div className="space-y-4">
          <div className="text-4xl">✓</div>
          <h3 className="text-lg font-semibold text-green-900">
            Merci pour votre évaluation!
          </h3>
          <p className="text-sm text-green-800">
            Votre feedback nous aide à améliorer notre service.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card">
      <h3 className="text-xl font-bold mb-6 text-foreground">
        Évaluez votre expérience
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        {renderStarRating(
          "Évaluation générale du service",
          formData.rating,
          (val) => setFormData((prev) => ({ ...prev, rating: val }))
        )}

        {/* Detailed Ratings */}
        <div className="space-y-6 pt-4 border-t">
          {renderStarRating(
            "Propreté et nettoyage",
            formData.cleanlinessRating,
            (val) => setFormData((prev) => ({ ...prev, cleanlinessRating: val }))
          )}

          {renderStarRating(
            "Ponctualité",
            formData.punctualityRating,
            (val) => setFormData((prev) => ({ ...prev, punctualityRating: val }))
          )}

          {renderStarRating(
            "Professionnalisme",
            formData.professionalismRating,
            (val) =>
              setFormData((prev) => ({ ...prev, professionalismRating: val }))
          )}
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label htmlFor="feedback-comment">Commentaires (optionnel)</Label>
          <Textarea
            id="feedback-comment"
            placeholder="Partagez vos commentaires et suggestions..."
            value={formData.comment}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, comment: e.target.value }))
            }
            rows={4}
            maxLength={1000}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {formData.comment.length}/1000
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              "Envoyer l'évaluation"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default FeedbackForm;
