import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayCircle, CheckCircle, Award, BookOpen, Clock } from 'lucide-react';
import VideoPlayer from '@/components/features/VideoPlayer';
import QuizModal from '@/components/features/QuizModal';
import CertificateGenerator from '@/components/features/CertificateGenerator';
import { toast } from 'sonner';

export default function LearningPage() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [modules, setModules] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [certificate, setCertificate] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [quizModule, setQuizModule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.id) {
      fetchLearningData();
    }
  }, [userProfile]);

  const fetchLearningData = async () => {
    try {
      // setLoading(true);

      // Fetch modules based on user role
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

      // Fetch certificate
      const { data: certData, error: certError } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .maybeSingle();

      if (certError) throw certError;

      setModules(modulesData || []);
      setUserProgress(progressData || []);
      setCertificate(certData);
    } catch (error) {
      console.error('Error fetching learning data:', error);
      toast.error('Failed to load learning modules');
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = (moduleId) => {
    return userProgress.find((p) => p.module_id === moduleId);
  };

  const calculateOverallProgress = () => {
    if (modules.length === 0) return 0;
    const requiredModules = modules.filter((m) => m.is_required);
    const completedModules = requiredModules.filter((m) => {
      const progress = getModuleProgress(m.id);
      return progress?.is_completed;
    });
    return Math.round((completedModules.length / requiredModules.length) * 100);
  };

  const handleModuleComplete = async (moduleId, quizScore = 100) => {
    try {
      const existingProgress = getModuleProgress(moduleId);

      if (existingProgress) {
        const { error } = await supabase
          .from('user_learning_progress')
          .update({
            is_completed: true,
            quiz_score: quizScore,
            completed_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_learning_progress').insert({
          user_id: userProfile.id,
          module_id: moduleId,
          is_completed: true,
          quiz_score: quizScore,
          completed_at: new Date().toISOString(),
          progress_percentage: 100,
        });

        if (error) throw error;
      }

      await fetchLearningData();
      toast.success('Module completed!');
      checkForCertificate();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const checkForCertificate = async () => {
    const requiredModules = modules.filter((m) => m.is_required);
    const allCompleted = requiredModules.every((m) => {
      const progress = getModuleProgress(m.id);
      return progress?.is_completed;
    });

    if (allCompleted && !certificate) {
      try {
        const { data, error } = await supabase
          .from('certifications')
          .insert({
            user_id: userProfile.id,
            issued_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        setCertificate(data);
        toast.success('Congratulations! You earned your certificate!');
      } catch (error) {
        console.error('Error creating certificate:', error);
      }
    }
  };

  const getModuleButtonConfig = (module) => {
    const progress = getModuleProgress(module.id);

    if (progress?.is_completed) {
      return {
        text: 'Completed',
        variant: 'outline',
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        disabled: true,
        onClick: null,
      };
    }

    if (progress && progress.progress_percentage >= 90) {
      return {
        text: 'Take Quiz',
        variant: 'default',
        icon: <BookOpen className="h-4 w-4" />,
        disabled: false,
        onClick: () => setQuizModule(module),
      };
    }

    return {
      text: 'Start Module',
      variant: 'default',
      icon: <PlayCircle className="h-4 w-4" />,
      disabled: false,
      onClick: () => setSelectedModule(module),
    };
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();
  const completedCount = modules.filter((m) => getModuleProgress(m.id)?.is_completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 p-6"
    >
      {/* Overall Progress Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              My Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {completedCount} of {modules.length} modules completed
              </span>
              <span className="text-2xl font-bold text-gray-900">{overallProgress}%</span>
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="origin-left"
            >
              <Progress value={overallProgress} className="h-3" />
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Certificate Card */}
      {certificate && (
        <motion.div
          initial={{ opacity: 0, rotateY: -90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg border-2 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Congratulations! You're Certified!</h3>
                    <p className="text-sm text-gray-600">
                      Issued on {new Date(certificate.issued_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <CertificateGenerator
                  userName={userProfile?.full_name}
                  completionDate={certificate.issued_at}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Module Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={{
          show: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        initial="hidden"
        animate="show"
      >
        {modules.map((module, index) => {
          const buttonConfig = getModuleButtonConfig(module);
          const progress = getModuleProgress(module.id);

          return (
            <motion.div
              key={module.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow h-full">
                <div className="relative aspect-video overflow-hidden rounded-t-lg">
                  {module.thumbnail_url ? (
                    <img
                      src={module.thumbnail_url}
                      alt={module.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-white opacity-50" />
                    </div>
                  )}
                  {progress?.is_completed && (
                    <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Completed
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-2">{module.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{module.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{module.duration_minutes} minutes</span>
                  </div>
                  {progress && !progress.is_completed && progress.progress_percentage > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Progress</span>
                        <span>{progress.progress_percentage}%</span>
                      </div>
                      <Progress value={progress.progress_percentage} className="h-2" />
                    </div>
                  )}
                  <Button
                    onClick={buttonConfig.onClick}
                    disabled={buttonConfig.disabled}
                    variant={buttonConfig.variant}
                    className="w-full"
                  >
                    {buttonConfig.icon}
                    {buttonConfig.text}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {selectedModule && (
          <VideoPlayer
            module={selectedModule}
            onClose={() => setSelectedModule(null)}
            onComplete={() => {
              setSelectedModule(null);
              setQuizModule(selectedModule);
            }}
          />
        )}
      </AnimatePresence>

      {/* Quiz Modal */}
      <AnimatePresence>
        {quizModule && (
          <QuizModal
            module={quizModule}
            onClose={() => setQuizModule(null)}
            onComplete={(score) => handleModuleComplete(quizModule.id, score)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
