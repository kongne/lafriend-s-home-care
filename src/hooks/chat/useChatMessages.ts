import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string | null;
  type: "text" | "image" | "file" | "video" | "audio" | "system";
  media_url: string | null;
  media_metadata: Record<string, unknown> | null;
  parent_message_id: string | null;
  is_pinned: boolean;
  is_edited: boolean;
  deleted_at: string | null;
  created_at: string;
  // local-only
  _pending?: boolean;
  _progress?: number;
}

export const messagesKey = (roomId?: string) => ["chat-messages", roomId] as const;

export const useChatMessages = (roomId: string | null) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: messagesKey(roomId || undefined),
    enabled: !!roomId,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data || []) as ChatMessage[];
    },
  });

  // realtime + presence
  useEffect(() => {
    if (!roomId || !user?.id) return;
    const ch = supabase.channel(`room:${roomId}`, { config: { presence: { key: user.id } } });
    channelRef.current = ch;

    ch.on("postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
      (payload) => {
        const msg = payload.new as ChatMessage;
        qc.setQueryData<ChatMessage[]>(messagesKey(roomId), (prev = []) => {
          if (prev.some((p) => p.id === msg.id)) return prev;
          // remove pending placeholder if matching content
          const filtered = prev.filter((p) => !(p._pending && p.user_id === msg.user_id && p.content === msg.content));
          return [...filtered, msg];
        });
      })
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          qc.setQueryData<ChatMessage[]>(messagesKey(roomId), (prev = []) =>
            prev.map((p) => (p.id === msg.id ? msg : p))
          );
        })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const uid = (payload as { user_id: string }).user_id;
        if (uid === user.id) return;
        setTypingUsers((prev) => (prev.includes(uid) ? prev : [...prev, uid]));
        setTimeout(() => setTypingUsers((prev) => prev.filter((x) => x !== uid)), 3000);
      })
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState() as Record<string, unknown>;
        setOnlineUsers(Object.keys(state));
      });

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ user_id: user.id, online_at: new Date().toISOString() });
      }
    });

    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [roomId, user?.id, qc]);

  const sendTyping = () => {
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { user_id: user?.id } });
  };

  const sendMessage = useMutation({
    mutationFn: async (input: { content?: string; type?: ChatMessage["type"]; media_url?: string; media_metadata?: Record<string, unknown>; parent_message_id?: string }) => {
      const row = {
        room_id: roomId!,
        user_id: user!.id,
        content: input.content ?? null,
        type: input.type ?? "text",
        media_url: input.media_url ?? null,
        media_metadata: (input.media_metadata ?? {}) as never,
        parent_message_id: input.parent_message_id ?? null,
      };
      const { data, error } = await supabase.from("chat_messages").insert(row).select("*").single();
      if (error) throw error;
      return data as ChatMessage;
    },
    onMutate: async (input) => {
      const optimistic: ChatMessage = {
        id: `tmp-${crypto.randomUUID()}`,
        room_id: roomId!,
        user_id: user!.id,
        content: input.content ?? null,
        type: input.type ?? "text",
        media_url: input.media_url ?? null,
        media_metadata: input.media_metadata ?? {},
        parent_message_id: input.parent_message_id ?? null,
        is_pinned: false,
        is_edited: false,
        deleted_at: null,
        created_at: new Date().toISOString(),
        _pending: true,
      };
      qc.setQueryData<ChatMessage[]>(messagesKey(roomId || undefined), (prev = []) => [...prev, optimistic]);
      return { tmpId: optimistic.id };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx?.tmpId) return;
      qc.setQueryData<ChatMessage[]>(messagesKey(roomId || undefined), (prev = []) => prev.filter((p) => p.id !== ctx.tmpId));
    },
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from("chat_messages").update({ is_pinned: pinned }).eq("id", id);
      if (error) throw error;
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chat_messages").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: messagesKey(roomId || undefined) }),
  });

  const markRead = async () => {
    if (!roomId || !user?.id) return;
    await supabase.from("chat_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("room_id", roomId).eq("user_id", user.id);
  };

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    typingUsers,
    onlineUsers,
    sendTyping,
    sendMessage,
    togglePin,
    deleteMessage,
    markRead,
  };
};