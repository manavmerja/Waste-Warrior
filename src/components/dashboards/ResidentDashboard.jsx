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
import recyclingIllustration from '@/assets/recycling-illustration.png';

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
      <div className="flex items-center justify-center min-h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
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
      {/* Welcome Banner - Gradient Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01, y: -2 }}
        className="relative overflow-hidden bg-gradient-to-r from-[#00A86B] to-[#4F46E5] rounded-2xl shadow-xl p-8 md:p-12"
      >
        {/* Background Image */}
        <div className="absolute inset-0 opacity-20">
          <img 
            src={teamSpiritIllustration} 
            alt="Team Spirit" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Welcome back, {userProfile?.full_name?.split(' ')[0] || 'Warrior'}! 🌱
          </motion.h1>
          <motion.p 
            className="text-2xl md:text-3xl text-white/90 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            You have <span className="font-bold">{userProfile?.credits || 0}</span> Green Points
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              onClick={() => onSectionChange('report')}
              size="lg"
              className="bg-white text-[#00A86B] hover:bg-gray-100 font-semibold shadow-lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Report a Waste Issue
            </Button>
          </motion.div>
        </div>
      </motion.div>

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
          { title: 'Total Reports', value: stats.totalReports, icon: FileText, iconColor: 'text-blue-700', bgColor: 'bg-blue-100' },
          { title: 'Resolved', value: stats.resolvedReports, icon: CheckCircle, iconColor: 'text-green-700', bgColor: 'bg-green-100' },
          { title: 'Pending', value: stats.pendingReports, icon: Clock, iconColor: 'text-yellow-700', bgColor: 'bg-yellow-100' },
          { title: 'Green Points', value: stats.totalCredits, icon: Coins, iconColor: 'text-purple-700', bgColor: 'bg-purple-100' },
        ].map((stat) => (
          <motion.div
            key={stat.title}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Card className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <Card className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Zap className="mr-2 h-5 w-5 text-yellow-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Camera, label: 'Report Waste', action: 'report', gradient: 'from-green-400 to-emerald-500' },
              { icon: MapPin, label: 'Find Points', action: 'map', gradient: 'from-indigo-400 to-purple-500' },
              { icon: Gift, label: 'Rewards', action: 'credits', gradient: 'from-orange-400 to-red-500' },
              { icon: FileText, label: 'Learn', action: 'learning', gradient: 'from-teal-400 to-cyan-500' },
            ].map((action) => (
              <motion.button
                key={action.label}
                onClick={() => onSectionChange(action.action)}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center space-y-3 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Tabs */}
      <Card className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <Tabs defaultValue="reports">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-700">Recent Reports</TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-700">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="reports" className="space-y-3 mt-4">
              {reports.length > 0 ? reports.map((report) => (
                <motion.div 
                  key={report.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{report.title}</h4>
                    <p className="text-xs text-gray-600">{new Date(report.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className={
                    report.status === 'resolved' 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : report.status === 'rejected'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                  }>
                    {report.status}
                  </Badge>
                </motion.div>
              )) : (
                <div className="text-center py-8">
                  <img src={recyclingIllustration} alt="No reports" className="w-32 h-32 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-600">No reports yet. Start reporting waste issues!</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="notifications" className="mt-4">
              {notifications.length > 0 ? notifications.map((n) => (
                <motion.div 
                  key={n.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-3 hover:from-blue-100 hover:to-indigo-100 transition-all"
                >
                  <h4 className="font-medium text-sm text-gray-900">{n.title}</h4>
                  <p className="text-xs text-gray-700 mt-1">{n.message}</p>
                </motion.div>
              )) : (
                <div className="text-center py-8">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">No new notifications</p>
                </div>
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