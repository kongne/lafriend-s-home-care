import { useMemo } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Clock, MapPin, Repeat, Edit2, XCircle, CheckCircle2, AlertCircle,
  Star, Pause, Play, FileDown, MessageCircle,
} from "lucide-react";
import { format, parseISO, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import type { Booking } from "@/hooks/portal/useBookings";

const STATUS: Record<string, { color: string; icon: JSX.Element; label: string }> = {
  pending: { color: "bg-yellow-500", icon: <AlertCircle className="h-3 w-3" />, label: "En attente" },
  confirmed: { color: "bg-green-500", icon: <CheckCircle2 className="h-3 w-3" />, label: "Confirmé" },
  completed: { color: "bg-blue-500", icon: <CheckCircle2 className="h-3 w-3" />, label: "Terminé" },
  cancelled: { color: "bg-red-500", icon: <XCircle className="h-3 w-3" />, label: "Annulé" },
};

const RECURRENCE_LABEL: Record<string, string> = {
  weekly: "Hebdomadaire", biweekly: "Bi-hebdomadaire", monthly: "Mensuel",
};

interface Props {
  booking: Booking;
  hasReview?: boolean;
  onReschedule?: (b: Booking) => void;
  onCancel?: (b: Booking) => void;
  onPauseToggle?: (b: Booking) => void;
  onReview?: (b: Booking) => void;
  onInvoice?: (b: Booking) => void;
  onWhatsApp?: (b: Booking) => void;
}

export const BookingCard = ({
  booking, hasReview, onReschedule, onCancel, onPauseToggle, onReview, onInvoice, onWhatsApp,
}: Props) => {
  const status = STATUS[booking.status] || STATUS.pending;

  const canReschedule = useMemo(() => {
    try {
      const dt = parseISO(`${booking.preferred_date}T${booking.preferred_time}`);
      return differenceInHours(dt, new Date()) >= 24 && !["cancelled", "completed"].includes(booking.status);
    } catch {
      return false;
    }
  }, [booking]);

  const isActive = !["cancelled", "completed"].includes(booking.status);
  const isCompleted = booking.status === "completed";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg truncate">{booking.service_type}</CardTitle>
            <CardDescription className="mt-1 text-xs">
              Réservé le {format(parseISO(booking.created_at), "d MMM yyyy", { locale: fr })}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={`${status.color} text-white flex items-center gap-1`}>
              {status.icon} {status.label}
            </Badge>
            {booking.is_paused && (
              <Badge variant="outline" className="text-xs">En pause</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-accent shrink-0" />
          <span className="truncate">{format(parseISO(booking.preferred_date), "EEEE d MMMM yyyy", { locale: fr })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-accent shrink-0" />
          <span>{booking.preferred_time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-accent shrink-0" />
          <span className="truncate">{booking.address}</span>
        </div>

        {booking.is_recurring && (
          <div className="flex items-center gap-2 text-sm">
            <Repeat className="h-4 w-4 text-green-500 shrink-0" />
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              {RECURRENCE_LABEL[booking.recurrence_type || ""] || booking.recurrence_type}
            </Badge>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-3 border-t">
          {isActive && onReschedule && (
            <Button
              variant="outline" size="sm"
              onClick={() => onReschedule(booking)}
              disabled={!canReschedule}
              title={!canReschedule ? "Replanification possible jusqu'à 24h avant le rendez-vous" : ""}
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" /> Replanifier
            </Button>
          )}
          {isActive && booking.is_recurring && onPauseToggle && (
            <Button variant="outline" size="sm" onClick={() => onPauseToggle(booking)}>
              {booking.is_paused
                ? <><Play className="h-3.5 w-3.5 mr-1" /> Reprendre</>
                : <><Pause className="h-3.5 w-3.5 mr-1" /> Pause</>}
            </Button>
          )}
          {isActive && onCancel && (
            <Button variant="outline" size="sm" onClick={() => onCancel(booking)} className="text-destructive hover:text-destructive">
              <XCircle className="h-3.5 w-3.5 mr-1" /> Annuler
            </Button>
          )}
          {isCompleted && onReview && !hasReview && (
            <Button size="sm" onClick={() => onReview(booking)} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Star className="h-3.5 w-3.5 mr-1" /> Laisser un avis
            </Button>
          )}
          {isCompleted && hasReview && (
            <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> Avis publié</Badge>
          )}
          {isCompleted && onInvoice && (
            <Button variant="outline" size="sm" onClick={() => onInvoice(booking)}>
              <FileDown className="h-3.5 w-3.5 mr-1" /> Facture
            </Button>
          )}
          {isActive && onWhatsApp && booking.phone && (
            <Button variant="ghost" size="sm" onClick={() => onWhatsApp(booking)} className="text-green-600">
              <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
