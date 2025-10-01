import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, MapPin, Award, Briefcase, Package, TrendingUp, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    pendingReports: 0,
    completedReports: 0,
    totalWorkers: 0,
    activeWorkers: 0,
    collectionPoints: 0,
    totalCredits: 0,
    greenChampions: 0,
    pendingKits: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [usersRes, reportsRes, workersRes, pointsRes, creditsRes, championsRes, kitsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('reports').select('status', { count: 'exact' }),
      supabase.from('users').select('is_active').eq('role', 'worker'),
      supabase.from('collection_points').select('id', { count: 'exact' }),
      supabase.from('users').select('credits'),
      supabase.from('users').select('id').eq('is_green_champion', true),
      supabase.from('kits').select('is_delivered')
    ]);

    setStats({
      totalUsers: usersRes.count || 0,
      totalReports: reportsRes.count || 0,
      pendingReports: reportsRes.data?.filter(r => r.status === 'pending').length || 0,
      completedReports: reportsRes.data?.filter(r => r.status === 'completed').length || 0,
      totalWorkers: workersRes.data?.length || 0,
      activeWorkers: workersRes.data?.filter(w => w.is_active).length || 0,
      collectionPoints: pointsRes.count || 0,
      totalCredits: creditsRes.data?.reduce((sum, u) => sum + (u.credits || 0), 0) || 0,
      greenChampions: championsRes.data?.length || 0,
      pendingKits: kitsRes.data?.filter(k => !k.is_delivered).length || 0
    });
  };

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Total Reports', value: stats.totalReports, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Pending Reports', value: stats.pendingReports, icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { title: 'Completed Reports', value: stats.completedReports, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'Total Workers', value: stats.totalWorkers, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { title: 'Active Workers', value: stats.activeWorkers, icon: Briefcase, color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { title: 'Collection Points', value: stats.collectionPoints, icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Total Credits', value: stats.totalCredits, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Green Champions', value: stats.greenChampions, icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Pending Kits', value: stats.pendingKits, icon: Package, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Admin Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your waste management system.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-bold">
                  {stats.totalReports > 0 
                    ? ((stats.completedReports / stats.totalReports) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Worker Utilization</span>
                <span className="font-bold">
                  {stats.totalWorkers > 0 
                    ? ((stats.activeWorkers / stats.totalWorkers) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Credits/User</span>
                <span className="font-bold">
                  {stats.totalUsers > 0 
                    ? (stats.totalCredits / stats.totalUsers).toFixed(0)
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10">
          <CardHeader>
            <CardTitle>Quick Actions Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.pendingReports > 0 && (
                <div className="flex items-center gap-2 p-2 bg-background rounded">
                  <FileText className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{stats.pendingReports} reports need assignment</span>
                </div>
              )}
              {stats.pendingKits > 0 && (
                <div className="flex items-center gap-2 p-2 bg-background rounded">
                  <Package className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">{stats.pendingKits} kits pending delivery</span>
                </div>
              )}
              {stats.pendingReports === 0 && stats.pendingKits === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  All caught up! 🎉
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
