import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Trophy, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';



export default function QuizModal({ module, onClose, onComplete }) {
  const { t } = useTranslation();
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
        .eq('module_id', module.id)
        .order('id', { ascending: true });

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
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
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

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const handleFinish = () => {
    if (score >= 50) {
      onComplete(score);
    }
    onClose();
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const allQuestionsAnswered = questions.every((q) => selectedAnswers[q.id]);

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (questions.length === 0) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>No Quiz Available</DialogTitle>
            <DialogDescription>This module doesn't have a quiz yet.</DialogDescription>
          </DialogHeader>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{module.title} - Quiz</DialogTitle>
          <DialogDescription>
            {showResults
              ? 'Review your results'
              : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Question Card */}
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {currentQuestion.question_text}
                  </h3>

                  <RadioGroup
                    value={selectedAnswers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                  >
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center space-x-3 p-4 rounded-lg bg-white border-2 border-gray-200 hover:border-indigo-400 transition-colors cursor-pointer"
                        >
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label
                            htmlFor={`option-${index}`}
                            className="flex-1 cursor-pointer text-gray-900"
                          >
                            {option}
                          </Label>
                        </motion.div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button onClick={handleSubmit} disabled={!allQuestionsAnswered}>
                    Submit Quiz
                  </Button>
                ) : (
                  <Button onClick={handleNext}>Next</Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Results Card */}
              <Card
                className={`${
                  score >= 50
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                    : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                } shadow-lg`}
              >
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  >
                    {score >= 50 ? (
                      <Trophy className="h-20 w-20 text-green-600 mx-auto mb-4" />
                    ) : (
                      <AlertCircle className="h-20 w-20 text-red-600 mx-auto mb-4" />
                    )}
                  </motion.div>

                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {score >= 50 ? 'Congratulations!' : 'Keep Trying!'}
                  </h3>
                  <p className="text-lg text-gray-600 mb-4">
                    {score >= 50
                      ? 'You passed the quiz!'
                      : 'You need at least 50% to pass. Please try again.'}
                  </p>
                  <div className="text-5xl font-bold text-gray-900 mb-2">{score}%</div>
                  <p className="text-sm text-gray-600">
                    You answered {Math.round((score / 100) * questions.length)} out of{' '}
                    {questions.length} questions correctly
                  </p>
                </CardContent>
              </Card>

              {/* Question Results */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {questions.map((question, index) => {
                  const isCorrect = selectedAnswers[question.id] === question.correct_answer;
                  return (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className={`${
                          isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                Question {index + 1}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">{question.question_text}</p>
                              {!isCorrect && (
                                <p className="text-xs text-red-600 mt-2">
                                  Correct answer: {question.correct_answer}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                {score < 50 && (
                  <Button variant="outline" onClick={handleRetry}>
                    Try Again
                  </Button>
                )}
                <Button onClick={handleFinish}>{score >= 50 ? 'Complete Module' : 'Close'}</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
