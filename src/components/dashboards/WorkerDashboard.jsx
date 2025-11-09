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
  Camera, Navigation, BarChart3, Phone, Mail, HelpCircle, 
  ClipboardList, TrendingUp 
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkerDashboard({ activeSection, onSectionChange }) {
  const { t } = useTranslation();
  const { user, userProfile, signOut } = useAuth();
  const [assignedReports, setAssignedReports] = useState([]);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingEvidence, setUploadingEvidence] = useState(null);

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
          .select('*, users:user_id(full_name, email)') // <-- THIS LINE IS FIXED
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
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <User className="h-5 w-5 text-indigo-600" />
            {t('worker.workerInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-600">{t('worker.name')}</Label>
              <p className="text-lg font-medium text-gray-900">{userProfile?.full_name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-gray-600">{t('worker.workerId')}</Label>
              <p className="text-lg font-mono text-gray-900">{workerProfile?.id?.slice(0, 8) || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-gray-600">{t('worker.email')}</Label>
              <p className="text-lg text-gray-900">{userProfile?.email || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-gray-600">{t('worker.phone')}</Label>
              <p className="text-lg text-gray-900">{userProfile?.phone || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-gray-600">{t('worker.language')}</Label>
              <p className="text-lg capitalize text-gray-900">{userProfile?.language || 'English'}</p>
            </div>
            <div>
              <Label className="text-gray-600">{t('worker.status')}</Label>
              <Badge variant={workerProfile?.is_active ? 'default' : 'secondary'}>
                {workerProfile?.is_active ? t('worker.active') : t('worker.inactive')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Award className="h-5 w-5 text-purple-600" />
            {t('worker.totalCredits')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-purple-600">{userProfile?.credits || 0}</div>
          <p className="text-sm text-gray-600 mt-2">{t('worker.creditsEarned')}</p>
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-900">{t('worker.total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{assignedReports.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-900">{t('worker.pending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingReports.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-900">{t('worker.completed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedReports.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900">{t('worker.pickupsList')}</CardTitle>
          <CardDescription className="text-gray-600">{t('worker.pickupsDescription')}</CardDescription>
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              {t('worker.completionRate')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-indigo-600">{completionRate}%</div>
            <Progress value={completionRate} className="h-3" />
            <p className="text-sm text-gray-600">
              {completedReports.length} {t('worker.of')} {assignedReports.length} {t('worker.pickupsCompleted')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Clock className="h-5 w-5 text-indigo-600" />
              {t('worker.stats')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('worker.todayPickups')}</span>
              <span className="text-xl font-bold text-gray-900">{todayPickups.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('worker.weeklyPickups')}</span>
              <span className="text-xl font-bold text-gray-900">{weeklyPickups.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('worker.pending')}</span>
              <span className="text-xl font-bold text-yellow-600">{pendingReports.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900">{t('worker.recentActivity')}</CardTitle>
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
      {unreadNotifications > 0 && (
        <div className="flex items-center justify-end">
          <Badge variant="destructive">{unreadNotifications} {t('worker.unread')}</Badge>
        </div>
      )}

      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900">{t('worker.allNotifications')}</CardTitle>
          <CardDescription className="text-gray-600">{t('worker.notificationsDescription')}</CardDescription>
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
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <HelpCircle className="h-5 w-5 text-indigo-600" />
            {t('worker.contactAdmin')}
          </CardTitle>
          <CardDescription className="text-gray-600">{t('worker.supportDescription')}</CardDescription>
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

      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BookOpen className="h-5 w-5 text-indigo-600" />
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
    <AnimatePresence mode="wait">
      {renderSection()}
    </AnimatePresence>
  );
}