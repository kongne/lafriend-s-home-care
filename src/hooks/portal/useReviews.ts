import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  staff_id: string | null;
  rating: number;
  comment: string | null;
  is_public: boolean;
  created_at: string;
}

export const reviewsKey = (userId?: string) => ["reviews", userId] as const;

export const useReviews = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: reviewsKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data || []) as Review[];
    },
  });

  const submitReview = useMutation({
    mutationFn: async (payload: Omit<Review, "id" | "user_id" | "created_at" | "is_public"> & { is_public?: boolean }) => {
      const { error } = await supabase.from("reviews").upsert(
        {
          ...payload,
          user_id: user!.id,
          is_public: payload.is_public ?? true,
        },
        { onConflict: "booking_id,user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Merci pour votre avis !");
      qc.invalidateQueries({ queryKey: reviewsKey(user?.id) });
    },
    onError: (e: any) => toast.error(e.message || "Erreur lors de l'envoi"),
  });

  return { reviews: query.data ?? [], isLoading: query.isLoading, submitReview };
};
