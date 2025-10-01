import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CollectionPointManagement() {
  const [points, setPoints] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    location_lat: '',
    location_lng: '',
    capacity: '',
    contact_phone: '',
    contact_email: ''
  });

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    const { data, error } = await supabase
      .from('collection_points')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setPoints(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      capacity: parseFloat(formData.capacity) || 0,
      location_lat: parseFloat(formData.location_lat) || 0,
      location_lng: parseFloat(formData.location_lng) || 0,
      current_load: 0,
      is_active: true
    };

    try {
      if (editingPoint) {
        const { error } = await supabase
          .from('collection_points')
          .update(dataToSubmit)
          .eq('id', editingPoint.id);
        
        if (error) throw error;
        toast.success('Collection point updated successfully');
      } else {
        const { error } = await supabase
          .from('collection_points')
          .insert([dataToSubmit]);
        
        if (error) throw error;
        toast.success('Collection point created successfully');
      }
      
      fetchPoints();
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving collection point:', error);
      toast.error('Failed to save collection point');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this collection point?')) return;
    
    const { error } = await supabase
      .from('collection_points')
      .delete()
      .eq('id', id);
    
    if (!error) {
      toast.success('Collection point deleted');
      fetchPoints();
    } else {
      toast.error('Failed to delete collection point');
    }
  };

  const handleEdit = (point) => {
    setEditingPoint(point);
    setFormData({
      name: point.name || '',
      address: point.address || '',
      location_lat: point.location_lat?.toString() || '',
      location_lng: point.location_lng?.toString() || '',
      capacity: point.capacity?.toString() || '',
      contact_phone: point.contact_phone || '',
      contact_email: point.contact_email || ''
    });
    setOpen(true);
  };

  const resetForm = () => {
    setEditingPoint(null);
    setFormData({
      name: '',
      address: '',
      location_lat: '',
      location_lng: '',
      capacity: '',
      contact_phone: '',
      contact_email: ''
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Collection Point Management
          </CardTitle>
          <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Collection Point
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPoint ? 'Edit Collection Point' : 'Create Collection Point'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Capacity (kg) *</Label>
                    <Input
                      type="number"
                      required
                      value={formData.capacity}
                      onChange={e => setFormData({...formData, capacity: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Address *</Label>
                  <Input
                    required
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Latitude *</Label>
                    <Input
                      type="number"
                      step="any"
                      required
                      value={formData.location_lat}
                      onChange={e => setFormData({...formData, location_lat: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Longitude *</Label>
                    <Input
                      type="number"
                      step="any"
                      required
                      value={formData.location_lng}
                      onChange={e => setFormData({...formData, location_lng: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      value={formData.contact_phone}
                      onChange={e => setFormData({...formData, contact_phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={e => setFormData({...formData, contact_email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPoint ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Current Load</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map(point => (
                <TableRow key={point.id}>
                  <TableCell className="font-medium">{point.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{point.address}</TableCell>
                  <TableCell>{point.capacity}kg</TableCell>
                  <TableCell>{point.current_load || 0}kg</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {point.contact_phone && <div>{point.contact_phone}</div>}
                      {point.contact_email && <div className="text-muted-foreground">{point.contact_email}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={point.is_active ? 'default' : 'secondary'}>
                      {point.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(point)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(point.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
