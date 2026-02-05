import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

// Generate VAPID key pair for push notifications
// This is a placeholder - in production, generate these securely
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  loading: boolean;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    loading: true,
  });

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    const isSupported = 'serviceWorker' in navigator && 
                        'PushManager' in window && 
                        'Notification' in window;
    return isSupported;
  }, []);

  // Get current subscription status
  const getSubscription = useCallback(async (): Promise<PushSubscription | null> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!checkSupport()) {
      toast({
        title: "Non supporté",
        description: "Les notifications push ne sont pas supportées sur ce navigateur",
        variant: "destructive"
      });
      return false;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission !== 'granted') {
        toast({
          title: "Permission refusée",
          description: "Vous devez autoriser les notifications pour recevoir des alertes",
          variant: "destructive"
        });
        setState(prev => ({ ...prev, loading: false }));
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save subscription to database
      if (user) {
        const subscriptionJSON = subscription.toJSON();
        
        // Store in profiles or a dedicated table
        // For now, we'll use localStorage and the notifications table
        localStorage.setItem('pushSubscription', JSON.stringify(subscriptionJSON));
        
        // Create a notification to confirm subscription
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'system',
          title: 'Notifications activées',
          message: 'Vous recevrez désormais des notifications push pour les mises à jour importantes',
        });
      }

      setState(prev => ({ 
        ...prev, 
        isSubscribed: true, 
        loading: false 
      }));

      toast({
        title: "Notifications activées",
        description: "Vous recevrez des alertes pour les réservations et mises à jour"
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'activer les notifications",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, [user, toast, checkSupport]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const subscription = await getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        localStorage.removeItem('pushSubscription');
      }

      setState(prev => ({ 
        ...prev, 
        isSubscribed: false, 
        loading: false 
      }));

      toast({
        title: "Notifications désactivées",
        description: "Vous ne recevrez plus de notifications push"
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, [getSubscription, toast]);

  // Send a local notification (for testing)
  const sendLocalNotification = useCallback(async (title: string, body: string, data?: Record<string, string>) => {
    if (!checkSupport()) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/favicon.png',
        data
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [checkSupport]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const isSupported = checkSupport();
      
      if (!isSupported) {
        setState({
          isSupported: false,
          isSubscribed: false,
          permission: 'default',
          loading: false
        });
        return;
      }

      const permission = Notification.permission;
      const subscription = await getSubscription();

      setState({
        isSupported: true,
        isSubscribed: !!subscription,
        permission,
        loading: false
      });
    };

    init();
  }, [checkSupport, getSubscription]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendLocalNotification
  };
}