import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { X, Megaphone, Clock, Bell, AlertTriangle, Info, Gift, Percent, Phone, Calendar, Sparkles, Users } from "lucide-react";

interface Announcement {
  id: string; message: string; icon: string | null;
  background_color: string; text_color: string;
  link_url: string | null; link_text: string | null;
  show_countdown: boolean; countdown_ends_at: string | null;
  dismissible: boolean; display_pages: string[] | null;
  target_languages: string[] | null; target_users: string;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Megaphone, Clock, Bell, AlertTriangle, Info, Gift, Percent, Phone, Calendar, Sparkles, Users,
};

const DISMISSED_KEY = "announcement_dismissed";

const getDismissed = (): string[] => {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const addDismissed = (id: string) => {
  const current = getDismissed();
  if (!current.includes(id)) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...current, id]));
  }
};

export const AnnouncementBar = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const { language } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from("announcements")
          .select("id, message, icon, background_color, text_color, link_url, link_text, show_countdown, countdown_ends_at, dismissible, display_pages, target_languages, target_users")
          .eq("status", "active")
          .eq("is_active", true)
          .lte("starts_at", new Date().toISOString())
          .gte("ends_at", new Date().toISOString())
          .order("display_order", { ascending: true });
        if (!error && data) {
          setAnnouncements(data as Announcement[]);
        }
      } catch {}
    };
    fetchAnnouncements();

    const channel = supabase
      .channel("announcements-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, fetchAnnouncements)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (announcements.some(a => a.show_countdown && a.countdown_ends_at)) {
      const timer = setInterval(() => setTime(Date.now()), 1000);
      return () => clearInterval(timer);
    }
  }, [announcements]);

  const matchesPage = useCallback((a: Announcement): boolean => {
    if (!a.display_pages || a.display_pages.length === 0) return true;
    const path = location.pathname;
    return a.display_pages.some(p => {
      if (p.endsWith("/*")) {
        const base = p.slice(0, -2);
        return path.startsWith(base);
      }
      return path === p;
    });
  }, [location.pathname]);

  const matchesLanguage = useCallback((a: Announcement): boolean => {
    if (!a.target_languages || a.target_languages.length === 0) return true;
    return a.target_languages.includes(language);
  }, [language]);

  const matchesUser = useCallback((a: Announcement): boolean => {
    if (a.target_users === "all") return true;
    if (a.target_users === "logged_in") return !!user;
    if (a.target_users === "guests_only") return !user;
    return true;
  }, [user]);

  const getCountdown = (endsAt: string): string => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "Terminé";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    if (days > 0) return `J-${days}`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  const visible = announcements.filter(a =>
    matchesPage(a) && matchesLanguage(a) && matchesUser(a) && !getDismissed().includes(a.id)
  );

  if (visible.length === 0) return null;

  const announcement = visible[0];
  const IconComp = announcement.icon ? ICON_MAP[announcement.icon] : null;

  return (
    <div className={`${announcement.background_color} ${announcement.text_color} relative z-50`}>
      <div className="container mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        {IconComp && <IconComp className="h-4 w-4 flex-shrink-0" />}

        <span className="flex-1 min-w-0 truncate">
          {announcement.link_url ? (
            <a href={announcement.link_url} className="hover:underline" target="_blank" rel="noopener noreferrer">
              {announcement.message}
            </a>
          ) : (
            announcement.message
          )}
        </span>

        {announcement.show_countdown && announcement.countdown_ends_at && (
          <span className="text-xs font-mono whitespace-nowrap flex-shrink-0 opacity-80">
            {getCountdown(announcement.countdown_ends_at)}
          </span>
        )}

        {announcement.link_url && announcement.link_text && (
          <a
            href={announcement.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 font-medium
              ${announcement.background_color === "bg-white" ? "bg-gray-900 text-white hover:bg-gray-800" :
                announcement.background_color === "bg-accent" ? "bg-accent-foreground text-accent hover:opacity-90" :
                "bg-white/20 hover:bg-white/30"}`}
          >
            {announcement.link_text}
          </a>
        )}

        {announcement.dismissible && (
          <button
            type="button"
            onClick={() => { addDismissed(announcement.id); setAnnouncements(prev => prev.filter(a => a.id !== announcement.id)); }}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBar;
