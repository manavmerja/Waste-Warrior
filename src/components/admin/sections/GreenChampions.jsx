import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Award, Trophy, Star } from 'lucide-react';

export default function GreenChampions() {
  const [users, setUsers] = useState([]);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [weeklyChampion, setWeeklyChampion] = useState(null);

  useEffect(() => {
    fetchUsers();
    calculateWeeklyChampion();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'resident')
      .order('credits', { ascending: false });
    
    if (!error && data) setUsers(data);
  };

  const calculateWeeklyChampion = async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'resident')
      .gte('created_at', oneWeekAgo.toISOString())
      .order('credits', { ascending: false })
      .limit(1)
      .single();
    
    if (!error && data) setWeeklyChampion(data);
  };

  const toggleChampion = async (userId, currentStatus) => {
    const { error } = await supabase
      .from('users')
      .update({ is_green_champion: !currentStatus })
      .eq('id', userId);
    
    if (!error) {
      toast.success(currentStatus ? 'Champion status removed' : 'Promoted to Green Champion!');
      fetchUsers();
    } else {
      toast.error('Failed to update champion status');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Trophy className="h-6 w-6" />
              Weekly Green Champion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyChampion ? (
              <div>
                <p className="text-2xl font-bold">{weeklyChampion.full_name || 'Unknown'}</p>
                <p className="text-muted-foreground">{weeklyChampion.credits} credits earned this week</p>
                <Button 
                  className="mt-4"
                  onClick={() => setShowAnnouncement(true)}
                >
                  Announce Champion
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No champion data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Champion Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Champions:</span>
                <span className="font-bold">{users.filter(u => u.is_green_champion).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Top Scorer:</span>
                <span className="font-bold">{users[0]?.credits || 0} credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Residents:</span>
                <span className="font-bold">{users.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Leaderboard & Champion Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                      {index === 1 && <Trophy className="h-4 w-4 text-gray-400" />}
                      {index === 2 && <Trophy className="h-4 w-4 text-amber-600" />}
                      <span className="font-bold">#{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-500/10">
                      {user.credits || 0} credits
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_green_champion && (
                      <Badge className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Champion
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={user.is_green_champion ? 'destructive' : 'default'}
                      onClick={() => toggleChampion(user.id, user.is_green_champion)}
                    >
                      {user.is_green_champion ? 'Demote' : 'Promote'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAnnouncement} onOpenChange={setShowAnnouncement}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">🎉 Weekly Green Champion Announcement! 🎉</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center space-y-4">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
            <div>
              <p className="text-2xl font-bold">{weeklyChampion?.full_name}</p>
              <p className="text-muted-foreground">
                Earned {weeklyChampion?.credits} credits this week!
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Congratulations on being our Weekly Green Champion! Keep up the amazing work! 🌱
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
