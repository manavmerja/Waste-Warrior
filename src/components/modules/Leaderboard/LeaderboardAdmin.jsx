import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Users,
  Plus,
  Minus,
  RotateCcw,
  Award,
  Star,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function LeaderboardAdmin() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pointsAmount, setPointsAmount] = useState(0);
  const [pointsReason, setPointsReason] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('credits', { ascending: false });

      if (error) throw error;

      const enrichedUsers = await Promise.all(
        data.map(async (user) => {
          const { count: reportsCount } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          return {
            ...user,
            reportsCount: reportsCount || 0
          };
        })
      );

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async () => {
    if (!selectedUser || pointsAmount <= 0) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ credits: selectedUser.credits + pointsAmount })
        .eq('id', selectedUser.id);

      if (error) throw error;

      await supabase.from('credit_audit_log').insert({
        user_id: selectedUser.id,
        action_type: 'add',
        amount: pointsAmount,
        reason: pointsReason || 'Admin addition'
      });

      toast({
        title: "Success",
        description: `Added ${pointsAmount} points to ${selectedUser.full_name}`
      });

      fetchAllUsers();
      setSelectedUser(null);
      setPointsAmount(0);
      setPointsReason('');
    } catch (error) {
      console.error('Error adding points:', error);
      toast({
        title: "Error",
        description: "Failed to add points",
        variant: "destructive"
      });
    }
  };

  const handleDeductPoints = async () => {
    if (!selectedUser || pointsAmount <= 0) return;

    try {
      const newCredits = Math.max(0, selectedUser.credits - pointsAmount);
      
      const { error } = await supabase
        .from('users')
        .update({ credits: newCredits })
        .eq('id', selectedUser.id);

      if (error) throw error;

      await supabase.from('credit_audit_log').insert({
        user_id: selectedUser.id,
        action_type: 'deduct',
        amount: -pointsAmount,
        reason: pointsReason || 'Admin deduction'
      });

      toast({
        title: "Success",
        description: `Deducted ${pointsAmount} points from ${selectedUser.full_name}`
      });

      fetchAllUsers();
      setSelectedUser(null);
      setPointsAmount(0);
      setPointsReason('');
    } catch (error) {
      console.error('Error deducting points:', error);
      toast({
        title: "Error",
        description: "Failed to deduct points",
        variant: "destructive"
      });
    }
  };

  const handleResetLeaderboard = async () => {
    if (!confirm('Are you sure you want to reset the entire leaderboard? This will set all user credits to 0.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ credits: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leaderboard has been reset successfully",
        duration: 5000
      });

      fetchAllUsers();
    } catch (error) {
      console.error('Error resetting leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to reset leaderboard",
        variant: "destructive"
      });
    }
  };

  const toggleGreenChampion = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_green_champion: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Green Champion status ${!currentStatus ? 'granted' : 'removed'}`
      });

      fetchAllUsers();
    } catch (error) {
      console.error('Error toggling champion status:', error);
      toast({
        title: "Error",
        description: "Failed to update champion status",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => {
    if (activeTab === 'all') return true;
    if (activeTab === 'residents') return user.role === 'resident';
    if (activeTab === 'workers') return user.role === 'worker';
    if (activeTab === 'champions') return user.is_green_champion;
    return true;
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Trophy className="h-10 w-10 text-primary" />
              🧑‍💼 Leaderboard Management
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage points, badges, and leaderboard settings
            </p>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={handleResetLeaderboard}
            className="gap-2 shadow-lg"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Leaderboard
          </Button>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          <Card className="hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Users className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold">{users.length}</div>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Total Users</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Trophy className="h-10 w-10 text-secondary mx-auto mb-3" />
              <div className="text-3xl font-bold">
                {users.filter(u => u.role === 'resident').length}
              </div>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Residents</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Award className="h-10 w-10 text-success mx-auto mb-3" />
              <div className="text-3xl font-bold">
                {users.filter(u => u.role === 'worker').length}
              </div>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Workers</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <Star className="h-10 w-10 text-warning mx-auto mb-3" />
              <div className="text-3xl font-bold">
                {users.filter(u => u.is_green_champion).length}
              </div>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Champions</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-8 h-12 bg-muted/50 p-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:shadow-md">All Users</TabsTrigger>
                <TabsTrigger value="residents" className="data-[state=active]:bg-background data-[state=active]:shadow-md">Residents</TabsTrigger>
                <TabsTrigger value="workers" className="data-[state=active]:bg-background data-[state=active]:shadow-md">Workers</TabsTrigger>
                <TabsTrigger value="champions" className="data-[state=active]:bg-background data-[state=active]:shadow-md">Champions</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-between p-5 bg-card rounded-xl border-2 hover:border-primary/50 transition-all shadow-sm hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-14 w-14 ring-2 ring-border">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-primary/10 font-bold">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg">{user.full_name || 'Anonymous'}</h4>
                          <Badge variant="outline" className="capitalize font-semibold">
                            {user.role}
                          </Badge>
                          {user.is_green_champion && (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white gap-1">
                              <Star className="h-3 w-3" />
                              Champion
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-medium">{user.reportsCount} reports</span>
                          <span className="text-primary font-bold">{user.credits} points</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Manage Points</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Manage Points: {user.full_name}</DialogTitle>
                            <DialogDescription>
                              Award or deduct points for this user's contributions
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label className="text-base">Points Amount</Label>
                              <Input
                                type="number"
                                min="0"
                                value={pointsAmount}
                                onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                                placeholder="Enter points"
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label className="text-base">Reason</Label>
                              <Input
                                value={pointsReason}
                                onChange={(e) => setPointsReason(e.target.value)}
                                placeholder="e.g., Exceptional service"
                                className="mt-2"
                              />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button onClick={handleAddPoints} className="flex-1 gap-2">
                                <Plus className="h-4 w-4" />
                                Add Points
                              </Button>
                              <Button onClick={handleDeductPoints} variant="destructive" className="flex-1 gap-2">
                                <Minus className="h-4 w-4" />
                                Deduct
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="sm"
                        variant={user.is_green_champion ? "default" : "outline"}
                        onClick={() => toggleGreenChampion(user.id, user.is_green_champion)}
                        className="gap-1"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Users className="h-20 w-20 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No users found in this category</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6"
        >
          <div className="inline-block">
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent mb-3"></div>
            <p className="text-base text-muted-foreground italic">
              💚 Together, we turn waste into worth.
            </p>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-secondary to-transparent mt-3"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
