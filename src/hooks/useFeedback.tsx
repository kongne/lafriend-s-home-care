import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { error as logError } from "@/lib/logger";

interface FeedbackData {
  bookingId: string;
  rating: number;
  comment?: string;
  cleanlinessRating: number;
  punctualityRating: number;
  professionalismRating: number;
}

export const useFeedback = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitFeedback = async (feedbackData: FeedbackData) => {
    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from("feedback_ratings")
        .insert({
          booking_id: feedbackData.bookingId,
          rating: feedbackData.rating,
          comment: feedbackData.comment || null,
          cleanliness_rating: feedbackData.cleanlinessRating,
          punctuality_rating: feedbackData.punctualityRating,
          professionalism_rating: feedbackData.professionalismRating,
          is_verified_booking: true,
        });

      if (submitError) throw submitError;

      setSubmitted(true);
      return { success: true };
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error submitting feedback";
      setError(errorMsg);
      logError("Feedback submission error:", err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setSubmitted(false);
    setError(null);
    setLoading(false);
  };

  return {
    loading,
    submitted,
    error,
    submitFeedback,
    resetState,
  };
};

export default useFeedback;
