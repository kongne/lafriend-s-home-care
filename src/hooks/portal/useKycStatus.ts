import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type KycStatus = "none" | "pending" | "approved" | "rejected";

export interface KycInfo {
  status: KycStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
}

export const useKycStatus = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["kyc-status", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<KycInfo> => {
      const { data, error } = await supabase
        .from("identity_documents")
        .select("status, rejection_reason, reviewed_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { status: "none", rejection_reason: null, reviewed_at: null };
      return {
        status: data.status as KycStatus,
        rejection_reason: data.rejection_reason,
        reviewed_at: data.reviewed_at,
      };
    },
  });
};