import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface NotificationItem {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  is_archived: boolean | null;
  link: string | null;
  created_at: string;
}

export const notificationsKey = (userId?: string) => ["notifications", userId] as const;

export const useNotifications = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const firstLoadRef = useRef(true);

  const query = useQuery({
    queryKey: notificationsKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<NotificationItem[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as NotificationItem[];
    },
  });

  // Realtime + Sonner toast on new
  useEffect(() => {
    if (!user?.id) return;
    firstLoadRef.current = true;
    const channel = supabase
      .channel(`notifications-rt-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as NotificationItem;
          qc.setQueryData<NotificationItem[]>(notificationsKey(user.id), (old) => [n, ...(old || [])]);
          toast(n.title, { description: n.message });
          if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
            try {
              new window.Notification(n.title, { body: n.message, tag: `notif-${n.id}`, icon: "/pwa-192x192.png" });
            } catch {
              navigator.serviceWorker?.ready?.then((reg) =>
                reg.showNotification(n.title, { body: n.message, tag: `notif-${n.id}`, icon: "/pwa-192x192.png" })
              ).catch(() => {});
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const u = payload.new as NotificationItem;
          qc.setQueryData<NotificationItem[]>(notificationsKey(user.id), (old) =>
            (old || []).map((n) => (n.id === u.id ? u : n))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const d = payload.old as { id: string };
          qc.setQueryData<NotificationItem[]>(notificationsKey(user.id), (old) =>
            (old || []).filter((n) => n.id !== d.id)
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const ids = (query.data || []).filter((n) => !n.is_read).map((n) => n.id);
      if (ids.length === 0) return;
      const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsKey(user?.id) }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      const ids = (query.data || []).map((n) => n.id);
      if (ids.length === 0) return;
      const { error } = await supabase.from("notifications").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notifications effacées");
      qc.invalidateQueries({ queryKey: notificationsKey(user?.id) });
    },
  });

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, isLoading: query.isLoading, markRead, markAllRead, remove, clearAll };
};
