import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  X,
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
  Server,
  ClipboardList,
  UserCheck,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AdminSidebarProps {
  onSignOut: () => void;
  pendingCount: number;
  unreadMessages: number;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

const menuItems = [
  { icon: BarChart3, label: "Statistiques", value: "analytics", path: "/admin" },
  { icon: Wrench, label: "Services", value: "services-management", path: "/admin?tab=services-management" },
  { icon: MessageCircle, label: "Reviews", value: "reviews-management", path: "/admin?tab=reviews-management" },
  { icon: MessageSquare, label: "Customer Feedback", value: "customer-feedback", path: "/admin?tab=customer-feedback" },
  { icon: CalendarDays, label: "Réservations", value: "bookings", path: "/admin?tab=bookings" },
  { icon: Calendar, label: "Calendrier", value: "calendar", path: "/admin?tab=calendar" },
  { icon: Calendar, label: "Planning Staff", value: "staff-calendar", path: "/admin?tab=staff-calendar" },
  { icon: Mail, label: "Messages", value: "contacts", path: "/admin?tab=contacts" },
  { icon: Users, label: "Abonnés", value: "subscribers", path: "/admin?tab=subscribers" },
  { icon: UserCog, label: "Emails Staff", value: "staff", path: "/admin?tab=staff" },
  { icon: Users, label: "Personnel", value: "staff-management", path: "/admin?tab=staff-management" },
  { icon: Gift, label: "Récompenses", value: "loyalty", path: "/admin?tab=loyalty" },
  { icon: Share2, label: "Parrainages", value: "referrals", path: "/admin?tab=referrals" },
  { icon: Bell, label: "Notifications", value: "notifications", path: "/admin?tab=notifications" },
  { icon: Megaphone, label: "Diffusion", value: "broadcast", path: "/admin?tab=broadcast" },
  { icon: Bell, label: "Bannière Annonces", value: "announcements", path: "/admin?tab=announcements" },
  { icon: Star, label: "Avis Clients", value: "feedback", path: "/admin?tab=feedback" },
  { icon: Star, label: "Modération Avis", value: "reviews", path: "/admin?tab=reviews" },
  { icon: ImageIcon, label: "Projets Galerie", value: "projects", path: "/admin?tab=projects" },
  { icon: Receipt, label: "Reçus", value: "receipts", path: "/admin?tab=receipts" },
  { icon: Clock, label: "Rappels", value: "reminders", path: "/admin?tab=reminders" },
  { icon: FileText, label: "Rapports", value: "reports", path: "/admin?tab=reports" },
  { icon: ShieldCheck, label: "Vérifications KYC", value: "verifications", path: "/admin/verifications" },
  { icon: ImageIcon, label: "Médiathèque", value: "media", path: "/admin?tab=media" },
  // Enterprise modules
  { icon: LayoutDashboard, label: "Super Admin", value: "super-admin", path: "/admin?tab=super-admin" },
  { icon: Shield, label: "RBAC", value: "rbac", path: "/admin?tab=rbac" },
  { icon: UserCheck, label: "User Management", value: "user-management", path: "/admin?tab=user-management" },
  { icon: ClipboardList, label: "Audit Logs", value: "audit-logs", path: "/admin?tab=audit-logs" },
  { icon: AlertTriangle, label: "Error Logs", value: "error-logs", path: "/admin?tab=error-logs" },
  { icon: Shield, label: "Security", value: "security", path: "/admin?tab=security" },
  { icon: Activity, label: "System Health", value: "system-health", path: "/admin?tab=system-health" },
  { icon: Wrench, label: "Maintenance", value: "maintenance", path: "/admin?tab=maintenance" },
  { icon: HardDrive, label: "Backup Center", value: "backup-center", path: "/admin?tab=backup-center" },
  { icon: Clock, label: "Activity Timeline", value: "activity-timeline", path: "/admin?tab=activity-timeline" },
  { icon: Settings, label: "Settings", value: "enterprise-settings", path: "/admin?tab=enterprise-settings" },
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
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab") || "analytics";

  const handleSignOut = async () => {
    await onSignOut();
    navigate("/");
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

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

        {menuItems.map((item) => {
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
