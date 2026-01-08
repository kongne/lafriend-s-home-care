import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarPlus,
  Mail,
  FileText,
  Users,
  Settings,
  RefreshCw,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface QuickActionsProps {
  onRefresh: () => void;
  onExportBookings: () => void;
  onExportContacts: () => void;
}

export const QuickActions = ({ onRefresh, onExportBookings, onExportContacts }: QuickActionsProps) => {
  const [, setSearchParams] = useSearchParams();

  const actions = [
    {
      icon: CalendarPlus,
      label: "Réservations",
      onClick: () => setSearchParams({ tab: "bookings" }),
      color: "text-blue-500",
    },
    {
      icon: Mail,
      label: "Messages",
      onClick: () => setSearchParams({ tab: "contacts" }),
      color: "text-purple-500",
    },
    {
      icon: Users,
      label: "Abonnés",
      onClick: () => setSearchParams({ tab: "subscribers" }),
      color: "text-green-500",
    },
    {
      icon: FileText,
      label: "Rapports",
      onClick: () => setSearchParams({ tab: "reports" }),
      color: "text-orange-500",
    },
    {
      icon: Settings,
      label: "Staff",
      onClick: () => setSearchParams({ tab: "staff" }),
      color: "text-gray-500",
    },
    {
      icon: RefreshCw,
      label: "Actualiser",
      onClick: onRefresh,
      color: "text-accent",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1"
              onClick={action.onClick}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
