import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Users, MapPin, Trash2, Ban, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [usersRes, reportsRes, pointsRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('reports').select('*, users(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('collection_points').select('*').order('created_at', { ascending: false })
      ]);

      if (usersRes.error) throw usersRes.error;
      if (reportsRes.error) throw reportsRes.error;
      if (pointsRes.error) throw pointsRes.error;

      setUsers(usersRes.data || []);
      setReports(reportsRes.data || []);
      setCollectionPoints(pointsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserBan = async (userId, currentBanStatus) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_banned: !currentBanStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(currentBanStatus ? 'User unbanned successfully' : 'User banned successfully');
      fetchData();
    } catch (error) {
      console.error('Error toggling ban:', error);
      toast.error('Failed to update user status');
    }
  };

  const deleteCollectionPoint = async (pointId) => {
    try {
      const { error } = await supabase
        .from('collection_points')
        .delete()
        .eq('id', pointId);

      if (error) throw error;

      toast.success('Collection point deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting point:', error);
      toast.error('Failed to delete collection point');
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      toast.success('Report status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report status');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-500',
      worker: 'bg-blue-500',
      scrap_dealer: 'bg-green-500',
      resident: 'bg-gray-500'
    };
    return colors[role] || 'bg-gray-500';
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
            <Shield className="mr-3 h-8 w-8 text-primary" />
            Admin Dashboard
          </CardTitle>
          <CardDescription>Manage users, reports, and collection points</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Collection Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectionPoints.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Shield className="mr-2 h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="points">
            <MapPin className="mr-2 h-4 w-4" />
            Collection Points
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.credits}</TableCell>
                        <TableCell>
                          {user.is_banned ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : (
                            <Badge variant="outline">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={user.is_banned ? "outline" : "destructive"}
                            onClick={() => toggleUserBan(user.id, user.is_banned)}
                          >
                            {user.is_banned ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports Management</CardTitle>
              <CardDescription>View and manage all waste reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>{report.users?.full_name || 'Unknown'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {report.address_text || `${report.location_lat}, ${report.location_lng}`}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReportStatus(report.id, 'completed')}
                              disabled={report.status === 'completed'}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateReportStatus(report.id, 'rejected')}
                              disabled={report.status === 'rejected'}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="points">
          <Card>
            <CardHeader>
              <CardTitle>Collection Points</CardTitle>
              <CardDescription>Manage waste collection points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Current Load</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collectionPoints.map((point) => (
                      <TableRow key={point.id}>
                        <TableCell className="font-medium">{point.name}</TableCell>
                        <TableCell>{point.address}</TableCell>
                        <TableCell>{point.capacity}kg</TableCell>
                        <TableCell>{point.current_load}kg</TableCell>
                        <TableCell>
                          {point.is_active ? (
                            <Badge variant="outline" className="bg-green-500/10">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-500/10">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteCollectionPoint(point.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
