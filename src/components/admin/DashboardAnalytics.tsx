import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
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

interface DashboardStats {
  totalReviews: number;
  avgRating: number;
  pendingReviews: number;
  publishedProjects: number;
  draftProjects: number;
  totalFeedback: number;
  newFeedback: number;
}

interface MonthlyStat {
  month: string;
  reviews: number;
  projects: number;
  bookings: number;
}

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const DashboardAnalytics = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [reviewsRes, projectsRes, feedbackRes, reviewsMonthly, projectsMonthly, bookingsMonthly] = await Promise.all([
        supabase.from("reviews").select("*", { count: "exact", head: false }),
        supabase.from("projects").select("*", { count: "exact", head: false }),
        supabase.from("feedback").select("*", { count: "exact", head: false }),
        supabase.from("reviews").select("created_at").gte("created_at", new Date(Date.now() - 365 * 86400000).toISOString()),
        supabase.from("projects").select("created_at").gte("created_at", new Date(Date.now() - 365 * 86400000).toISOString()),
        supabase.from("bookings").select("created_at").gte("created_at", new Date(Date.now() - 365 * 86400000).toISOString()),
      ]);

      const allReviews = reviewsRes.data || [];
      const allProjects = projectsRes.data || [];
      const allFeedback = feedbackRes.data || [];

      const totalReviews = allReviews.length;
      const avgRating = totalReviews > 0
        ? Math.round((allReviews.reduce((sum, r: any) => sum + (r.rating || 0), 0) / totalReviews) * 10) / 10
        : 0;
      const pendingReviews = allReviews.filter((r: any) => r.status === "pending").length;
      const publishedProjects = allProjects.filter((p: any) => p.status === "published").length;
      const draftProjects = allProjects.filter((p: any) => p.status === "draft").length;
      const totalFeedback = allFeedback.length;
      const newFeedback = allFeedback.filter((f: any) => f.status === "new").length;

      setStats({ totalReviews, avgRating, pendingReviews, publishedProjects, draftProjects, totalFeedback, newFeedback });

      const monthly: MonthlyStat[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = d.toISOString().slice(0, 7);
        const monthLabel = MONTHS_FR[d.getMonth()];
        monthly.push({
          month: monthLabel,
          reviews: (reviewsMonthly.data || []).filter((r: any) => r.created_at?.startsWith(monthKey)).length,
          projects: (projectsMonthly.data || []).filter((p: any) => p.created_at?.startsWith(monthKey)).length,
          bookings: (bookingsMonthly.data || []).filter((b: any) => b.created_at?.startsWith(monthKey)).length,
        });
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

  const cards = [
    { label: "Total Avis", value: stats.totalReviews, icon: Star, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
    { label: "Note Moyenne", value: stats.avgRating.toString(), icon: TrendingUp, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20", suffix: "/5" },
    { label: "Avis en Attente", value: stats.pendingReviews, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/20" },
    { label: "Projets Publiés", value: stats.publishedProjects, icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
    { label: "Projets Brouillon", value: stats.draftProjects, icon: FileText, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-950/20" },
    { label: "Total Retours", value: stats.totalFeedback, icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20" },
    { label: "Nouveaux Retours", value: stats.newFeedback, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{card.label}</p>
              <p className="text-2xl font-bold mt-1">
                {card.value}
                {card.suffix && <span className="text-lg text-muted-foreground font-normal">{card.suffix}</span>}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activité Mensuelle (12 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ fontWeight: 600 }}
                  />
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
            <CardTitle className="text-base">Tendance des Avis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ fontWeight: 600 }}
                  />
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
