import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Trophy, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function QuizModal({ module, onClose, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [module.id]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('module_id', module.id);

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load quiz questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correct_answer) {
        correctCount++;
      }
    });
    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);
  };

  const handleFinish = () => {
    if (score >= 60) {
      onComplete(score);
    } else {
      onClose();
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const isAnswerSelected = currentQuestion && selectedAnswers[currentQuestion.id];

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md flex items-center justify-center h-48 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </DialogContent>
      </Dialog>
    );
  }

  if (questions.length === 0) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Quiz Not Ready</DialogTitle>
            <DialogDescription>Questions coming soon.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
             <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      {/* FULL HEIGHT MOBILE LAYOUT */}
      <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-xl p-0 flex flex-col bg-white overflow-hidden border-0 sm:border sm:rounded-xl">
        
        {/* 1. FIXED HEADER */}
        <div className="p-6 border-b border-gray-100 bg-white z-10 flex-shrink-0">
          <DialogHeader className="mb-4 text-left">
            <DialogTitle className="text-xl font-bold text-gray-900">{module.title}</DialogTitle>
            <DialogDescription>
               {!showResults ? `Question ${currentQuestionIndex + 1} of ${questions.length}` : 'Quiz Results'}
            </DialogDescription>
          </DialogHeader>
          
          {!showResults && (
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* 2. SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
           {!showResults ? (
              <div className="space-y-6 pb-4">
                 <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
                    {currentQuestion.question_text}
                 </h3>

                 <RadioGroup
                    value={selectedAnswers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                    className="space-y-3"
                 >
                    {currentQuestion.options.map((option, index) => (
                      <label 
                        key={index} 
                        className={`flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 
                          ${selectedAnswers[currentQuestion.id] === option 
                            ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                      >
                        <RadioGroupItem value={option} id={`opt-${index}`} className="mt-1" />
                        <span className="text-sm md:text-base text-gray-700 select-none">{option}</span>
                      </label>
                    ))}
                 </RadioGroup>
              </div>
           ) : (
              // RESULTS VIEW
              <div className="space-y-6 pb-4">
                 <div className={`text-center p-6 rounded-2xl ${score >= 60 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {score >= 60 ? <Trophy className="h-16 w-16 text-emerald-600 mx-auto mb-2" /> : <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-2" />}
                    <h2 className="text-2xl font-bold text-gray-900">{score}% Score</h2>
                    <p className="text-gray-600">{score >= 60 ? 'You passed! 🎉' : 'Try again.'}</p>
                 </div>

                 {/* ANSWER REVIEW */}
                 <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Review:</h4>
                    {questions.map((q, i) => {
                       const userAnswer = selectedAnswers[q.id];
                       const isCorrect = userAnswer === q.correct_answer;
                       return (
                          <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-white'}`}>
                             <p className="text-sm font-medium text-gray-900 mb-2">{i + 1}. {q.question_text}</p>
                             {!isCorrect && <p className="text-xs text-red-500 mb-1">Your: {userAnswer || "Skipped"}</p>}
                             <p className="text-xs text-emerald-700 font-bold">Correct: {q.correct_answer}</p>
                          </div>
                       )
                    })}
                 </div>
              </div>
           )}
        </div>

        {/* 3. FIXED FOOTER (BUTTONS) - FORCED COLORS */}
        <div className="p-4 border-t border-gray-200 bg-white z-20 flex-shrink-0 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           {!showResults ? (
              <Button 
                onClick={currentQuestionIndex < questions.length - 1 ? handleNext : handleSubmit} 
                disabled={!isAnswerSelected} 
                className="w-full sm:w-auto font-bold h-12 sm:h-10 text-lg sm:text-sm"
                // 👇 FORCE COLOR & VISIBILITY
                style={{ 
                  backgroundColor: isAnswerSelected ? '#059669' : '#e5e7eb', // Emerald-600 or Gray-200
                  color: isAnswerSelected ? 'white' : '#9ca3af', // White or Gray-400
                  opacity: 1 // Ensure not invisible
                }}
              >
                {currentQuestionIndex < questions.length - 1 ? <>Next <ArrowRight className="w-4 h-4 ml-2" /></> : "Submit Quiz"}
              </Button>
           ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                 {score < 60 && (
                    <Button variant="outline" onClick={() => { setShowResults(false); setCurrentQuestionIndex(0); setSelectedAnswers({}); setScore(0); }} className="flex-1 sm:flex-none">
                      Retry
                    </Button>
                 )}
                 <Button onClick={handleFinish} className="flex-1 sm:flex-none" style={{ backgroundColor: '#059669', color: 'white' }}>
                    {score >= 60 ? 'Finish Module' : 'Close'}
                 </Button>
              </div>
           )}
        </div>

      </DialogContent>
    </Dialog>
  );
}