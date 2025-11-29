import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  CalendarDays, 
  Mail, 
  Users, 
  ArrowLeft,
  Loader2,
  Trash2,
  Plus,
  RefreshCw
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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [staffEmails, setStaffEmails] = useState<StaffEmail[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffName, setNewStaffName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    
    if (user) {
      checkAdminRole();
    }
  }, [user, authLoading, navigate]);

  const checkAdminRole = async () => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user!.id,
        _role: 'admin'
      });

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions d'administrateur.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchAllData();
    } catch (error) {
      console.error("Error checking admin role:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchBookings(),
      fetchContacts(),
      fetchStaffEmails(),
      fetchSubscribers(),
    ]);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) setBookings(data);
  };

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) setContacts(data);
  };

  const fetchStaffEmails = async () => {
    const { data, error } = await supabase
      .from("staff_emails")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) setStaffEmails(data);
  };

  const fetchSubscribers = async () => {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });
    
    if (!error && data) setSubscribers(data);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);
    
    if (!error) {
      toast({ title: "Statut mis à jour" });
      fetchBookings();
    }
  };

  const updateContactStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("contact_submissions")
      .update({ status })
      .eq("id", id);
    
    if (!error) {
      toast({ title: "Statut mis à jour" });
      fetchContacts();
    }
  };

  const addStaffEmail = async () => {
    if (!newStaffEmail) return;
    
    const { error } = await supabase
      .from("staff_emails")
      .insert({ email: newStaffEmail, name: newStaffName || null });
    
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
    const { error } = await supabase
      .from("staff_emails")
      .delete()
      .eq("id", id);
    
    if (!error) {
      toast({ title: "Email supprimé" });
      fetchStaffEmails();
    }
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord Admin</h1>
          <Button variant="outline" size="icon" onClick={fetchAllData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CalendarDays className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                  <p className="text-muted-foreground">Réservations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Mail className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{contacts.length}</p>
                  <p className="text-muted-foreground">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{subscribers.length}</p>
                  <p className="text-muted-foreground">Abonnés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Mail className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{staffEmails.length}</p>
                  <p className="text-muted-foreground">Staff Emails</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings">Réservations</TabsTrigger>
            <TabsTrigger value="contacts">Messages</TabsTrigger>
            <TabsTrigger value="subscribers">Abonnés</TabsTrigger>
            <TabsTrigger value="staff">Emails Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
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
                    {booking.message && (
                      <div className="col-span-2"><strong>Message:</strong> {booking.message}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateBookingStatus(booking.id, "confirmed")}>
                      Confirmer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateBookingStatus(booking.id, "completed")}>
                      Terminé
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateBookingStatus(booking.id, "cancelled")}>
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {bookings.length === 0 && (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Aucune réservation</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            {contacts.map((contact) => (
              <Card key={contact.id}>
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
                    <Button size="sm" variant="outline" onClick={() => updateContactStatus(contact.id, "read")}>
                      Marquer lu
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateContactStatus(contact.id, "replied")}>
                      Répondu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {contacts.length === 0 && (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Aucun message</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="subscribers" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {subscribers.map((sub) => (
                    <div key={sub.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>{sub.email}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(sub.subscribed_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  ))}
                  {subscribers.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Aucun abonné</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ajouter un email staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="staffName">Nom</Label>
                    <Input
                      id="staffName"
                      placeholder="Nom (optionnel)"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="staffEmail">Email</Label>
                    <Input
                      id="staffEmail"
                      type="email"
                      placeholder="email@exemple.com"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addStaffEmail}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {staffEmails.map((staff) => (
                    <div key={staff.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        {staff.name && <span className="font-medium mr-2">{staff.name}</span>}
                        <span>{staff.email}</span>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removeStaffEmail(staff.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {staffEmails.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Aucun email staff configuré. Ajoutez des emails pour recevoir les notifications.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
