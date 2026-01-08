import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface Booking {
  id: string;
  full_name: string;
  email: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  created_at: string;
}

interface RecentBookingsTableProps {
  bookings: Booking[];
  onStatusChange: (id: string, status: string) => void;
}

export const RecentBookingsTable = ({ bookings, onStatusChange }: RecentBookingsTableProps) => {
  const [, setSearchParams] = useSearchParams();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-500", label: "En attente" },
      confirmed: { color: "bg-green-500", label: "Confirmé" },
      completed: { color: "bg-blue-500", label: "Terminé" },
      cancelled: { color: "bg-red-500", label: "Annulé" },
    };
    const variant = variants[status] || { color: "bg-gray-500", label: status };
    return <Badge className={`${variant.color} text-white`}>{variant.label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Dernières réservations</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSearchParams({ tab: "bookings" })}
        >
          Voir tout
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="hidden sm:table-cell">Service</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.slice(0, 5).map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.full_name}</p>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        {booking.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell capitalize">
                    {booking.service_type}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(booking.preferred_date)}
                  </TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {booking.status === "pending" && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => onStatusChange(booking.id, "confirmed")}
                            title="Confirmer"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => onStatusChange(booking.id, "cancelled")}
                            title="Annuler"
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {bookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucune réservation récente
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
