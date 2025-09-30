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
import { Truck, MapPin, CheckCircle, Clock, Upload, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function WorkerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [assignedReports, setAssignedReports] = useState([]);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingProof, setUploadingProof] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchWorkerData();
    }
  }, [user]);

  const fetchWorkerData = async () => {
    try {
      setLoading(true);
      
      const [reportsRes, profileRes] = await Promise.all([
        supabase
          .from('reports')
          .select('*, users(full_name, email)')
          .eq('assigned_worker_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('workers')
          .select('*')
          .eq('user_id', user.id)
          .single()
      ]);

      if (reportsRes.error) throw reportsRes.error;
      
      setAssignedReports(reportsRes.data || []);
      setWorkerProfile(profileRes.data);
    } catch (error) {
      console.error('Error fetching worker data:', error);
      toast.error('Failed to load worker data');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      toast.success(`Report marked as ${newStatus}`);
      fetchWorkerData();
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report status');
    }
  };

  const handleProofUpload = async (reportId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingProof(reportId);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${reportId}-proof-${Date.now()}.${fileExt}`;
      const filePath = `proof/${fileName}`;

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
          photo_urls: [publicUrl],
          status: 'completed',
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (updateError) throw updateError;

      toast.success('Proof uploaded and report completed!');
      fetchWorkerData();
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error('Failed to upload proof');
    } finally {
      setUploadingProof(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      assigned: 'bg-blue-500',
      in_progress: 'bg-purple-500',
      completed: 'bg-green-500',
      rejected: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const pendingReports = assignedReports.filter(r => r.status === 'assigned' || r.status === 'in_progress');
  const completedReports = assignedReports.filter(r => r.status === 'completed');

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
          <CardTitle className="flex items-center text-3xl">
            <Truck className="mr-3 h-8 w-8 text-primary" />
            Worker Dashboard
          </CardTitle>
          <CardDescription>Manage your assigned waste collection tasks</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedReports.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            <Clock className="mr-2 h-4 w-4" />
            Pending ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle className="mr-2 h-4 w-4" />
            Completed ({completedReports.length})
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingReports.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">No pending pickups</p>
                </CardContent>
              </Card>
            ) : (
              pendingReports.map((report) => (
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
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => updateReportStatus(report.id, 'in_progress')}
                        disabled={report.status === 'in_progress'}
                        variant="outline"
                      >
                        Start Pickup
                      </Button>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`proof-${report.id}`}
                          className="cursor-pointer"
                        >
                          <Button
                            type="button"
                            disabled={uploadingProof === report.id}
                            asChild
                          >
                            <span>
                              <Upload className="mr-2 h-4 w-4" />
                              {uploadingProof === report.id ? 'Uploading...' : 'Upload Proof & Complete'}
                            </span>
                          </Button>
                        </Label>
                        <Input
                          id={`proof-${report.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleProofUpload(report.id, e)}
                          disabled={uploadingProof === report.id}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {completedReports.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">No completed pickups yet</p>
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
                      <Badge className="bg-green-500">Completed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Completed on: {new Date(report.resolved_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Worker Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workerProfile ? (
                <>
                  <div>
                    <Label>Vehicle ID</Label>
                    <p className="text-lg font-medium">{workerProfile.vehicle_id || 'Not assigned'}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={workerProfile.is_active ? "outline" : "secondary"}>
                      {workerProfile.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <Label>Learning Progress</Label>
                    <p className="text-lg font-medium">{workerProfile.learning_progress}%</p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Worker profile not found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
