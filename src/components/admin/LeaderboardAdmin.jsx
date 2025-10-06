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
  TrendingUp,
  Plus,
  Minus,
  RotateCcw,
  History,
  Award,
  Medal,
  Star,
  Calendar
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

      // Log the action
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

      // Log the action
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
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all users

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
            <div key={i} className="h-20 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              Leaderboard Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage points, badges, and leaderboard settings
            </p>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={handleResetLeaderboard}
            className="gap-2"
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
          className="grid grid-cols-1 sm:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'resident').length}
              </div>
              <p className="text-sm text-muted-foreground">Residents</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="h-8 w-8 text-success mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'worker').length}
              </div>
              <p className="text-sm text-muted-foreground">Workers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-warning mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {users.filter(u => u.is_green_champion).length}
              </div>
              <p className="text-sm text-muted-foreground">Champions</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all">All Users</TabsTrigger>
                <TabsTrigger value="residents">Residents</TabsTrigger>
                <TabsTrigger value="workers">Workers</TabsTrigger>
                <TabsTrigger value="champions">Champions</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-primary/10">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{user.full_name || 'Anonymous'}</h4>
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                          {user.is_green_champion && (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                              <Star className="h-3 w-3 mr-1" />
                              Champion
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{user.reportsCount} reports</span>
                          <span className="text-primary font-semibold">{user.credits} points</span>
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
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Points
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Points to {user.full_name}</DialogTitle>
                            <DialogDescription>
                              Award points to this user for their contributions
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label>Points Amount</Label>
                              <Input
                                type="number"
                                min="0"
                                value={pointsAmount}
                                onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                                placeholder="Enter points"
                              />
                            </div>
                            <div>
                              <Label>Reason</Label>
                              <Input
                                value={pointsReason}
                                onChange={(e) => setPointsReason(e.target.value)}
                                placeholder="e.g., Exceptional service"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleAddPoints} className="flex-1">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Points
                              </Button>
                              <Button onClick={handleDeductPoints} variant="destructive" className="flex-1">
                                <Minus className="h-4 w-4 mr-1" />
                                Deduct Points
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="sm"
                        variant={user.is_green_champion ? "default" : "outline"}
                        onClick={() => toggleGreenChampion(user.id, user.is_green_champion)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No users found in this category</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
