import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { error as logError } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { BulkActions, SelectableItem } from "@/components/admin/BulkActions";
import { AdminSidebar, MobileSidebarTrigger } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { KPICard } from "@/components/admin/KPICard";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { TaskList } from "@/components/admin/TaskList";
import { QuickActions } from "@/components/admin/QuickActions";
import { RecentBookingsTable } from "@/components/admin/RecentBookingsTable";
import { exportToCSV, bookingColumns, contactColumns, subscriberColumns } from "@/lib/exportCsv";
import { exportToPDF } from "@/lib/exportPdf";
import { staffEmailSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { 
  CalendarDays, 
  Mail, 
  Users, 
  Loader2,
  Trash2,
  Plus,
  RefreshCw,
  Download,
  BarChart3,
  Send,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";

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
}

interface ContactSubmission {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface StaffEmail {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [staffEmails, setStaffEmails] = useState<StaffEmail[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [sendingConfirmation, setSendingConfirmation] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeTab = searchParams.get("tab") || "analytics";

  // Sample tasks for demo
  const [tasks, setTasks] = useState([
    { id: "1", title: "Confirmer les réservations en attente", completed: false, priority: "high" as const },
    { id: "2", title: "Répondre aux messages clients", completed: false, priority: "medium" as const },
    { id: "3", title: "Vérifier les disponibilités", completed: true, priority: "low" as const },
  ]);

  // Computed values
  const pendingBookings = useMemo(() => bookings.filter(b => b.status === "pending").length, [bookings]);
  const unreadMessages = useMemo(() => contacts.filter(c => c.status === "unread").length, [contacts]);
  const confirmedBookings = useMemo(() => bookings.filter(b => b.status === "confirmed").length, [bookings]);
  
  // Activity feed from recent bookings and contacts
  const activities = useMemo(() => {
    const bookingActivities = bookings.slice(0, 5).map(b => ({
      id: b.id,
      type: "booking" as const,
      title: `Nouvelle réservation`,
      description: `${b.full_name} - ${b.service_type}`,
      timestamp: b.created_at,
      status: b.status,
    }));
    const contactActivities = contacts.slice(0, 5).map(c => ({
      id: c.id,
      type: "contact" as const,
      title: `Nouveau message`,
      description: `${c.full_name}: ${c.subject}`,
      timestamp: c.created_at,
      status: c.status,
    }));
    return [...bookingActivities, ...contactActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [bookings, contacts]);

  // Notifications
  const notifications = useMemo(() => {
    const notifs = [];
    if (pendingBookings > 0) {
      notifs.push({
        id: "pending",
        title: "Réservations en attente",
        message: `${pendingBookings} réservation(s) à confirmer`,
        time: "Maintenant",
        read: false,
      });
    }
    if (unreadMessages > 0) {
      notifs.push({
        id: "unread",
        title: "Messages non lus",
        message: `${unreadMessages} message(s) à lire`,
        time: "Maintenant",
        read: false,
      });
    }
    return notifs;
  }, [pendingBookings, unreadMessages]);

  // Filtered data based on search
  const filteredBookings = useMemo(() => {
    if (!searchQuery) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter(b => 
      b.full_name.toLowerCase().includes(q) ||
      b.email.toLowerCase().includes(q) ||
      b.service_type.toLowerCase().includes(q)
    );
  }, [bookings, searchQuery]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  // Real-time subscriptions for new bookings and contacts
  useEffect(() => {
    if (!isAdmin) return;

    const bookingsChannel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          const newBooking = payload.new as Booking;
          setBookings((prev) => [newBooking, ...prev]);
          toast({
            title: "Nouvelle réservation",
            description: `${newBooking.full_name} - ${newBooking.service_type}`,
          });
        }
      )
      .subscribe();

    const contactsChannel = supabase
      .channel('contacts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contact_submissions' },
        (payload) => {
          const newContact = payload.new as ContactSubmission;
          setContacts((prev) => [newContact, ...prev]);
          toast({
            title: "Nouveau message",
            description: `${newContact.full_name}: ${newContact.subject}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(contactsChannel);
    };
  }, [isAdmin, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) checkAdminRole();
  }, [user, authLoading, navigate]);

  const checkAdminRole = async () => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user!.id,
        _role: 'admin'
      });
      if (error) throw error;
      if (!data) {
        toast({ title: "Accès refusé", description: "Vous n'avez pas les permissions d'administrateur.", variant: "destructive" });
        navigate("/");
        return;
      }
      setIsAdmin(true);
      fetchAllData();
    } catch (err) {
      logError("Error checking admin role:", err);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([fetchBookings(), fetchContacts(), fetchStaffEmails(), fetchSubscribers()]);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (!error && data) setBookings(data);
  };

  const fetchContacts = async () => {
    const { data, error } = await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false });
    if (!error && data) setContacts(data);
  };

  const fetchStaffEmails = async () => {
    const { data, error } = await supabase.from("staff_emails").select("*").order("created_at", { ascending: false });
    if (!error && data) setStaffEmails(data);
  };

  const fetchSubscribers = async () => {
    const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false });
    if (!error && data) setSubscribers(data);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (!error) {
      toast({ title: "Statut mis à jour" });
      fetchBookings();
    }
  };

  const updateContactStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("contact_submissions").update({ status }).eq("id", id);
    if (!error) {
      toast({ title: "Statut mis à jour" });
      fetchContacts();
    }
  };

  const sendBookingConfirmation = async (booking: Booking) => {
    setSendingConfirmation(booking.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-booking-confirmation', {
        method: 'POST',
        body: {
          clientEmail: booking.email,
          clientName: booking.full_name,
          serviceType: booking.service_type,
          preferredDate: booking.preferred_date,
          preferredTime: booking.preferred_time,
          address: booking.address,
          language: 'fr'
        }
      });

      if (error) {
        logError('Send booking confirmation error:', error);
        const errMsg = (error as any)?.message || "Erreur lors de l'envoi de la confirmation";
        toast({ title: "Erreur", description: errMsg, variant: "destructive" });
        return;
      }

      toast({ title: "Confirmation envoyée", description: `Email envoyé à ${booking.email}` });
    } catch (err) {
      logError("Error sending confirmation:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Erreur", description: msg || "Impossible d'envoyer la confirmation", variant: "destructive" });
    } finally {
      setSendingConfirmation(null);
    }
  };

  const addStaffEmail = async () => {
    const validation = staffEmailSchema.safeParse({ email: newStaffEmail, name: newStaffName || undefined });
    if (!validation.success) {
      toast({ title: "Erreur", description: validation.error.errors[0].message, variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("staff_emails").insert({ email: validation.data.email, name: validation.data.name || null });
    if (!error) {
      toast({ title: "Email ajouté" });
      setNewStaffEmail("");
      setNewStaffName("");
      fetchStaffEmails();
    } else {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const removeStaffEmail = async (id: string) => {
    const { error } = await supabase.from("staff_emails").delete().eq("id", id);
    if (!error) {
      toast({ title: "Email supprimé" });
      fetchStaffEmails();
    }
  };

  const handleBulkBookingAction = useCallback(async (action: string, ids: string[]) => {
    if (action === 'delete') {
      toast({ title: "Action non disponible", description: "La suppression en masse nécessite une mise à jour des permissions", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("bookings").update({ status: action }).in("id", ids);
    if (!error) {
      toast({ title: "Mise à jour effectuée", description: `${ids.length} réservation(s) mise(s) à jour` });
      setSelectedBookings([]);
      fetchBookings();
    } else {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  const handleBulkContactAction = useCallback(async (action: string, ids: string[]) => {
    if (action === 'delete') {
      toast({ title: "Action non disponible", description: "La suppression en masse nécessite une mise à jour des permissions", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("contact_submissions").update({ status: action }).in("id", ids);
    if (!error) {
      toast({ title: "Mise à jour effectuée", description: `${ids.length} message(s) mis à jour` });
      setSelectedContacts([]);
      fetchContacts();
    } else {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  const toggleBookingSelection = (id: string, checked: boolean) => {
    setSelectedBookings(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const toggleContactSelection = (id: string, checked: boolean) => {
    setSelectedContacts(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-green-500",
      completed: "bg-blue-500",
      cancelled: "bg-red-500",
      unread: "bg-yellow-500",
      read: "bg-blue-500",
      replied: "bg-green-500",
    };
    return <Badge className={`${colors[status] || "bg-gray-500"} text-white`}>{status}</Badge>;
  };

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const renderContent = () => {
    switch (activeTab) {
      case "analytics":
        return (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard title="Réservations" value={bookings.length} change={12} icon={CalendarDays} />
              <KPICard title="En attente" value={pendingBookings} icon={Clock} iconColor="text-yellow-500" />
              <KPICard title="Confirmées" value={confirmedBookings} change={8} icon={CheckCircle2} iconColor="text-green-500" />
              <KPICard title="Messages" value={contacts.length} icon={Mail} iconColor="text-purple-500" />
            </div>

            {/* Quick Actions */}
            <QuickActions 
              onRefresh={fetchAllData}
              onExportBookings={() => exportToPDF(bookings, "reservations", bookingColumns, "Réservations")}
              onExportContacts={() => exportToPDF(contacts, "messages", contactColumns, "Messages")}
            />

            {/* Recent Bookings Table */}
            <RecentBookingsTable 
              bookings={bookings}
              onStatusChange={updateBookingStatus}
            />

            {/* Charts & Analytics */}
            <AdminAnalytics bookings={bookings} contacts={contacts} />

            {/* Activity & Tasks */}
            <div className="grid lg:grid-cols-2 gap-6">
              <ActivityFeed activities={activities} />
              <TaskList
                tasks={tasks}
                onToggle={(id, completed) => setTasks(tasks.map(t => t.id === id ? { ...t, completed } : t))}
                onDelete={(id) => setTasks(tasks.filter(t => t.id !== id))}
              />
            </div>
          </div>
        );

      case "bookings":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <BulkActions
                selectedIds={selectedBookings}
                onSelectAll={(checked) => setSelectedBookings(checked ? filteredBookings.map(b => b.id) : [])}
                allSelected={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                someSelected={selectedBookings.length > 0 && selectedBookings.length < filteredBookings.length}
                onBulkAction={handleBulkBookingAction}
                type="bookings"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredBookings, "reservations", bookingColumns)}>
                  <Download className="h-4 w-4 mr-2" />CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportToPDF(filteredBookings, "reservations", bookingColumns, "Réservations")}>
                  <FileText className="h-4 w-4 mr-2" />PDF
                </Button>
              </div>
            </div>
            
            {filteredBookings.map((booking) => (
              <SelectableItem key={booking.id} id={booking.id} selected={selectedBookings.includes(booking.id)} onSelect={toggleBookingSelection}>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{booking.full_name}</CardTitle>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-4">
                      <div><strong>Email:</strong> {booking.email}</div>
                      <div><strong>Tél:</strong> {booking.phone}</div>
                      <div><strong>Service:</strong> {booking.service_type}</div>
                      <div><strong>Date:</strong> {booking.preferred_date} à {booking.preferred_time}</div>
                      <div className="col-span-2"><strong>Adresse:</strong> {booking.address}</div>
                      {booking.message && <div className="col-span-2"><strong>Message:</strong> {booking.message}</div>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateBookingStatus(booking.id, "confirmed")}>Confirmer</Button>
                      <Button size="sm" variant="outline" onClick={() => updateBookingStatus(booking.id, "completed")}>Terminé</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateBookingStatus(booking.id, "cancelled")}>Annuler</Button>
                      {booking.status === 'confirmed' && (
                        <Button size="sm" variant="secondary" onClick={() => sendBookingConfirmation(booking)} disabled={sendingConfirmation === booking.id}>
                          {sendingConfirmation === booking.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                          Envoyer confirmation
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </SelectableItem>
            ))}
            {filteredBookings.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Aucune réservation</CardContent></Card>}
          </div>
        );

      case "contacts":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <BulkActions selectedIds={selectedContacts} onSelectAll={(checked) => setSelectedContacts(checked ? filteredContacts.map(c => c.id) : [])} allSelected={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0} someSelected={selectedContacts.length > 0 && selectedContacts.length < filteredContacts.length} onBulkAction={handleBulkContactAction} type="contacts" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredContacts, "messages", contactColumns)}><Download className="h-4 w-4 mr-2" />CSV</Button>
                <Button variant="outline" size="sm" onClick={() => exportToPDF(filteredContacts, "messages", contactColumns, "Messages")}><FileText className="h-4 w-4 mr-2" />PDF</Button>
              </div>
            </div>
            {filteredContacts.map((contact) => (
              <SelectableItem key={contact.id} id={contact.id} selected={selectedContacts.includes(contact.id)} onSelect={toggleContactSelection}>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{contact.subject}</CardTitle>
                      {getStatusBadge(contact.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div><strong>De:</strong> {contact.full_name}</div>
                      <div><strong>Email:</strong> {contact.email}</div>
                      {contact.phone && <div><strong>Tél:</strong> {contact.phone}</div>}
                      <div className="col-span-2"><strong>Message:</strong> {contact.message}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateContactStatus(contact.id, "read")}>Marquer lu</Button>
                      <Button size="sm" variant="outline" onClick={() => updateContactStatus(contact.id, "replied")}>Répondu</Button>
                    </div>
                  </CardContent>
                </Card>
              </SelectableItem>
            ))}
            {filteredContacts.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Aucun message</CardContent></Card>}
          </div>
        );

      case "subscribers":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Abonnés Newsletter ({subscribers.length})</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToCSV(subscribers, "abonnes", subscriberColumns)}><Download className="h-4 w-4 mr-2" />CSV</Button>
                <Button variant="outline" size="sm" onClick={() => exportToPDF(subscribers, "abonnes", subscriberColumns, "Abonnés Newsletter")}><FileText className="h-4 w-4 mr-2" />PDF</Button>
              </div>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {subscribers.map((sub) => (
                    <div key={sub.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">{sub.email}</span>
                      <span className="text-sm text-muted-foreground">{new Date(sub.subscribed_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  ))}
                  {subscribers.length === 0 && <p className="text-center text-muted-foreground py-4">Aucun abonné</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "staff":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Ajouter un email staff</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Label htmlFor="staffName">Nom</Label>
                    <Input id="staffName" placeholder="Nom (optionnel)" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="staffEmail">Email</Label>
                    <Input id="staffEmail" type="email" placeholder="email@exemple.com" value={newStaffEmail} onChange={(e) => setNewStaffEmail(e.target.value)} />
                  </div>
                  <div className="flex items-end"><Button onClick={addStaffEmail}><Plus className="h-4 w-4 mr-2" />Ajouter</Button></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {staffEmails.map((staff) => (
                    <div key={staff.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>{staff.name && <span className="font-medium mr-2">{staff.name}</span>}<span>{staff.email}</span></div>
                      <Button size="icon" variant="ghost" onClick={() => removeStaffEmail(staff.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                  {staffEmails.length === 0 && <p className="text-center text-muted-foreground py-4">Aucun email staff configuré.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "reports":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Rapports et Exports</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => exportToPDF(bookings, "rapport-reservations", bookingColumns, "Rapport des Réservations")}>
                <CardContent className="pt-6 text-center">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 text-accent" />
                  <h3 className="font-semibold mb-2">Rapport Réservations</h3>
                  <p className="text-sm text-muted-foreground">Exporter toutes les réservations en PDF</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => exportToPDF(contacts, "rapport-messages", contactColumns, "Rapport des Messages")}>
                <CardContent className="pt-6 text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                  <h3 className="font-semibold mb-2">Rapport Messages</h3>
                  <p className="text-sm text-muted-foreground">Exporter tous les messages en PDF</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => exportToPDF(subscribers, "rapport-abonnes", subscriberColumns, "Rapport des Abonnés")}>
                <CardContent className="pt-6 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="font-semibold mb-2">Rapport Abonnés</h3>
                  <p className="text-sm text-muted-foreground">Exporter tous les abonnés en PDF</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return <div className="text-center py-12 text-muted-foreground">Section en construction</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - handles both mobile (Sheet) and desktop */}
      <AdminSidebar 
        onSignOut={signOut} 
        pendingCount={pendingBookings} 
        unreadMessages={unreadMessages}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
      />

      {/* Main Content */}
      <div className="md:ml-64 transition-all duration-300">
        <AdminHeader
          userName={user?.email?.split("@")[0]}
          notifications={notifications}
          onSearch={setSearchQuery}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          showMobileMenu={mobileSidebarOpen}
        />

        <main className="p-4 md:p-6 lg:p-8">
          {/* Page Title & Refresh */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground capitalize">
                {activeTab === "analytics" ? "Tableau de bord" : activeTab}
              </h1>
              <p className="text-muted-foreground text-sm">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={fetchAllData} aria-label="Rafraîchir">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab Content */}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Admin;
