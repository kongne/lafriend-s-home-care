import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/admin/KPICard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Star, MessageSquare, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface DashboardStats {
  totalReviews: number;
  avgRating: number;
  pendingReviews: number;
  publishedProjects: number;
  draftProjects: number;
  totalFeedback: number;
  newFeedback: number;
  prevTotalReviews: number;
  prevAvgRating: number;
  prevPublishedProjects: number;
  prevTotalFeedback: number;
}

interface MonthlyStat {
  month: string;
  reviews: number;
  projects: number;
  bookings: number;
}

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

interface DashboardAnalyticsProps {
  timeRange: "7d" | "30d" | "90d" | "12m";
}

export const DashboardAnalytics = ({ timeRange }: DashboardAnalyticsProps) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const getPeriodDays = (range: string): number => {
    switch (range) {
      case "7d": return 7;
      case "30d": return 30;
      case "90d": return 90;
      case "12m": return 365;
      default: return 30;
    }
  };

  const getGrouping = (range: string): "day" | "week" | "month" => {
    switch (range) {
      case "7d": return "day";
      case "30d": return "day";
      case "90d": return "week";
      case "12m": return "month";
      default: return "month";
    }
  };

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

      const allReviews = reviewsRes.data || [];
      const allProjects = projectsRes.data || [];
      const allFeedback = feedbackRes.data || [];
      const prevReviews = prevReviewsRes.data || [];
      const prevProjects = prevProjectsRes.data || [];
      const prevFeedback = prevFeedbackRes.data || [];

      const totalReviews = allReviews.length;
      const avgRating = totalReviews > 0
        ? Math.round((allReviews.reduce((sum, r: any) => sum + (r.rating || 0), 0) / totalReviews) * 10) / 10
        : 0;
      const pendingReviews = allReviews.filter((r: any) => r.status === "pending").length;
      const publishedProjects = allProjects.filter((p: any) => p.status === "published").length;
      const draftProjects = allProjects.filter((p: any) => p.status === "draft").length;
      const totalFeedback = allFeedback.length;
      const newFeedback = allFeedback.filter((f: any) => f.status === "new").length;

      const prevTotalReviews = prevReviews.length;
      const prevAvgRating = prevTotalReviews > 0
        ? Math.round((prevReviews.reduce((sum, r: any) => sum + (r.rating || 0), 0) / prevTotalReviews) * 10) / 10
        : 0;
      const prevPublishedProjects = prevProjects.filter((p: any) => p.status === "published").length;
      const prevTotalFeedback = prevFeedback.length;

      setStats({ totalReviews, avgRating, pendingReviews, publishedProjects, draftProjects, totalFeedback, newFeedback, prevTotalReviews, prevAvgRating, prevPublishedProjects, prevTotalFeedback });

      const grouping = getGrouping(timeRange);
      const monthly: MonthlyStat[] = [];
      const itemData = reviewsMonthly.data || [];
      const projData = projectsMonthly.data || [];
      const bookData = bookingsMonthly.data || [];

      if (grouping === "month") {
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = d.toISOString().slice(0, 7);
          monthly.push({
            month: MONTHS_FR[d.getMonth()],
            reviews: itemData.filter((r: any) => r.created_at?.startsWith(monthKey)).length,
            projects: projData.filter((p: any) => p.created_at?.startsWith(monthKey)).length,
            bookings: bookData.filter((b: any) => b.created_at?.startsWith(monthKey)).length,
          });
        }
      } else if (grouping === "week") {
        const numWeeks = Math.ceil(days / 7);
        for (let i = numWeeks - 1; i >= 0; i--) {
          const weekStart = new Date(now.getTime() - (i * 7 + 6) * 86400000);
          const weekEnd = new Date(now.getTime() - i * 7 * 86400000);
          monthly.push({
            month: `S${numWeeks - i}`,
            reviews: itemData.filter((r: any) => { const d = new Date(r.created_at); return d >= weekStart && d <= weekEnd; }).length,
            projects: projData.filter((p: any) => { const d = new Date(p.created_at); return d >= weekStart && d <= weekEnd; }).length,
            bookings: bookData.filter((b: any) => { const d = new Date(b.created_at); return d >= weekStart && d <= weekEnd; }).length,
          });
        }
      } else {
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 86400000);
          const dayKey = d.toISOString().slice(0, 10);
          const label = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
          monthly.push({
            month: label,
            reviews: itemData.filter((r: any) => r.created_at?.startsWith(dayKey)).length,
            projects: projData.filter((p: any) => p.created_at?.startsWith(dayKey)).length,
            bookings: bookData.filter((b: any) => b.created_at?.startsWith(dayKey)).length,
          });
        }
      }
      setMonthlyData(monthly);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-12 w-12 rounded-full" /><Skeleton className="h-5 w-24 mt-3" /><Skeleton className="h-8 w-16 mt-1" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (!stats) return null;

  const calcChange = (current: number, previous: number): number | undefined => {
    if (previous === 0) return undefined;
    return Math.round(((current - previous) / previous) * 100);
  };

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
          <CardHeader>
            <CardTitle className="text-base">
              Activité ({timeRange === "7d" ? "7 jours" : timeRange === "30d" ? "30 jours" : timeRange === "90d" ? "90 jours" : "12 mois"})
            </CardTitle>
          </CardHeader>
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
          <CardHeader>
            <CardTitle className="text-base">Tendance Avis & Réservations</CardTitle>
          </CardHeader>
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
    </div>
  );
};

export default DashboardAnalytics;
