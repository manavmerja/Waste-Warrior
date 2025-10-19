import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar, SidebarFooter } from '@/components/ui/sidebar';
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
  Home,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ReportForm from '@/components/forms/ReportForm';
import CreditsSystem from '@/components/features/CreditsSystem';
import { LeaderboardDashboard } from '@/components/modules/Leaderboard';
import UserProfile from '@/components/features/UserProfile';
import LanguageSelector from '@/components/ui/language-selector';
import LearningModules from '@/components/features/LearningModules';
import ecoIllustration from '@/assets/eco-conscious-illustration.png';

// Sidebar navigation items
const navigationItems = [
  { id: 'overview', label: 'dashboard.overview', icon: Home },
  { id: 'report', label: 'dashboard.reportWaste', icon: Camera },
  { id: 'learning', label: 'dashboard.learning', icon: FileText },
  { id: 'credits', label: 'dashboard.credits', icon: Coins },
  { id: 'leaderboard', label: 'dashboard.champions', icon: BarChart3 },
];

function DashboardSidebar({ activeSection, onSectionChange, userProfile }) {
  const { collapsed, setCollapsed } = useSidebar();
  const { signOut } = useAuth();
  const { t } = useTranslation();

  // Set default collapsed state on mount
  useEffect(() => {
    setCollapsed(true);
  }, [setCollapsed]);

  return (
    <Sidebar 
      className={collapsed ? "w-16" : "w-64"} 
      collapsible
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      style={{ backgroundColor: '#1F2937' }}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white font-semibold">
            {!collapsed && "Waste Warrior"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeSection === item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={`w-full justify-start gap-3 ${
                      activeSection === item.id
                        ? 'bg-[#00A86B] text-white hover:bg-[#00A86B]/90'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
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
        
        {/* Profile & Logout Section */}
        <SidebarFooter className="mt-auto border-t border-gray-700 pt-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onSectionChange('profile')}
                className="w-full justify-start gap-3 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name} />
                  <AvatarFallback className="bg-[#00A86B] text-white">
                    {userProfile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm text-white">{userProfile?.full_name || 'User'}</span>
                    <span className="text-xs text-gray-400">{userProfile?.role || 'Resident'}</span>
                  </div>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={signOut}
                className="w-full justify-start gap-3 text-gray-300 hover:bg-red-600 hover:text-white"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">Log Out</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
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
            {/* Welcome Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="relative overflow-hidden border-none bg-gradient-to-r from-[#00A86B] to-[#4F46E5] text-white">
                <div 
                  className="absolute inset-0 opacity-10 bg-no-repeat bg-right-bottom bg-contain"
                  style={{ 
                    backgroundImage: `url(${ecoIllustration})`,
                  }}
                />
                <CardContent className="relative p-8 md:p-12">
                  <div className="max-w-2xl">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                      Welcome back, {userProfile?.full_name?.split(' ')[0] || 'Warrior'}!
                    </h1>
                    <h2 className="text-xl md:text-2xl mb-6">
                      You have <span className="font-bold text-yellow-300">{userProfile?.credits || 0}</span> Green Points
                    </h2>
                    <Button 
                      size="lg"
                      onClick={() => setActiveSection('report')}
                      className="bg-white text-[#00A86B] hover:bg-gray-100 font-semibold"
                    >
                      Report a Waste Issue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-[#1F2937]">
                    <TrendingUp className="mr-2 h-5 w-5 text-[#00A86B]" />
                    {t('dashboard.quickActions')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button 
                      className="h-auto flex-col space-y-2 p-6 hover:scale-105 transition-transform border-2" 
                      variant="outline"
                      onClick={() => setActiveSection('report')}
                    >
                      <Camera className="h-8 w-8 text-[#00A86B]" />
                      <span className="font-medium text-[#1F2937]">{t('dashboard.reportWasteAction')}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {t('dashboard.reportWasteDesc')}
                      </span>
                    </Button>
                    
                    <Button className="h-auto flex-col space-y-2 p-6 hover:scale-105 transition-transform border-2" variant="outline">
                      <MapPin className="h-8 w-8 text-[#4F46E5]" />
                      <span className="font-medium text-[#1F2937]">{t('dashboard.findCollectionPoints')}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {t('dashboard.findCollectionDesc')}
                      </span>
                    </Button>
                    
                    <Button 
                      className="h-auto flex-col space-y-2 p-6 hover:scale-105 transition-transform border-2" 
                      variant="outline"
                      disabled={creditsToNextReward > 0}
                      onClick={() => setActiveSection('credits')}
                    >
                      <Gift className="h-8 w-8 text-[#F59E0B]" />
                      <span className="font-medium text-[#1F2937]">{t('dashboard.redeemRewards')}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {creditsToNextReward > 0 
                          ? t('dashboard.pointsNeeded', { count: creditsToNextReward })
                          : t('dashboard.redeemDesc')
                        }
                      </span>
                    </Button>
                    
                    <Button 
                      className="h-auto flex-col space-y-2 p-6 hover:scale-105 transition-transform border-2" 
                      variant="outline"
                      onClick={() => setActiveSection('learning')}
                    >
                      <Bell className="h-8 w-8 text-[#4F46E5]" />
                      <span className="font-medium text-[#1F2937]">{t('dashboard.learningCenter')}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {t('dashboard.learningDesc')}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity Feeds with Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#1F2937]">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="reports" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="reports" className="data-[state=active]:bg-[#00A86B] data-[state=active]:text-white">
                        Recent Reports
                      </TabsTrigger>
                      <TabsTrigger value="notifications" className="data-[state=active]:bg-[#00A86B] data-[state=active]:text-white">
                        Notifications {notifications.length > 0 && (
                          <Badge variant="secondary" className="ml-2 bg-[#EF4444] text-white">
                            {notifications.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="reports" className="space-y-4 mt-4">
                      {reports.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                          <p>{t('dashboard.noReports')}</p>
                          <p className="text-sm">{t('dashboard.startReporting')}</p>
                        </div>
                      ) : (
                        reports.map((report) => (
                          <div key={report.id} className="flex items-center justify-between p-4 bg-[#F7FAFC] rounded-lg border">
                            <div className="flex-1">
                              <h4 className="font-medium text-[#1F2937]">{report.title}</h4>
                              <p className="text-sm text-muted-foreground">{report.address_text}</p>
                              <div className="flex items-center mt-2 space-x-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(report.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Badge 
                              className={
                                report.status === 'pending' ? 'bg-[#F59E0B] text-white' :
                                report.status === 'resolved' ? 'bg-[#22C55E] text-white' :
                                report.status === 'rejected' ? 'bg-[#EF4444] text-white' :
                                'bg-[#4F46E5] text-white'
                              }
                            >
                              {report.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </TabsContent>
                    
                    <TabsContent value="notifications" className="space-y-4 mt-4">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                          <p>{t('dashboard.noNotifications')}</p>
                          <p className="text-sm">{t('dashboard.notifyUpdates')}</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div key={notification.id} className="p-4 bg-[#F7FAFC] rounded-lg border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-[#1F2937]">{notification.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(notification.created_at).toLocaleString()}
                                </span>
                              </div>
                              <CheckCircle className="h-4 w-4 text-[#22C55E] ml-2 flex-shrink-0" />
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
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

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-[#F7FAFC]">
        <DashboardSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          userProfile={userProfile}
        />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="flex h-16 items-center justify-end px-6">
              <LanguageSelector />
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