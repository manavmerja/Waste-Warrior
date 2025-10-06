import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Users, TrendingUp, Info, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const rankColors = {
  1: 'from-yellow-400 to-yellow-600',
  2: 'from-gray-300 to-gray-500',
  3: 'from-orange-400 to-orange-600'
};

export default function LeaderboardDashboard() {
  const { t } = useTranslation();
  const { user, userProfile } = useAuth();
  const { width, height } = useWindowSize();
  const [activeTab, setActiveTab] = useState('residents');
  const [residents, setResidents] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 0,
    totalUsers: 0,
    monthlyReports: 0
  });

  useEffect(() => {
    fetchLeaderboardData();
    fetchStats();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, () => {
        fetchLeaderboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      // Fetch residents
      const { data: residentsData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'resident')
        .order('credits', { ascending: false })
        .limit(20);

      // Fetch workers
      const { data: workersData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'worker')
        .order('credits', { ascending: false })
        .limit(20);

      // Get additional stats for each user
      const enrichResidents = await enrichUserData(residentsData || []);
      const enrichWorkers = await enrichUserData(workersData || []);

      setResidents(enrichResidents);
      setWorkers(enrichWorkers);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const enrichUserData = async (users) => {
    return Promise.all(
      users.map(async (user) => {
        const { count: reportsCount } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

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
          monthlyReports: monthlyReports || 0,
          lastUpdated: new Date().toISOString()
        };
      })
    );
  };

  const fetchStats = async () => {
    try {
      const { count: totalReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

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
      case 1: return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-orange-500" />;
      default: return <span className="text-base font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const celebrateRankChange = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const renderLeaderboardTable = (data, role) => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {data.map((user, index) => {
        const rank = index + 1;
        const isCurrentUser = user.id === userProfile?.id;
        const isTopThree = rank <= 3;

        return (
          <motion.div
            key={user.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className={`relative overflow-hidden rounded-xl border transition-all ${
              isCurrentUser 
                ? 'border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-lg ring-2 ring-primary/50' 
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            {/* Glow effect for current user */}
            {isCurrentUser && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}

            <div className="relative p-4 flex items-center gap-4">
              {/* Rank Badge */}
              <div className="flex-shrink-0 w-16 flex items-center justify-center">
                {isTopThree ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 360] }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${rankColors[rank]} flex items-center justify-center shadow-lg`}
                  >
                    {getRankIcon(rank)}
                  </motion.div>
                ) : (
                  <div className="text-xl font-bold text-muted-foreground">#{rank}</div>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-14 w-14 ring-2 ring-border">
                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground truncate">
                    {user.full_name || 'Anonymous Champion'}
                  </h4>
                  {user.is_green_champion && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white gap-1">
                      <Star className="h-3 w-3" />
                      {t('leaderboard.champion')}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {user.reportsCount} {t('leaderboard.reports')}
                  </span>
                  <span className="hidden sm:inline">
                    {user.monthlyReports} {t('leaderboard.thisMonth')}
                  </span>
                </div>
              </div>

              {/* Credits */}
              <div className="text-right flex-shrink-0">
                <motion.div
                  className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {user.credits}
                </motion.div>
                <p className="text-xs text-muted-foreground">{t('leaderboard.points')}</p>
              </div>
            </div>
          </motion.div>
        );
      })}

      {data.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">{t('leaderboard.noChampions')}</p>
        </motion.div>
      )}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
              <div className="w-12 h-12 bg-muted-foreground/20 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted-foreground/20 rounded w-1/4"></div>
                <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-6">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* How It Works Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-primary to-secondary text-primary-foreground overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Info className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Trophy className="h-6 w-6" />
                    {t('leaderboard.howItWorks.title')}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-base">{t('leaderboard.howItWorks.residentsTitle')}</h3>
                      <ul className="space-y-1 text-primary-foreground/90">
                        <li>• {t('leaderboard.howItWorks.residentsPoint1')}</li>
                        <li>• {t('leaderboard.howItWorks.residentsPoint2')}</li>
                        <li>• {t('leaderboard.howItWorks.residentsPoint3')}</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-base">{t('leaderboard.howItWorks.workersTitle')}</h3>
                      <ul className="space-y-1 text-primary-foreground/90">
                        <li>• {t('leaderboard.howItWorks.workersPoint1')}</li>
                        <li>• {t('leaderboard.howItWorks.workersPoint2')}</li>
                        <li>• {t('leaderboard.howItWorks.workersPoint3')}</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <p className="text-sm">
                      <Sparkles className="inline h-4 w-4 mr-1" />
                      {t('leaderboard.howItWorks.note')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Card className="overflow-hidden">
            <CardContent className="p-6 text-center relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12"></div>
              <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
              <motion.div
                className="text-3xl font-bold text-foreground"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                {stats.totalReports}
              </motion.div>
              <p className="text-sm text-muted-foreground mt-1">{t('leaderboard.totalReports')}</p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardContent className="p-6 text-center relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -mr-12 -mt-12"></div>
              <Users className="h-10 w-10 text-secondary mx-auto mb-3" />
              <motion.div
                className="text-3xl font-bold text-foreground"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
              >
                {stats.totalUsers}
              </motion.div>
              <p className="text-sm text-muted-foreground mt-1">{t('leaderboard.greenChampions')}</p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardContent className="p-6 text-center relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full -mr-12 -mt-12"></div>
              <Award className="h-10 w-10 text-success mx-auto mb-3" />
              <motion.div
                className="text-3xl font-bold text-foreground"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                {stats.monthlyReports}
              </motion.div>
              <p className="text-sm text-muted-foreground mt-1">{t('leaderboard.thisMonth')}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="h-6 w-6 text-primary" />
                {t('leaderboard.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="residents" className="gap-2">
                    <Users className="h-4 w-4" />
                    {t('leaderboard.residents')}
                  </TabsTrigger>
                  <TabsTrigger value="workers" className="gap-2">
                    <Award className="h-4 w-4" />
                    {t('leaderboard.workers')}
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <TabsContent value="residents" className="mt-0">
                    {renderLeaderboardTable(residents, 'resident')}
                  </TabsContent>

                  <TabsContent value="workers" className="mt-0">
                    {renderLeaderboardTable(workers, 'worker')}
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Motivation Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-accent to-muted border-0">
            <CardContent className="p-6 text-center">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-lg font-medium text-foreground italic">
                "{t('leaderboard.motivationQuote')}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">🌍 {t('leaderboard.motivationAuthor')}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
