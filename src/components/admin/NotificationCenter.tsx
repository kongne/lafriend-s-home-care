import { useState, useEffect, useRef } from "react";
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
  Settings2,
  ChevronDown,
  ChevronRight,
  Layers,
  Moon,
  CalendarRange,
  ChevronUp,
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format, isAfter, subDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  is_archived: boolean | null;
  priority?: "low" | "medium" | "high";
  created_at: string;
}

interface NotificationPreference {
  type: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

const STORAGE_KEY = "lafriends_notif_prefs";

const DEFAULT_PREFERENCES: NotificationPreference[] = [
  { type: "booking", inApp: true, email: true, push: true },
  { type: "contact", inApp: true, email: true, push: false },
  { type: "warning", inApp: true, email: true, push: true },
  { type: "error", inApp: true, email: true, push: true },
  { type: "system", inApp: true, email: false, push: false },
];

const NOTIF_TYPES = ["booking", "contact", "warning", "error", "system"];

const typeLabels: Record<string, string> = {
  booking: "Réservations",
  contact: "Messages",
  warning: "Alertes",
  error: "Erreurs",
  system: "Système",
};

const loadPreferences = (): NotificationPreference[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { }
  return DEFAULT_PREFERENCES;
};

export const NotificationCenter = () => {
  const { user } = useAuth();
  const channelRef = useRef(`notifications-${Math.random().toString(36).slice(2, 9)}`);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [groupByType, setGroupByType] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference[]>(loadPreferences);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [dateRange, setDateRange] = useState<"all" | "today" | "7d" | "30d" | "90d">("all");
  const [dndMode, setDndMode] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.is_read && !n.is_archived).length;

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setNotifications(data.map(n => ({ ...n, is_archived: n.is_archived ?? false })) as Notification[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel(channelRef.current)
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
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(newNotif.title, {
                body: newNotif.message,
                icon: '/pwa-192x192.png',
                badge: '/favicon.png',
                tag: `notif-${newNotif.id}`,
              });
            } catch (e) {
              navigator.serviceWorker?.ready?.then(reg => {
                reg.showNotification(newNotif.title, {
                  body: newNotif.message,
                  icon: '/pwa-192x192.png',
                  badge: '/favicon.png',
                  tag: `notif-${newNotif.id}`,
                });
              }).catch(() => { });
            }
          }
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

