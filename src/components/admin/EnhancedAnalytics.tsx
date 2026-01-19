import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend 
} from "recharts";
import { TrendingUp, Calendar, CheckCircle, XCircle, DollarSign, Users, Target, Clock } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, parseISO, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

interface Booking {
  id: string;
  service_type: string;
  status: string;
  created_at: string;
  preferred_date: string;
}

interface ContactSubmission {
  id: string;
  status: string;
  created_at: string;
}

interface EnhancedAnalyticsProps {
  bookings: Booking[];
  contacts: ContactSubmission[];
}

// Service prices in FCFA
const SERVICE_PRICES: Record<string, number> = {
  "Nettoyage Standard": 50000,
  "Nettoyage Approfondi": 80000,
  "Nettoyage de Déménagement": 120000,
  "Nettoyage de Bureau": 100000,
  "Lavage de Vitres": 40000,
  "Nettoyage de Tapis": 60000,
};

const COLORS = ['hsl(var(--accent))', 'hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  completed: '#3b82f6',
  cancelled: '#ef4444',
};

export const EnhancedAnalytics = ({ bookings, contacts }: EnhancedAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '12m'>('30d');

  // Calculate revenue stats
  const revenueStats = useMemo(() => {
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const totalRevenue = completedBookings.reduce((sum, b) => 
      sum + (SERVICE_PRICES[b.service_type] || 50000), 0
    );
    const averageOrderValue = completedBookings.length > 0 
      ? totalRevenue / completedBookings.length 
      : 0;
    
    // Calculate revenue by period
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    
    const thisMonthRevenue = completedBookings
      .filter(b => parseISO(b.created_at) >= thisMonthStart)
      .reduce((sum, b) => sum + (SERVICE_PRICES[b.service_type] || 50000), 0);
    
    const lastMonthRevenue = completedBookings
      .filter(b => {
        const date = parseISO(b.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      })
      .reduce((sum, b) => sum + (SERVICE_PRICES[b.service_type] || 50000), 0);
    
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    return {
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      revenueGrowth,
      averageOrderValue,
      completedCount: completedBookings.length,
    };
  }, [bookings]);

  // Calculate conversion rates
  const conversionStats = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    
    return {
      conversionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      pendingRate: total > 0 ? Math.round((pending / total) * 100) : 0,
      confirmationRate: total > 0 ? Math.round(((confirmed + completed) / total) * 100) : 0,
    };
  }, [bookings]);

  // Time-based trend data
  const trendData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let interval: 'day' | 'week' | 'month';
    
    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        interval = 'day';
        break;
      case '30d':
        startDate = subDays(now, 30);
        interval = 'day';
        break;
      case '90d':
        startDate = subDays(now, 90);
        interval = 'week';
        break;
      case '12m':
        startDate = subMonths(now, 12);
        interval = 'month';
        break;
    }

    const filteredBookings = bookings.filter(b => parseISO(b.created_at) >= startDate);
    
    // Generate date labels
    let dates: Date[];
    if (interval === 'day') {
      dates = eachDayOfInterval({ start: startDate, end: now });
    } else if (interval === 'week') {
      dates = eachWeekOfInterval({ start: startDate, end: now });
    } else {
      dates = eachMonthOfInterval({ start: startDate, end: now });
    }

    return dates.map(date => {
      const periodEnd = interval === 'day' 
        ? date 
        : interval === 'week' 
          ? subDays(new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000), 1)
          : endOfMonth(date);
      
      const periodBookings = filteredBookings.filter(b => {
        const bookingDate = parseISO(b.created_at);
        return isWithinInterval(bookingDate, { start: date, end: periodEnd });
      });

      const revenue = periodBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (SERVICE_PRICES[b.service_type] || 50000), 0);

      const label = interval === 'day' 
        ? format(date, 'dd/MM', { locale: fr })
        : interval === 'week'
          ? format(date, "'S'w", { locale: fr })
          : format(date, 'MMM', { locale: fr });

      return {
        date: label,
        bookings: periodBookings.length,
        revenue: revenue / 1000, // in thousands
        completed: periodBookings.filter(b => b.status === 'completed').length,
        cancelled: periodBookings.filter(b => b.status === 'cancelled').length,
      };
    });
  }, [bookings, timeRange]);

  // Service breakdown with revenue
  const serviceBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; revenue: number }> = {};
    bookings.forEach(b => {
      if (!counts[b.service_type]) {
        counts[b.service_type] = { count: 0, revenue: 0 };
      }
      counts[b.service_type].count++;
      if (b.status === 'completed') {
        counts[b.service_type].revenue += SERVICE_PRICES[b.service_type] || 50000;
      }
    });
    return Object.entries(counts)
      .map(([name, data]) => ({ 
        name, 
        count: data.count, 
        revenue: data.revenue / 1000 
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [bookings]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    bookings.forEach(b => {
      if (counts.hasOwnProperty(b.status)) {
        counts[b.status as keyof typeof counts]++;
      }
    });
    return [
      { name: 'En attente', value: counts.pending, color: STATUS_COLORS.pending },
      { name: 'Confirmé', value: counts.confirmed, color: STATUS_COLORS.confirmed },
      { name: 'Terminé', value: counts.completed, color: STATUS_COLORS.completed },
      { name: 'Annulé', value: counts.cancelled, color: STATUS_COLORS.cancelled },
    ];
  }, [bookings]);

  // Monthly comparison
  const monthlyComparison = useMemo(() => {
    const months: Record<string, { bookings: number; revenue: number }> = {};
    
    bookings.forEach(b => {
      const monthKey = format(parseISO(b.created_at), 'yyyy-MM');
      if (!months[monthKey]) {
        months[monthKey] = { bookings: 0, revenue: 0 };
      }
      months[monthKey].bookings++;
      if (b.status === 'completed') {
        months[monthKey].revenue += SERVICE_PRICES[b.service_type] || 50000;
      }
    });

    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, data]) => ({
        month: format(parseISO(month + '-01'), 'MMM yy', { locale: fr }),
        bookings: data.bookings,
        revenue: data.revenue / 1000,
      }));
  }, [bookings]);

  const formatCurrency = (value: number) => `${value.toLocaleString()} FCFA`;
  const formatK = (value: number) => `${value}k`;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tableau de Bord Analytique</h2>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
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

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenu Total</p>
                <p className="text-2xl font-bold">{formatCurrency(revenueStats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ce Mois</p>
                <p className="text-2xl font-bold">{formatCurrency(revenueStats.thisMonthRevenue)}</p>
                {revenueStats.revenueGrowth !== 0 && (
                  <p className={`text-xs ${revenueStats.revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {revenueStats.revenueGrowth > 0 ? '+' : ''}{revenueStats.revenueGrowth.toFixed(1)}% vs mois dernier
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Panier Moyen</p>
                <p className="text-2xl font-bold">{formatCurrency(revenueStats.averageOrderValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/20">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de Conversion</p>
                <p className="text-2xl font-bold">{conversionStats.conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="bookings">Réservations</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="monthly">Mensuel</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évolution des Revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={formatK} />
                    <Tooltip 
                      formatter={(value: number) => [`${value}k FCFA`, 'Revenu']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tendance des Réservations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="bookings" 
                        name="Total"
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--accent))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        name="Terminé"
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cancelled" 
                        name="Annulé"
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={{ fill: '#ef4444' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribution des Statuts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusDistribution.map((entry, index) => (
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
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenus par Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" tickFormatter={formatK} />
                      <YAxis type="category" dataKey="name" className="text-xs" width={140} />
                      <Tooltip 
                        formatter={(value: number) => [`${value}k FCFA`, 'Revenu']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nombre de Réservations par Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {serviceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comparaison Mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" tickFormatter={formatK} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="bookings" name="Réservations" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="revenue" name="Revenu (k FCFA)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{conversionStats.confirmationRate}%</p>
                <p className="text-sm text-muted-foreground">Taux de Confirmation</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{conversionStats.cancellationRate}%</p>
                <p className="text-sm text-muted-foreground">Taux d'Annulation</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{conversionStats.pendingRate}%</p>
                <p className="text-sm text-muted-foreground">En Attente</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{revenueStats.completedCount}</p>
                <p className="text-sm text-muted-foreground">Services Terminés</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAnalytics;