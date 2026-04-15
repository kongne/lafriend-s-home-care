import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const PushNotificationToggle = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const isSupported = typeof window !== "undefined" && "Notification" in window;

  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error("Les notifications ne sont pas supportées sur ce navigateur");
      return;
    }
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        toast.success("Notifications activées ! Vous recevrez des alertes en temps réel.");
        // Show a test notification
        try {
          new Notification("LaFriend's Services", {
            body: "Les notifications sont maintenant activées ✓",
            icon: "/pwa-192x192.png",
          });
        } catch {
          navigator.serviceWorker?.ready?.then(reg => {
            reg.showNotification("LaFriend's Services", {
              body: "Les notifications sont maintenant activées ✓",
              icon: "/pwa-192x192.png",
            });
          });
        }
      } else if (result === "denied") {
        toast.error("Notifications bloquées. Changez les permissions dans les paramètres du navigateur.");
      }
    } catch {
      toast.error("Erreur lors de l'activation des notifications");
    }
    setLoading(false);
  }, [isSupported]);

  if (!isSupported) return null;

  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {permission === "granted" ? (
            <Bell className="h-5 w-5 text-green-500" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {permission === "granted"
                ? "Notifications activées"
                : "Notifications désactivées"}
            </p>
            <p className="text-xs text-muted-foreground">
              {permission === "granted"
                ? "Vous recevez des alertes en temps réel"
                : permission === "denied"
                ? "Bloquées — modifiez dans les paramètres du navigateur"
                : "Activez pour recevoir des alertes en temps réel"}
            </p>
          </div>
        </div>
        {permission !== "granted" && permission !== "denied" && (
          <Button
            size="sm"
            onClick={requestPermission}
            disabled={loading}
            className="bg-accent text-accent-foreground w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Activer
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
