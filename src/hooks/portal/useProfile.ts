import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  total_spent: number | null;
  loyalty_points: number | null;
  loyalty_tier: string | null;
  special_instructions: string | null;
  preferred_time_slot: string | null;
}

export const profileKey = (userId?: string) => ["profile", userId] as const;

export const useProfile = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: profileKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (values: Partial<Profile>) => {
      const { error } = await supabase
        .from("profiles")
        .update(values)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onMutate: async (values) => {
      await qc.cancelQueries({ queryKey: profileKey(user?.id) });
      const prev = qc.getQueryData<Profile | null>(profileKey(user?.id));
      qc.setQueryData<Profile | null>(profileKey(user?.id), (old) =>
        old ? { ...old, ...values } : old
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(profileKey(user?.id), ctx.prev);
      toast.error("Impossible de mettre à jour le profil");
    },
    onSuccess: () => toast.success("Profil mis à jour"),
    onSettled: () => qc.invalidateQueries({ queryKey: profileKey(user?.id) }),
  });

  return { profile: query.data ?? null, isLoading: query.isLoading, updateProfile };
};
