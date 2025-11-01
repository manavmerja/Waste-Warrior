import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  MapPin, 
  Award, 
  Bell, 
  FileText, 
  Gift,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  Coins,
  BarChart3,
  Zap,
  Users,
  Sparkles,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ReportForm from '@/components/forms/ReportForm';
import CreditsSystem from '@/components/features/CreditsSystem';
import { LeaderboardDashboard } from '@/components/modules/Leaderboard';
import UserProfile from '@/components/features/UserProfile';
import LearningModules from '@/components/features/LearningModules';
import DashboardLayout from '@/components/layout/DashboardLayout';
import wasteIllustration from '@/assets/waste-management-illustration.png';
import teamSpiritIllustration from '@/assets/team-spirit-illustration.png';

export default function ResidentDashboard({activeSection, onSectionChange}) {
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    totalCredits: 0,
  });

  useEffect(() => {
    if (userProfile?.id) {
      fetchUserData();
      setupRealtimeListeners();
    }
  }, [userProfile]);

  const fetchUserData = async () => {
    try {
      // Fetch user's reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reportsError) throw reportsError;

      // Fetch notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile?.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (notificationsError) throw notificationsError;

      // Calculate stats
      const totalReports = reportsData?.length || 0;
      const resolvedReports = reportsData?.filter(r => r.status === 'resolved').length || 0;
      const pendingReports = reportsData?.filter(r => r.status === 'pending').length || 0;

      setReports(reportsData || []);
      setNotifications(notificationsData || []);
      setStats({
        totalReports,
        resolvedReports,
        pendingReports,
        totalCredits: userProfile?.credits || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    // Listen for report status updates
    const reportChannel = supabase
      .channel('report_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reports',
          filter: `user_id=eq.${userProfile?.id}`
        },
        (payload) => {
          setReports(prev => 
            prev.map(report => 
              report.id === payload.new.id ? payload.new : report
            )
          );
          
          // Show notification for status change
          toast({
            title: 'Report Updated',
            description: `Your report status changed to ${payload.new.status}`,
          });
        }
      )
      .subscribe();

    // Listen for new notifications
    const notificationChannel = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile?.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          toast({
            title: payload.new.title,
            description: payload.new.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reportChannel);
      supabase.removeChannel(notificationChannel);
    };
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const creditsToNextReward = Math.max(0, 100 - (userProfile?.credits || 0));
  const creditsProgress = Math.min(100, ((userProfile?.credits || 0) / 100) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-gradient-to-b from-violet-50 to-cyan-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const renderOverviewSection = () => (
    <motion.div
      key="overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <Card className="relative overflow-hidden border-none bg-gradient-to-r from-[#00A86B] to-[#4F46E5] text-white shadow-2xl">
        <div 
          className="absolute inset-0 opacity-20 bg-no-repeat bg-right-bottom"
          style={{ 
            backgroundImage: `url(${teamSpiritIllustration})`,
            backgroundSize: '50%',
          }}
        />
        <CardContent className="relative p-8 md:p-12">
          <div className="max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Welcome back, {userProfile?.full_name?.split(' ')[0] || 'Warrior'}! 🌱
            </motion.h1>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-3xl mb-6"
            >
              You have <span className="font-bold text-yellow-300">{userProfile?.credits || 0}</span> Green Points
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                size="lg"
                onClick={() => onSectionChange('report')}
                className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-semibold shadow-lg"
              >
                <Camera className="mr-2 h-5 w-5" />
                Report a Waste Issue
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {[
          { title: 'Total Reports', value: stats.totalReports, icon: FileText, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', gradient: 'from-blue-500 to-indigo-500' },
          { title: 'Resolved', value: stats.resolvedReports, icon: CheckCircle, iconBg: 'bg-green-100', iconColor: 'text-green-600', gradient: 'from-green-500 to-emerald-500' },
          { title: 'Pending', value: stats.pendingReports, icon: Clock, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', gradient: 'from-yellow-500 to-orange-500' },
          { title: 'Green Points', value: stats.totalCredits, icon: Coins, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', gradient: 'from-purple-500 to-pink-500' },
        ].map((stat) => (
          <motion.div
            key={stat.title}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                    <p className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${stat.gradient} mt-2`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.iconBg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions & Activity Feeds */}
      <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Zap className="mr-2 h-5 w-5 text-[#F59E0B]" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Camera, label: 'Report Waste', action: 'report', gradient: 'from-green-400 to-emerald-500', iconColor: 'text-green-600' },
              { icon: MapPin, label: 'Find Points', action: 'map', gradient: 'from-indigo-400 to-purple-500', iconColor: 'text-indigo-600' },
              { icon: Gift, label: 'Rewards', action: 'credits', gradient: 'from-orange-400 to-red-500', iconColor: 'text-orange-600' },
              { icon: FileText, label: 'Learn', action: 'learning', gradient: 'from-teal-400 to-cyan-500', iconColor: 'text-teal-600' },
            ].map((action) => (
              <motion.div
                key={action.label}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  className="h-auto flex-col space-y-3 p-6 border-2 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all w-full" 
                  variant="outline"
                  onClick={() => onSectionChange(action.action)}
                >
                  <div className={`p-3 rounded-full bg-gradient-to-br ${action.gradient}`}>
                    <action.icon className="h-8 w-8 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">{action.label}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Tabs */}
      <Card className="bg-white shadow-lg">
        <CardContent className="p-6">
          <Tabs defaultValue="reports">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reports">Recent Reports</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="reports" className="space-y-3">
              {reports.length > 0 ? reports.map((report) => (
                <motion.div 
                  key={report.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-gray-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{report.title}</h4>
                    <p className="text-xs text-gray-500">{new Date(report.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className={
                    report.status === 'resolved' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : report.status === 'rejected'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                  }>
                    {report.status}
                  </Badge>
                </motion.div>
              )) : (
                <p className="text-center text-gray-500 py-4">No reports yet. Start reporting waste issues!</p>
              )}
            </TabsContent>
            <TabsContent value="notifications">
              {notifications.length > 0 ? notifications.map((n) => (
                <motion.div 
                  key={n.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-2 hover:shadow-md transition-shadow"
                >
                  <h4 className="font-medium text-sm text-gray-900">{n.title}</h4>
                  <p className="text-xs text-gray-600">{n.message}</p>
                </motion.div>
              )) : (
                <p className="text-center text-gray-500 py-4">No new notifications</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderActiveSection = () => {
    const sectionVariants = {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    };

    switch (activeSection) {
      case 'overview':
        return renderOverviewSection();
      
      case 'report':
        return (
          <motion.div
            key="report"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <ReportForm onReportSubmitted={fetchUserData} />
          </motion.div>
        );
      case 'credits':
        return (
          <motion.div
            key="credits"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <CreditsSystem />
          </motion.div>
        );
      case 'leaderboard':
        return (
          <motion.div
            key="leaderboard"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <LeaderboardDashboard />
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div
            key="profile"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <UserProfile />
          </motion.div>
        );
      case 'learning':
        return (
          <motion.div
            key="learning"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <LearningModules />
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Inside ResidentDashboard (1).jsx - CORRECTED return statement
return (
    <AnimatePresence mode="wait"> 
      {renderActiveSection()}
    </AnimatePresence> 
  );
}