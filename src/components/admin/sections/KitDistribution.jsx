import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, Plus, CheckCircle } from 'lucide-react';

export default function KitDistribution() {
  const [kits, setKits] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: '',
    userId: 'unassigned'
  });

  useEffect(() => {
    fetchKits();
    fetchUsers();
  }, []);

  const fetchKits = async () => {
    const { data } = await supabase
      .from('kits')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false });
    if (data) setKits(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'resident')
      .order('full_name');
    if (data) setUsers(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('kits')
      .insert([{
        name: formData.name,
        description: formData.description,
        items: formData.items,
        assigned_to: formData.userId === 'unassigned' ? null : formData.userId,
        is_delivered: false
      }]);

    if (!error) {
      toast.success('Kit created successfully');
      fetchKits();
      setOpen(false);
      setFormData({ name: '', description: '', items: '', userId: 'unassigned' });
    } else {
      toast.error('Failed to create kit');
    }
  };

  const markAsDelivered = async (kitId) => {
    const { error } = await supabase
      .from('kits')
      .update({ 
        is_delivered: true,
        delivered_at: new Date().toISOString()
      })
      .eq('id', kitId);

    if (!error) {
      toast.success('Kit marked as delivered');
      fetchKits();
    } else {
      toast.error('Failed to update kit status');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Kit Distribution Management
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Kit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Kit</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Kit Name *</Label>
                  <Input
                    required
                    placeholder="e.g., Eco-Friendly Waste Kit"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the kit contents and purpose..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Items (comma-separated)</Label>
                  <Input
                    placeholder="e.g., Gloves, Bags, Segregation Guide"
                    value={formData.items}
                    onChange={e => setFormData({...formData, items: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Assign to User (Optional)</Label>
                  <Select value={formData.userId} onValueChange={(val) => setFormData({...formData, userId: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Kit</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kit Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivered At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kits.map(kit => (
                <TableRow key={kit.id}>
                  <TableCell className="font-medium">{kit.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{kit.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{kit.items}</TableCell>
                  <TableCell>
                    {kit.users ? (
                      <span>{kit.users.full_name || kit.users.email}</span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={kit.is_delivered ? 'default' : 'secondary'}>
                      {kit.is_delivered ? 'Delivered' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {kit.delivered_at ? new Date(kit.delivered_at).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    {!kit.is_delivered && kit.assigned_to && (
                      <Button
                        size="sm"
                        onClick={() => markAsDelivered(kit.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Delivered
                      </Button>
                    )}
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
