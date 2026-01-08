import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface BookingCalendarProps {
  bookings: Booking[];
  onBookingClick?: (booking: Booking) => void;
  onStatusChange?: (id: string, status: string) => void;
}

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-green-500",
  completed: "bg-blue-500",
  cancelled: "bg-red-500",
};

export const BookingCalendar = ({ bookings, onBookingClick, onStatusChange }: BookingCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  let startingDay = firstDayOfMonth.getDay() - 1;
  if (startingDay < 0) startingDay = 6;

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    bookings.forEach((booking) => {
      const date = booking.preferred_date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(booking);
    });
    return grouped;
  }, [bookings]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateKey = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const selectedBookings = selectedDate ? bookingsByDate[selectedDate] || [] : [];

  // Generate calendar days
  const calendarDays = [];
  
  // Empty cells for days before the first day of month
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 bg-muted/30 rounded-lg" />);
  }
  
  // Actual days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatDateKey(day);
    const dayBookings = bookingsByDate[dateKey] || [];
    const hasBookings = dayBookings.length > 0;
    const isSelected = selectedDate === dateKey;
    const todayClass = isToday(day);

    calendarDays.push(
      <div
        key={day}
        onClick={() => setSelectedDate(dateKey)}
        className={cn(
          "h-24 p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md",
          isSelected ? "border-accent ring-2 ring-accent/20 bg-accent/5" : "border-border",
          todayClass && "bg-primary/5 border-primary",
          !hasBookings && "hover:bg-muted/50"
        )}
      >
        <div className="flex justify-between items-start">
          <span className={cn(
            "text-sm font-medium",
            todayClass && "text-primary font-bold"
          )}>
            {day}
          </span>
          {hasBookings && (
            <Badge variant="secondary" className="text-xs">
              {dayBookings.length}
            </Badge>
          )}
        </div>
        <div className="mt-1 space-y-1 overflow-hidden">
          {dayBookings.slice(0, 2).map((booking) => (
            <div
              key={booking.id}
              className={cn(
                "text-xs truncate px-1 py-0.5 rounded text-white",
                statusColors[booking.status] || "bg-gray-500"
              )}
              title={`${booking.full_name} - ${booking.service_type}`}
            >
              {booking.preferred_time} - {booking.full_name.split(" ")[0]}
            </div>
          ))}
          {dayBookings.length > 2 && (
            <div className="text-xs text-muted-foreground text-center">
              +{dayBookings.length - 2} autres
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendrier des Réservations
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Aujourd'hui
              </Button>
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold min-w-[160px] text-center">
                {MONTHS[month]} {year}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>En attente</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Confirmée</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Terminée</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Annulée</span>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays}
          </div>
        </CardContent>
      </Card>

      {/* Selected day details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Réservations du {new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune réservation pour cette date</p>
            ) : (
              <div className="space-y-3">
                {selectedBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onBookingClick?.(booking)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{booking.full_name}</h4>
                        <p className="text-sm text-muted-foreground">{booking.service_type}</p>
                      </div>
                      <Badge className={cn("text-white", statusColors[booking.status] || "bg-gray-500")}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div><strong>Heure:</strong> {booking.preferred_time}</div>
                      <div><strong>Tél:</strong> {booking.phone}</div>
                      <div className="col-span-2"><strong>Adresse:</strong> {booking.address}</div>
                    </div>
                    {onStatusChange && booking.status !== "completed" && booking.status !== "cancelled" && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onStatusChange(booking.id, "confirmed"); }}>
                          Confirmer
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onStatusChange(booking.id, "completed"); }}>
                          Terminé
                        </Button>
                        <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onStatusChange(booking.id, "cancelled"); }}>
                          Annuler
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
