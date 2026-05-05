import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Booking {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  message: string | null;
  status: string;
  created_at: string;
  is_recurring: boolean;
  recurrence_type: string | null;
  recurrence_end_date: string | null;
  assigned_staff_id: string | null;
  is_paused: boolean;
}

export const bookingsKey = (userId?: string) => ["bookings", userId] as const;

export const useBookings = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: bookingsKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user!.id)
        .order("preferred_date", { ascending: false });
      if (error) throw error;
      return (data || []) as Booking[];
    },
  });

  // Realtime sync
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`bookings-rt-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: bookingsKey(user.id) })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  const updateBooking = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Booking> }) => {
      const { error } = await supabase
        .from("bookings")
        .update(values)
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onMutate: async ({ id, values }) => {
      await qc.cancelQueries({ queryKey: bookingsKey(user?.id) });
      const prev = qc.getQueryData<Booking[]>(bookingsKey(user?.id));
      qc.setQueryData<Booking[]>(bookingsKey(user?.id), (old) =>
        (old || []).map((b) => (b.id === id ? { ...b, ...values } : b))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(bookingsKey(user?.id), ctx.prev);
      toast.error("Erreur lors de la mise à jour");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: bookingsKey(user?.id) }),
  });

  return { ...query, bookings: query.data ?? [], updateBooking };
};