  useEffect(() => {
    const checkRole = async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(Boolean(data));
    };
    void checkRole();
  }, [user]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (!error) setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAsUnread = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: false }).eq("id", id);
    if (!error) setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)));
  };

  const archiveNotification = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_archived: true }).eq("id", id);
    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_archived: true } : n)));
      toast({ title: "Notification archivée" });
    }
  };

  const unarchiveNotification = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_archived: false }).eq("id", id);
    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_archived: false } : n)));
      toast({ title: "Notification restaurée" });
    }
  };

  const snoozeLabels: Record<string, string> = {
    "15": "15 minutes", "30": "30 minutes", "60": "1 heure",
    "180": "3 heures", "1440": "Demain", "custom": "Personnalisé",
  };

  const snoozeNotification = async (id: string, minutes: number) => {
    setSnoozedIds((prev) => new Set([...prev, id]));
    const label = snoozeLabels[String(minutes)] || `${minutes} minutes`;
    toast({ title: `Notification mise en attente pour ${label}`, description: "Elle réapparaîtra bientôt" });
    setTimeout(() => {
      setSnoozedIds((prev) => { const newSet = new Set(prev); newSet.delete(id); return newSet; });
    }, minutes * 60 * 1000);
  };

  const snoozeWithCustom = (id: string) => {
    const input = prompt("Minutes de report:", "30");
    if (input) { const mins = parseInt(input); if (mins > 0) snoozeNotification(id, mins); }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (!error) setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read && !n.is_archived && !snoozedIds.has(n.id)).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({ title: "Toutes les notifications marquées comme lues" });
    }
  };

  const clearAllArchived = async () => {
    const ids = notifications.filter((n) => n.is_archived).map((n) => n.id);
    if (ids.length === 0) return;
    const { error } = await supabase.from("notifications").delete().in("id", ids);
    if (!error) {
      setNotifications((prev) => prev.filter((n) => !n.is_archived));
      toast({ title: "Notifications archivées supprimées" });
    }
  };

  const bulkArchive = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const { error } = await supabase.from("notifications").update({ is_archived: true }).in("id", ids);
    if (!error) {
      setNotifications((prev) => prev.map((n) => selectedIds.has(n.id) ? { ...n, is_archived: true } : n));
      toast({ title: `${ids.length} notification(s) archivée(s)` });
      setSelectedIds(new Set());
      setBulkMode(false);
    }
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const { error } = await supabase.from("notifications").delete().in("id", ids);
    if (!error) {
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      toast({ title: `${ids.length} notification(s) supprimée(s)` });
      setSelectedIds(new Set());
      setBulkMode(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getDateThreshold = (): Date | null => {
    switch (dateRange) {
      case "today": return startOfDay(new Date());
      case "7d": return subDays(new Date(), 7);
      case "30d": return subDays(new Date(), 30);
      case "90d": return subDays(new Date(), 90);
      default: return null;
    }
  };

  const savePreferences = (prefs: NotificationPreference[]) => {
    setPreferences(prefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    toast({ title: "Préférences enregistrées" });
  };

  const togglePref = (type: string, channel: keyof Omit<NotificationPreference, "type">) => {
    const updated = preferences.map((p) =>
      p.type === type ? { ...p, [channel]: !p[channel] } : p
    );
    savePreferences(updated);
  };

  const filteredNotifications = notifications
    .filter((n) => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedFilters.length === 0 || selectedFilters.includes(n.type);
      const matchesArchive = showArchived ? n.is_archived : !n.is_archived;
      const notSnoozed = !snoozedIds.has(n.id);
      const pref = preferences.find((p) => p.type === n.type);
      const matchesPref = pref ? pref.inApp : true;
      const threshold = getDateThreshold();
      const matchesDate = threshold ? isAfter(new Date(n.created_at), threshold) : true;
      const matchesDnd = dndMode ? n.priority === "high" || n.type === "error" || n.type === "warning" : true;
      return matchesSearch && matchesType && matchesArchive && notSnoozed && matchesPref && matchesDate && matchesDnd;
    });

  const groupedNotifications = groupByType
    ? NOTIF_TYPES.reduce((acc, type) => {
      const items = filteredNotifications.filter((n) => n.type === type);
      if (items.length > 0) acc.push({ type, items });
      return acc;
    }, [] as { type: string; items: Notification[] }[])
    : [];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking": return "bg-green-500";
      case "contact": return "bg-blue-500";
      case "warning": return "bg-yellow-500";
      case "error": return "bg-red-500";
      case "system": return "bg-purple-500";
      default: return "bg-accent";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "";
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol !== 'javascript:';
    } catch { return false; }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link && isValidUrl(notification.link)) {
      window.location.href = notification.link;
    }
  };

  const renderNotificationItem = (notification: Notification) => (
    <div
      key={notification.id}
      className={cn(
        "flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 group border-l-4",
        !notification.is_read && !showArchived
          ? "bg-accent/5 border-l-accent"
          : "border-l-transparent",
        bulkMode && "pl-2"
      )}
      onClick={() => {
        if (bulkMode) { toggleSelect(notification.id); return; }
        handleNotificationClick(notification);
      }}
    >
      {bulkMode && (
        <input
          type="checkbox"
          checked={selectedIds.has(notification.id)}
          onChange={() => toggleSelect(notification.id)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <div className={cn("h-3 w-3 rounded-full mt-1 shrink-0", getTypeColor(notification.type))} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={cn("font-medium text-sm truncate",
            !notification.is_read && !showArchived ? "text-foreground font-semibold" : "text-muted-foreground"
          )}>
            {notification.title}
          </span>
          {notification.priority && (
            <Badge variant="secondary" className={cn("text-xs shrink-0", getPriorityColor(notification.priority))}>
              {notification.priority}
            </Badge>
          )}
        </div>
                    {notification.message.length > 120 ? (
                      <>
                        <p className="text-xs text-muted-foreground line-clamp-2">{expandedIds.has(notification.id) ? notification.message : notification.message.slice(0, 120)}</p>
                        <button onClick={(e) => { e.stopPropagation(); toggleExpanded(notification.id); }} className="text-xs text-accent hover:underline mt-0.5">
                          {expandedIds.has(notification.id) ? "Voir moins" : "Voir plus"}
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-muted-foreground/70">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
          </span>
          {notification.link && <ExternalLink className="h-3 w-3 text-muted-foreground opacity-60" />}
        </div>
      </div>
      <div className={cn(
        "flex shrink-0 gap-1",
        bulkMode ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
      )}>
        {!notification.is_read && !showArchived && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} title="Marquer comme lu">
            <Check className="h-3 w-3" />
          </Button>
        )}
        {notification.is_read && !showArchived && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); markAsUnread(notification.id); }} title="Marquer comme non lu">
            <EyeOff className="h-3 w-3" />
          </Button>
        )}
                        {!showArchived && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()} title="Reporter">
                                <Clock className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuContent align="end" className="z-[100]">
                                <DropdownMenuLabel>Reporter pour</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.entries(snoozeLabels).map(([mins, label]) => (
                                  <DropdownMenuCheckboxItem
                                    key={mins}
                                    checked={false}
                                    onSelect={(e) => { e.preventDefault(); if (mins === "custom") snoozeWithCustom(notification.id); else snoozeNotification(notification.id, parseInt(mins)); }}
                                  >
                                    {label}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenuPortal>
                          </DropdownMenu>
                        )}
        {!showArchived ? (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-600 hover:text-yellow-600" onClick={(e) => { e.stopPropagation(); archiveNotification(notification.id); }} title="Archiver">
            <X className="h-3 w-3" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); unarchiveNotification(notification.id); }} title="Restaurer">
            <Check className="h-3 w-3" />
          </Button>
        )}
        {isAdmin && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }} title="Supprimer">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );

  const renderGroupedSection = (group: { type: string; items: Notification[] }) => {
    const [expanded, setExpanded] = useState(true);
    return (
      <div key={group.type} className="border-b last:border-b-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50 transition-colors"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <span>{typeLabels[group.type] || group.type}</span>
          <Badge variant="secondary" className="text-xs ml-auto">{group.items.length}</Badge>
        </button>
        {expanded && <div className="divide-y">{group.items.map(renderNotificationItem)}</div>}
      </div>
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50 w-[min(92vw,450px)] max-w-[450px] bg-popover p-0">
          <div className="p-4 border-b space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">{unreadCount} non lu(s)</Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setPreferencesOpen(true)} className="h-7 text-xs" title="Préférences">
                  <Settings2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }} className={cn("h-7 text-xs", bulkMode && "text-accent")} title="Sélection multiple">
                  <Layers className="h-4 w-4" />
                </Button>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs" title="Tout marquer comme lu">
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}
                {isAdmin && showArchived && notifications.filter(n => n.is_archived).length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllArchived} className="h-7 text-xs text-destructive hover:text-destructive" title="Supprimer les archives">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {bulkMode && selectedIds.size > 0 && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs text-muted-foreground">{selectedIds.size} sélectionnée(s)</span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={bulkArchive}>
                  Archiver
                </Button>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="h-7 text-xs text-destructive" onClick={bulkDelete}>
                    Supprimer
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1 w-full sm:w-auto" title="Filtrer par type">
                    <Filter className="h-4 w-4" />
                    <span className="text-xs">{selectedFilters.length > 0 ? `${selectedFilters.length}` : "Type"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filtrer par type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {NOTIF_TYPES.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={selectedFilters.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedFilters([...selectedFilters, type]);
                        else setSelectedFilters(selectedFilters.filter((t) => t !== type));
                      }}
                    >
                      {typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant={showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className="h-9 w-full sm:w-auto"
                title={showArchived ? "Voir actifs" : "Voir archives"}
              >
                {showArchived ? "Archive" : "Actifs"}
              </Button>
              <Select value={dateRange} onValueChange={(v: "all" | "today" | "7d" | "30d" | "90d") => setDateRange(v)}>
                <SelectTrigger className="h-9 w-full sm:w-[130px] text-xs">
                  <CalendarRange className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="7d">7 jours</SelectItem>
                  <SelectItem value="30d">30 jours</SelectItem>
                  <SelectItem value="90d">90 jours</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={groupByType ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupByType(!groupByType)}
                className="h-9 w-full sm:w-auto"
                title="Grouper par catégorie"
              >
                <Layers className="h-4 w-4 mr-1" />
                Grouper
              </Button>
              <Button
                variant={dndMode ? "default" : "outline"}
                size="sm"
                onClick={() => setDndMode(!dndMode)}
                className={cn("h-9 w-full sm:w-auto", dndMode && "bg-yellow-500 hover:bg-yellow-600 text-white")}
                title="Ne pas déranger"
              >
                <Moon className="h-4 w-4 mr-1" />
                NPD
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[min(70vh,450px)]">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">Chargement...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>{showArchived ? "Aucune notification archivée" : "Aucune notification"}</p>
              </div>
            ) : groupByType ? (
              <div>{groupedNotifications.map(renderGroupedSection)}</div>
            ) : (
              <div className="divide-y">{filteredNotifications.map(renderNotificationItem)}</div>
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Preferences Dialog */}
      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Préférences de notifications</DialogTitle>
            <DialogDescription>Choisissez les notifications que vous souhaitez recevoir et par quels canaux.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground pb-1 border-b">
              <div>Type</div>
              <div className="text-center">In-app</div>
              <div className="text-center">Email</div>
              <div className="text-center">Push</div>
            </div>
            {preferences.map((pref) => (
              <div key={pref.type} className="grid grid-cols-4 gap-2 items-center">
                <Label className="text-sm font-medium">{typeLabels[pref.type] || pref.type}</Label>
                <div className="flex justify-center">
                  <Switch checked={pref.inApp} onCheckedChange={() => togglePref(pref.type, "inApp")} />
                </div>
                <div className="flex justify-center">
                  <Switch checked={pref.email} onCheckedChange={() => togglePref(pref.type, "email")} />
                </div>
                <div className="flex justify-center">
                  <Switch checked={pref.push} onCheckedChange={() => togglePref(pref.type, "push")} />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => savePreferences(DEFAULT_PREFERENCES)} variant="outline">Réinitialiser</Button>
            <Button onClick={() => setPreferencesOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationCenter;
