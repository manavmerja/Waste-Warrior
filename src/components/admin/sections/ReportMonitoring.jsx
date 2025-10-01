import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function ReportMonitoring() {
  const [reports, setReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [assignData, setAssignData] = useState({
    workerId: '',
    deadline: ''
  });
  const [penaltyAmount, setPenaltyAmount] = useState('');

  useEffect(() => {
    fetchReports();
    fetchWorkers();
  }, []);

  const fetchReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('*, users!reports_user_id_fkey(full_name, email), assigned_worker:users!reports_assigned_to_fkey(full_name)')
      .order('created_at', { ascending: false });
    
    if (data) setReports(data);
  };

  const fetchWorkers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'worker');
    
    if (data) setWorkers(data);
  };

  const assignReport = async () => {
    if (!assignData.workerId) {
      toast.error('Please select a worker');
      return;
    }

    const { error } = await supabase
      .from('reports')
      .update({
        assigned_to: assignData.workerId,
        deadline: assignData.deadline || null,
        status: 'assigned'
      })
      .eq('id', selectedReport.id);

    if (!error) {
      toast.success('Report assigned to worker');
      fetchReports();
      setAssignDialogOpen(false);
      setAssignData({ workerId: '', deadline: '' });
    } else {
      toast.error('Failed to assign report');
    }
  };

  const escalateCase = async () => {
    if (!penaltyAmount) {
      toast.error('Please enter penalty amount');
      return;
    }

    const penalty = parseInt(penaltyAmount);
    
    // Get worker's current credits
    const { data: workerData } = await supabase
      .from('users')
      .select('credits')
      .eq('id', selectedReport.assigned_to)
      .single();

    const newCredits = (workerData?.credits || 0) - penalty;

    // Apply penalty
    const { error: penaltyError } = await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', selectedReport.assigned_to);

    if (penaltyError) {
      toast.error('Failed to apply penalty');
      return;
    }

    // Log penalty
    await supabase
      .from('credit_audit_log')
      .insert([{
        user_id: selectedReport.assigned_to,
        amount: -penalty,
        reason: `Penalty for failing to complete report: ${selectedReport.title}`,
        action_type: 'subtract'
      }]);

    // Update report status
    await supabase
      .from('reports')
      .update({ 
        status: 'escalated',
        assigned_to: null
      })
      .eq('id', selectedReport.id);

    toast.success('Case escalated and penalty applied');
    fetchReports();
    setEscalateDialogOpen(false);
    setPenaltyAmount('');
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Form Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(report => {
                const isOverdue = report.deadline && new Date(report.deadline) < new Date() && report.status !== 'completed';
                
                return (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.title}</TableCell>
                    <TableCell>{report.users?.full_name || 'Unknown'}</TableCell>
                    <TableCell>
                      {report.assigned_worker?.full_name || (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.deadline ? (
                        <div className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                          {new Date(report.deadline).toLocaleDateString()}
                          {isOverdue && <Clock className="inline h-3 w-3 ml-1" />}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No deadline</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {report.status === 'completed' && (
                        <Badge variant="outline" className="bg-green-500/10">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Disposed
                        </Badge>
                      )}
                      {report.status === 'in_progress' && (
                        <Badge variant="outline" className="bg-blue-500/10">
                          In Progress
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!report.assigned_to && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setAssignDialogOpen(true);
                            }}
                          >
                            Assign
                          </Button>
                        )}
                        {report.assigned_to && isOverdue && report.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedReport(report);
                              setEscalateDialogOpen(true);
                            }}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Escalate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Report to Worker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Select Worker</Label>
              <Select value={assignData.workerId} onValueChange={(val) => setAssignData({...assignData, workerId: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map(worker => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.full_name || worker.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Deadline (Optional)</Label>
              <Input
                type="date"
                value={assignData.deadline}
                onChange={e => setAssignData({...assignData, deadline: e.target.value})}
              />
            </div>

            <Button onClick={assignReport} className="w-full">
              Assign Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Case & Apply Penalty</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-500/10 p-4 rounded-lg">
              <p className="text-sm">
                Worker <strong>{selectedReport?.assigned_worker?.full_name}</strong> failed to complete this task by the deadline.
              </p>
            </div>

            <div>
              <Label>Penalty Amount (Credits)</Label>
              <Input
                type="number"
                placeholder="Enter penalty credits"
                value={penaltyAmount}
                onChange={e => setPenaltyAmount(e.target.value)}
              />
            </div>

            <Button onClick={escalateCase} variant="destructive" className="w-full">
              Escalate & Apply Penalty
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
