import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { useReviews } from "@/hooks/portal/useReviews";
import type { Booking } from "@/hooks/portal/useBookings";

interface Props {
  booking: Booking | null;
  onClose: () => void;
}

export const ReviewDialog = ({ booking, onClose }: Props) => {
  const { submitReview } = useReviews();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  if (!booking) return null;

  const handleSubmit = async () => {
    await submitReview.mutateAsync({
      booking_id: booking.id,
      staff_id: booking.assigned_staff_id ?? null,
      rating,
      comment: comment.trim() || null,
    });
    setRating(5);
    setComment("");
    onClose();
  };

  return (
    <Dialog open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Laisser un avis</DialogTitle>
          <DialogDescription>
            Comment s'est passé votre service « {booking.service_type} » ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 ${
                    (hover || rating) >= n ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Partagez votre expérience (optionnel)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitReview.isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitReview.isPending} className="bg-accent text-accent-foreground">
            {submitReview.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Publier l'avis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
