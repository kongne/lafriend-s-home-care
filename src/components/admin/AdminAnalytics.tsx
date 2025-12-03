import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Calendar, CheckCircle, XCircle } from "lucide-react";

interface Booking {
  id: string;
  service_type: string;
  status: string;
  created_at: string;
}

interface ContactSubmission {
  id: string;
  status: string;
  created_at: string;
}

interface AdminAnalyticsProps {
  bookings: Booking[];
  contacts: ContactSubmission[];
}

const COLORS = ['hsl(var(--accent))', 'hsl(var(--primary))', 'hsl(var(--muted))', '#10b981', '#f59e0b', '#ef4444'];

export const AdminAnalytics = ({ bookings, contacts }: AdminAnalyticsProps) => {
  const serviceStats = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      counts[b.service_type] = (counts[b.service_type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  const statusStats = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    bookings.forEach(b => {
      if (counts.hasOwnProperty(b.status)) {
        counts[b.status as keyof typeof counts]++;
      }
    });
    return [
      { name: 'En attente', value: counts.pending, color: '#f59e0b' },
      { name: 'Confirmé', value: counts.confirmed, color: '#10b981' },
      { name: 'Terminé', value: counts.completed, color: '#3b82f6' },
      { name: 'Annulé', value: counts.cancelled, color: '#ef4444' },
    ];
  }, [bookings]);

  const weeklyTrend = useMemo(() => {
    const last7Days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      last7Days[key] = 0;
    }
    
    bookings.forEach(b => {
      const date = new Date(b.created_at);
      const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 7) {
        const key = date.toLocaleDateString('fr-FR', { weekday: 'short' });
        if (last7Days.hasOwnProperty(key)) {
          last7Days[key]++;
        }
      }
    });
    
    return Object.entries(last7Days).map(([day, count]) => ({ day, count }));
  }, [bookings]);

  const conversionRate = useMemo(() => {
    if (bookings.length === 0) return 0;
    const completed = bookings.filter(b => b.status === 'completed').length;
    return Math.round((completed / bookings.length) * 100);
  }, [bookings]);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <p className="text-muted-foreground text-sm">Taux de conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-muted-foreground text-sm">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{confirmedCount}</p>
                <p className="text-muted-foreground text-sm">Confirmés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{contacts.filter(c => c.status === 'unread').length}</p>
                <p className="text-muted-foreground text-sm">Messages non lus</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Réservations cette semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Services Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Services populaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={120} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Distribution des statuts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
