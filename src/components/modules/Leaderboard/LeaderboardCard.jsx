import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, Star } from 'lucide-react';

const rankColors = {
  1: 'from-yellow-400 to-yellow-600',
  2: 'from-gray-300 to-gray-500',
  3: 'from-orange-400 to-orange-600'
};

export default function LeaderboardCard({ user, rank, isCurrentUser, animationDelay = 0 }) {
  const { t } = useTranslation();
  const isTopThree = rank <= 3;

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-orange-500" />;
      default: return <span className="text-xl font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
        isCurrentUser 
          ? 'border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-xl ring-2 ring-primary/50' 
          : 'border-border bg-card hover:border-primary/30 hover:shadow-lg'
      }`}
    >
      {/* Animated glow for current user */}
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

      <div className="relative p-5 flex items-center gap-4">
        {/* Rank Badge */}
        <div className="flex-shrink-0 w-16 flex items-center justify-center">
          {isTopThree ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 360] }}
              transition={{ delay: animationDelay, duration: 0.5 }}
              className={`w-14 h-14 rounded-full bg-gradient-to-br ${rankColors[rank]} flex items-center justify-center shadow-lg`}
            >
              {getRankIcon(rank)}
            </motion.div>
          ) : (
            <div className="text-xl font-bold text-muted-foreground">#{rank}</div>
          )}
        </div>

        {/* Avatar */}
        <Avatar className="h-16 w-16 ring-2 ring-border shadow-md">
          <AvatarImage src={user.avatar_url} alt={user.full_name} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-lg">
            {getInitials(user.full_name)}
          </AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-foreground truncate text-lg">
              {user.full_name || 'Anonymous Champion'}
            </h4>
            {user.is_green_champion && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white gap-1 shadow-md">
                <Star className="h-3 w-3" />
                {t('leaderboard.champion')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="font-medium">{user.reportsCount}</span> {t('leaderboard.reports')}
            </span>
            <span className="hidden sm:inline">
              <span className="font-medium">{user.monthlyReports}</span> {t('leaderboard.thisMonth')}
            </span>
          </div>
        </div>

        {/* Credits */}
        <div className="text-right flex-shrink-0">
          <motion.div
            className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: animationDelay }}
          >
            {user.credits}
          </motion.div>
          <p className="text-xs text-muted-foreground font-medium">{t('leaderboard.points')}</p>
        </div>
      </div>
    </motion.div>
  );
}
