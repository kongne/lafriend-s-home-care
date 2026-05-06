import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatRoom {
  id: string;
  name: string | null;
  type: string;
  booking_id: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const chatRoomsKey = (uid?: string) => ["chat-rooms", uid] as const;

export const useChatRooms = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: chatRoomsKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<ChatRoom[]> => {
      const { data: parts, error: pe } = await supabase
        .from("chat_participants")
        .select("room_id")
        .eq("user_id", user!.id);
      if (pe) throw pe;
      const ids = (parts || []).map((p) => p.room_id);
      if (!ids.length) return [];
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("*")
        .in("id", ids)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ChatRoom[];
    },
  });

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`chat-rooms-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "chat_participants", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: chatRoomsKey(user.id) }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, qc]);

  /** Create or fetch a room tied to a booking, with the given participants */
  const ensureBookingRoom = useMutation({
    mutationFn: async ({ bookingId, name, participantIds }: {
      bookingId: string; name: string; participantIds: string[];
    }): Promise<string> => {
      // try find existing
      const { data: existing } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();
      if (existing?.id) return existing.id;

      const { data: room, error } = await supabase
        .from("chat_rooms")
        .insert({ name, type: "booking", booking_id: bookingId, created_by: user!.id })
        .select("id").single();
      if (error) throw error;

      const uniqueParts = Array.from(new Set([user!.id, ...participantIds].filter(Boolean)));
      await supabase.from("chat_participants").insert(
        uniqueParts.map((uid) => ({ room_id: room.id, user_id: uid }))
      );
      return room.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chatRoomsKey(user?.id) }),
  });

  return { rooms: query.data ?? [], isLoading: query.isLoading, ensureBookingRoom };
};