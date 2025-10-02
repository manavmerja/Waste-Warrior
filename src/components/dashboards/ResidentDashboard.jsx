import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
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
  User,
  Menu,
  Home
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ReportForm from '@/components/forms/ReportForm';
import CreditsSystem from '@/components/features/CreditsSystem';
import GreenChampionsLeaderboard from '@/components/features/GreenChampionsLeaderboard';
import UserProfile from '@/components/features/UserProfile';
import LanguageSelector from '@/components/ui/language-selector';
import LearningModules from '@/components/features/LearningModules';

// Sidebar navigation items
const navigationItems = [
  { id: 'overview', label: 'dashboard.overview', icon: Home },
  { id: 'report', label: 'dashboard.reportWaste', icon: Camera },
  { id: 'learning', label: 'dashboard.learning', icon: FileText },
  { id: 'credits', label: 'dashboard.credits', icon: Coins },
  { id: 'leaderboard', label: 'dashboard.champions', icon: BarChart3 },
  { id: 'profile', label: 'dashboard.profile', icon: User },
];

function DashboardSidebar({ activeSection, onSectionChange }) {
  const { collapsed } = useSidebar();
  const { t } = useTranslation();

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            {!collapsed && "Waste Warrior"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeSection === item.id}
                    onClick={() => onSectionChange(item.id)}
                    className="w-full justify-start gap-3 hover:bg-accent/50 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:border-r-2 data-[active=true]:border-primary"
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="font-medium">{t(item.label)}</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function ResidentDashboard() {
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    fetchUserData();
    setupRealtimeListeners();
  }, []);

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

      setReports(reportsData || []);
      setNotifications(notificationsData || []);
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
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const renderActiveSection = () => {
    const sectionVariants = {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    };

    switch (activeSection) {
      case 'overview':
        return (
          <motion.div
            key="overview"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('dashboard.greenPoints')}</CardTitle>
                    <Award className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{userProfile?.credits || 0}</div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">{t('dashboard.nextReward')}</span>
                        <span className="font-medium">{t('dashboard.pointsNeeded', { count: creditsToNextReward })}</span>
                      </div>
                      <Progress value={creditsProgress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('dashboard.reportsLookup')}</CardTitle>
                    <FileText className="h-4 w-4 text-secondary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-secondary">{reports.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('dashboard.resolvedThisMonth', { count: reports.filter(r => r.status === 'resolved').length })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('dashboard.kitStatus')}</CardTitle>
                    <Gift className="h-4 w-4 text-warning" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">
                      {userProfile?.kit_received ? t('dashboard.received') : t('dashboard.pending')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('dashboard.ecoFriendlyKit')}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                    {t('dashboard.quickActions')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button 
                      className="h-auto flex-col space-y-2 p-6 hover:scale-105 transition-transform" 
                      variant="outline"
                      onClick={() => setActiveSection('report')}
                    >
                      <Camera className="h-8 w-8 text-primary" />
                      <span className="font-medium">{t('dashboard.reportWasteAction')}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {t('dashboard.reportWasteDesc')}
                      </span>
                    </Button>
                    
                    <Button className="h-auto flex-col space-y-2 p-6 hover:scale-105 transition-transform" variant="outline">
                      <MapPin className="h-8 w-8 text-secondary" />
                      <span className="font-medium">{t('dashboard.findCollectionPoints')}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {t('dashboard.findCollectionDesc')}
                      </span>
                    </Button>
                    
                    <Button 
                      className="h-auto flex-col space-y-2 p-6 hover:scale-105 transition-transform" 
                      variant="outline"
                      disabled={creditsToNextReward > 0}
                      onClick={() => setActiveSection('credits')}
                    >
                      <Gift className="h-8 w-8 text-warning" />
                      <span className="font-medium">{t('dashboard.redeemRewards')}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {creditsToNextReward > 0 
                          ? t('dashboard.pointsNeeded', { count: creditsToNextReward })
                          : t('dashboard.redeemDesc')
                        }
                      </span>
                    </Button>
                    
                    <Button className="h-auto flex-col space-y-2 p-6 hover:scale-105 transition-transform" variant="outline">
                      <Bell className="h-8 w-8 text-info" />
                      <span className="font-medium">{t('dashboard.learningCenter')}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {t('dashboard.learningDesc')}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Reports and Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-primary" />
                      {t('dashboard.recentReports')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reports.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>{t('dashboard.noReports')}</p>
                        <p className="text-sm">{t('dashboard.startReporting')}</p>
                      </div>
                    ) : (
                      reports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{report.title}</h4>
                            <p className="text-sm text-muted-foreground">{report.address_text}</p>
                            <div className="flex items-center mt-2 space-x-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {new Date(report.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="mr-2 h-5 w-5 text-info" />
                      {t('dashboard.recentNotifications')}
                      {notifications.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {notifications.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>{t('dashboard.noNotifications')}</p>
                        <p className="text-sm">{t('dashboard.notifyUpdates')}</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{notification.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.created_at).toLocaleString()}
                              </span>
                            </div>
                            <CheckCircle className="h-4 w-4 text-success ml-2 flex-shrink-0" />
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        );
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
            <GreenChampionsLeaderboard />
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
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        <DashboardSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hidden sm:block"
                >
                  <h1 className="text-xl font-bold text-foreground">
                    {t('dashboard.welcome', { name: userProfile?.full_name?.split(' ')[0] || 'Warrior' })}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.welcomeSubtitle')}
                  </p>
                </motion.div>
              </div>
              
              <div className="flex items-center gap-4">
                <LanguageSelector />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <AnimatePresence mode="wait">
              {renderActiveSection()}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}