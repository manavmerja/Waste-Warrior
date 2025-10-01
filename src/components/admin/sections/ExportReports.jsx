import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, FileText, TrendingUp } from 'lucide-react';

export default function ExportReports() {
  const [reportType, setReportType] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({
    totalReports: 0,
    completedReports: 0,
    totalCredits: 0,
    activeUsers: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [reportsRes, creditsRes, usersRes] = await Promise.all([
      supabase.from('reports').select('status', { count: 'exact' }),
      supabase.from('users').select('credits'),
      supabase.from('users').select('id', { count: 'exact' })
    ]);

    const totalReports = reportsRes.count || 0;
    const completedReports = reportsRes.data?.filter(r => r.status === 'completed').length || 0;
    const totalCredits = creditsRes.data?.reduce((sum, u) => sum + (u.credits || 0), 0) || 0;
    const activeUsers = usersRes.count || 0;

    setStats({ totalReports, completedReports, totalCredits, activeUsers });
  };

  const generateCSV = (data, headers) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportMonthlyStats = async () => {
    try {
      const { data: reports } = await supabase
        .from('reports')
        .select('id, title, status, created_at, completed_at, users(full_name, email)')
        .gte('created_at', startDate || '2020-01-01')
        .lte('created_at', endDate || new Date().toISOString());

      const headers = ['title', 'reporter_name', 'reporter_email', 'status', 'created_at', 'completed_at'];
      const data = reports?.map(r => ({
        title: r.title,
        reporter_name: r.users?.full_name || 'Unknown',
        reporter_email: r.users?.email || 'Unknown',
        status: r.status,
        created_at: r.created_at,
        completed_at: r.completed_at || 'N/A'
      })) || [];

      generateCSV(data, headers);
      toast.success('Monthly statistics exported');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const exportCreditsDistributed = async () => {
    try {
      const { data } = await supabase
        .from('credit_audit_log')
        .select('*, users(full_name, email)')
        .gte('created_at', startDate || '2020-01-01')
        .lte('created_at', endDate || new Date().toISOString())
        .order('created_at', { ascending: false });

      const headers = ['user_name', 'user_email', 'amount', 'action_type', 'reason', 'created_at'];
      const csvData = data?.map(log => ({
        user_name: log.users?.full_name || 'Unknown',
        user_email: log.users?.email || 'Unknown',
        amount: log.amount,
        action_type: log.action_type,
        reason: log.reason,
        created_at: log.created_at
      })) || [];

      generateCSV(csvData, headers);
      toast.success('Credits report exported');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const exportResolvedReports = async () => {
    try {
      const { data } = await supabase
        .from('reports')
        .select('*, users(full_name, email), worker:users!reports_assigned_to_fkey(full_name)')
        .eq('status', 'completed')
        .gte('completed_at', startDate || '2020-01-01')
        .lte('completed_at', endDate || new Date().toISOString());

      const headers = ['title', 'reporter', 'worker', 'created_at', 'completed_at', 'is_verified'];
      const csvData = data?.map(r => ({
        title: r.title,
        reporter: r.users?.full_name || 'Unknown',
        worker: r.worker?.full_name || 'Unassigned',
        created_at: r.created_at,
        completed_at: r.completed_at,
        is_verified: r.is_verified ? 'Yes' : 'No'
      })) || [];

      generateCSV(csvData, headers);
      toast.success('Resolved reports exported');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const handleExport = () => {
    if (reportType === 'monthly') {
      exportMonthlyStats();
    } else if (reportType === 'credits') {
      exportCreditsDistributed();
    } else if (reportType === 'resolved') {
      exportResolvedReports();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Reports
          </CardTitle>
          <CardDescription>Generate and download CSV reports for various metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly Statistics</SelectItem>
                <SelectItem value="credits">Credits Distributed</SelectItem>
                <SelectItem value="resolved">Resolved Reports</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleExport} className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Generate & Download CSV
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold">
                {stats.totalReports > 0 
                  ? ((stats.completedReports / stats.totalReports) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm text-muted-foreground">Avg Credits Per User</p>
              <p className="text-2xl font-bold">
                {stats.activeUsers > 0 
                  ? (stats.totalCredits / stats.activeUsers).toFixed(0)
                  : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
