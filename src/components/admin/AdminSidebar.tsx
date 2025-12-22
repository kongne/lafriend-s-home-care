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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AdminSidebarProps {
  onSignOut: () => void;
  pendingCount: number;
  unreadMessages: number;
}

const menuItems = [
  { icon: BarChart3, label: "Statistiques", value: "analytics", path: "/admin" },
  { icon: CalendarDays, label: "Réservations", value: "bookings", path: "/admin?tab=bookings" },
  { icon: Mail, label: "Messages", value: "contacts", path: "/admin?tab=contacts" },
  { icon: Users, label: "Abonnés", value: "subscribers", path: "/admin?tab=subscribers" },
  { icon: UserCog, label: "Staff", value: "staff", path: "/admin?tab=staff" },
  { icon: Bell, label: "Notifications", value: "notifications", path: "/admin?tab=notifications" },
  { icon: FileText, label: "Rapports", value: "reports", path: "/admin?tab=reports" },
];

export const AdminSidebar = ({ onSignOut, pendingCount, unreadMessages }: AdminSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab") || "analytics";

  const handleSignOut = async () => {
    await onSignOut();
    navigate("/");
  };

  return (
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

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <Link to="/">
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
          const isActive = currentTab === item.value || 
            (item.value === "analytics" && !searchParams.get("tab") && location.pathname === "/admin");
          const showBadge = 
            (item.value === "bookings" && pendingCount > 0) ||
            (item.value === "contacts" && unreadMessages > 0);
          const badgeCount = item.value === "bookings" ? pendingCount : unreadMessages;

          return (
            <Link key={item.value} to={item.path}>
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
        <Link to="/admin/settings">
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
    </aside>
  );
};

export default AdminSidebar;
