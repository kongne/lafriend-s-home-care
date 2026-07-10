import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KPICard } from "@/components/admin/KPICard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import { Star, MessageSquare, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle, Calendar, DollarSign, Users, Target, XCircle } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, parseISO, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

interface Booking {
  id: string; service_type: string; status: string; created_at: string; preferred_date: string;
}
interface ContactSubmission {
  id: string; status: string; created_at: string;
}
interface AnalyticsDashboardProps {
  timeRange: "7d" | "30d" | "90d" | "12m";
  bookings: Booking[];
  contacts: ContactSubmission[];
}

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const SERVICE_PRICES: Record<string, number> = {
  "Nettoyage Standard": 50000, "Nettoyage Approfondi": 80000,
  "Nettoyage de Déménagement": 120000, "Nettoyage de Bureau": 100000,
  "Lavage de Vitres": 40000, "Nettoyage de Tapis": 60000,
};
const COLORS = ['hsl(var(--accent))', 'hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#10b981', completed: '#3b82f6', cancelled: '#ef4444',
};

export const AnalyticsDashboard = ({ timeRange, bookings, contacts }: AnalyticsDashboardProps) => {
  const [tabTimeRange, setTabTimeRange] = useState<'7d' | '30d' | '90d' | '12m'>('30d');

  const formatCurrency = (value: number) => `${value.toLocaleString()} FCFA`;
  const formatK = (value: number) => `${value}k`;

  const getPeriodDays = (range: string): number => {
    switch (range) { case "7d": return 7; case "30d": return 30; case "90d": return 90; case "12m": return 365; default: return 30; }
  };
  const getGrouping = (range: string): "day" | "week" | "month" => {
    switch (range) { case "7d": return "day"; case "30d": return "day"; case "90d": return "week"; case "12m": return "month"; default: return "month"; }
  };

  const [stats, setStats] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const days = getPeriodDays(timeRange);
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 86400000).toISOString();
        const prevStartDate = new Date(now.getTime() - 2 * days * 86400000).toISOString();
        const prevEndDate = new Date(now.getTime() - days * 86400000).toISOString();
        const [reviewsRes, projectsRes, feedbackRes, reviewsMonthly, projectsMonthly, bookingsMonthly,
          prevReviewsRes, prevProjectsRes, prevFeedbackRes] = await Promise.all([
          supabase.from("reviews").select("*", { count: "exact", head: false }).gte("created_at", startDate),
          supabase.from("projects").select("*", { count: "exact", head: false }).gte("created_at", startDate),
          supabase.from("feedback").select("*", { count: "exact", head: false }).gte("created_at", startDate),
          supabase.from("reviews").select("created_at").gte("created_at", startDate),
          supabase.from("projects").select("created_at").gte("created_at", startDate),
          supabase.from("bookings").select("created_at").gte("created_at", startDate),
          supabase.from("reviews").select("*", { count: "exact", head: false }).gte("created_at", prevStartDate).lt("created_at", prevEndDate),
          supabase.from("projects").select("*", { count: "exact", head: false }).gte("created_at", prevStartDate).lt("created_at", prevEndDate),
          supabase.from("feedback").select("*", { count: "exact", head: false }).gte("created_at", prevStartDate).lt("created_at", prevEndDate),
        ]);
        const allReviews = reviewsRes.data || []; const allProjects = projectsRes.data || []; const allFeedback = feedbackRes.data || [];
        const prevReviews = prevReviewsRes.data || []; const prevProjects = prevProjectsRes.data || []; const prevFeedback = prevFeedbackRes.data || [];
        const totalReviews = allReviews.length;
        const avgRating = totalReviews > 0 ? Math.round((allReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalReviews) * 10) / 10 : 0;
        const prevTotalReviews = prevReviews.length;
        const prevAvgRating = prevTotalReviews > 0 ? Math.round((prevReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / prevTotalReviews) * 10) / 10 : 0;
        setStats({ totalReviews, avgRating, pendingReviews: allReviews.filter((r: any) => r.status === "pending").length, publishedProjects: allProjects.filter((p: any) => p.status === "published").length, draftProjects: allProjects.filter((p: any) => p.status === "draft").length, totalFeedback: allFeedback.length, newFeedback: allFeedback.filter((f: any) => f.status === "new").length, prevTotalReviews, prevAvgRating, prevPublishedProjects: prevProjects.filter((p: any) => p.status === "published").length, prevTotalFeedback: prevFeedback.length });
        const grouping = getGrouping(timeRange);
        const monthly: any[] = [];
        const itemData = reviewsMonthly.data || []; const projData = projectsMonthly.data || []; const bookData = bookingsMonthly.data || [];
        if (grouping === "month") {
          for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const key = d.toISOString().slice(0, 7); monthly.push({ month: MONTHS_FR[d.getMonth()], reviews: itemData.filter((r: any) => r.created_at?.startsWith(key)).length, projects: projData.filter((p: any) => p.created_at?.startsWith(key)).length, bookings: bookData.filter((b: any) => b.created_at?.startsWith(key)).length }); }
        } else if (grouping === "week") {
          const numWeeks = Math.ceil(days / 7);
          for (let i = numWeeks - 1; i >= 0; i--) { const ws = new Date(now.getTime() - (i * 7 + 6) * 86400000); const we = new Date(now.getTime() - i * 7 * 86400000); monthly.push({ month: `S${numWeeks - i}`, reviews: itemData.filter((r: any) => { const d = new Date(r.created_at); return d >= ws && d <= we; }).length, projects: projData.filter((p: any) => { const d = new Date(p.created_at); return d >= ws && d <= we; }).length, bookings: bookData.filter((b: any) => { const d = new Date(b.created_at); return d >= ws && d <= we; }).length }); }
        } else {
          for (let i = days - 1; i >= 0; i--) { const d = new Date(now.getTime() - i * 86400000); const label = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }); const key = d.toISOString().slice(0, 10); monthly.push({ month: label, reviews: itemData.filter((r: any) => r.created_at?.startsWith(key)).length, projects: projData.filter((p: any) => p.created_at?.startsWith(key)).length, bookings: bookData.filter((b: any) => b.created_at?.startsWith(key)).length }); }
        }
        setMonthlyData(monthly);
      } catch (err) { console.error("Error fetching dashboard stats:", err); } finally { setLoading(false); }
    };
    fetchStats();
  });

  const calcChange = (current: number, previous: number): number | undefined => previous === 0 ? undefined : Math.round(((current - previous) / previous) * 100);

  const revenueStats = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'completed');
    const totalRevenue = completed.reduce((sum, b) => sum + (SERVICE_PRICES[b.service_type] || 50000), 0);
    const now = new Date();
    const thisMonthRevenue = completed.filter(b => parseISO(b.created_at) >= startOfMonth(now)).reduce((sum, b) => sum + (SERVICE_PRICES[b.service_type] || 50000), 0);
    const lastMonthRevenue = completed.filter(b => { const d = parseISO(b.created_at); return d >= startOfMonth(subMonths(now, 1)) && d <= endOfMonth(subMonths(now, 1)); }).reduce((sum, b) => sum + (SERVICE_PRICES[b.service_type] || 50000), 0);
    return { totalRevenue, thisMonthRevenue, lastMonthRevenue, revenueGrowth: lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0, averageOrderValue: completed.length > 0 ? totalRevenue / completed.length : 0, completedCount: completed.length };
  }, [bookings]);

  const conversionStats = useMemo(() => {
    const total = bookings.length; const completed = bookings.filter(b => b.status === 'completed').length; const cancelled = bookings.filter(b => b.status === 'cancelled').length; const pending = bookings.filter(b => b.status === 'pending').length; const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    return { conversionRate: total > 0 ? Math.round((completed / total) * 100) : 0, cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0, pendingRate: total > 0 ? Math.round((pending / total) * 100) : 0, confirmationRate: total > 0 ? Math.round(((confirmed + completed) / total) * 100) : 0 };
  }, [bookings]);

  const trendData = useMemo(() => {
    const now = new Date();
    let startDate: Date; let interval: 'day' | 'week' | 'month';
    switch (tabTimeRange) {
      case '7d': startDate = subDays(now, 7); interval = 'day'; break;
      case '30d': startDate = subDays(now, 30); interval = 'day'; break;
      case '90d': startDate = subDays(now, 90); interval = 'week'; break;
      case '12m': startDate = subMonths(now, 12); interval = 'month'; break;
    }
    const filtered = bookings.filter(b => parseISO(b.created_at) >= startDate!);
    const dates = interval === 'day' ? eachDayOfInterval({ start: startDate!, end: now }) : interval === 'week' ? eachWeekOfInterval({ start: startDate!, end: now }) : eachMonthOfInterval({ start: startDate!, end: now });
    return dates.map(date => {
      const periodEnd = interval === 'day' ? date : interval === 'week' ? subDays(new Date(date.getTime() + 7 * 86400000), 1) : endOfMonth(date);
      const periodBookings = filtered.filter(b => isWithinInterval(parseISO(b.created_at), { start: date, end: periodEnd }));
      return { date: interval === 'day' ? format(date, 'dd/MM', { locale: fr }) : interval === 'week' ? format(date, "'S'w", { locale: fr }) : format(date, 'MMM', { locale: fr }), bookings: periodBookings.length, revenue: periodBookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (SERVICE_PRICES[b.service_type] || 50000), 0) / 1000, completed: periodBookings.filter(b => b.status === 'completed').length, cancelled: periodBookings.filter(b => b.status === 'cancelled').length };
    });
  }, [bookings, tabTimeRange]);

  const serviceBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; revenue: number }> = {};
    bookings.forEach(b => { if (!counts[b.service_type]) counts[b.service_type] = { count: 0, revenue: 0 }; counts[b.service_type].count++; if (b.status === 'completed') counts[b.service_type].revenue += SERVICE_PRICES[b.service_type] || 50000; });
    return Object.entries(counts).map(([name, data]) => ({ name, count: data.count, revenue: data.revenue / 1000 })).sort((a, b) => b.revenue - a.revenue);
  }, [bookings]);

  const statusDistribution = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    bookings.forEach(b => { if (counts.hasOwnProperty(b.status)) counts[b.status as keyof typeof counts]++; });
    return [{ name: 'En attente', value: counts.pending, color: STATUS_COLORS.pending }, { name: 'Confirmé', value: counts.confirmed, color: STATUS_COLORS.confirmed }, { name: 'Terminé', value: counts.completed, color: STATUS_COLORS.completed }, { name: 'Annulé', value: counts.cancelled, color: STATUS_COLORS.cancelled }];
  }, [bookings]);

  const monthlyComparison = useMemo(() => {
    const months: Record<string, { bookings: number; revenue: number }> = {};
    bookings.forEach(b => { const key = format(parseISO(b.created_at), 'yyyy-MM'); if (!months[key]) months[key] = { bookings: 0, revenue: 0 }; months[key].bookings++; if (b.status === 'completed') months[key].revenue += SERVICE_PRICES[b.service_type] || 50000; });
    return Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([month, data]) => ({ month: format(parseISO(month + '-01'), 'MMM yy', { locale: fr }), bookings: data.bookings, revenue: data.revenue / 1000 }));
  }, [bookings]);

  if (loading || !stats) {
    return <div className="space-y-6">{!stats ? null : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 7 }).map((_, i) => (<Card key={i}><CardContent className="p-6"><Skeleton className="h-12 w-12 rounded-full" /><Skeleton className="h-5 w-24 mt-3" /><Skeleton className="h-8 w-16 mt-1" /></CardContent></Card>))}</div>}<Skeleton className="h-72 w-full rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KPICard title="Total Avis" value={stats.totalReviews} change={calcChange(stats.totalReviews, stats.prevTotalReviews)} icon={Star} iconColor="text-amber-500" />
        <KPICard title="Note Moyenne" value={`${stats.avgRating}/5`} change={stats.prevAvgRating > 0 ? calcChange(stats.avgRating, stats.prevAvgRating) : undefined} icon={TrendingUp} iconColor="text-green-500" />
        <KPICard title="Avis en Attente" value={stats.pendingReviews} icon={Clock} iconColor="text-yellow-500" />
        <KPICard title="Projets Publiés" value={stats.publishedProjects} change={calcChange(stats.publishedProjects, stats.prevPublishedProjects)} icon={CheckCircle2} iconColor="text-blue-500" />
        <KPICard title="Projets Brouillon" value={stats.draftProjects} icon={FileText} iconColor="text-gray-500" />
        <KPICard title="Total Retours" value={stats.totalFeedback} change={calcChange(stats.totalFeedback, stats.prevTotalFeedback)} icon={MessageSquare} iconColor="text-purple-500" />
        <KPICard title="Nouveaux Retours" value={stats.newFeedback} icon={AlertCircle} iconColor="text-red-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Activité ({timeRange === "7d" ? "7 jours" : timeRange === "30d" ? "30 jours" : timeRange === "90d" ? "90 jours" : "12 mois"})</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} labelStyle={{ fontWeight: 600 }} />
                  <Bar dataKey="reviews" name="Avis" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="projects" name="Projets" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bookings" name="Réservations" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Tendance Avis & Réservations</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} labelStyle={{ fontWeight: 600 }} />
                  <Line type="monotone" dataKey="reviews" name="Avis" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: "hsl(var(--accent))" }} />
                  <Line type="monotone" dataKey="bookings" name="Réservations" stroke="#34d399" strokeWidth={2} dot={{ fill: "#34d399" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-green-500/20"><DollarSign className="h-6 w-6 text-green-500" /></div><div><p className="text-sm text-muted-foreground">Revenu Total</p><p className="text-2xl font-bold">{formatCurrency(revenueStats.totalRevenue)}</p></div></div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-blue-500/20"><Calendar className="h-6 w-6 text-blue-500" /></div><div><p className="text-sm text-muted-foreground">Ce Mois</p><p className="text-2xl font-bold">{formatCurrency(revenueStats.thisMonthRevenue)}</p>{revenueStats.revenueGrowth !== 0 && <p className={`text-xs ${revenueStats.revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>{revenueStats.revenueGrowth > 0 ? '+' : ''}{revenueStats.revenueGrowth.toFixed(1)}% vs mois dernier</p>}</div></div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-purple-500/20"><Target className="h-6 w-6 text-purple-500" /></div><div><p className="text-sm text-muted-foreground">Panier Moyen</p><p className="text-2xl font-bold">{formatCurrency(revenueStats.averageOrderValue)}</p></div></div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-accent/20"><TrendingUp className="h-6 w-6 text-accent" /></div><div><p className="text-sm text-muted-foreground">Taux de Conversion</p><p className="text-2xl font-bold">{conversionStats.conversionRate}%</p></div></div></CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tableau de Bord Analytique</h2>
        <Select value={tabTimeRange} onValueChange={(v) => setTabTimeRange(v as typeof tabTimeRange)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="90d">90 derniers jours</SelectItem>
            <SelectItem value="12m">12 derniers mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="bookings">Réservations</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="monthly">Mensuel</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-lg">Évolution des Revenus</CardTitle></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="date" className="text-xs" /><YAxis className="text-xs" tickFormatter={formatK} /><Tooltip formatter={(value: number) => [`${value}k FCFA`, 'Revenu']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Area type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#colorRevenue)" /></AreaChart></ResponsiveContainer></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle className="text-lg">Tendance des Réservations</CardTitle></CardHeader><CardContent><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="date" className="text-xs" /><YAxis className="text-xs" /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Legend /><Line type="monotone" dataKey="bookings" name="Total" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} /><Line type="monotone" dataKey="completed" name="Terminé" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} /><Line type="monotone" dataKey="cancelled" name="Annulé" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} /></LineChart></ResponsiveContainer></div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-lg">Distribution des Statuts</CardTitle></CardHeader><CardContent><div className="h-[280px] flex items-center justify-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{statusDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /></PieChart></ResponsiveContainer></div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle className="text-lg">Revenus par Service</CardTitle></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={serviceBreakdown} layout="vertical"><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis type="number" className="text-xs" tickFormatter={formatK} /><YAxis type="category" dataKey="name" className="text-xs" width={140} /><Tooltip formatter={(value: number) => [`${value}k FCFA`, 'Revenu']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-lg">Nombre de Réservations par Service</CardTitle></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={serviceBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="count" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>{serviceBreakdown.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Legend /></PieChart></ResponsiveContainer></div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-lg">Comparaison Mensuelle</CardTitle></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyComparison}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="month" className="text-xs" /><YAxis yAxisId="left" className="text-xs" /><YAxis yAxisId="right" orientation="right" className="text-xs" tickFormatter={formatK} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Legend /><Bar yAxisId="left" dataKey="bookings" name="Réservations" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} /><Bar yAxisId="right" dataKey="revenue" name="Revenu (k FCFA)" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6 text-center"><CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold">{conversionStats.confirmationRate}%</p><p className="text-sm text-muted-foreground">Taux de Confirmation</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" /><p className="text-2xl font-bold">{conversionStats.cancellationRate}%</p><p className="text-sm text-muted-foreground">Taux d'Annulation</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" /><p className="text-2xl font-bold">{conversionStats.pendingRate}%</p><p className="text-sm text-muted-foreground">En Attente</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 text-purple-500 mx-auto mb-2" /><p className="text-2xl font-bold">{revenueStats.completedCount}</p><p className="text-sm text-muted-foreground">Services Terminés</p></CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;