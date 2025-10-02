import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, RotateCcw, Award, Users, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function LearningProgressManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [usersResult, modulesResult, progressResult, certificatesResult] = await Promise.all([
        supabase.from('users').select('id, full_name, email, created_at'),
        supabase.from('learning_modules').select('*'),
        supabase.from('user_learning_progress').select('*'),
        supabase.from('certifications').select('*'),
      ]);

      setUsers(usersResult.data || []);
      setModules(modulesResult.data || []);
      setProgress(progressResult.data || []);
      setCertificates(certificatesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserProgress = (userId) => {
    const userProgress = progress.filter(p => p.user_id === userId);
    const completedCount = userProgress.filter(p => p.is_completed).length;
    const totalModules = modules.length;
    const percentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    return {
      completedCount,
      totalModules,
      percentage,
      status: completedCount === 0 ? 'notStarted' : completedCount === totalModules ? 'completed' : 'inProgress',
    };
  };

  const handleResetProgress = async (userId) => {
    try {
      const { error } = await supabase
        .from('user_learning_progress')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('admin.resetProgress'),
      });

      fetchData();
    } catch (error) {
      console.error('Error resetting progress:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Modules Completed', 'Total Modules', 'Progress %', 'Status', 'Last Activity'];
    const rows = filteredUsers.map(user => {
      const userProg = getUserProgress(user.id);
      const lastProgress = progress
        .filter(p => p.user_id === user.id)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

      return [
        user.full_name || 'N/A',
        user.email,
        userProg.completedCount,
        userProg.totalModules,
        userProg.percentage,
        t(`learning.${userProg.status}`),
        lastProgress ? new Date(lastProgress.updated_at).toLocaleDateString() : 'N/A',
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-progress-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(user => {
    const userProg = getUserProgress(user.id);
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || userProg.status === filter;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalModules: modules.length,
    activeUsers: users.filter(u => getUserProgress(u.id).completedCount > 0).length,
    certificatesIssued: certificates.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('admin.learningProgress')}</h1>
        <p className="text-muted-foreground">{t('admin.overview')}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.totalModules')}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalModules}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.activeUsers')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.certificatesIssued')}</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.certificatesIssued}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('admin.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Tabs value={filter} onValueChange={setFilter} className="w-auto">
                <TabsList>
                  <TabsTrigger value="all">{t('admin.allUsers')}</TabsTrigger>
                  <TabsTrigger value="completed">{t('admin.completedUsers')}</TabsTrigger>
                  <TabsTrigger value="inProgress">{t('admin.inProgressUsers')}</TabsTrigger>
                  <TabsTrigger value="notStarted">{t('admin.notStartedUsers')}</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button onClick={exportToCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {t('admin.exportCSV')}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.userName')}</TableHead>
                <TableHead>{t('admin.progressPercentage')}</TableHead>
                <TableHead>{t('admin.modulesCompleted')}</TableHead>
                <TableHead>{t('admin.status')}</TableHead>
                <TableHead>{t('admin.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const userProg = getUserProgress(user.id);
                const hasCertificate = certificates.some(c => c.user_id === user.id);

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {user.full_name || 'N/A'}
                          {hasCertificate && <Award className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={userProg.percentage} className="h-2" />
                        <span className="text-xs text-muted-foreground">{userProg.percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {userProg.completedCount}/{userProg.totalModules}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          userProg.status === 'completed'
                            ? 'default'
                            : userProg.status === 'inProgress'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {t(`learning.${userProg.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetProgress(user.id)}
                        disabled={userProg.completedCount === 0}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t('admin.reset')}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
