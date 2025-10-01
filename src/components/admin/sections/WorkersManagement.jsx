import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Briefcase, UserPlus } from 'lucide-react';

export default function WorkersManagement() {
  const [workers, setWorkers] = useState([]);
  const [reports, setReports] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');

  useEffect(() => {
    fetchWorkers();
    fetchPendingReports();
  }, []);

  const fetchWorkers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*, assigned_reports:reports(count)')
      .eq('role', 'worker');
    
    if (!error && data) setWorkers(data);
  };

  const fetchPendingReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('*, users(full_name)')
      .in('status', ['pending', 'assigned'])
      .order('created_at', { ascending: false });
    
    if (data) setReports(data);
  };

  const assignPickup = async () => {
    if (!selectedReport || !selectedWorker) {
      toast.error('Please select both report and worker');
      return;
    }

    const { error } = await supabase
      .from('reports')
      .update({ 
        assigned_to: selectedWorker,
        status: 'assigned'
      })
      .eq('id', selectedReport);

    if (!error) {
      toast.success('Pickup assigned successfully');
      fetchWorkers();
      fetchPendingReports();
      setAssignDialogOpen(false);
      setSelectedReport('');
      setSelectedWorker('');
    } else {
      toast.error('Failed to assign pickup');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Workers Management
          </CardTitle>
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Pickup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Pickup to Worker</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Select Report</label>
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a report" />
                    </SelectTrigger>
                    <SelectContent>
                      {reports.filter(r => !r.assigned_to).map(report => (
                        <SelectItem key={report.id} value={report.id}>
                          {report.title} - {report.users?.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Select Worker</label>
                  <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a worker" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map(worker => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.full_name || worker.email} - Vehicle: {worker.vehicle_id || 'N/A'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={assignPickup} className="w-full">
                  Assign Pickup
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vehicle ID</TableHead>
                <TableHead>Assigned Tasks</TableHead>
                <TableHead>Active Status</TableHead>
                <TableHead>Current Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map(worker => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">{worker.full_name || 'N/A'}</TableCell>
                  <TableCell>{worker.email}</TableCell>
                  <TableCell>{worker.vehicle_id || 'Not assigned'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {worker.assigned_reports?.[0]?.count || 0} tasks
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={worker.is_active ? 'default' : 'secondary'}>
                      {worker.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {worker.current_location_lat && worker.current_location_lng
                      ? `${worker.current_location_lat.toFixed(4)}, ${worker.current_location_lng.toFixed(4)}`
                      : 'No location'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
