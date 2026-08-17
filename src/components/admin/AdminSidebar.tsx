import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/useRBAC";
import {
  BarChart3,
  CalendarDays,
  Mail,
  Users,
  Settings,
  Bell,
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCog,
  FileText,
  Menu,
  Calendar,
  Gift,
  Share2,
  Megaphone,
  Clock,
  Star,
  Receipt,
  Image as ImageIcon,
  MessageCircle,
  MessageSquare,
  ShieldCheck,
  Wrench,
  Shield,
  HardDrive,
  Activity,
  AlertTriangle,
  ClipboardList,
  UserCheck,
  LayoutDashboard,
  Quote,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AdminSidebarProps {
  onSignOut: () => void;
  pendingCount: number;
  unreadMessages: number;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

interface MenuItem {
  icon: typeof BarChart3;
  label: string;
  value: string;
  path: string;
  permission?: string;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: "Tableau de bord",
    items: [
      { icon: BarChart3, label: "Statistiques", value: "analytics", path: "/admin" },
    ],
  },
  {
    label: "Opérations",
    items: [
      { icon: CalendarDays, label: "Réservations", value: "bookings", path: "/admin?tab=bookings", permission: "bookings.view" },
      { icon: Calendar, label: "Calendrier", value: "calendar", path: "/admin?tab=calendar", permission: "bookings.view" },
      { icon: Mail, label: "Messages", value: "contacts", path: "/admin?tab=contacts", permission: "bookings.view" },
      { icon: MessageCircle, label: "Reviews", value: "reviews-management", path: "/admin?tab=reviews-management", permission: "reviews.view" },
      { icon: MessageSquare, label: "Customer Feedback", value: "customer-feedback", path: "/admin?tab=customer-feedback", permission: "feedback.view" },
      { icon: Star, label: "Avis Clients", value: "feedback", path: "/admin?tab=feedback", permission: "feedback.view" },
      { icon: Clock, label: "Rappels", value: "reminders", path: "/admin?tab=reminders", permission: "bookings.view" },
      { icon: Receipt, label: "Reçus", value: "receipts", path: "/admin?tab=receipts", permission: "bookings.view" },
    ],
  },
  {
    label: "Services & Personnel",
    items: [
      { icon: Wrench, label: "Services", value: "services-management", path: "/admin?tab=services-management", permission: "services.view" },
      { icon: Users, label: "Personnel", value: "staff-management", path: "/admin?tab=staff-management", permission: "staff.view" },
      { icon: Calendar, label: "Planning Staff", value: "staff-calendar", path: "/admin?tab=staff-calendar", permission: "staff.view" },
      { icon: UserCog, label: "Emails Staff", value: "staff", path: "/admin?tab=staff", permission: "staff.view" },
      { icon: ShieldCheck, label: "Vérifications KYC", value: "verifications", path: "/admin/verifications", permission: "users.view" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { icon: Gift, label: "Récompenses", value: "loyalty", path: "/admin?tab=loyalty", permission: "bookings.view" },
      { icon: Share2, label: "Parrainages", value: "referrals", path: "/admin?tab=referrals", permission: "bookings.view" },
      { icon: Users, label: "Abonnés", value: "subscribers", path: "/admin?tab=subscribers", permission: "bookings.view" },
      { icon: Quote, label: "Témoignages", value: "testimonials", path: "/admin?tab=testimonials", permission: "testimonials.view" },
    ],
  },
  {
    label: "Communication",
    items: [
      { icon: Bell, label: "Notifications", value: "notifications", path: "/admin?tab=notifications", permission: "notifications.manage" },
      { icon: Megaphone, label: "Diffusion", value: "broadcast", path: "/admin?tab=broadcast", permission: "notifications.manage" },
      { icon: Bell, label: "Bannière Annonces", value: "announcements", path: "/admin?tab=announcements", permission: "announcements.manage" },
    ],
  },
  {
    label: "Contenu",
    items: [
      { icon: ImageIcon, label: "Projets Galerie", value: "projects", path: "/admin?tab=projects", permission: "projects.view" },
      { icon: ImageIcon, label: "Médiathèque", value: "media", path: "/admin?tab=media", permission: "services.view" },
      { icon: FileText, label: "Rapports", value: "reports", path: "/admin?tab=reports", permission: "reports.view" },
    ],
  },
  {
    label: "Système",
    items: [
      { icon: LayoutDashboard, label: "Super Admin", value: "super-admin", path: "/admin?tab=super-admin", permission: "dashboard.view" },
      { icon: Shield, label: "RBAC", value: "rbac", path: "/admin?tab=rbac", permission: "rbac.view" },
      { icon: UserCheck, label: "User Management", value: "user-management", path: "/admin?tab=user-management", permission: "users.view" },
      { icon: ClipboardList, label: "Audit Logs", value: "audit-logs", path: "/admin?tab=audit-logs", permission: "audit.view" },
      { icon: AlertTriangle, label: "Error Logs", value: "error-logs", path: "/admin?tab=error-logs", permission: "errors.view" },
      { icon: Shield, label: "Security", value: "security", path: "/admin?tab=security", permission: "security.view" },
      { icon: Activity, label: "System Health", value: "system-health", path: "/admin?tab=system-health", permission: "system.logs" },
      { icon: Wrench, label: "Maintenance", value: "maintenance", path: "/admin?tab=maintenance", permission: "maintenance.manage" },
      { icon: HardDrive, label: "Backup Center", value: "backup-center", path: "/admin?tab=backup-center", permission: "backups.create" },
      { icon: Settings, label: "Settings", value: "enterprise-settings", path: "/admin?tab=enterprise-settings", permission: "settings.view" },
      { icon: Zap, label: "Webhooks", value: "webhooks", path: "/admin?tab=webhooks", permission: "webhooks.view" },
    ],
  },
];

const SidebarContent = ({
  collapsed,
  onSignOut,
  pendingCount,
  unreadMessages,
  onNavigate,
}: {
  collapsed: boolean;
  onSignOut: () => void;
  pendingCount: number;
  unreadMessages: number;
  onNavigate?: () => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { can, loading: permsLoading } = usePermissions();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab") || "analytics";

  const handleSignOut = async () => {
    try {
      await onSignOut();
    } catch {
      // continue to navigate even if signOut fails
    }
    navigate("/");
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  const visibleSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.permission) return true;
        if (permsLoading) return false;
        return can(item.permission);
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <Link to="/" onClick={handleNavClick}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3",
              collapsed && "justify-center px-2"
            )}
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Accueil</span>}
          </Button>
        </Link>

        <div className="py-2">
          <div className={cn("h-px bg-border", collapsed && "mx-2")} />
        </div>

        {visibleSections.map((section) => (
          <div key={section.label} className="space-y-1">
            {!collapsed && (
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {section.label}
              </div>
            )}
            {collapsed && <div className="px-2 py-1"><div className="h-px bg-border" /></div>}
            {section.items.map((item) => {
              const isActive =
                (item.value === "verifications" && location.pathname === "/admin/verifications") ||
                (location.pathname === "/admin" && (currentTab === item.value ||
                  (item.value === "analytics" && !searchParams.get("tab"))));
              const showBadge =
                (item.value === "bookings" && pendingCount > 0) ||
                (item.value === "contacts" && unreadMessages > 0);
              const badgeCount = item.value === "bookings" ? pendingCount : unreadMessages;

              return (
                <Link key={item.value} to={item.path} onClick={handleNavClick}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 relative",
                      collapsed && "justify-center px-2",
                      isActive && "bg-accent/10 text-accent hover:bg-accent/20"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                    {showBadge && (
                      <span className={cn(
                        "absolute bg-destructive text-destructive-foreground text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center",
                        collapsed ? "top-0 right-0" : "right-2"
                      )}>
                        {badgeCount}
                      </span>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border space-y-1">
        <Link to="/admin/settings" onClick={handleNavClick}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3",
              collapsed && "justify-center px-2"
            )}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Paramètres</span>}
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </Button>
      </div>
    </>
  );
};

export const AdminSidebar = ({
  onSignOut,
  pendingCount,
  unreadMessages,
  mobileOpen = false,
  onMobileOpenChange,
}: AdminSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Sidebar using Sheet */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-64 p-0 md:hidden">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-xl font-bold">Admin</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-[calc(100%-65px)]">
            <SidebarContent
              collapsed={false}
              onSignOut={onSignOut}
              pendingCount={pendingCount}
              unreadMessages={unreadMessages}
              onNavigate={() => onMobileOpenChange?.(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-screen bg-card border-r border-border z-40 transition-all duration-300 flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-xl font-bold text-foreground">Admin</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <SidebarContent
          collapsed={collapsed}
          onSignOut={onSignOut}
          pendingCount={pendingCount}
          unreadMessages={unreadMessages}
        />
      </aside>
    </>
  );
};

// Mobile trigger button component
export const MobileSidebarTrigger = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant="ghost"
    size="icon"
    className="md:hidden"
    onClick={onClick}
    aria-label="Open menu"
  >
    <Menu className="h-5 w-5" />
  </Button>
);

export default AdminSidebar;
