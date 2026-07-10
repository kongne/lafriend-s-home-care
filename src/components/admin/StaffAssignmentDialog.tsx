import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  specializations: string[];
  is_active: boolean;
}

interface StaffAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface StaffAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingDate: string;
  bookingTime: string;
  currentStaffId: string | null;
  onAssigned: () => void;
}

const DAYS_OF_WEEK = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"
];

export const StaffAssignmentDialog = ({
  open,
  onOpenChange,
  bookingId,
  bookingDate,
  bookingTime,
  currentStaffId,
  onAssigned
}: StaffAssignmentDialogProps) => {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [availability, setAvailability] = useState<Record<string, StaffAvailability[]>>({});
  const [selectedStaffId, setSelectedStaffId] = useState<string>(currentStaffId || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStaffWithAvailability();
      setSelectedStaffId(currentStaffId || "");
    }
  }, [open, currentStaffId]);

  const fetchStaffWithAvailability = async () => {
    setLoading(true);
    
    // Fetch active staff
    const { data: staffData } = await supabase
      .from("staff_members")
      .select("*")
      .eq("is_active", true)
      .order("full_name");

    if (staffData) {
      setStaff(staffData);

      // Fetch availability for each staff member
      const { data: availData } = await supabase
        .from("staff_availability")
        .select("*")
        .in("staff_id", staffData.map(s => s.id));

      if (availData) {
        const availByStaff: Record<string, StaffAvailability[]> = {};
        availData.forEach(a => {
          if (!availByStaff[a.staff_id]) {
            availByStaff[a.staff_id] = [];
          }
          availByStaff[a.staff_id].push(a);
        });
        setAvailability(availByStaff);
      }
    }
    
    setLoading(false);
  };

  const isStaffAvailable = (staffId: string): { available: boolean; reason?: string } => {
    const staffAvail = availability[staffId];
    if (!staffAvail || staffAvail.length === 0) {
      return { available: false, reason: "Pas de disponibilité définie" };
    }

    const bookingDay = new Date(bookingDate).getDay();
    const dayAvail = staffAvail.find(a => a.day_of_week === bookingDay);
    
    if (!dayAvail) {
      return { available: false, reason: `Non disponible le ${DAYS_OF_WEEK[bookingDay]}` };
    }

    // Check if booking time falls within availability
    const bookingHour = parseInt(bookingTime.split(":")[0]);
    const startHour = parseInt(dayAvail.start_time.split(":")[0]);
    const endHour = parseInt(dayAvail.end_time.split(":")[0]);

    if (bookingHour < startHour || bookingHour >= endHour) {
      return { 
        available: false, 
        reason: `Disponible de ${dayAvail.start_time} à ${dayAvail.end_time}` 
      };
    }

    return { available: true };
  };

  const handleAssign = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("bookings")
      .update({ assigned_staff_id: selectedStaffId || null })
      .eq("id", bookingId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      const staffName = staff.find(s => s.id === selectedStaffId)?.full_name;
      toast({ 
        title: selectedStaffId ? "Employé assigné" : "Assignation retirée",
        description: selectedStaffId 
          ? `${staffName} a été assigné à cette réservation`
          : "L'assignation a été retirée"
      });
      onAssigned();
      onOpenChange(false);
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assigner un employé</DialogTitle>
          <DialogDescription>
            Choisissez un membre de l'équipe pour cette réservation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <Calendar className="h-4 w-4" />
            <span>{new Date(bookingDate).toLocaleDateString("fr-FR", { 
              weekday: "long", 
              day: "numeric", 
              month: "long" 
            })}</span>
            <Clock className="h-4 w-4 ml-2" />
            <span>{bookingTime}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : (
            <div className="space-y-2">
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <span className="text-muted-foreground">Aucun (retirer l'assignation)</span>
                  </SelectItem>
                  {staff.map((member) => {
                    const { available, reason } = isStaffAvailable(member.id);
                    return (
                      <SelectItem 
                        key={member.id} 
                        value={member.id}
                        disabled={!available}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-accent/20 text-accent">
                              {member.full_name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className={!available ? "text-muted-foreground" : ""}>
                              {member.full_name}
                            </span>
                            {!available && (
                              <span className="text-xs text-muted-foreground">{reason}</span>
                            )}
                          </div>
                          {available && (
                            <Badge variant="outline" className="ml-auto text-xs bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Disponible
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {selectedStaffId && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  {(() => {
                    const member = staff.find(s => s.id === selectedStaffId);
                    if (!member) return null;
                    return (
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-accent/20 text-accent">
                            {member.full_name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.full_name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                          {member.specializations.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {member.specializations.slice(0, 3).map(s => (
                                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={saving}
            className="bg-accent text-accent-foreground"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {selectedStaffId ? "Assigner" : "Retirer l'assignation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StaffAssignmentDialog;
