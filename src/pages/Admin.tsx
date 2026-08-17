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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { BulkActions } from "@/components/admin/BulkActions";
import { AdminSidebar, MobileSidebarTrigger } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { KPICard } from "@/components/admin/KPICard";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { TaskList } from "@/components/admin/TaskList";
import { QuickActions } from "@/components/admin/QuickActions";
import { RecentBookingsTable } from "@/components/admin/RecentBookingsTable";
import { BookingCalendar } from "@/components/admin/BookingCalendar";
import { StaffManagement } from "@/components/admin/StaffManagement";
import { StaffAssignmentDialog } from "@/components/admin/StaffAssignmentDialog";
import { StaffCalendar } from "@/components/admin/StaffCalendar";
import { NotificationCenter } from "@/components/admin/NotificationCenter";
import { LoyaltyRewardsManagement } from "@/components/admin/LoyaltyRewardsManagement";
import { ReferralManagement } from "@/components/admin/ReferralManagement";
import { FeedbackManagement } from "@/components/admin/FeedbackManagement";
import { ReceiptGenerator } from "@/components/admin/ReceiptGenerator";
import { ReviewManagement } from "@/components/admin/ReviewManagement";
import { ProjectManagement } from "@/components/admin/ProjectManagement";
import { ContactMessageManagement } from "@/components/admin/ContactMessageManagement";

import { ServiceManagement } from "@/components/admin/ServiceManagement";

import { BroadcastNotification } from "@/components/admin/BroadcastNotification";
import { AnnouncementManagement } from "@/components/admin/AnnouncementManagement";
import { EmailRemindersManagement } from "@/components/admin/EmailRemindersManagement";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { UserManager } from "@/components/admin/UserManager";
import { ActivityAuditViewer } from "@/components/admin/ActivityAuditViewer";
import { ErrorLogCenter } from "@/components/admin/ErrorLogCenter";
import { SecurityCenter } from "@/components/admin/SecurityCenter";
import { SystemHealth } from "@/components/admin/SystemHealth";
import { MaintenanceManager } from "@/components/admin/MaintenanceManager";
import { BackupCenter } from "@/components/admin/BackupCenter";

import { SettingsManager } from "@/components/admin/SettingsManager";
import { SuperAdminDashboard } from "@/components/admin/SuperAdminDashboard";
import { TestimonialManagement } from "@/components/admin/TestimonialManagement";
import { WebhookManagement } from "@/components/admin/WebhookManagement";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { exportToCSV, bookingColumns, contactColumns, subscriberColumns } from "@/lib/exportCsv";
import { exportToPDF } from "@/lib/exportPdf";
import { downloadReport } from "@/lib/adminReports";
import { staffEmailSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CalendarDays, Mail, Users, Loader2, Trash2, Plus, RefreshCw,
  Download, BarChart3, Send, FileText, TrendingUp, Clock, CheckCircle2,
  Calendar, MoreHorizontal, Eye, Phone, MessageCircle,
} from "lucide-react";

