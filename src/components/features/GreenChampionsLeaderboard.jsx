import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Users, TrendingUp } from 'lucide-react';

export default function GreenChampionsLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    totalUsers: 0,
    monthlyReports: 0
  });

  useEffect(() => {
    fetchLeaderboardData();
    fetchStats();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      // Get top users by credits (showing monthly leaders)
      const { data: topUsers, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, credits')
        .order('credits', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get additional stats for each user
      const leaderboardWithStats = await Promise.all(
        topUsers.map(async (user) => {
          // Get total reports count
          const { count: reportsCount } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          // Get monthly reports count
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const { count: monthlyReports } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', startOfMonth.toISOString());

          return {
            ...user,
            reportsCount: reportsCount || 0,
            monthlyReports: monthlyReports || 0
          };
        })
      );

      setLeaderboard(leaderboardWithStats);

      // Find current user's rank
      if (user) {
        const userIndex = leaderboardWithStats.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          setUserRank(userIndex + 1);
        } else {
          // User not in top 10, get their actual rank
          const { data: allUsers, error: rankError } = await supabase
            .from('users')
            .select('id, credits')
            .order('credits', { ascending: false });

          if (!rankError && allUsers) {
            const rank = allUsers.findIndex(u => u.id === user.id) + 1;
            setUserRank(rank);
          }
        }
      }

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Total reports
      const { count: totalReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

      // Total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Monthly reports
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      setStats({
        totalReports: totalReports || 0,
        totalUsers: totalUsers || 0,
        monthlyReports: monthlyReports || 0
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-orange-500" />;
      default: return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-yellow-500';
      case 2: return 'bg-gray-400';
      case 3: return 'bg-orange-500';
      default: return 'bg-primary';
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-sm text-muted-foreground">Total Reports</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-sm text-muted-foreground">Green Champions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.monthlyReports}</div>
            <p className="text-sm text-muted-foreground">This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Your Rank */}
      {userRank && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Your Ranking</h3>
              <div className="flex items-center justify-center gap-2">
                {getRankIcon(userRank)}
                <span className="text-xl font-bold">Rank #{userRank}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Green Champions Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard.map((champion, index) => (
              <div
                key={champion.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  champion.id === user?.id ? 'bg-primary/5 border-primary' : 'bg-background'
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-12">
                  {getRankIcon(index + 1)}
                </div>

                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src={champion.avatar_url} alt={champion.full_name} />
                  <AvatarFallback className="bg-primary/10">
                    {getInitials(champion.full_name)}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1">
                  <h4 className="font-semibold">
                    {champion.full_name || 'Anonymous Champion'}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{champion.reportsCount} reports</span>
                    <span>{champion.monthlyReports} this month</span>
                  </div>
                </div>

                {/* Credits & Badge */}
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {champion.credits} credits
                  </div>
                  {index < 3 && (
                    <Badge className={getRankBadgeColor(index + 1)}>
                      {index === 0 ? 'Gold' : index === 1 ? 'Silver' : 'Bronze'} Champion
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No champions yet! Be the first to start reporting waste issues.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}