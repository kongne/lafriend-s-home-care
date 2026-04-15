import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PushNotificationToggle } from "./PushNotificationToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  CheckCheck,
  Trash2,
  Search,
  Loader2,
  Info,
  AlertTriangle,
  CheckCircle2,
  Gift,
  Calendar,
  Archive,
} from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  is_archived: boolean | null;
  link: string | null;
  created_at: string;
}

interface CustomerNotificationsProps {
  unreadCount?: number;
  onUnreadCountChange?: (count: number) => void;
}

export const CustomerNotifications = ({ onUnreadCountChange }: CustomerNotificationsProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotifications(data);
      const unread = data.filter((n) => !n.is_read).length;
      onUnreadCountChange?.(unread);
    }
    setLoading(false);
  }, [user, onUnreadCountChange]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;
    // Subscribe to realtime for browser push alerts
    const channel = supabase
      .channel("customer-notif-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) => [n, ...prev]);
          onUnreadCountChange?.((prev: number) => prev + 1);
          // Browser notification
          if ('Notification' in window && window.Notification.permission === 'granted') {
            try {
              new window.Notification(n.title, { body: n.message, icon: '/pwa-192x192.png', tag: `notif-${n.id}` });
            } catch {
              navigator.serviceWorker?.ready?.then(reg => {
                reg.showNotification(n.title, { body: n.message, icon: '/pwa-192x192.png', tag: `notif-${n.id}` });
              });
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications, user, onUnreadCountChange]);

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (!error) {
      toast.success(`${unreadIds.length} notification(s) marquée(s) comme lue(s)`);
      fetchNotifications();
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (!error) fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (!error) {
      toast.success("Notification supprimée");
      fetchNotifications();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "booking": return <Calendar className="h-5 w-5 text-blue-500" />;
      case "reward": return <Gift className="h-5 w-5 text-purple-500" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "success": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default: return <Info className="h-5 w-5 text-accent" />;
    }
  };

  const uniqueTypes = [...new Set(notifications.map((n) => n.type))];

  const filtered = notifications.filter((n) => {
    if (filter === "unread" && n.is_read) return false;
    if (filter === "read" && !n.is_read) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Push notification toggle */}
      <PushNotificationToggle />

      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">Mes Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-accent text-accent-foreground">{unreadCount} non lue(s)</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="w-full sm:w-auto">
            <CheckCheck className="h-4 w-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="unread">Non lues</SelectItem>
              <SelectItem value="read">Lues</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              {uniqueTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Aucune notification</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-sm ${!notification.is_read ? "border-accent/40 bg-accent/5" : ""}`}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${!notification.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(notification.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markAsRead(notification.id)}
                            title="Marquer comme lu"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
