import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NotificationCenter } from "@/components/admin/NotificationCenter";
import { CustomerAnalytics } from "@/components/customer/CustomerAnalytics";
import { LoyaltyRewards } from "@/components/customer/LoyaltyRewards";
import { ReferralProgram } from "@/components/customer/ReferralProgram";
import { CustomerNotifications } from "@/components/customer/CustomerNotifications";
import { BookingCard } from "@/components/customer/portal/BookingCard";
import { BookingSkeleton } from "@/components/customer/portal/BookingSkeleton";
import { EmptyState } from "@/components/customer/portal/EmptyState";
import { ReviewDialog } from "@/components/customer/portal/ReviewDialog";
import { SettingsTab } from "@/components/customer/portal/SettingsTab";
import {
  Calendar, Clock, Loader2, Repeat, User, Phone, Mail,
  BarChart3, Users, Bell, Settings as SettingsIcon, History,
} from "lucide-react";
import { isPast, isFuture, parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBookings, type Booking } from "@/hooks/portal/useBookings";
import { useProfile } from "@/hooks/portal/useProfile";
import { useReviews } from "@/hooks/portal/useReviews";
import { useNotifications } from "@/hooks/portal/useNotifications";
import { downloadInvoice } from "@/lib/invoice";
import { toast } from "sonner";
import { BookingChatDialog } from "@/components/chat/BookingChatDialog";

