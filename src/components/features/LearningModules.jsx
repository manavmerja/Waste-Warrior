import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle2, Award, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import VideoPlayer from './VideoPlayer';
import CertificateGenerator from './CertificateGenerator';

export default function LearningModules() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [modules, setModules] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModulesAndProgress();
  }, [userProfile]);

  const fetchModulesAndProgress = async () => {
    try {
      setLoading(true);
      
      // Fetch learning modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('learning_modules')
        .select('*')
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_learning_progress')
        .select('*')
        .eq('user_id', userProfile.id);

      if (progressError) throw progressError;

      // Fetch certificate if exists
      const { data: certData } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setModules(modulesData || []);
      setUserProgress(progressData || []);
      setCertificate(certData);
    } catch (error) {
      console.error('Error fetching learning data:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = (moduleId) => {
    return userProgress.find(p => p.module_id === moduleId) || null;
  };

  const calculateOverallProgress = () => {
    if (modules.length === 0) return 0;
    const completedModules = userProgress.filter(p => p.is_completed).length;
    return Math.round((completedModules / modules.length) * 100);
  };

  const handleModuleComplete = async (moduleId) => {
    try {
      const progress = getModuleProgress(moduleId);
      
      if (progress) {
        // Update existing progress
        const { error } = await supabase
          .from('user_learning_progress')
          .update({
            is_completed: true,
            progress_percentage: 100,
            completed_at: new Date().toISOString(),
          })
          .eq('id', progress.id);

        if (error) throw error;
      } else {
        // Create new progress
        const { error } = await supabase
          .from('user_learning_progress')
          .insert({
            user_id: userProfile.id,
            module_id: moduleId,
            is_completed: true,
            progress_percentage: 100,
            completed_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast({
        title: t('common.success'),
        description: t('learning.markComplete'),
      });

      // Refresh progress
      await fetchModulesAndProgress();
      
      // Check if all modules completed
      checkForCertificate();
    } catch (error) {
      console.error('Error marking module complete:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const checkForCertificate = async () => {
    const completedModules = userProgress.filter(p => p.is_completed).length;
    const requiredModules = modules.filter(m => m.is_required).length;

    if (completedModules >= requiredModules && !certificate) {
      // Generate certificate
      try {
        const { data, error } = await supabase
          .from('certifications')
          .insert({
            user_id: userProfile.id,
          })
          .select()
          .single();

        if (error) throw error;

        setCertificate(data);
        toast({
          title: '🎉 ' + t('learning.certifiedWarrior'),
          description: t('learning.downloadCertificate'),
        });
      } catch (error) {
        console.error('Error generating certificate:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('learning.title')}</CardTitle>
                <CardDescription>{t('learning.subtitle')}</CardDescription>
              </div>
              {certificate && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {t('learning.certifiedWarrior')}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('learning.progress')}</span>
                <span className="font-medium">{calculateOverallProgress()}%</span>
              </div>
              <Progress value={calculateOverallProgress()} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {t('learning.modulesCompleted', {
                  completed: userProgress.filter(p => p.is_completed).length,
                  total: modules.length,
                })}
              </p>
            </div>

            {certificate && (
              <div className="mt-4">
                <CertificateGenerator 
                  userName={userProfile.full_name}
                  completionDate={certificate.issued_at}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {selectedModule && (
          <VideoPlayer
            module={selectedModule}
            onClose={() => setSelectedModule(null)}
            onComplete={() => handleModuleComplete(selectedModule.id)}
          />
        )}
      </AnimatePresence>

      {/* Modules Grid */}
      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PlayCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('learning.noModules')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => {
            const progress = getModuleProgress(module.id);
            const isCompleted = progress?.is_completed || false;

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {module.title}
                      </CardTitle>
                      {isCompleted && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {module.thumbnail_url && (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={module.thumbnail_url}
                          alt={module.title}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <PlayCircle className="h-12 w-12 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('learning.duration', { minutes: module.duration_minutes || 5 })}
                      </span>
                      {progress && !isCompleted && (
                        <span className="text-primary font-medium">
                          {progress.progress_percentage}%
                        </span>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      variant={isCompleted ? 'outline' : 'default'}
                      onClick={() => setSelectedModule(module)}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {t('learning.completed')}
                        </>
                      ) : progress ? (
                        <>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          {t('learning.continueModule')}
                        </>
                      ) : (
                        <>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          {t('learning.startModule')}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
