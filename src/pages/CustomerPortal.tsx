import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NotificationCenter } from "@/components/admin/NotificationCenter";
import { CustomerAnalytics } from "@/components/customer/CustomerAnalytics";
import { LoyaltyRewards } from "@/components/customer/LoyaltyRewards";
import { ReferralProgram } from "@/components/customer/ReferralProgram";
import { CustomerNotifications } from "@/components/customer/CustomerNotifications";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Loader2, 
  Repeat, 
  Edit2, 
  XCircle,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Mail,
  BarChart3,
  Award,
  Users,
  Bell,
} from "lucide-react";
import { format, parseISO, isPast, isFuture } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Booking {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  message: string | null;
  status: string;
  created_at: string;
  is_recurring: boolean;
  recurrence_type: string | null;
  recurrence_end_date: string | null;
  assigned_staff_id: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  total_spent?: number | null;
  loyalty_points?: number | null;
  loyalty_tier?: string | null;
}

const CustomerPortal = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [cancelingBooking, setCancelingBooking] = useState<Booking | null>(null);
  const queryClient = useQueryClient();
  const [editForm, setEditForm] = useState({
    preferred_date: "",
    preferred_time: "",
    recurrence_type: "",
    recurrence_end_date: ""
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/customer-portal");
    }
  }, [user, authLoading, navigate]);

  const bookingsQuery = useQuery({
    queryKey: ["bookings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user!.id)
        .order("preferred_date", { ascending: false });
      if (error) throw error;
      return (data || []) as Booking[];
    },
  });

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  const bookings = bookingsQuery.data ?? [];
  const profile = profileQuery.data ?? null;
  const loading = bookingsQuery.isLoading || profileQuery.isLoading;

  const fetchProfile = () => queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
  const fetchBookings = () => queryClient.invalidateQueries({ queryKey: ["bookings", user?.id] });

  const updateBookingMutation = useMutation({
    mutationFn: async (payload: { id: string; values: Partial<Booking> }) => {
      const { error } = await supabase
        .from("bookings")
        .update(payload.values)
        .eq("id", payload.id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => fetchBookings(),
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pending: { color: "bg-yellow-500", icon: <AlertCircle className="h-3 w-3" />, label: "En attente" },
      confirmed: { color: "bg-green-500", icon: <CheckCircle2 className="h-3 w-3" />, label: "Confirmé" },
      completed: { color: "bg-blue-500", icon: <CheckCircle2 className="h-3 w-3" />, label: "Terminé" },
      cancelled: { color: "bg-red-500", icon: <XCircle className="h-3 w-3" />, label: "Annulé" },
    };
    const { color, icon, label } = config[status] || config.pending;
    return (
      <Badge className={`${color} text-white flex items-center gap-1`}>
        {icon} {label}
      </Badge>
    );
  };

  const getRecurrenceLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      weekly: "Hebdomadaire",
      biweekly: "Bi-hebdomadaire",
      monthly: "Mensuel",
    };
    return labels[type || ""] || type;
  };

  const upcomingBookings = bookings.filter(
    b => isFuture(parseISO(b.preferred_date)) && b.status !== "cancelled"
  );
  const pastBookings = bookings.filter(
    b => isPast(parseISO(b.preferred_date)) || b.status === "cancelled"
  );
  const recurringBookings = bookings.filter(b => b.is_recurring && b.status !== "cancelled");

  const handleEditClick = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      preferred_date: booking.preferred_date,
      preferred_time: booking.preferred_time,
      recurrence_type: booking.recurrence_type || "",
      recurrence_end_date: booking.recurrence_end_date || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;
    try {
      await updateBookingMutation.mutateAsync({
        id: editingBooking.id,
        values: {
          preferred_date: editForm.preferred_date,
          preferred_time: editForm.preferred_time,
          recurrence_type: editForm.recurrence_type || null,
          recurrence_end_date: editForm.recurrence_end_date || null,
        },
      });
      toast({ title: "Réservation modifiée", description: "Vos modifications ont été enregistrées" });
      setEditingBooking(null);
    } catch {
      toast({ title: "Erreur", description: "Impossible de modifier la réservation", variant: "destructive" });
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelingBooking) return;
    try {
      await updateBookingMutation.mutateAsync({
        id: cancelingBooking.id,
        values: { status: "cancelled" },
      });
      toast({ title: "Réservation annulée", description: "Votre réservation a été annulée" });
      setCancelingBooking(null);
    } catch {
      toast({ title: "Erreur", description: "Impossible d'annuler la réservation", variant: "destructive" });
    }
  };

  const BookingCard = ({ booking, showActions = true }: { booking: Booking; showActions?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{booking.service_type}</CardTitle>
            <CardDescription className="mt-1">
              Réservé le {format(parseISO(booking.created_at), "d MMMM yyyy", { locale: fr })}
            </CardDescription>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-accent" />
          <span>{format(parseISO(booking.preferred_date), "EEEE d MMMM yyyy", { locale: fr })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-accent" />
          <span>{booking.preferred_time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-accent" />
          <span className="truncate">{booking.address}</span>
        </div>
        
        {booking.is_recurring && (
          <div className="flex items-center gap-2 text-sm">
            <Repeat className="h-4 w-4 text-green-500" />
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {getRecurrenceLabel(booking.recurrence_type)}
              {booking.recurrence_end_date && (
                <span className="ml-1">
                  jusqu'au {format(parseISO(booking.recurrence_end_date), "d MMM yyyy", { locale: fr })}
                </span>
              )}
            </Badge>
          </div>
        )}

        {showActions && booking.status !== "cancelled" && booking.status !== "completed" && (
          <div className="flex gap-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditClick(booking)}
              className="flex-1"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelingBooking(booking)}
              className="flex-1 text-destructive hover:text-destructive"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Annuler
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (authLoading || loading) {
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
              <Clock className="h-4 w-4 shrink-0" />
              <span className="truncate hidden sm:inline">Historique</span> ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 px-2 sm:px-3 py-2 text-xs sm:text-sm flex-1 min-w-0 relative">
              <Bell className="h-4 w-4 shrink-0" />
              <span className="truncate hidden sm:inline">Notifs</span>
              {unreadNotifCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-accent text-accent-foreground">
                  {unreadNotifCount}
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
          </TabsList>

          <TabsContent value="upcoming">
            {upcomingBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune réservation à venir</h3>
                <p className="text-muted-foreground mb-4">
                  Vous n'avez pas de réservations programmées
                </p>
                <Button onClick={() => navigate("/#booking")} className="bg-accent text-accent-foreground">
                  Réserver maintenant
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recurring">
            {recurringBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Repeat className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun abonnement récurrent</h3>
                <p className="text-muted-foreground mb-4">
                  Économisez du temps en programmant des nettoyages réguliers
                </p>
                <Button onClick={() => navigate("/#booking")} className="bg-accent text-accent-foreground">
                  Créer un abonnement
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recurringBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {pastBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun historique</h3>
                <p className="text-muted-foreground">
                  Vos réservations passées apparaîtront ici
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <CustomerAnalytics bookings={bookings} profile={profile} />
              <LoyaltyRewards profile={profile} onPointsUpdate={fetchProfile} />
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <CustomerNotifications onUnreadCountChange={setUnreadNotifCount} />
          </TabsContent>

          <TabsContent value="referral">
            <ReferralProgram />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* Edit Dialog */}
      <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la réservation</DialogTitle>
            <DialogDescription>
              Modifiez les détails de votre réservation
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
            <Button onClick={handleSaveEdit} className="bg-accent text-accent-foreground">
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
            <Button variant="destructive" onClick={handleCancelBooking}>
              Oui, annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerPortal;