const CustomerPortal = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { bookings, isLoading: bookingsLoading, updateBooking } = useBookings();
  const { profile, isLoading: profileLoading } = useProfile();
  const { reviews } = useReviews();
  const { unreadCount } = useNotifications();

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [cancelingBooking, setCancelingBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    preferred_date: "", preferred_time: "", recurrence_type: "", recurrence_end_date: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/customer-portal");
  }, [user, authLoading, navigate]);

  const reviewedIds = useMemo(() => new Set(reviews.map((r) => r.booking_id)), [reviews]);

  const upcomingBookings = bookings.filter(
    (b) => isFuture(parseISO(b.preferred_date)) && b.status !== "cancelled"
  );
  const pastBookings = bookings.filter(
    (b) => isPast(parseISO(b.preferred_date)) || b.status === "cancelled"
  );
  const recurringBookings = bookings.filter((b) => b.is_recurring && b.status !== "cancelled");
  const completedBookings = bookings.filter((b) => b.status === "completed");

  const openReschedule = (b: Booking) => {
    setEditingBooking(b);
    setEditForm({
      preferred_date: b.preferred_date,
      preferred_time: b.preferred_time,
      recurrence_type: b.recurrence_type || "",
      recurrence_end_date: b.recurrence_end_date || "",
    });
  };

  const saveReschedule = async () => {
    if (!editingBooking) return;
    try {
      await updateBooking.mutateAsync({
        id: editingBooking.id,
        values: {
          preferred_date: editForm.preferred_date,
          preferred_time: editForm.preferred_time,
          recurrence_type: editForm.recurrence_type || null,
          recurrence_end_date: editForm.recurrence_end_date || null,
        },
      });
      toast.success("Réservation replanifiée");
      setEditingBooking(null);
    } catch { /* handled by mutation */ }
  };

  const confirmCancel = async () => {
    if (!cancelingBooking) return;
    try {
      await updateBooking.mutateAsync({
        id: cancelingBooking.id,
        values: { status: "cancelled" },
      });
      toast.success("Réservation annulée");
      setCancelingBooking(null);
    } catch { /* handled */ }
  };

  const togglePause = (b: Booking) => {
    updateBooking.mutate({ id: b.id, values: { is_paused: !b.is_paused } });
    toast.success(b.is_paused ? "Abonnement repris" : "Abonnement mis en pause");
  };

  const openWhatsApp = (b: Booking) => {
    const msg = encodeURIComponent(`Bonjour, à propos de ma réservation du ${b.preferred_date} à ${b.preferred_time} (${b.service_type}).`);
    const phone = b.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const cardHandlers = {
    onReschedule: openReschedule,
    onCancel: setCancelingBooking,
    onPauseToggle: togglePause,
    onReview: setReviewBooking,
    onInvoice: downloadInvoice,
    onWhatsApp: openWhatsApp,
    onChat: setChatBooking,
  };

  const loading = bookingsLoading || profileLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 py-8 pt-24 max-w-full">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mon Espace Client</h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos réservations et suivez vos rendez-vous
            </p>
          </div>
          <div className="self-start sm:self-auto">
            <NotificationCenter />
          </div>
        </div>

        {/* Profile Summary */}
        <Card className="mb-8 bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <User className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{profile?.full_name || user?.email?.split("@")[0]}</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user?.email}
                    </span>
                    {profile?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {profile.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4 sm:justify-end">
                <div className="text-center px-4 py-2 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-accent">{upcomingBookings.length}</div>
                  <div className="text-xs text-muted-foreground">À venir</div>
                </div>
                <div className="text-center px-4 py-2 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-green-500">{recurringBookings.length}</div>
                  <div className="text-xs text-muted-foreground">Récurrents</div>
                </div>
                <div className="text-center px-4 py-2 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">{pastBookings.length}</div>
                  <div className="text-xs text-muted-foreground">Historique</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto w-full gap-1 sm:gap-2">
            <TabsTrigger value="upcoming" className="gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 min-w-0">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="truncate hidden sm:inline">À venir</span> ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="recurring" className="gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 min-w-0">
              <Repeat className="h-4 w-4 shrink-0" />
              <span className="truncate hidden sm:inline">Récurrents</span> ({recurringBookings.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 min-w-0">
              <History className="h-4 w-4 shrink-0" />
              <span className="truncate hidden sm:inline">Historique</span> ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 min-w-0 relative">
              <Bell className="h-4 w-4 shrink-0" />
              <span className="truncate hidden sm:inline">Notifs</span>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-accent text-accent-foreground">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 min-w-0">
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span className="truncate hidden sm:inline">Fidélité</span>
            </TabsTrigger>
            <TabsTrigger value="referral" className="gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 min-w-0">
              <Users className="h-4 w-4 shrink-0" />
              <span className="truncate hidden sm:inline">Parrainage</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 min-w-0">
              <SettingsIcon className="h-4 w-4 shrink-0" />
              <span className="truncate hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {loading ? <BookingSkeleton /> : upcomingBookings.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Aucune réservation à venir"
                description="Réservez votre premier service en quelques clics"
                actionLabel="Réserver maintenant"
                onAction={() => navigate("/#booking")}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingBookings.map((b) => (
                  <BookingCard key={b.id} booking={b} hasReview={reviewedIds.has(b.id)} {...cardHandlers} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recurring">
            {loading ? <BookingSkeleton /> : recurringBookings.length === 0 ? (
              <EmptyState
                icon={Repeat}
                title="Aucun abonnement récurrent"
                description="Économisez du temps avec des nettoyages réguliers"
                actionLabel="Créer un abonnement"
                onAction={() => navigate("/#booking")}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recurringBookings.map((b) => (
                  <BookingCard key={b.id} booking={b} hasReview={reviewedIds.has(b.id)} {...cardHandlers} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {loading ? <BookingSkeleton /> : pastBookings.length === 0 ? (
              <EmptyState icon={Clock} title="Aucun historique" description="Vos réservations passées apparaîtront ici" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastBookings.map((b) => (
                  <BookingCard key={b.id} booking={b} hasReview={reviewedIds.has(b.id)} {...cardHandlers} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <CustomerAnalytics bookings={bookings} profile={profile} />
              <LoyaltyRewards profile={profile} />
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <CustomerNotifications />
          </TabsContent>

          <TabsContent value="referral">
            <ReferralProgram />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* Edit Dialog */}
      <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replanifier la réservation</DialogTitle>
            <DialogDescription>
              Choisissez une nouvelle date et heure (au moins 24h à l'avance).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={editForm.preferred_date}
                onChange={(e) => setEditForm(prev => ({ ...prev, preferred_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Heure</Label>
              <Select
                value={editForm.preferred_time}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, preferred_time: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:00">08:00</SelectItem>
                  <SelectItem value="09:00">09:00</SelectItem>
                  <SelectItem value="10:00">10:00</SelectItem>
                  <SelectItem value="11:00">11:00</SelectItem>
                  <SelectItem value="14:00">14:00</SelectItem>
                  <SelectItem value="15:00">15:00</SelectItem>
                  <SelectItem value="16:00">16:00</SelectItem>
                  <SelectItem value="17:00">17:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingBooking?.is_recurring && (
              <>
                <div className="space-y-2">
                  <Label>Fréquence</Label>
                  <Select
                    value={editForm.recurrence_type}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, recurrence_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date de fin (optionnel)</Label>
                  <Input
                    type="date"
                    value={editForm.recurrence_end_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, recurrence_end_date: e.target.value }))}
                    min={editForm.preferred_date}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBooking(null)}>
              Annuler
            </Button>
            <Button onClick={saveReschedule} className="bg-accent text-accent-foreground">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelingBooking} onOpenChange={() => setCancelingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la réservation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {cancelingBooking && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-medium">{cancelingBooking.service_type}</p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(cancelingBooking.preferred_date), "EEEE d MMMM yyyy", { locale: fr })} à {cancelingBooking.preferred_time}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelingBooking(null)}>
              Non, garder
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Oui, annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReviewDialog booking={reviewBooking} onClose={() => setReviewBooking(null)} />
    </div>
  );
};

export default CustomerPortal;
