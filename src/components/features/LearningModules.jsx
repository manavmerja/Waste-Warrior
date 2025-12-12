import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import VideoPlayer from './VideoPlayer';
import QuizModal from './QuizModal';
import CertificateGenerator from './CertificateGenerator';

export default function LearningModules() {
  const { userProfile } = useAuth();
  
  const [modules, setModules] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeModuleForVideo, setActiveModuleForVideo] = useState(null);
  const [activeModuleForQuiz, setActiveModuleForQuiz] = useState(null);
  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    if (userProfile) {
      fetchData();
    }
  }, [userProfile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: modulesData } = await supabase
        .from('learning_modules')
        .select('*')
        .order('order_index', { ascending: true });

      const { data: progressData } = await supabase
        .from('user_learning_progress')
        .select('*')
        .eq('user_id', userProfile.id);

      const { data: certData } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .single();

      setModules(modulesData || []);
      setUserProgress(progressData || []);
      setCertificate(certData);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (moduleId) => {
    return userProgress.find(p => p.module_id === moduleId);
  };

  const handleVideoComplete = async (moduleId) => {
    try {
      const { error } = await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: userProfile.id,
          module_id: moduleId,
          is_video_watched: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, module_id' });

      if (error) throw error;
      toast.success("Video completed! Quiz unlocked.");
      
      await fetchData();
      setActiveModuleForVideo(null);
      
      const module = modules.find(m => m.id === moduleId);
      setActiveModuleForQuiz(module);

    } catch (error) {
      toast.error("Error saving progress");
    }
  };

  const handleQuizPass = async (moduleId, score) => {
    try {
      const { error } = await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: userProfile.id,
          module_id: moduleId,
          is_video_watched: true,
          quiz_score: score,
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, module_id' });

      if (error) throw error;

      toast.success(`Module Completed! Score: ${score}%`);
      setActiveModuleForQuiz(null);
      await fetchData();
      
      checkForCertificate();

    } catch (error) {
      console.error(error);
      toast.error("Error saving quiz result");
    }
  };

  const checkForCertificate = async () => {
     if (modules.length > 0 && userProgress.filter(p => p.is_completed).length === modules.length && !certificate) {
         try {
            const { data, error } = await supabase.from('certifications').insert({ user_id: userProfile.id }).select().single();
            if(!error) setCertificate(data);
         } catch(e) {}
     }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* --- HERO SECTION FIXED --- */}
      {/* Added Inline Style for Background Color */}
      <div 
        className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl"
        style={{ background: 'linear-gradient(to right, #059669, #0d9488)' }} 
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-white">
              Learning Hub 🎓
              {certificate && <Badge className="bg-yellow-400 text-black hover:bg-yellow-500">Certified</Badge>}
            </h1>
            <p className="text-emerald-50 max-w-2xl text-lg">
              Watch videos, take quizzes, and earn your certificate. Become a certified Waste Warrior!
            </p>
          </div>

          {certificate && (
            <div className="mt-2">
              <CertificateGenerator 
                userName={userProfile.full_name} 
                completionDate={certificate.issued_at} 
              />
            </div>
          )}
        </div>
      </div>

      {/* --- MODULES GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => {
          const progress = getProgress(module.id);
          const isCompleted = progress?.is_completed;
          const isVideoWatched = progress?.is_video_watched;
          
          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`h-full border-gray-100 hover:shadow-lg transition-all duration-300 flex flex-col ${isCompleted ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white'}`}>
                
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100 rounded-t-xl overflow-hidden group">
                  <img 
                    src={module.thumbnail_url} 
                    alt={module.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    {isCompleted ? (
                      <div className="bg-emerald-500 rounded-full p-3 shadow-lg"><CheckCircle2 className="w-8 h-8 text-white" /></div>
                    ) : (
                      <div className="bg-white/90 rounded-full p-3 shadow-lg group-hover:scale-110 transition-transform"><PlayCircle className="w-8 h-8 text-emerald-600" /></div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <CardHeader className="pb-2">
                   <CardTitle className="text-lg line-clamp-1 text-gray-800">{module.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 flex-grow">
                   <p className="text-sm text-gray-500 line-clamp-2 mb-4">{module.description}</p>
                   {/* Status Indicator */}
                   <div className="flex items-center gap-2 text-sm">
                      <Badge variant={isCompleted ? "success" : "secondary"} className={isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}>
                        {isCompleted ? 'Completed' : isVideoWatched ? 'Quiz Pending' : 'Not Started'}
                      </Badge>
                      <span className="text-gray-400 text-xs">• {module.duration_minutes} mins</span>
                   </div>
                </CardContent>

                <CardFooter className="pt-0">
                  {isCompleted ? (
                    <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50" disabled>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Done
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
                      onClick={() => {
                        if (isVideoWatched && !isCompleted) {
                           setActiveModuleForQuiz(module);
                        } else {
                           setActiveModuleForVideo(module);
                        }
                      }}
                    >
                      {isVideoWatched ? "Take Quiz" : "Start Learning"} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </CardFooter>

              </Card>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {activeModuleForVideo && (
          <VideoPlayer 
            module={activeModuleForVideo} 
            onClose={() => setActiveModuleForVideo(null)}
            onComplete={() => handleVideoComplete(activeModuleForVideo.id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModuleForQuiz && (
          <QuizModal 
            module={activeModuleForQuiz}
            onClose={() => setActiveModuleForQuiz(null)}
            onComplete={(score) => handleQuizPass(activeModuleForQuiz.id, score)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}