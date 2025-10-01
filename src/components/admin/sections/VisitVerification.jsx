import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckSquare, X, Check, Eye } from 'lucide-react';

export default function VisitVerification() {
  const [reports, setReports] = useState([]);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchCompletedReports();
  }, []);

  const fetchCompletedReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('*, users!reports_user_id_fkey(full_name), worker:users!reports_assigned_to_fkey(full_name)')
      .in('status', ['completed', 'in_progress'])
      .not('proof_photo_url', 'is', null)
      .order('updated_at', { ascending: false });
    
    if (data) setReports(data);
  };

  const verifyVisit = async (reportId, isApproved) => {
    const updates = {
      is_verified: isApproved,
      verification_notes: adminNotes || null,
      verified_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', reportId);

    if (!error) {
      toast.success(isApproved ? 'Visit verified successfully' : 'Visit rejected');
      fetchCompletedReports();
      setViewDialog(false);
      setAdminNotes('');
    } else {
      toast.error('Failed to verify visit');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Worker Visit Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Title</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Completed At</TableHead>
                <TableHead>Proof Available</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(report => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>{report.worker?.full_name || 'Unknown'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {report.completed_at ? new Date(report.completed_at).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {report.proof_photo_url ? (
                      <Badge variant="outline" className="bg-green-500/10">
                        <Check className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-500/10">
                        No Proof
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {report.is_verified === null ? (
                      <Badge variant="secondary">Pending</Badge>
                    ) : report.is_verified ? (
                      <Badge className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReport(report);
                        setViewDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Worker Visit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h3 className="font-semibold mb-2">Report Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Title:</span>
                  <p className="font-medium">{selectedReport?.title}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Worker:</span>
                  <p className="font-medium">{selectedReport?.worker?.full_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">{selectedReport?.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Completed:</span>
                  <p className="font-medium">
                    {selectedReport?.completed_at 
                      ? new Date(selectedReport.completed_at).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {selectedReport?.proof_photo_url && (
              <div>
                <h3 className="font-semibold mb-2">Proof of Work</h3>
                <img 
                  src={selectedReport.proof_photo_url} 
                  alt="Proof of completion"
                  className="w-full rounded-lg border"
                />
              </div>
            )}

            {selectedReport?.worker_notes && (
              <div>
                <h3 className="font-semibold mb-2">Worker Notes</h3>
                <p className="text-sm bg-muted p-3 rounded-lg">
                  {selectedReport.worker_notes}
                </p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Segregation Compliance Check</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Verify that waste has been properly segregated according to guidelines.
              </p>
              <Textarea
                placeholder="Add verification notes (optional)..."
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => selectedReport && verifyVisit(selectedReport.id, false)}
                variant="destructive"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => selectedReport && verifyVisit(selectedReport.id, true)}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Verify & Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