interface Booking {
  id: string;
  user_id?: string | null;
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
  is_recurring?: boolean;
  recurrence_type?: string | null;
  estimated_price?: number | null;
  selected_addons?: { id: string; name: string; price: number | null }[] | null;
  distance_km?: number | null;
  latitude?: string | null;
  longitude?: string | null;
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
  const fmtPrice = (n: number) => n.toLocaleString("fr-FR") + " FCFA";
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardTimeRange, setDashboardTimeRange] = useState<"7d" | "30d" | "90d" | "12m">("12m");
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(10);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsPerPage, setContactsPerPage] = useState(10);

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

  const totalBookingPages = Math.max(1, Math.ceil(filteredBookings.length / bookingsPerPage));
  const totalContactPages = Math.max(1, Math.ceil(filteredContacts.length / contactsPerPage));
  const paginatedBookings = useMemo(() => {
    const start = (bookingsPage - 1) * bookingsPerPage;
    return filteredBookings.slice(start, start + bookingsPerPage);
  }, [filteredBookings, bookingsPage, bookingsPerPage]);
  const paginatedContacts = useMemo(() => {
    const start = (contactsPage - 1) * contactsPerPage;
    return filteredContacts.slice(start, start + contactsPerPage);
  }, [filteredContacts, contactsPage, contactsPerPage]);
  // Reset page when search changes
  useEffect(() => { setBookingsPage(1); }, [searchQuery]);
  useEffect(() => { setContactsPage(1); }, [searchQuery]);
  // Clamp page if filtered count drops below current page
  useEffect(() => { if (bookingsPage > totalBookingPages) setBookingsPage(totalBookingPages); }, [bookingsPage, totalBookingPages]);
  useEffect(() => { if (contactsPage > totalContactPages) setContactsPage(totalContactPages); }, [contactsPage, totalContactPages]);

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
      const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
        _user_id: user!.id,
        _role: 'admin'
      });
      if (roleError) throw roleError;

      if (!hasAdminRole) {
        const { data: hasAnyPerm, error: permError } = await supabase.rpc('has_any_permission', {
          _user_id: user!.id,
          _permission_codes: ['bookings.view', 'users.view', 'rbac.view', 'audit.view', 'dashboard.view']
        });
        if (permError) throw permError;
        if (!hasAnyPerm) {
          toast({ title: "Accès refusé", description: "Vous n'avez pas les permissions d'administrateur.", variant: "destructive" });
          navigate("/");
          return;
        }
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

  const createBookingNotification = async (booking: Booking, status: string) => {
    if (!booking.user_id) return;

    const content: Record<string, { title: string; message: string }> = {
      confirmed: {
        title: "Réservation confirmée",
        message: `Votre réservation ${booking.service_type} du ${booking.preferred_date} à ${booking.preferred_time} est confirmée.`,
      },
      completed: {
        title: "Service terminé",
        message: `Votre prestation ${booking.service_type} a été marquée comme terminée.`,
      },
      cancelled: {
        title: "Réservation annulée",
        message: `Votre réservation ${booking.service_type} du ${booking.preferred_date} a été annulée.`,
      },
    };

    const payload = content[status];
    if (!payload) return;

    await supabase.from("notifications").insert({
      user_id: booking.user_id,
      type: "booking",
      title: payload.title,
      message: payload.message,
      link: "/customer-portal",
      is_read: false,
      is_archived: false,
    });
  };

  const updateBookingStatus = async (id: string, status: string) => {
    // Find the booking to get email info
    const booking = bookings.find(b => b.id === id);
    
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (!error) {
      await createBookingNotification(booking as Booking, status);
      toast({ title: "Statut mis à jour", description: "La réservation a bien été mise à jour." });
      fetchBookings();
      
      // Send status notification email
      if (booking && (status === 'confirmed' || status === 'completed' || status === 'cancelled')) {
        try {
          const { data, error: functionError } = await supabase.functions.invoke('send-status-notification', {
            method: 'POST',
            body: {
              clientEmail: booking.email,
              clientName: booking.full_name,
              clientPhone: booking.phone,
              serviceType: booking.service_type,
              preferredDate: booking.preferred_date,
              preferredTime: booking.preferred_time,
              address: booking.address,
              newStatus: status,
              language: 'fr',
              sendSms: true
            }
          });

          if (functionError || !(data as { ok?: boolean })?.ok) {
            throw new Error(functionError?.message || (data as { error?: string })?.error || "Impossible d'envoyer la notification client");
          }

          toast({ 
            title: "Notifications envoyées", 
            description: `Email et SMS de ${status === 'confirmed' ? 'confirmation' : status === 'cancelled' ? 'annulation' : 'completion'} envoyés` 
          });
        } catch (err) {
          logError("Error sending status notification:", err);
        }
      }
    }
  };

  const updateBookingDate = async (id: string, newDate: string): Promise<void> => {
    const { error } = await supabase.from("bookings").update({ preferred_date: newDate }).eq("id", id);
    if (error) {
      throw error;
    }
    await fetchBookings();
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

      if (!(data as { ok?: boolean })?.ok) {
        throw new Error((data as { error?: string })?.error || "Erreur lors de l'envoi de la confirmation");
      }

      if (booking.user_id) {
        await supabase.from("notifications").insert({
          user_id: booking.user_id,
          type: "booking",
          title: "Confirmation envoyée",
          message: `La confirmation pour votre réservation ${booking.service_type} a été envoyée.`,
          link: "/customer-portal",
          is_read: false,
          is_archived: false,
        });
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
      toast({ title: "Erreur", description: validation.error.issues[0].message, variant: "destructive" });
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

  const handleBulkBookingAction = useCallback(async (action: string, ids: string[]): Promise<{ success: number; failed: number }> => {
    if (action === 'delete') {
      const { error } = await supabase.from("bookings").delete().in("id", ids);
      setSelectedBookings([]);
      fetchBookings();
      return error ? { success: 0, failed: ids.length } : { success: ids.length, failed: 0 };
    }
    const { error } = await supabase.from("bookings").update({ status: action }).in("id", ids);
    setSelectedBookings([]);
    fetchBookings();
    return error ? { success: 0, failed: ids.length } : { success: ids.length, failed: 0 };
  }, []);

  const handleBulkContactAction = useCallback(async (action: string, ids: string[]): Promise<{ success: number; failed: number }> => {
    if (action === 'delete') {
      const { error } = await supabase.from("contact_submissions").delete().in("id", ids);
      setSelectedContacts([]);
      fetchContacts();
      return error ? { success: 0, failed: ids.length } : { success: ids.length, failed: 0 };
    }
    const { error } = await supabase.from("contact_submissions").update({ status: action }).in("id", ids);
    setSelectedContacts([]);
    fetchContacts();
    return error ? { success: 0, failed: ids.length } : { success: ids.length, failed: 0 };
  }, []);

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
            {/* Date Range Selector */}
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-muted-foreground">Période:</span>
              <Select value={dashboardTimeRange} onValueChange={(v: "7d" | "30d" | "90d" | "12m") => setDashboardTimeRange(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 derniers jours</SelectItem>
                  <SelectItem value="30d">30 derniers jours</SelectItem>
                  <SelectItem value="90d">90 derniers jours</SelectItem>
                  <SelectItem value="12m">12 derniers mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <AnalyticsDashboard timeRange={dashboardTimeRange} bookings={bookings} contacts={contacts} />

            {/* Quick Actions */}
            <QuickActions 
              onRefresh={fetchAllData}
              onExportBookings={() => void exportToPDF(bookings, "reservations", bookingColumns, "Réservations")}
              onExportContacts={() => void exportToPDF(contacts, "messages", contactColumns, "Messages")}
            />

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
                <Button variant="outline" size="sm" onClick={() => {
                  const data = selectedBookings.length > 0 ? filteredBookings.filter(b => selectedBookings.includes(b.id)) : filteredBookings;
                  exportToCSV(data, "reservations", bookingColumns);
                }}>
                  <Download className="h-4 w-4 mr-2" />CSV{selectedBookings.length > 0 && ` (${selectedBookings.length})`}
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const data = selectedBookings.length > 0 ? filteredBookings.filter(b => selectedBookings.includes(b.id)) : filteredBookings;
                  void exportToPDF(data, "reservations", bookingColumns, "Réservations");
                }}>
                  <FileText className="h-4 w-4 mr-2" />PDF{selectedBookings.length > 0 && ` (${selectedBookings.length})`}
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-lg border bg-card">
              <div className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="hidden sm:inline">{filteredBookings.length} réservation(s)</span>
                  <span className="sm:hidden">{filteredBookings.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground hidden sm:inline">Lignes:</label>
                  <select
                    className="h-8 rounded border border-input bg-background px-2 text-xs"
                    value={bookingsPerPage}
                    onChange={(e) => { setBookingsPerPage(Number(e.target.value)); setBookingsPage(1); }}
                  >
                    {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                        onChange={(e) => setSelectedBookings(e.target.checked ? filteredBookings.map(b => b.id) : [])}
                      />
                    </TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead className="hidden lg:table-cell">Service</TableHead>
                    <TableHead className="hidden xl:table-cell">Prix</TableHead>
                    <TableHead className="hidden xl:table-cell">Options</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                        <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Aucune réservation
                      </TableCell>
                    </TableRow>
                  ) : paginatedBookings.map((booking) => (
                    <TableRow key={booking.id} className={selectedBookings.includes(booking.id) ? "bg-accent/10" : ""}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={selectedBookings.includes(booking.id)}
                          onChange={() => toggleBookingSelection(booking.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{booking.full_name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[160px]">{booking.email}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">{booking.phone}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{booking.address}</div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{booking.service_type}</TableCell>
                      <TableCell className="hidden xl:table-cell text-sm whitespace-nowrap">
                        {booking.estimated_price != null ? `${booking.estimated_price.toLocaleString("fr-FR")} FCFA` : "-"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell max-w-[160px]">
                        <div className="text-xs truncate" title={(booking.selected_addons || []).map(a => a.name).join(", ")}>
                          {(booking.selected_addons || []).length > 0
                            ? (booking.selected_addons || []).map(a => a.name).join(", ")
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell whitespace-nowrap text-sm">
                        {booking.preferred_date}<br /><span className="text-xs text-muted-foreground">{booking.preferred_time}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="WhatsApp" onClick={() => window.open(`https://wa.me/${booking.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${booking.full_name}, concernant votre réservation du ${booking.preferred_date}...`)}`, "_blank")}>
                            <MessageCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          {booking.status === 'pending' && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" title="Confirmer" onClick={() => updateBookingStatus(booking.id, "confirmed")}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {booking.status === 'confirmed' && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" title="Marquer terminé" onClick={() => updateBookingStatus(booking.id, "completed")}>
                              <Calendar className="h-4 w-4" />
                            </Button>
                          )}
                          {booking.status !== 'cancelled' && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Annuler" onClick={() => updateBookingStatus(booking.id, "cancelled")}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30">
                <div className="flex items-center gap-1 text-sm">
                  <button
                    className="h-8 px-3 rounded border border-input bg-background text-xs font-medium hover:bg-accent/10 disabled:opacity-40"
                    disabled={bookingsPage <= 1}
                    onClick={() => setBookingsPage(p => Math.max(1, p - 1))}
                  >Précédent</button>
                  {Array.from({ length: Math.min(totalBookingPages, 5) }, (_, i) => {
                    const start = Math.max(1, Math.min(bookingsPage - 2, totalBookingPages - 4));
                    const page = start + i;
                    if (page > totalBookingPages) return null;
                    return (
                      <button
                        key={page}
                        className={`h-8 min-w-8 rounded text-xs font-medium ${
                          page === bookingsPage
                            ? "bg-accent text-accent-foreground"
                            : "border border-input bg-background hover:bg-accent/10"
                        }`}
                        onClick={() => setBookingsPage(page)}
                      >{page}</button>
                    );
                  })}
                  <button
                    className="h-8 px-3 rounded border border-input bg-background text-xs font-medium hover:bg-accent/10 disabled:opacity-40"
                    disabled={bookingsPage >= totalBookingPages}
                    onClick={() => setBookingsPage(p => Math.min(totalBookingPages, p + 1))}
                  >Suivant</button>
                </div>
              </div>
            </div>
          </div>
        );
 
      case "calendar":
        return (
          <BookingCalendar 
            bookings={bookings} 
            onStatusChange={updateBookingStatus}
            onDateChange={updateBookingDate}
          />
        );

      case "contacts":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <BulkActions selectedIds={selectedContacts} onSelectAll={(checked) => setSelectedContacts(checked ? filteredContacts.map(c => c.id) : [])} allSelected={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0} someSelected={selectedContacts.length > 0 && selectedContacts.length < filteredContacts.length} onBulkAction={handleBulkContactAction} type="contacts" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  const data = selectedContacts.length > 0 ? filteredContacts.filter(c => selectedContacts.includes(c.id)) : filteredContacts;
                  exportToCSV(data, "messages", contactColumns);
                }}><Download className="h-4 w-4 mr-2" />CSV{selectedContacts.length > 0 && ` (${selectedContacts.length})`}</Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const data = selectedContacts.length > 0 ? filteredContacts.filter(c => selectedContacts.includes(c.id)) : filteredContacts;
                  void exportToPDF(data, "messages", contactColumns, "Messages");
                }}><FileText className="h-4 w-4 mr-2" />PDF{selectedContacts.length > 0 && ` (${selectedContacts.length})`}</Button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border bg-card">
              <div className="flex items-center justify-between gap-4 px-4 py-2 border-b bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="hidden sm:inline">{filteredContacts.length} message(s)</span>
                  <span className="sm:hidden">{filteredContacts.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground hidden sm:inline">Lignes:</label>
                  <select
                    className="h-8 rounded border border-input bg-background px-2 text-xs"
                    value={contactsPerPage}
                    onChange={(e) => { setContactsPerPage(Number(e.target.value)); setContactsPage(1); }}
                  >
                    {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                        onChange={(e) => setSelectedContacts(e.target.checked ? filteredContacts.map(c => c.id) : [])}
                      />
                    </TableHead>
                    <TableHead>De</TableHead>
                    <TableHead className="hidden sm:table-cell">Sujet</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedContacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Aucun message
                      </TableCell>
                    </TableRow>
                  ) : paginatedContacts.map((contact) => (
                    <TableRow key={contact.id} className={selectedContacts.includes(contact.id) ? "bg-accent/10" : ""}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => toggleContactSelection(contact.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{contact.full_name}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell max-w-[200px]">
                        <div className="text-sm truncate">{contact.subject}</div>
                        <div className="text-xs text-muted-foreground truncate">{contact.message}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">{contact.email}</div>
                        {contact.phone && <div className="text-xs text-muted-foreground">{contact.phone}</div>}
                      </TableCell>
                      <TableCell>{getStatusBadge(contact.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Marquer lu" onClick={() => updateContactStatus(contact.id, "read")}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Répondre par email" onClick={() => window.open(`mailto:${contact.email}?subject=Re: ${encodeURIComponent(contact.subject)}`, "_blank")}>
                            <Mail className="h-4 w-4" />
                          </Button>
                          {contact.phone && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" title="WhatsApp" onClick={() => window.open(`https://wa.me/${contact.phone!.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${contact.full_name}, concernant votre message "${contact.subject}"...`)}`, "_blank")}>
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30">
                <div className="flex items-center gap-1 text-sm">
                  <button
                    className="h-8 px-3 rounded border border-input bg-background text-xs font-medium hover:bg-accent/10 disabled:opacity-40"
                    disabled={contactsPage <= 1}
                    onClick={() => setContactsPage(p => Math.max(1, p - 1))}
                  >Précédent</button>
                  {Array.from({ length: Math.min(totalContactPages, 5) }, (_, i) => {
                    const start = Math.max(1, Math.min(contactsPage - 2, totalContactPages - 4));
                    const page = start + i;
                    if (page > totalContactPages) return null;
                    return (
                      <button
                        key={page}
                        className={`h-8 min-w-8 rounded text-xs font-medium ${
                          page === contactsPage
                            ? "bg-accent text-accent-foreground"
                            : "border border-input bg-background hover:bg-accent/10"
                        }`}
                        onClick={() => setContactsPage(page)}
                      >{page}</button>
                    );
                  })}
                  <button
                    className="h-8 px-3 rounded border border-input bg-background text-xs font-medium hover:bg-accent/10 disabled:opacity-40"
                    disabled={contactsPage >= totalContactPages}
                    onClick={() => setContactsPage(p => Math.min(totalContactPages, p + 1))}
                  >Suivant</button>
                </div>
              </div>
            </div>
          </div>
        );
 
      case "subscribers":
        return (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Abonnés Newsletter ({subscribers.length})</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToCSV(subscribers, "abonnes", subscriberColumns)}><Download className="h-4 w-4 mr-2" />CSV</Button>
                <Button variant="outline" size="sm" onClick={() => void exportToPDF(subscribers, "abonnes", subscriberColumns, "Abonnés Newsletter")}><FileText className="h-4 w-4 mr-2" />PDF</Button>
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

      case "staff-management":
        return <StaffManagement />;

      case "staff-calendar":
        return <StaffCalendar />;

      case "notifications":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Centre de Notifications</h2>
            <NotificationCenter />
          </div>
        );

      case "broadcast":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Diffusion de Messages</h2>
            <BroadcastNotification />
          </div>
        );

      case "announcements":
        return (
          <div className="space-y-6">
            <AnnouncementManagement />
          </div>
        );

      case "reports":
        return (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Rapports et Exports</h2>
                <p className="text-sm text-muted-foreground">CSV agrégé côté serveur • PDF formaté côté client</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { type: "bookings" as const, label: "Réservations", desc: "Toutes les réservations + remises et points", icon: CalendarDays, color: "text-accent", pdf: () => exportToPDF(bookings, "rapport-reservations", bookingColumns, "Rapport des Réservations") },
                { type: "contacts" as const, label: "Messages", desc: "Tous les messages reçus", icon: Mail, color: "text-purple-500", pdf: () => exportToPDF(contacts, "rapport-messages", contactColumns, "Rapport des Messages") },
                { type: "subscribers" as const, label: "Abonnés newsletter", desc: "Liste des abonnés actifs", icon: Users, color: "text-green-500", pdf: () => exportToPDF(subscribers, "rapport-abonnes", subscriberColumns, "Rapport des Abonnés") },
                { type: "revenue" as const, label: "Revenus mensuels", desc: "Synthèse par mois (estimé)", icon: TrendingUp, color: "text-emerald-500" },
                { type: "loyalty" as const, label: "Transactions fidélité", desc: "Points gagnés / utilisés", icon: BarChart3, color: "text-amber-500" },
                { type: "referrals" as const, label: "Parrainages", desc: "Codes et conversions", icon: Send, color: "text-blue-500" },
              ].map((r) => (
                <Card key={r.type} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 text-center space-y-3">
                    <r.icon className={`h-12 w-12 mx-auto ${r.color}`} />
                    <h3 className="font-semibold">{r.label}</h3>
                    <p className="text-sm text-muted-foreground">{r.desc}</p>
                    <div className="flex gap-2 justify-center pt-2">
                      <Button size="sm" variant="outline" onClick={() => void downloadReport(r.type)}>
                        <Download className="h-3.5 w-3.5 mr-1" /> CSV
                      </Button>
                      {r.pdf && (
                        <Button size="sm" variant="ghost" onClick={() => void r.pdf!()}>
                          <FileText className="h-3.5 w-3.5 mr-1" /> PDF
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "loyalty":
        return <LoyaltyRewardsManagement />;

      case "feedback":
        return <FeedbackManagement />;

      case "customer-feedback":
        return <ContactMessageManagement />;

      case "reviews-management":
        return <ReviewManagement />;

      case "services-management":
        return <ServiceManagement />;

      case "projects":
        return <ProjectManagement />;

      case "referrals":
        return <ReferralManagement />;

      case "reminders":
        return (
          <div className="space-y-6">
            <EmailRemindersManagement />
          </div>
        );

      case "receipts":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Reçus</h2>
              <p className="text-sm text-muted-foreground">{bookings.length} réservation(s)</p>
            </div>
            <div className="grid gap-3">
              {filteredBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Aucune réservation</p>
                  </CardContent>
                </Card>
              ) : (
                filteredBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{booking.full_name}</p>
                        <p className="text-sm text-muted-foreground">{booking.service_type} — {new Date(booking.preferred_date).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <ReceiptGenerator booking={booking} />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );

      case "media":
        return (
          <div className="space-y-6">
            <MediaLibrary />
          </div>
        );

      // Enterprise modules
      case "super-admin":
        return <PermissionGuard permission="dashboard.view"><SuperAdminDashboard /></PermissionGuard>;

      case "rbac":
        return <PermissionGuard permission="rbac.view"><RoleManagement /></PermissionGuard>;

      case "user-management":
        return <PermissionGuard permission="users.view"><UserManager /></PermissionGuard>;

      case "audit-logs":
      case "activity-timeline":
        return <PermissionGuard permission="audit.view"><ActivityAuditViewer /></PermissionGuard>;

      case "error-logs":
        return <PermissionGuard permission="errors.view"><ErrorLogCenter /></PermissionGuard>;

      case "security":
        return <PermissionGuard permission="security.view"><SecurityCenter /></PermissionGuard>;

      case "system-health":
        return <PermissionGuard permission="system.logs"><SystemHealth /></PermissionGuard>;

      case "maintenance":
        return <PermissionGuard permission="maintenance.manage"><MaintenanceManager /></PermissionGuard>;

      case "backup-center":
        return <PermissionGuard permission="backups.create"><BackupCenter /></PermissionGuard>;

      case "enterprise-settings":
        return <PermissionGuard permission="settings.view"><SettingsManager /></PermissionGuard>;

      case "testimonials":
        return <PermissionGuard permission="testimonials.view"><TestimonialManagement /></PermissionGuard>;

      case "webhooks":
        return <PermissionGuard permission="webhooks.view"><WebhookManagement /></PermissionGuard>;

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
          onSearch={setSearchQuery}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          showMobileMenu={mobileSidebarOpen}
        />

        <main className="p-4 md:p-6 lg:p-8">
          {/* Page Title & Refresh */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
