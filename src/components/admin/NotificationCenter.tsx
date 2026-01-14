import { useState, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  X,
  Filter,
  Search,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  is_archived: boolean;
  priority?: "low" | "medium" | "high";
  created_at: string;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.is_read && !n.is_archived).length;
  const notificationType = ["booking", "contact", "warning", "error", "system"];

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
          toast({
            title: newNotif.title,
            description: newNotif.message,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        (payload) => {
          const deleted = payload.old as { id: string };
          setNotifications((prev) => prev.filter((n) => n.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const markAsUnread = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: false })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      );
    }
  };

  const archiveNotification = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_archived: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_archived: true } : n))
      );
      toast({ title: "Notification archivée" });
    }
  };

  const unarchiveNotification = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_archived: false })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_archived: false } : n))
      );
      toast({ title: "Notification restaurée" });
    }
  };

  const snoozeNotification = async (id: string, minutes: number = 30) => {
    setSnoozedIds((prev) => new Set([...prev, id]));
    toast({
      title: `Notification mise en attente pour ${minutes} minutes`,
      description: "Elle réapparaîtra bientôt",
    });

    setTimeout(() => {
      setSnoozedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, minutes * 60 * 1000);
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((n) => !n.is_read && !n.is_archived && !snoozedIds.has(n.id))
      .map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      toast({ title: "Toutes les notifications marquées comme lues" });
    }
  };

  const clearAllArchived = async () => {
    const ids = notifications
      .filter((n) => n.is_archived)
      .map((n) => n.id);
    if (ids.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .in("id", ids);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => !n.is_archived));
      toast({ title: "Notifications archivées supprimées" });
    }
  };

  // Filter notifications based on search and type
  const filteredNotifications = notifications
    .filter((n) => {
      const matchesSearch = n.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        n.message
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesType =
        selectedFilters.length === 0 || selectedFilters.includes(n.type);

      const matchesArchive = showArchived ? n.is_archived : !n.is_archived;

      const notSnoozed = !snoozedIds.has(n.id);

      return matchesSearch && matchesType && matchesArchive && notSnoozed;
    });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking":
        return "bg-green-500";
      case "contact":
        return "bg-blue-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      case "system":
        return "bg-purple-500";
      default:
        return "bg-accent";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[450px] bg-popover z-50 p-0">
        {/* Header with title and action buttons */}
        <div className="p-4 border-b space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} non lu(s)
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 text-xs"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
              {showArchived && notifications.filter(n => n.is_archived).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllArchived}
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  title="Supprimer les archives"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            
            {/* Type Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1"
                  title="Filtrer par type"
                >
                  <Filter className="h-4 w-4" />
                  <span className="text-xs">
                    {selectedFilters.length > 0 ? `${selectedFilters.length}` : "Type"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filtrer par type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notificationType.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={selectedFilters.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFilters([...selectedFilters, type]);
                      } else {
                        setSelectedFilters(selectedFilters.filter((t) => t !== type));
                      }
                    }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Archive/Active toggle */}
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="h-9"
              title={showArchived ? "Voir actifs" : "Voir archives"}
            >
              {showArchived ? "Archive" : "Actifs"}
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[450px]">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Chargement...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>{showArchived ? "Aucune notification archivée" : "Aucune notification"}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 group border-l-4",
                    !notification.is_read && !showArchived
                      ? "bg-accent/5 border-l-accent"
                      : "border-l-transparent"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Type indicator dot */}
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full mt-1 shrink-0",
                      getTypeColor(notification.type)
                    )}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={cn(
                          "font-medium text-sm truncate",
                          !notification.is_read && !showArchived
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground"
                        )}
                      >
                        {notification.title}
                      </span>
                      {notification.priority && (
                        <Badge
                          variant="secondary"
                          className={cn("text-xs shrink-0", getPriorityColor(notification.priority))}
                        >
                          {notification.priority}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                      {notification.link && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-60" />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">
                    {!notification.is_read && !showArchived && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsUnread(notification.id);
                        }}
                        title="Marquer comme non lu"
                      >
                        <EyeOff className="h-3 w-3" />
                      </Button>
                    )}
                    {notification.is_read && !showArchived && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsUnread(notification.id);
                        }}
                        title="Marquer comme non lu"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}

                    {!showArchived && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          snoozeNotification(notification.id, 30);
                        }}
                        title="Reporter 30 min"
                      >
                        <Clock className="h-3 w-3" />
                      </Button>
                    )}

                    {!showArchived ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-yellow-600 hover:text-yellow-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveNotification(notification.id);
                        }}
                        title="Archiver"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          unarchiveNotification(notification.id);
                        }}
                        title="Restaurer"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter;
