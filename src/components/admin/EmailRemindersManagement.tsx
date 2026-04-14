import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Clock,
  Trash2,
  CalendarClock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Loader2,
} from "lucide-react";
import { BulkActions } from "./BulkActions";
import { Checkbox } from "@/components/ui/checkbox";

interface EmailReminder {
  id: string;
  booking_id: string | null;
  email: string;
  reminder_type: string;
  scheduled_send_time: string;
  sent_at: string | null;
  status: string;
  retry_count: number | null;
  last_error: string | null;
  created_at: string;
}

export const EmailRemindersManagement = () => {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<EmailReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "sent" | "cancelled">("all");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDateTime, setNewDateTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleBulkAction = useCallback(async (action: string, ids: string[]): Promise<{ success: number; failed: number }> => {
    if (action === 'delete') {
      const { error } = await supabase.from("email_reminders").delete().in("id", ids);
      setSelectedIds([]);
      fetchReminders();
      return error ? { success: 0, failed: ids.length } : { success: ids.length, failed: 0 };
    }
    const { error } = await supabase.from("email_reminders").update({ status: action }).in("id", ids);
    setSelectedIds([]);
    fetchReminders();
    return error ? { success: 0, failed: ids.length } : { success: ids.length, failed: 0 };
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_reminders")
      .select("*")
      .order("scheduled_send_time", { ascending: false });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setReminders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReminders(); }, []);

  const cancelReminder = async (id: string) => {
    const { error } = await supabase
      .from("email_reminders")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rappel annulé" });
      fetchReminders();
    }
  };

  const rescheduleReminder = async () => {
    if (!rescheduleId || !newDateTime) return;
    setSaving(true);

    const { error } = await supabase
      .from("email_reminders")
      .update({
        scheduled_send_time: new Date(newDateTime).toISOString(),
        status: "pending",
        retry_count: 0,
        last_error: null,
      })
      .eq("id", rescheduleId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rappel reprogrammé" });
      setRescheduleId(null);
      setNewDateTime("");
      fetchReminders();
    }
    setSaving(false);
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase
      .from("email_reminders")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rappel supprimé" });
      fetchReminders();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case "sent":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Envoyé</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" />Annulé</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><AlertCircle className="w-3 h-3 mr-1" />Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filtered = reminders.filter(r => filter === "all" || r.status === filter);

  const pendingCount = reminders.filter(r => r.status === "pending").length;
  const sentCount = reminders.filter(r => r.status === "sent").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Rappels Email</h2>
          <p className="text-sm text-muted-foreground">
            {pendingCount} en attente · {sentCount} envoyés · {reminders.length} total
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReminders}>
          <RefreshCw className="h-4 w-4 mr-2" />Actualiser
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "sent", "cancelled"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "sent" ? "Envoyés" : "Annulés"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Send className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Aucun rappel {filter !== "all" ? `avec le statut "${filter}"` : ""}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((reminder) => (
            <Card key={reminder.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(reminder.status)}
                      <span className="text-sm font-medium truncate">{reminder.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Prévu: {new Date(reminder.scheduled_send_time).toLocaleString("fr-FR")}
                      </span>
                      {reminder.sent_at && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          Envoyé: {new Date(reminder.sent_at).toLocaleString("fr-FR")}
                        </span>
                      )}
                      {reminder.retry_count != null && reminder.retry_count > 0 && (
                        <span className="text-amber-600">{reminder.retry_count} tentative(s)</span>
                      )}
                    </div>
                    {reminder.last_error && (
                      <p className="text-xs text-destructive mt-1">Erreur: {reminder.last_error}</p>
                    )}
                  </div>

                  {reminder.status === "pending" && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRescheduleId(reminder.id);
                          const d = new Date(reminder.scheduled_send_time);
                          setNewDateTime(d.toISOString().slice(0, 16));
                        }}
                      >
                        <CalendarClock className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Reprogrammer</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelReminder(reminder.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Annuler</span>
                      </Button>
                    </div>
                  )}

                  {(reminder.status === "cancelled" || reminder.status === "failed") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReminder(reminder.id)}
                      className="text-destructive hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleId} onOpenChange={(open) => !open && setRescheduleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogrammer le rappel</DialogTitle>
            <DialogDescription>Choisissez une nouvelle date et heure pour l'envoi du rappel.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="datetime-local"
              value={newDateTime}
              onChange={(e) => setNewDateTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleId(null)}>Annuler</Button>
            <Button onClick={rescheduleReminder} disabled={saving || !newDateTime}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
