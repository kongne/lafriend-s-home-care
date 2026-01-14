import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  Clock,
  User,
  Phone,
  Mail,
  Loader2,
  CheckCircle2
} from "lucide-react";

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  specializations: string[];
  hourly_rate: number | null;
  is_active: boolean;
  created_at: string;
}

interface StaffAvailability {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DAYS_OF_WEEK = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"
];

const DEFAULT_AVAILABILITY: Omit<StaffAvailability, 'id' | 'staff_id'>[] = [
  { day_of_week: 1, start_time: "08:00", end_time: "17:00", is_available: true },
  { day_of_week: 2, start_time: "08:00", end_time: "17:00", is_available: true },
  { day_of_week: 3, start_time: "08:00", end_time: "17:00", is_available: true },
  { day_of_week: 4, start_time: "08:00", end_time: "17:00", is_available: true },
  { day_of_week: 5, start_time: "08:00", end_time: "17:00", is_available: true },
];

export const StaffManagement = () => {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [availability, setAvailability] = useState<StaffAvailability[]>([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    specializations: "",
    hourly_rate: "",
    is_active: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("staff_members")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setStaff(data);
    }
    setLoading(false);
  };

  const fetchAvailability = async (staffId: string) => {
    const { data, error } = await supabase
      .from("staff_availability")
      .select("*")
      .eq("staff_id", staffId)
      .order("day_of_week");

    if (!error && data) {
      setAvailability(data);
    }
  };

  const handleAddStaff = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    const { data, error } = await supabase
      .from("staff_members")
      .insert({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        specializations: formData.specializations.split(",").map(s => s.trim()).filter(Boolean),
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        is_active: formData.is_active
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else if (data) {
      // Create default availability
      const availabilityRecords = DEFAULT_AVAILABILITY.map(a => ({
        ...a,
        staff_id: data.id
      }));
      await supabase.from("staff_availability").insert(availabilityRecords);

      toast({ title: "Employé ajouté", description: `${formData.full_name} a été ajouté à l'équipe` });
      setIsAddDialogOpen(false);
      resetForm();
      fetchStaff();
    }
    setSaving(false);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate full name
    if (!formData.full_name.trim()) {
      errors.full_name = "Le nom complet est requis";
    } else if (formData.full_name.length < 2) {
      errors.full_name = "Le nom doit contenir au moins 2 caractères";
    } else if (formData.full_name.length > 100) {
      errors.full_name = "Le nom ne doit pas dépasser 100 caractères";
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Email invalide";
    } else if (formData.email.length > 254) {
      errors.email = "L'email est trop long";
    }
    
    // Validate phone if provided
    if (formData.phone.trim()) {
      const phoneRegex = /^[\d+\-()\\s]+$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = "Numéro de téléphone invalide";
      } else if (formData.phone.replace(/\D/g, "").length < 7) {
        errors.phone = "Le numéro doit contenir au moins 7 chiffres";
      }
    }
    
    // Validate hourly rate if provided
    if (formData.hourly_rate) {
      const rate = parseFloat(formData.hourly_rate);
      if (isNaN(rate) || rate <= 0) {
        errors.hourly_rate = "Le taux horaire doit être un nombre positif";
      } else if (rate > 1000000) {
        errors.hourly_rate = "Le taux horaire semble trop élevé";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;
    if (!validateForm()) return;
    
    setSaving(true);

    const { error } = await supabase
      .from("staff_members")
      .update({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        specializations: formData.specializations.split(",").map(s => s.trim()).filter(Boolean),
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        is_active: formData.is_active
      })
      .eq("id", selectedStaff.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Employé mis à jour" });
      setIsEditDialogOpen(false);
      resetForm();
      fetchStaff();
    }
    setSaving(false);
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${name} ?`)) return;

    const { error } = await supabase
      .from("staff_members")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Employé supprimé" });
      fetchStaff();
    }
  };

  const handleAvailabilityChange = (dayIndex: number, field: string, value: string | boolean) => {
    setAvailability(prev => {
      const existing = prev.find(a => a.day_of_week === dayIndex);
      if (existing) {
        return prev.map(a => a.day_of_week === dayIndex ? { ...a, [field]: value } : a);
      }
      return [...prev, {
        id: '',
        staff_id: selectedStaff!.id,
        day_of_week: dayIndex,
        start_time: '08:00',
        end_time: '17:00',
        is_available: true,
        [field]: value
      }];
    });
  };

  const handleSaveAvailability = async () => {
    if (!selectedStaff) return;
    setSaving(true);

    // Delete existing and insert new
    await supabase
      .from("staff_availability")
      .delete()
      .eq("staff_id", selectedStaff.id);

    const toInsert = availability
      .filter(a => a.is_available)
      .map(a => ({
        staff_id: selectedStaff.id,
        day_of_week: a.day_of_week,
        start_time: a.start_time,
        end_time: a.end_time,
        is_available: a.is_available
      }));

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from("staff_availability")
        .insert(toInsert);

      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    toast({ title: "Disponibilités enregistrées" });
    setIsAvailabilityDialogOpen(false);
    setSaving(false);
  };

  const openEditDialog = (member: StaffMember) => {
    setSelectedStaff(member);
    setFormData({
      full_name: member.full_name,
      email: member.email,
      phone: member.phone || "",
      specializations: member.specializations.join(", "),
      hourly_rate: member.hourly_rate?.toString() || "",
      is_active: member.is_active
    });
    setIsEditDialogOpen(true);
  };

  const openAvailabilityDialog = async (member: StaffMember) => {
    setSelectedStaff(member);
    await fetchAvailability(member.id);
    // Initialize with all days
    const fullAvailability = DAYS_OF_WEEK.map((_, index) => {
      const existing = availability.find(a => a.day_of_week === index);
      return existing || {
        id: '',
        staff_id: member.id,
        day_of_week: index,
        start_time: '08:00',
        end_time: '17:00',
        is_available: false
      };
    });
    setAvailability(fullAvailability);
    setIsAvailabilityDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      specializations: "",
      hourly_rate: "",
      is_active: true
    });
    setFormErrors({});
    setSelectedStaff(null);
  };

  const StaffForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nom complet *</Label>
          <Input
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Jean Dupont"
            maxLength={100}
            className={formErrors.full_name ? "border-red-500" : ""}
          />
          {formErrors.full_name && <p className="text-red-500 text-sm">{formErrors.full_name}</p>}
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="jean@example.com"
            maxLength={254}
            className={formErrors.email ? "border-red-500" : ""}
          />
          {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Téléphone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+237 6XX XXX XXX"
            maxLength={20}
            className={formErrors.phone ? "border-red-500" : ""}
          />
          {formErrors.phone && <p className="text-red-500 text-sm">{formErrors.phone}</p>}
        </div>
        <div className="space-y-2">
          <Label>Taux horaire (XAF)</Label>
          <Input
            type="number"
            value={formData.hourly_rate}
            onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
            placeholder="2500"
            min="0"
            step="100"
            max="1000000"
            className={formErrors.hourly_rate ? "border-red-500" : ""}
          />
          {formErrors.hourly_rate && <p className="text-red-500 text-sm">{formErrors.hourly_rate}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Spécialisations (séparées par des virgules)</Label>
        <Input
          value={formData.specializations}
          onChange={(e) => setFormData(prev => ({ ...prev, specializations: e.target.value }))}
          placeholder="Nettoyage résidentiel, Vitres, Commercial"
          maxLength={500}
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label>Actif</Label>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion du Personnel</h2>
          <p className="text-muted-foreground">Gérez votre équipe et leurs disponibilités</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un employé
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajouter un employé</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau membre à votre équipe de nettoyage
              </DialogDescription>
            </DialogHeader>
            <StaffForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleAddStaff} 
                disabled={saving || !formData.full_name.trim() || !formData.email.trim()}
                className="bg-accent text-accent-foreground"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {staff.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun employé</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par ajouter des membres à votre équipe
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Spécialisations</TableHead>
                <TableHead>Taux horaire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-accent/20 text-accent">
                          {member.full_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.specializations.slice(0, 2).map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {member.specializations.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{member.specializations.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.hourly_rate ? `${member.hourly_rate.toLocaleString()} XAF/h` : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={member.is_active ? "bg-green-500" : "bg-gray-500"}>
                      {member.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openAvailabilityDialog(member)}
                        title="Disponibilités"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(member)}
                        title="Modifier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStaff(member.id, member.full_name)}
                        className="text-destructive hover:text-destructive"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l'employé</DialogTitle>
          </DialogHeader>
          <StaffForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpdateStaff} 
              disabled={saving}
              className="bg-accent text-accent-foreground"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Disponibilités de {selectedStaff?.full_name}</DialogTitle>
            <DialogDescription>
              Définissez les horaires de travail pour chaque jour
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {DAYS_OF_WEEK.map((day, index) => {
              const dayAvail = availability.find(a => a.day_of_week === index) || {
                is_available: false,
                start_time: "08:00",
                end_time: "17:00"
              };
              return (
                <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <Switch
                    checked={dayAvail.is_available}
                    onCheckedChange={(checked) => handleAvailabilityChange(index, "is_available", checked)}
                  />
                  <span className="w-24 font-medium">{day}</span>
                  {dayAvail.is_available && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={dayAvail.start_time}
                        onChange={(e) => handleAvailabilityChange(index, "start_time", e.target.value)}
                        className="w-28"
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={dayAvail.end_time}
                        onChange={(e) => handleAvailabilityChange(index, "end_time", e.target.value)}
                        className="w-28"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAvailabilityDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSaveAvailability} 
              disabled={saving}
              className="bg-accent text-accent-foreground"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;
