import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Info, Trophy, Sparkles } from 'lucide-react';

export default function LeaderboardInfo() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-gradient-to-r from-primary to-secondary text-primary-foreground overflow-hidden shadow-xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Info className="h-7 w-7" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-7 w-7" />
                {t('leaderboard.howItWorks.title')}
              </h2>
              <div className="grid md:grid-cols-2 gap-6 text-sm md:text-base">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    🧍 {t('leaderboard.howItWorks.residentsTitle')}
                  </h3>
                  <ul className="space-y-2 text-primary-foreground/95">
                    <li className="flex items-start gap-2">
                      <span className="text-lg">•</span>
                      <span>{t('leaderboard.howItWorks.residentsPoint1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lg">•</span>
                      <span>{t('leaderboard.howItWorks.residentsPoint2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lg">•</span>
                      <span>{t('leaderboard.howItWorks.residentsPoint3')}</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    🧑‍🔧 {t('leaderboard.howItWorks.workersTitle')}
                  </h3>
                  <ul className="space-y-2 text-primary-foreground/95">
                    <li className="flex items-start gap-2">
                      <span className="text-lg">•</span>
                      <span>{t('leaderboard.howItWorks.workersPoint1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lg">•</span>
                      <span>{t('leaderboard.howItWorks.workersPoint2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lg">•</span>
                      <span>{t('leaderboard.howItWorks.workersPoint3')}</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <p className="text-sm md:text-base flex items-start gap-2">
                  <Sparkles className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>{t('leaderboard.howItWorks.note')}</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
