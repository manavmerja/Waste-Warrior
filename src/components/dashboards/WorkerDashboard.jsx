import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Truck, MapPin, CheckCircle, Clock, User, Bell, Award, BookOpen, 
  Camera, Navigation, LogOut, BarChart3, Phone, Mail, HelpCircle, 
  Home, ClipboardList, TrendingUp, Menu, X 
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector from '@/components/ui/language-selector';

export default function WorkerDashboard() {
  const { t } = useTranslation();
  const { user, userProfile, signOut } = useAuth();
  const [assignedReports, setAssignedReports] = useState([]);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingEvidence, setUploadingEvidence] = useState(null);
  const [activeSection, setActiveSection] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchWorkerData();
      subscribeToNotifications();
    }
  }, [user]);

  const fetchWorkerData = async () => {
    try {
      setLoading(true);
      
      const [reportsRes, profileRes, notificationsRes] = await Promise.all([
        supabase
          .from('reports')
          .select('*, users(full_name, email)')
          .eq('assigned_worker_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('workers')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('worker_notifications')
          .select('*')
          .eq('worker_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      if (reportsRes.error) throw reportsRes.error;
      
      setAssignedReports(reportsRes.data || []);
      setWorkerProfile(profileRes.data);
      setNotifications(notificationsRes.data || []);
    } catch (error) {
      console.error('Error fetching worker data:', error);
      toast.error('Failed to load worker data');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('worker-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'worker_notifications',
          filter: `worker_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          toast.success(payload.new.title, {
            description: payload.new.message
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateReportStatus = async (reportId, newStatus, segregationDone = false) => {
    try {
      const updateData = { 
        status: newStatus,
        segregation_done: segregationDone
      };
      if (newStatus === 'completed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      toast.success(t('worker.statusUpdated'));
      fetchWorkerData();
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report status');
    }
  };

  const handleEvidenceUpload = async (reportId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingEvidence(reportId);
      
      // Get geolocation
      let geoData = { lat: null, lng: null };
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              geoData = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              resolve();
            },
            () => resolve()
          );
        });
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${reportId}-evidence-${Date.now()}.${fileExt}`;
      const filePath = `evidence/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('waste-reports')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('waste-reports')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('reports')
        .update({ 
          evidence_photo_url: publicUrl,
          evidence_timestamp: new Date().toISOString(),
          evidence_lat: geoData.lat,
          evidence_lng: geoData.lng,
          status: 'in_progress'
        })
        .eq('id', reportId);

      if (updateError) throw updateError;

      toast.success(
        geoData.lat ? t('worker.evidenceWithGeo') : t('worker.evidenceUploaded')
      );
      fetchWorkerData();
    } catch (error) {
      console.error('Error uploading evidence:', error);
      toast.error('Failed to upload evidence');
    } finally {
      setUploadingEvidence(null);
    }
  };

  const markNotificationRead = async (notificationId) => {
    await supabase
      .from('worker_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    fetchWorkerData();
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };

  const openInMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'secondary',
      assigned: 'default',
      in_progress: 'default',
      completed: 'default',
      rejected: 'destructive',
      escalated: 'destructive'
    };
    return variants[status] || 'secondary';
  };

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const pendingReports = assignedReports.filter(r => 
    r.status === 'assigned' || r.status === 'in_progress'
  );
  const completedReports = assignedReports.filter(r => r.status === 'completed');
  const todayPickups = assignedReports.filter(r => {
    const today = new Date().toDateString();
    return new Date(r.created_at).toDateString() === today;
  });
  const weeklyPickups = assignedReports.filter(r => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(r.created_at) >= weekAgo;
  });
  const unreadNotifications = notifications.filter(n => !n.is_read).length;
  const completionRate = assignedReports.length > 0 
    ? Math.round((completedReports.length / assignedReports.length) * 100) 
    : 0;

  const menuItems = [
    { id: 'profile', label: t('worker.profile'), icon: User },
    { id: 'pickups', label: t('worker.assignedPickups'), icon: ClipboardList },
    { id: 'progress', label: t('worker.progress'), icon: TrendingUp },
    { id: 'notifications', label: t('worker.notifications'), icon: Bell, badge: unreadNotifications },
    { id: 'support', label: t('worker.support'), icon: HelpCircle },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'pickups':
        return <PickupsSection />;
      case 'progress':
        return <ProgressSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'support':
        return <SupportSection />;
      default:
        return <ProfileSection />;
    }
  };

  const ProfileSection = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">{t('worker.profile')}</h2>
        <LanguageSelector />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('worker.workerInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{t('worker.name')}</Label>
              <p className="text-lg font-medium">{userProfile?.full_name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('worker.workerId')}</Label>
              <p className="text-lg font-mono">{workerProfile?.id?.slice(0, 8) || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('worker.email')}</Label>
              <p className="text-lg">{userProfile?.email || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('worker.phone')}</Label>
              <p className="text-lg">{userProfile?.phone || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('worker.language')}</Label>
              <p className="text-lg capitalize">{userProfile?.language || 'English'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('worker.status')}</Label>
              <Badge variant={workerProfile?.is_active ? 'default' : 'secondary'}>
                {workerProfile?.is_active ? t('worker.active') : t('worker.inactive')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {t('worker.totalCredits')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">{userProfile?.credits || 0}</div>
          <p className="text-sm text-muted-foreground mt-2">{t('worker.creditsEarned')}</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  const PickupsSection = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold text-foreground">{t('worker.assignedPickups')}</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('worker.total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('worker.pending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('worker.completed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{completedReports.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('worker.pickupsList')}</CardTitle>
          <CardDescription>{t('worker.pickupsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {assignedReports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('worker.noPickups')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('worker.location')}</TableHead>
                  <TableHead>{t('worker.residentName')}</TableHead>
                  <TableHead>{t('worker.wasteType')}</TableHead>
                  <TableHead>{t('worker.date')}</TableHead>
                  <TableHead>{t('worker.status')}</TableHead>
                  <TableHead>{t('worker.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedReports.map((report) => (
                  <TableRow key={report.id} className={isOverdue(report.deadline) ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="max-w-[200px] truncate">
                          {report.address_text || `${report.location_lat}, ${report.location_lng}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{report.users?.full_name || 'N/A'}</TableCell>
                    <TableCell>{report.title}</TableCell>
                    <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(report.status)}>
                        {report.status}
                      </Badge>
                      {isOverdue(report.deadline) && (
                        <Badge variant="destructive" className="ml-2">{t('worker.overdue')}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {report.location_lat && report.location_lng && (
                          <Button
                            onClick={() => openInMaps(report.location_lat, report.location_lng)}
                            variant="outline"
                            size="sm"
                          >
                            <Navigation className="h-4 w-4" />
                          </Button>
                        )}
                        {report.status === 'assigned' && (
                          <Button
                            onClick={() => updateReportStatus(report.id, 'in_progress')}
                            size="sm"
                          >
                            {t('worker.start')}
                          </Button>
                        )}
                        {report.status === 'in_progress' && (
                          <>
                            <Label htmlFor={`evidence-${report.id}`} className="cursor-pointer">
                              <Button
                                type="button"
                                disabled={uploadingEvidence === report.id}
                                size="sm"
                                asChild
                              >
                                <span>
                                  <Camera className="h-4 w-4" />
                                </span>
                              </Button>
                            </Label>
                            <Input
                              id={`evidence-${report.id}`}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => handleEvidenceUpload(report.id, e)}
                              disabled={uploadingEvidence === report.id}
                            />
                            {report.evidence_photo_url && (
                              <Button
                                onClick={() => updateReportStatus(report.id, 'completed')}
                                size="sm"
                                variant="default"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const ProgressSection = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold text-foreground">{t('worker.progressTracker')}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('worker.completionRate')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {completedReports.length} {t('worker.of')} {assignedReports.length} {t('worker.pickupsCompleted')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('worker.stats')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('worker.todayPickups')}</span>
              <span className="text-xl font-bold">{todayPickups.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('worker.weeklyPickups')}</span>
              <span className="text-xl font-bold">{weeklyPickups.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('worker.pending')}</span>
              <span className="text-xl font-bold text-warning">{pendingReports.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('worker.recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedReports.slice(0, 5).map((report) => (
              <div key={report.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <CheckCircle className="h-5 w-5 text-success" />
                <div className="flex-1">
                  <p className="font-medium">{report.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(report.resolved_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="default">{t('worker.completed')}</Badge>
              </div>
            ))}
            {completedReports.length === 0 && (
              <p className="text-center text-muted-foreground py-4">{t('worker.noCompletedPickups')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const NotificationsSection = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">{t('worker.notifications')}</h2>
        {unreadNotifications > 0 && (
          <Badge variant="destructive">{unreadNotifications} {t('worker.unread')}</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('worker.allNotifications')}</CardTitle>
          <CardDescription>{t('worker.notificationsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('worker.noNotifications')}</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors ${
                  !notification.is_read ? 'bg-primary/5 border-primary' : 'bg-card'
                }`}
              >
                <div className="flex items-start gap-4">
                  <Bell className={`h-5 w-5 mt-0.5 ${!notification.is_read ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <Button
                      onClick={() => markNotificationRead(notification.id)}
                      variant="ghost"
                      size="sm"
                    >
                      {t('worker.markRead')}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const SupportSection = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold text-foreground">{t('worker.support')}</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {t('worker.contactAdmin')}
          </CardTitle>
          <CardDescription>{t('worker.supportDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{t('worker.helpline')}</p>
              <p className="text-sm text-muted-foreground">+1-800-WASTE-WARRIOR</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{t('worker.emailSupport')}</p>
              <p className="text-sm text-muted-foreground">support@wastewarrior.com</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('worker.guidelines')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-semibold">{t('worker.pickupProcedure')}</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>{t('worker.step1')}</li>
              <li>{t('worker.step2')}</li>
              <li>{t('worker.step3')}</li>
              <li>{t('worker.step4')}</li>
            </ol>
          </div>
          <div className="space-y-2 pt-4">
            <h4 className="font-semibold">{t('worker.safetyGuidelines')}</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>{t('worker.safety1')}</li>
              <li>{t('worker.safety2')}</li>
              <li>{t('worker.safety3')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="bg-card border-r border-border sticky top-0 h-screen overflow-y-auto"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Truck className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Waste Warrior</span>
              </motion.div>
            )}
            <Button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              variant="ghost"
              size="icon"
              className="ml-auto"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                variant={activeSection === item.id ? 'default' : 'ghost'}
                className={`w-full justify-start ${!sidebarOpen && 'px-2'}`}
              >
                <item.icon className={`h-5 w-5 ${sidebarOpen && 'mr-3'}`} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className={`w-full justify-start ${!sidebarOpen && 'px-2'}`}
            >
              <LogOut className={`h-5 w-5 ${sidebarOpen && 'mr-3'}`} />
              {sidebarOpen && t('worker.logout')}
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl py-8 px-6">
          {renderSection()}
        </div>
      </main>
    </div>
  );

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('worker.totalAssigned')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('worker.pending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('worker.completed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('worker.totalCredits')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{userProfile?.credits || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pickups">
            <Truck className="mr-2 h-4 w-4" />
            {t('worker.pickups')} ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle className="mr-2 h-4 w-4" />
            {t('worker.completed')} ({completedReports.length})
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            {t('worker.notifications')}
            {unreadNotifications > 0 && (
              <Badge className="ml-2" variant="destructive">{unreadNotifications}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="credits">
            <Award className="mr-2 h-4 w-4" />
            {t('worker.credits')}
          </TabsTrigger>
          <TabsTrigger value="learning">
            <BookOpen className="mr-2 h-4 w-4" />
            {t('worker.learning')}
          </TabsTrigger>
        </TabsList>

        {/* Pickups Tab */}
        <TabsContent value="pickups">
          <div className="space-y-4">
            {pendingReports.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">{t('worker.noPickups')}</p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {pendingReports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className={isOverdue(report.deadline) ? 'border-red-500' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle>{report.title}</CardTitle>
                              {isOverdue(report.deadline) && (
                                <Badge variant="destructive">{t('worker.overdue')}</Badge>
                              )}
                            </div>
                            <CardDescription className="flex items-center">
                              <MapPin className="mr-1 h-4 w-4" />
                              {report.address_text || `${report.location_lat}, ${report.location_lng}`}
                            </CardDescription>
                            {report.users && (
                              <p className="text-sm text-muted-foreground">
                                {t('worker.reportedBy')}: {report.users.full_name || report.users.email}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {t('worker.deadline')}: {new Date(report.deadline).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                        
                        {/* Photo Display */}
                        {report.photo_urls && report.photo_urls.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {report.photo_urls.map((url, idx) => (
                              <img 
                                key={idx} 
                                src={url} 
                                alt="Report" 
                                className="w-24 h-24 object-cover rounded"
                              />
                            ))}
                          </div>
                        )}

                        {/* Segregation Check */}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`seg-${report.id}`}
                            checked={report.segregation_done}
                            onCheckedChange={(checked) => 
                              updateReportStatus(report.id, report.status, checked)
                            }
                          />
                          <Label htmlFor={`seg-${report.id}`}>{t('worker.segregationDone')}</Label>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {report.location_lat && report.location_lng && (
                            <Button
                              onClick={() => openInMaps(report.location_lat, report.location_lng)}
                              variant="outline"
                              size="sm"
                            >
                              <Navigation className="mr-2 h-4 w-4" />
                              {t('worker.getDirections')}
                            </Button>
                          )}
                          
                          {report.status === 'assigned' && (
                            <Button
                              onClick={() => updateReportStatus(report.id, 'in_progress')}
                              variant="outline"
                              size="sm"
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              {t('worker.startPickup')}
                            </Button>
                          )}

                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`evidence-${report.id}`}
                              className="cursor-pointer"
                            >
                              <Button
                                type="button"
                                disabled={uploadingEvidence === report.id}
                                size="sm"
                                asChild
                              >
                                <span>
                                  <Camera className="mr-2 h-4 w-4" />
                                  {uploadingEvidence === report.id ? 'Uploading...' : t('worker.uploadEvidence')}
                                </span>
                              </Button>
                            </Label>
                            <Input
                              id={`evidence-${report.id}`}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => handleEvidenceUpload(report.id, e)}
                              disabled={uploadingEvidence === report.id}
                            />
                          </div>

                          {report.evidence_photo_url && (
                            <>
                              <Button
                                onClick={() => updateReportStatus(report.id, 'completed')}
                                variant="default"
                                size="sm"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t('worker.markPicked')}
                              </Button>
                              <Button
                                onClick={() => updateReportStatus(report.id, 'rejected')}
                                variant="destructive"
                                size="sm"
                              >
                                {t('worker.markFailed')}
                              </Button>
                            </>
                          )}
                        </div>

                        {report.evidence_photo_url && (
                          <div className="mt-2">
                            <Label className="text-xs text-muted-foreground">Evidence Photo:</Label>
                            <img 
                              src={report.evidence_photo_url} 
                              alt="Evidence" 
                              className="w-32 h-32 object-cover rounded mt-1"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed">
          <div className="space-y-4">
            {completedReports.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">{t('worker.noCompleted')}</p>
                </CardContent>
              </Card>
            ) : (
              completedReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle>{report.title}</CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" />
                          {report.address_text || `${report.location_lat}, ${report.location_lng}`}
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-500">{t('worker.completed')}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {t('worker.completedOn')}: {new Date(report.resolved_at).toLocaleString()}
                    </p>
                    {report.segregation_verified && (
                      <Badge variant="outline" className="mt-2">
                        {t('worker.segregationStatus')}: Verified
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('worker.notifications')}</CardTitle>
                {unreadNotifications > 0 && (
                  <Button onClick={markAllNotificationsRead} variant="outline" size="sm">
                    {t('worker.markAllRead')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('worker.noNotifications')}</p>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 rounded-lg border ${
                      notif.is_read ? 'bg-muted/50' : 'bg-primary/10 border-primary'
                    }`}
                    onClick={() => !notif.is_read && markNotificationRead(notif.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{notif.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <Badge variant="default" className="ml-2">New</Badge>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits">
          <Card>
            <CardHeader>
              <CardTitle>{t('worker.creditsHistory')}</CardTitle>
              <CardDescription>
                {t('worker.totalCredits')}: {userProfile?.credits || 0}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {creditsLog.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No credit history yet</p>
              ) : (
                creditsLog.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{log.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={log.amount > 0 ? 'default' : 'destructive'}>
                      {log.amount > 0 ? '+' : ''}{log.amount}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning">
          <LearningModules />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}