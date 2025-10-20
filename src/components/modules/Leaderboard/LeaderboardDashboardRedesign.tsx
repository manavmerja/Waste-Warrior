import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, TrendingUp, Award, ChevronDown, ChevronUp, Sparkles, Clock } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';
import LeaderboardCard from './LeaderboardCard';
import { Button } from '@/components/ui/button';

export default function LeaderboardDashboardRedesign() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const { width, height } = useWindowSize();
  const [activeTab, setActiveTab] = useState('residents');
  const [residents, setResidents] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 0,
    totalUsers: 0,
    monthlyReports: 0
  });

  // Calculate time until monthly reset
  const [timeToReset, setTimeToReset] = useState('');

  useEffect(() => {
    // Update countdown every second
    const interval = setInterval(() => {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const diff = nextMonth.getTime() - now.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeToReset(`${days}d ${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const renderLeaderboardList = (data) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {data.map((user, index) => (
        <LeaderboardCard
          key={user.id}
          user={user}
          rank={index + 1}
          isCurrentUser={user.id === userProfile?.id}
          animationDelay={index * 0.05}
        />
      ))}

      {data.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Award className="h-20 w-20 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-lg">{t('leaderboard.noChampions')}</p>
        </motion.div>
      )}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#001F3F] via-[#1E90FF] to-[#00A86B] p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-6 bg-white/10 backdrop-blur-md rounded-2xl">
                <div className="w-16 h-16 bg-white/20 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-white/20 rounded w-1/3"></div>
                  <div className="h-4 bg-white/20 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001F3F] via-[#1E90FF] to-[#00A86B] p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Trophy className="h-12 w-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]" />
            {t('leaderboard.title')}
            <Sparkles className="h-10 w-10 text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]" />
          </h1>
          <p className="text-white/80 text-lg">{t('leaderboard.subtitle')}</p>
        </motion.div>

        {/* Countdown to Reset */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardContent className="p-4 flex items-center justify-center gap-3">
              <Clock className="h-5 w-5 text-yellow-400" />
              <span className="text-white font-semibold">
                {t('leaderboard.resetIn')}: 
              </span>
              <span className="text-yellow-400 font-bold text-xl tabular-nums">
                {timeToReset}
              </span>
            </CardContent>
          </Card>
        </motion.div>

        {/* How Points Work - Expandable Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border-white/30 shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <Button
                onClick={() => setShowInfo(!showInfo)}
                className="w-full p-6 bg-transparent hover:bg-white/10 flex items-center justify-between text-left border-0 rounded-none"
                variant="ghost"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-yellow-400" />
                  <span className="text-white text-xl font-bold">ℹ️ {t('leaderboard.howPointsWork')}</span>
                </div>
                {showInfo ? <ChevronUp className="h-6 w-6 text-white" /> : <ChevronDown className="h-6 w-6 text-white" />}
              </Button>
              
              <AnimatePresence>
                {showInfo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-white space-y-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-400" />
                            {t('leaderboard.residents')}
                          </h3>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-400 font-bold">+20</span>
                              <span>{t('leaderboard.residentPoint1')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-400 font-bold">+30</span>
                              <span>{t('leaderboard.residentPoint2')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-yellow-400 font-bold">+50</span>
                              <span>{t('leaderboard.residentPoint3')}</span>
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            <Award className="h-5 w-5 text-blue-400" />
                            {t('leaderboard.workers')}
                          </h3>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <span className="text-cyan-400 font-bold">+40</span>
                              <span>{t('leaderboard.workerPoint1')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-cyan-400 font-bold">+30</span>
                              <span>{t('leaderboard.workerPoint2')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-cyan-400 font-bold">+20</span>
                              <span>{t('leaderboard.workerPoint3')}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm italic border-t border-white/20 pt-4">
                        💡 {t('leaderboard.resetInfo')}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="bg-gradient-to-br from-yellow-500/30 to-orange-500/30 backdrop-blur-xl border-2 border-yellow-400/50 shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_rgba(255,215,0,0.5)] transition-all duration-300">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <motion.div
                className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-full -mr-16 -mt-16"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <TrendingUp className="h-12 w-12 text-yellow-400 mx-auto mb-3 relative z-10 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
              <motion.div
                className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent relative z-10"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
              >
                {stats.totalReports}
              </motion.div>
              <p className="text-white/90 text-sm mt-2 font-semibold">{t('leaderboard.totalReports')}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-cyan-500/30 to-blue-500/30 backdrop-blur-xl border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:shadow-[0_0_50px_rgba(0,255,255,0.5)] transition-all duration-300">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <motion.div
                className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/20 rounded-full -mr-16 -mt-16"
                animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <Users className="h-12 w-12 text-cyan-400 mx-auto mb-3 relative z-10 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
              <motion.div
                className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent relative z-10"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                {stats.totalUsers}
              </motion.div>
              <p className="text-black text-sm mt-2 font-semibold">{t('leaderboard.greenChampions')}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/30 to-lime-500/30 backdrop-blur-xl border-2 border-green-400/50 shadow-[0_0_30px_rgba(50,205,50,0.3)] hover:shadow-[0_0_50px_rgba(50,205,50,0.5)] transition-all duration-300">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <motion.div
                className="absolute top-0 right-0 w-32 h-32 bg-green-400/20 rounded-full -mr-16 -mt-16"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <Award className="h-12 w-12 text-green-400 mx-auto mb-3 relative z-10 drop-shadow-[0_0_10px_rgba(50,205,50,0.8)]" />
              <motion.div
                className="text-5xl font-bold bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent relative z-10"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
              >
                {stats.monthlyReports}
              </motion.div>
              <p className="text-white/90 text-sm mt-2 font-semibold">{t('leaderboard.thisMonth')}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white/10 backdrop-blur-xl border-2 border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.1)]">
            <div className="p-6 md:p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-black/30 backdrop-blur-md p-1 rounded-2xl border border-white/20">
                  <TabsTrigger 
                    value="residents" 
                    className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-cyan-400 data-[state=active]:text-black data-[state=active]:shadow-[0_0_20px_rgba(50,205,50,0.6)] rounded-xl transition-all duration-300 text-white font-bold text-lg"
                  >
                    <Users className="h-5 w-5" />
                    <span>{t('leaderboard.residents')}</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="workers" 
                    className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-purple-400 data-[state=active]:text-black data-[state=active]:shadow-[0_0_20px_rgba(30,144,255,0.6)] rounded-xl transition-all duration-300 text-white font-bold text-lg"
                  >
                    <Award className="h-5 w-5" />
                    <span>{t('leaderboard.workers')}</span>
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <TabsContent value="residents" className="mt-0">
                    {renderLeaderboardList(residents)}
                  </TabsContent>

                  <TabsContent value="workers" className="mt-0">
                    {renderLeaderboardList(workers)}
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </div>
          </Card>
        </motion.div>

        {/* Motivation Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center py-8"
        >
          <div className="inline-block">
            <motion.div
              className="h-1 w-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent mb-4 rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className="text-xl md:text-2xl text-white italic font-semibold drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              💚 {t('leaderboard.quote')}
            </p>
            <motion.div
              className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent mt-4 rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
