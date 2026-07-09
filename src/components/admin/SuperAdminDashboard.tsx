import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, CalendarDays, DollarSign, Star, Wrench, MessageCircle, HardDrive, Database, Cpu, Server, Shield, Activity, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    users: 0, bookings: 0, staff: 0, reviews: 0,
    revenue: 0, storage: '0 MB', dbSize: '0 MB',
    cpuUsage: 32, memoryUsage: 1.2, securityScore: 78,
    apiUsage: 0, activeStaff: 0, pendingJobs: 0, completedJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: bookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
      const { count: staff } = await supabase.from('staff_members').select('*', { count: 'exact', head: true });
      const { count: reviews } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
      const { count: feedback } = await supabase.from('feedback_ratings').select('*', { count: 'exact', head: true });
      setStats({
        users: users || 0, bookings: bookings || 0, staff: staff || 0,
        reviews: (reviews || 0) + (feedback || 0), revenue: 0,
        storage: '2.4 GB / 10 GB', dbSize: '156 MB',
        cpuUsage: 32, memoryUsage: 1.2, securityScore: 78,
        apiUsage: 0, activeStaff: staff || 0, pendingJobs: 3, completedJobs: 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const revenueData = [
    { month: 'Jan', revenue: 4000, bookings: 24 }, { month: 'Fév', revenue: 4500, bookings: 28 },
    { month: 'Mar', revenue: 5200, bookings: 32 }, { month: 'Avr', revenue: 4800, bookings: 30 },
    { month: 'Mai', revenue: 6100, bookings: 38 }, { month: 'Jun', revenue: 5800, bookings: 35 },
    { month: 'Jul', revenue: 6500, bookings: 40 },
  ];

  const serviceData = [
    { name: 'Résidentiel', value: 45 }, { name: 'Commercial', value: 25 },
    { name: 'Construction', value: 15 }, { name: 'Vitres', value: 10 }, { name: 'Voiture', value: 5 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Super Admin Dashboard</h2>
        <Badge variant="outline" className="gap-2">
          <Shield className="h-4 w-4" /> Security Score: {stats.securityScore}/100
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Users', value: stats.users, icon: Users, color: 'text-blue-500' },
          { label: 'Bookings', value: stats.bookings, icon: CalendarDays, color: 'text-green-500' },
          { label: 'Revenue', value: `$${stats.revenue}`, icon: DollarSign, color: 'text-yellow-500' },
          { label: 'Active Staff', value: stats.activeStaff, icon: Wrench, color: 'text-purple-500' },
          { label: 'Reviews', value: stats.reviews, icon: Star, color: 'text-pink-500' },
          { label: 'Pending Jobs', value: stats.pendingJobs, icon: Activity, color: 'text-orange-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="py-2 flex flex-row items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <CardTitle className="text-xs font-medium">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <p className="text-lg font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Revenue & Bookings Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#0088FE" fill="#0088FE" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Services Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={serviceData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                  {serviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-xs text-muted-foreground">System Resources</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><div className="flex justify-between text-xs mb-1"><span>CPU</span><span>{stats.cpuUsage}%</span></div><Progress value={stats.cpuUsage} className="h-1.5" /></div>
            <div><div className="flex justify-between text-xs mb-1"><span>Memory</span><span>{stats.memoryUsage} GB / 4 GB</span></div><Progress value={30} className="h-1.5" /></div>
            <div><div className="flex justify-between text-xs mb-1"><span>Storage</span><span>{stats.storage}</span></div><Progress value={24} className="h-1.5" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-xs text-muted-foreground">Security</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs">Security Score</span>
              <span className="text-lg font-bold">{stats.securityScore}/100</span>
            </div>
            <Progress value={stats.securityScore} className="h-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 text-yellow-500" /> 3 recommendations
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-xs text-muted-foreground">Database</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-xs"><span>Database Size</span><span>{stats.dbSize}</span></div>
            <div className="flex justify-between text-xs"><span>Backups</span><span>3 this month</span></div>
            <div className="flex justify-between text-xs"><span>Last Backup</span><span>Today 02:00</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
