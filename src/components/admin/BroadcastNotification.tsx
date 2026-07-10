import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Send, 
  Users, 
  UserCheck, 
  Loader2,
  Megaphone,
  Mail,
  Smartphone,
  CheckCircle2
} from "lucide-react";

type RecipientType = "all" | "customers" | "staff" | "admins";
type NotificationType = "info" | "booking" | "warning" | "system";

interface BroadcastStats {
  total: number;
  sent: number;
  failed: number;
}

export function BroadcastNotification() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [recipientType, setRecipientType] = useState<RecipientType>("all");
  const [notificationType, setNotificationType] = useState<NotificationType>("info");
  const [sendEmail, setSendEmail] = useState(false);
  const [sendSms, setSendSms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<BroadcastStats | null>(null);

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre et le message sont requis",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setStats(null);

    try {
      // Call the broadcast edge function
      const { data, error } = await supabase.functions.invoke('broadcast-notification', {
        body: {
          title,
          message,
          link: link || null,
          recipientType,
          notificationType,
          sendEmail,
          sendSms
        }
      });

      if (error) {
        throw error;
      }

      if (!(data as { ok?: boolean })?.ok) {
        throw new Error((data as { error?: string })?.error || "Impossible d'envoyer la notification");
      }

      const resolvedStats = ((data as { data?: { stats?: BroadcastStats } })?.data?.stats) || { total: 0, sent: 0, failed: 0 };

      setStats(resolvedStats);

      toast({
        title: "Diffusion réussie",
        description: `Notification envoyée à ${resolvedStats.sent} utilisateur(s)`
      });

      // Clear form
      setTitle("");
      setMessage("");
      setLink("");

    } catch (error) {
      console.error('Broadcast error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la notification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecipientLabel = (type: RecipientType) => {
    switch (type) {
      case "all": return "Tous les utilisateurs";
      case "customers": return "Clients uniquement";
      case "staff": return "Personnel uniquement";
      case "admins": return "Administrateurs";
    }
  };

  const getNotificationTypeColor = (type: NotificationType) => {
    switch (type) {
      case "info": return "bg-blue-500";
      case "booking": return "bg-green-500";
      case "warning": return "bg-yellow-500";
      case "system": return "bg-purple-500";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-accent" />
            Diffusion de Notification
          </CardTitle>
          <CardDescription>
            Envoyez des notifications à tous les utilisateurs ou à des groupes spécifiques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Message Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de la notification</Label>
              <Input
                id="title"
                placeholder="Ex: Promotion spéciale!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{title.length}/100 caractères</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Écrivez votre message ici..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{message.length}/500 caractères</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Lien (optionnel)</Label>
              <Input
                id="link"
                placeholder="Ex: /customer-portal ou https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
          </div>

          {/* Recipients and Type */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Destinataires</Label>
              <Select value={recipientType} onValueChange={(v) => setRecipientType(v as RecipientType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Tous les utilisateurs
                    </span>
                  </SelectItem>
                  <SelectItem value="customers">
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Clients uniquement
                    </span>
                  </SelectItem>
                  <SelectItem value="staff">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Personnel uniquement
                    </span>
                  </SelectItem>
                  <SelectItem value="admins">
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Administrateurs
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type de notification</Label>
              <Select value={notificationType} onValueChange={(v) => setNotificationType(v as NotificationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      Information
                    </span>
                  </SelectItem>
                  <SelectItem value="booking">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      Réservation
                    </span>
                  </SelectItem>
                  <SelectItem value="warning">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      Avertissement
                    </span>
                  </SelectItem>
                  <SelectItem value="system">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500" />
                      Système
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Channels */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm">Canaux supplémentaires</h4>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  id="send-email"
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                />
                <Label htmlFor="send-email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Envoyer par Email
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="send-sms"
                  checked={sendSms}
                  onCheckedChange={setSendSms}
                />
                <Label htmlFor="send-sms" className="flex items-center gap-2 cursor-pointer">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  Envoyer par SMS
                </Label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 border rounded-lg bg-background">
            <h4 className="font-medium text-sm mb-3">Aperçu</h4>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-md">
              <div className={`h-3 w-3 rounded-full mt-1 ${getNotificationTypeColor(notificationType)}`} />
              <div className="flex-1">
                <p className="font-medium text-sm">{title || "Titre de la notification"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {message || "Le message apparaîtra ici..."}
                </p>
                {link && (
                  <p className="text-xs text-accent mt-1 truncate">{link}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <span>Destinataires: {getRecipientLabel(recipientType)}</span>
              {sendEmail && <Badge variant="secondary" className="text-xs">Email</Badge>}
              {sendSms && <Badge variant="secondary" className="text-xs">SMS</Badge>}
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">Diffusion terminée</p>
                <p className="text-xs text-muted-foreground">
                  {stats.sent} envoyée(s) / {stats.total} total
                  {stats.failed > 0 && ` (${stats.failed} échec(s))`}
                </p>
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button 
            onClick={handleBroadcast} 
            disabled={loading || !title.trim() || !message.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer la notification
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Send Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:border-accent transition-colors" onClick={() => {
          setTitle("🎉 Promotion du jour!");
          setMessage("Profitez de 20% de réduction sur tous nos services de nettoyage. Offre valable aujourd'hui uniquement!");
          setRecipientType("customers");
          setNotificationType("info");
        }}>
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <Bell className="h-5 w-5 text-accent" />
            </div>
            <p className="font-medium text-sm">Promotion</p>
            <p className="text-xs text-muted-foreground">Annoncer une offre</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-accent transition-colors" onClick={() => {
          setTitle("📅 Rappel: Horaires modifiés");
          setMessage("Nos horaires de service seront modifiés cette semaine. Consultez votre espace client pour plus de détails.");
          setRecipientType("all");
          setNotificationType("warning");
        }}>
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mx-auto mb-2">
              <Bell className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="font-medium text-sm">Rappel</p>
            <p className="text-xs text-muted-foreground">Information importante</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-accent transition-colors" onClick={() => {
          setTitle("🛠️ Mise à jour système");
          setMessage("Une maintenance est prévue. Le service sera temporairement indisponible.");
          setRecipientType("all");
          setNotificationType("system");
        }}>
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-2">
              <Bell className="h-5 w-5 text-purple-600" />
            </div>
            <p className="font-medium text-sm">Système</p>
            <p className="text-xs text-muted-foreground">Alerte technique</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}