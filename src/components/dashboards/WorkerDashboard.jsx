import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Truck, MapPin, CheckCircle, Clock, Upload, User, Bell, Award, BookOpen, Camera, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector from '@/components/ui/language-selector';
import LearningModules from '@/components/features/LearningModules';

export default function WorkerDashboard() {
  const { t } = useTranslation();
  const { user, userProfile } = useAuth();
  const [assignedReports, setAssignedReports] = useState([]);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [creditsLog, setCreditsLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingEvidence, setUploadingEvidence] = useState(null);
  const [activeTab, setActiveTab] = useState('pickups');

  useEffect(() => {
    if (user?.id) {
      fetchWorkerData();
      subscribeToNotifications();
    }
  }, [user]);

  const fetchWorkerData = async () => {
    try {
      setLoading(true);
      
      const [reportsRes, profileRes, notificationsRes, creditsRes] = await Promise.all([
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
          .limit(10),
        supabase
          .from('credits_log')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      if (reportsRes.error) throw reportsRes.error;
      
      setAssignedReports(reportsRes.data || []);
      setWorkerProfile(profileRes.data);
      setNotifications(notificationsRes.data || []);
      setCreditsLog(creditsRes.data || []);
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

  const markAllNotificationsRead = async () => {
    await supabase
      .from('worker_notifications')
      .update({ is_read: true })
      .eq('worker_id', user.id)
      .eq('is_read', false);
    
    fetchWorkerData();
  };

  const openInMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      assigned: 'bg-blue-500',
      in_progress: 'bg-purple-500',
      completed: 'bg-green-500',
      rejected: 'bg-red-500',
      escalated: 'bg-orange-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const pendingReports = assignedReports.filter(r => 
    r.status === 'assigned' || r.status === 'in_progress'
  );
  const completedReports = assignedReports.filter(r => r.status === 'completed');
  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-3xl">{t('worker.dashboard')}</CardTitle>
                <CardDescription>{t('worker.subtitle')}</CardDescription>
              </div>
            </div>
            <LanguageSelector />
          </div>
        </CardHeader>
      </Card>

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