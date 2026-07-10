import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  MapPin,
  Loader2,
  Filter,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  getDay,
} from "date-fns";
import { fr } from "date-fns/locale";

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  specializations: string[];
  is_active: boolean;
  photo_url?: string | null;
}

interface Booking {
  id: string;
  full_name: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  address: string;
  status: string;
  assigned_staff_id: string | null;
}

interface StaffAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface StaffTimeOff {
  start_date: string;
  end_date: string;
  reason: string | null;
}

const DAYS_OF_WEEK = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-green-500",
  completed: "bg-blue-500",
  cancelled: "bg-red-500",
};

export const StaffCalendar = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<Record<string, StaffAvailability[]>>({});
  const [timeOff, setTimeOff] = useState<Record<string, StaffTimeOff[]>>({});
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    const startDate = format(startOfMonth(currentDate), "yyyy-MM-dd");
    const endDate = format(endOfMonth(currentDate), "yyyy-MM-dd");

    const [staffRes, bookingsRes] = await Promise.all([
      supabase.from("staff_members").select("*").eq("is_active", true),
      supabase
        .from("bookings")
        .select("*")
        .gte("preferred_date", startDate)
        .lte("preferred_date", endDate)
        .neq("status", "cancelled"),
    ]);

    if (staffRes.data) {
      setStaff(staffRes.data);
      
      // Fetch availability and time off for each staff
      const availabilityMap: Record<string, StaffAvailability[]> = {};
      const timeOffMap: Record<string, StaffTimeOff[]> = {};

      for (const member of staffRes.data) {
        const [availRes, timeOffRes] = await Promise.all([
          supabase.from("staff_availability").select("*").eq("staff_id", member.id),
          supabase
            .from("staff_time_off")
            .select("*")
            .eq("staff_id", member.id)
            .gte("end_date", startDate)
            .lte("start_date", endDate),
        ]);

        if (availRes.data) availabilityMap[member.id] = availRes.data;
        if (timeOffRes.data) timeOffMap[member.id] = timeOffRes.data;
      }

      setAvailability(availabilityMap);
      setTimeOff(timeOffMap);
    }

    if (bookingsRes.data) setBookings(bookingsRes.data);
    setLoading(false);
  };

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add empty cells for days before month start
    const startDayOfWeek = getDay(monthStart);
    const emptyDays = Array(startDayOfWeek).fill(null);

    return [...emptyDays, ...days];
  }, [currentDate]);

  const getStaffBookingsForDate = (staffId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookings.filter(
      (b) => b.preferred_date === dateStr && b.assigned_staff_id === staffId
    );
  };

  const isStaffOnTimeOff = (staffId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const staffTimeOff = timeOff[staffId] || [];
    return staffTimeOff.some(
      (to) => dateStr >= to.start_date && dateStr <= to.end_date
    );
  };

  const isStaffAvailable = (staffId: string, date: Date) => {
    const dayOfWeek = getDay(date);
    const staffAvailability = availability[staffId] || [];
    const dayAvailability = staffAvailability.find((a) => a.day_of_week === dayOfWeek);
    return dayAvailability?.is_available ?? false;
  };

  const filteredStaff = selectedStaffId === "all" 
    ? staff 
    : staff.filter((s) => s.id === selectedStaffId);

  const getDateBookings = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookings.filter((b) => b.preferred_date === dateStr);
  };

  const selectedDateBookings = selectedDate ? getDateBookings(selectedDate) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Calendrier du Personnel
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrer par employé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les employés</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold min-w-[180px] text-center">
                {format(currentDate, "MMMM yyyy", { locale: fr })}
              </h3>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Aujourd'hui
            </Button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Congé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span>Non disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span>Réservation assignée</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 bg-muted/50">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="text-center py-2 text-sm font-medium text-muted-foreground border-b"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="min-h-[100px] border-b border-r bg-muted/20" />;
                }

                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const dayBookings = getDateBookings(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[100px] border-b border-r p-1 cursor-pointer transition-colors hover:bg-accent/5 ${
                      isToday ? "bg-accent/10" : ""
                    } ${isSelected ? "ring-2 ring-accent ring-inset" : ""}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? "text-accent" : ""}`}>
                      {format(day, "d")}
                    </div>

                    {/* Staff availability indicators */}
                    <div className="space-y-1">
                      {filteredStaff.slice(0, 3).map((member) => {
                        const staffBookings = getStaffBookingsForDate(member.id, day);
                        const onTimeOff = isStaffOnTimeOff(member.id, day);
                        const available = isStaffAvailable(member.id, day);

                        return (
                          <div
                            key={member.id}
                            className="flex items-center gap-1 text-xs"
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                onTimeOff
                                  ? "bg-red-500"
                                  : staffBookings.length > 0
                                  ? "bg-accent"
                                  : available
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            />
                            <span className="truncate text-muted-foreground">
                              {member.full_name.split(" ")[0]}
                            </span>
                            {staffBookings.length > 0 && (
                              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                                {staffBookings.length}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                      {filteredStaff.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{filteredStaff.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Staff Status */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Statut du Personnel
                </h4>
                <div className="space-y-2">
                  {filteredStaff.map((member) => {
                    const onTimeOff = isStaffOnTimeOff(member.id, selectedDate);
                    const available = isStaffAvailable(member.id, selectedDate);
                    const staffBookings = getStaffBookingsForDate(member.id, selectedDate);

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{member.full_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {member.specializations?.join(", ") || "Tous services"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {staffBookings.length > 0 && (
                            <Badge className="bg-accent text-accent-foreground">
                              {staffBookings.length} RDV
                            </Badge>
                          )}
                          <Badge
                            className={
                              onTimeOff
                                ? "bg-red-500 text-white"
                                : available
                                ? "bg-green-500 text-white"
                                : "bg-gray-400 text-white"
                            }
                          >
                            {onTimeOff ? "Congé" : available ? "Dispo" : "Indispo"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bookings */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Réservations du jour ({selectedDateBookings.length})
                </h4>
                {selectedDateBookings.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Aucune réservation pour ce jour
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDateBookings.map((booking) => {
                      const assignedStaff = staff.find(
                        (s) => s.id === booking.assigned_staff_id
                      );
                      return (
                        <div
                          key={booking.id}
                          className="p-3 bg-muted/50 rounded-lg border-l-4"
                          style={{
                            borderColor: statusColors[booking.status]
                              ? statusColors[booking.status].replace("bg-", "")
                              : "#gray",
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">{booking.full_name}</div>
                            <Badge className={statusColors[booking.status]}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {booking.preferred_time}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{booking.address}</span>
                            </div>
                            {assignedStaff && (
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                {assignedStaff.full_name}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StaffCalendar;
