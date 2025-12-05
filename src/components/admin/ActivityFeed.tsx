import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, Mail, User, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: "booking" | "contact" | "subscriber" | "status_change";
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxHeight?: string;
  loading?: boolean;
}

const iconMap = {
  booking: CalendarDays,
  contact: Mail,
  subscriber: User,
  status_change: Check,
};

const colorMap = {
  booking: "text-blue-500 bg-blue-500/10",
  contact: "text-purple-500 bg-purple-500/10",
  subscriber: "text-green-500 bg-green-500/10",
  status_change: "text-accent bg-accent/10",
};

export const ActivityFeed = ({
  activities,
  maxHeight = "400px",
  loading = false,
}: ActivityFeedProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune activité récente
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const Icon = iconMap[activity.type];
                const colorClass = colorMap[activity.type];

                return (
                  <div
                    key={activity.id}
                    className={cn(
                      "flex gap-3 pb-4",
                      index !== activities.length - 1 && "border-b border-border"
                    )}
                  >
                    <div className={cn("p-2 rounded-full h-fit", colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
