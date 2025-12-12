import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuizQuestion {
  questionId: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'text';
  options?: string[];
  correctAnswer: any;
  explanation?: string;
  order: number;
}

interface QuizData {
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
}

export default function ModuleQuizScreen() {
  const { chef, sessionToken } = useChefAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; moduleId: string }>();
  const { showSuccess, showError } = useToast();

  const courseId = params.id;
  const moduleId = params.moduleId;

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const saveQuizProgressTimeoutRef = useRef<any>(null);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    isCorrect: boolean;
    userAnswer: any;
    correctAnswer: any;
    explanation?: string;
    question: QuizQuestion;
  } | null>(null);
  const [quizResults, setQuizResults] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    passed: boolean;
    questionResults: Record<string, { isCorrect: boolean; userAnswer: any; correctAnswer: any }>;
  } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  // Get module content to access quiz
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)

  // @ts-ignore
  const moduleContent = useQuery(
    // @ts-ignore
    api.queries.courseModules.getModuleContent,
    chef?._id && courseId && moduleId && sessionToken
      ? { courseId, moduleId, sessionToken }
      : 'skip'
  ) as any;

  // Get course enrollment
  const enrollment = useQuery(
    api.queries.chefCourses.getByChefAndCourse,
    chef?._id && courseId && sessionToken
      ? { chefId: chef._id, courseId, sessionToken }
      : 'skip'
  ) as any;

  const updateProgress = useMutation(api.mutations.chefCourses.updateModuleProgress);

  // Find current module
  const currentModule = React.useMemo(() => {
    if (!enrollment?.progress) return null;
    return enrollment.progress.find((m: any) => m.moduleId === moduleId);
  }, [enrollment, moduleId]);

  // Restore quiz progress when module data loads
  React.useEffect(() => {
    if (currentModule?.partialQuizAnswers && !submitted) {
      // Restore saved answers
      setAnswers(currentModule.partialQuizAnswers);
      // Restore question index if available
      if (currentModule.currentQuizQuestionIndex !== undefined) {
        setCurrentQuestionIndex(currentModule.currentQuizQuestionIndex);
      }
    }
  }, [currentModule?.partialQuizAnswers, currentModule?.currentQuizQuestionIndex, submitted]);

  // Save quiz progress as answers change
  const saveQuizProgress = React.useCallback(async (newAnswers: Record<string, any>, questionIndex: number) => {
    if (!chef?._id || !courseId || !moduleId || !sessionToken || !currentModule || !moduleContent || submitted) return;

    // Clear existing timeout
    if (saveQuizProgressTimeoutRef.current) {
      clearTimeout(saveQuizProgressTimeoutRef.current);
    }

    // Debounce saves - only save after 500ms of no changes
    saveQuizProgressTimeoutRef.current = setTimeout(async () => {
      try {
        await updateProgress({
          chefId: chef._id,
          courseId,
          moduleId,
          moduleName: currentModule.moduleName || moduleContent.moduleName || 'Module',
          moduleNumber: currentModule.moduleNumber,
          completed: currentModule.completed || false,
          sessionToken,
          partialQuizAnswers: newAnswers,
          currentQuizQuestionIndex: questionIndex,
        });
      } catch (error) {
        console.error('Error saving quiz progress:', error);
      }
    }, 500);
  }, [chef, courseId, moduleId, sessionToken, currentModule, moduleContent, updateProgress, submitted]);

  // Get all modules sorted to find next module
  const sortedModules = React.useMemo(() => {
    if (!enrollment?.progress) return [];
    return [...enrollment.progress].sort((a: any, b: any) => a.moduleNumber - b.moduleNumber);
  }, [enrollment]);

  // Find next incomplete module
  const nextModule = React.useMemo(() => {
    if (!currentModule || !sortedModules.length) return null;
    const currentIndex = sortedModules.findIndex((m: any) => m.moduleId === moduleId);
    if (currentIndex === -1) return null;

    // Find next incomplete module after current
    for (let i = currentIndex + 1; i < sortedModules.length; i++) {
      if (!sortedModules[i].completed) {
        return sortedModules[i];
      }
    }
    return null;
  }, [currentModule, sortedModules, moduleId]);

  const quiz: QuizData | null = moduleContent?.quiz || null;

  // Timer for quiz
  React.useEffect(() => {
    if (!quiz?.timeLimit || submitted) return;

    setTimeRemaining(quiz.timeLimit);
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          if (prev === 1) {
            handleSubmit(); // Auto-submit when time runs out
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz?.timeLimit, submitted]);

  const handleAnswerChange = useCallback((questionId: string, answer: any, question: QuizQuestion, totalQuestions: number, isLastQuestion: boolean, submitCallback: () => void) => {
    if (submitted || showingFeedback) return;

    // Save the answer
    const newAnswers = {
      ...answers,
      [questionId]: answer,
    };
    setAnswers(newAnswers);

    // Save progress immediately
    saveQuizProgress(newAnswers, currentQuestionIndex);

    // Check if answer is correct
    const isCorrect = JSON.stringify(answer) === JSON.stringify(question.correctAnswer);

    // Show feedback immediately
    setCurrentFeedback({
      isCorrect,
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      question,
    });
    setShowingFeedback(true);

    // Animate feedback in
    Animated.timing(feedbackOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-advance after delay
    const delay = isCorrect ? 2000 : 4000; // 2s for correct, 4s for wrong (to read explanation)

    setTimeout(() => {
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowingFeedback(false);
        setCurrentFeedback(null);

        // Move to next question or submit if last
        if (isLastQuestion) {
          // Last question - submit quiz after a brief delay
          setTimeout(() => {
            submitCallback();
          }, 100);
        } else {
          // Move to next question
          const nextIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIndex);
          // Save progress with new question index
          const updatedAnswers = { ...answers, [questionId]: answer };
          saveQuizProgress(updatedAnswers, nextIndex);
        }
      });
    }, delay);
  }, [submitted, showingFeedback, feedbackOpacity, currentQuestionIndex, answers, saveQuizProgress]);

  const calculateScore = useCallback((userAnswers: Record<string, any>, questions: QuizQuestion[]) => {
    let correctCount = 0;
    const questionResults: Record<string, { isCorrect: boolean; userAnswer: any; correctAnswer: any }> = {};

    questions.forEach((question) => {
      const userAnswer = userAnswers[question.questionId];
      const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);

      questionResults[question.questionId] = {
        isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer,
      };

      if (isCorrect) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= (quiz?.passingScore || 80);

    return {
      score,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      passed,
      questionResults,
    };
  }, [quiz?.passingScore]);

  const handleSubmit = useCallback(async () => {
    if (!quiz || !chef?._id || !courseId || !moduleId || !sessionToken || !currentModule) {
      return;
    }

    // Check if all questions are answered
    const unansweredQuestions = quiz.questions.filter(
      (q) => answers[q.questionId] === undefined || answers[q.questionId] === null
    );

    if (unansweredQuestions.length > 0) {
      showError('Incomplete Quiz', `Please answer all ${unansweredQuestions.length} remaining question(s).`);
      return;
    }

    setSubmitted(true);

    // Calculate results
    const results = calculateScore(answers, quiz.questions);
    setQuizResults(results);

    // Prepare quiz answers for submission
    const quizAnswers = quiz.questions.map((question) => ({
      questionId: question.questionId,
      answer: answers[question.questionId],
      isCorrect: results.questionResults[question.questionId].isCorrect,
      attemptNumber: (currentModule.quizAttempts || 0) + 1,
      answeredAt: Date.now(),
    }));

    try {
      // Update module progress with quiz results
      await updateProgress({
        chefId: chef._id,
        courseId,
        moduleId,
        moduleName: currentModule.moduleName || moduleContent?.moduleName || 'Module',
        moduleNumber: currentModule.moduleNumber,
        completed: results.passed, // Only mark complete if passed
        quizScore: results.score,
        quizAnswers,
        sessionToken,
        // Clear partial progress since quiz is submitted
        partialQuizAnswers: undefined,
        currentQuizQuestionIndex: undefined,
      });

      if (results.passed) {
        showSuccess('Quiz Passed!', `You scored ${results.score}%. Module completed!`);
      } else {
        showError('Quiz Failed', `You scored ${results.score}%. Minimum ${quiz.passingScore}% required.`);
      }

      // Auto-navigate to next module or completion after 1.5 seconds
      setTimeout(() => {
        if (nextModule) {
          // Navigate to next module videos
          router.replace(`/(tabs)/chef/onboarding/course/${courseId}/module/${nextModule.moduleId}`);
        } else {
          // All modules completed - go back to onboarding screen which will show completion
          router.replace('/(tabs)/chef/onboarding');
        }
      }, 1500);
    } catch (error: any) {
      showError('Error', error.message || 'Failed to submit quiz');
      setSubmitted(false);
    }
  }, [quiz, answers, chef, courseId, moduleId, sessionToken, currentModule, moduleContent, updateProgress, calculateScore, showSuccess, showError, nextModule, router]);

  const handleRetake = useCallback(async () => {
    setAnswers({});
    setSubmitted(false);
    setQuizResults(null);
    setCurrentQuestionIndex(0);

    // Clear saved progress
    if (chef?._id && courseId && moduleId && sessionToken && currentModule && moduleContent) {
      try {
        await updateProgress({
          chefId: chef._id,
          courseId,
          moduleId,
          moduleName: currentModule.moduleName || moduleContent.moduleName || 'Module',
          moduleNumber: currentModule.moduleNumber,
          completed: currentModule.completed || false,
          sessionToken,
          partialQuizAnswers: undefined,
          currentQuizQuestionIndex: undefined,
        });
      } catch (error) {
        console.error('Error clearing quiz progress:', error);
      }
    }

    if (quiz?.timeLimit) {
      setTimeRemaining(quiz.timeLimit);
    }
  }, [quiz?.timeLimit, chef, courseId, moduleId, sessionToken, currentModule, moduleContent, updateProgress]);

  if (!moduleContent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Quiz</Text>
        </View>
        <View style={styles.content}>
          <EmptyState
            title="No quiz available"
            subtitle="This module doesn't have a quiz yet."
            icon="help-circle-outline"
            style={{ paddingVertical: 40 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const sortedQuestions = [...quiz.questions].sort((a, b) => a.order - b.order);
  const currentQuestion = sortedQuestions[currentQuestionIndex];
  const allAnswered = sortedQuestions.every((q) => answers[q.questionId] !== undefined && answers[q.questionId] !== null);
  const currentQuestionAnswered = currentQuestion && (answers[currentQuestion.questionId] !== undefined && answers[currentQuestion.questionId] !== null);
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === sortedQuestions.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Module Quiz</Text>
        </View>

        {/* Quiz Results */}
        {submitted && quizResults && (
          <View style={[styles.resultsCard, quizResults.passed ? styles.passedCard : styles.failedCard]}>
            <View style={styles.resultsHeader}>
              {quizResults.passed ? (
                <CheckCircle size={32} color={COLORS.secondary} />
              ) : (
                <XCircle size={32} color={COLORS.link} />
              )}
              <Text style={[styles.resultsTitle, quizResults.passed ? styles.passedText : styles.failedText]}>
                {quizResults.passed ? 'Great job!' : 'Let\'s try again'}
              </Text>
            </View>
            {!quizResults.passed && (
              <Text style={styles.resultsMessage}>
                You can retake this to improve your score.
              </Text>
            )}
          </View>
        )}

        {/* Current Question Only */}
        {currentQuestion && (
          <View key={currentQuestion.questionId} style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* Multiple Choice */}
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, optIndex) => {
                  const userAnswer = answers[currentQuestion.questionId];
                  const isSelected = userAnswer === option;

                  return (
                    <TouchableOpacity
                      key={optIndex}
                      onPress={() => !submitted && !showingFeedback && handleAnswerChange(
                        currentQuestion.questionId,
                        option,
                        currentQuestion,
                        sortedQuestions.length,
                        isLastQuestion,
                        handleSubmit
                      )}
                      disabled={submitted || showingFeedback}
                      style={[
                        styles.option,
                        isSelected && !submitted && !showingFeedback && styles.optionSelected,
                      ]}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.radioButton,
                          isSelected && styles.radioButtonSelected,
                        ]}>
                          {isSelected && <View style={styles.radioButtonInner} />}
                        </View>
                        <Text style={styles.optionText}>{option}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* True/False */}
            {currentQuestion.type === 'true_false' && (
              <View style={styles.optionsContainer}>
                {['True', 'False'].map((option) => {
                  const userAnswer = answers[currentQuestion.questionId];
                  const isSelected = userAnswer === option;

                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => !submitted && !showingFeedback && handleAnswerChange(
                        currentQuestion.questionId,
                        option,
                        currentQuestion,
                        sortedQuestions.length,
                        isLastQuestion,
                        handleSubmit
                      )}
                      disabled={submitted || showingFeedback}
                      style={[
                        styles.option,
                        isSelected && !submitted && !showingFeedback && styles.optionSelected,
                      ]}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.radioButton,
                          isSelected && styles.radioButtonSelected,
                        ]}>
                          {isSelected && <View style={styles.radioButtonInner} />}
                        </View>
                        <Text style={styles.optionText}>{option}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Text Answer */}
            {currentQuestion.type === 'text' && (
              <View style={styles.textAnswerContainer}>
                <Text style={styles.textAnswerLabel}>Your Answer:</Text>
                <Text style={styles.textAnswerNote}>
                  Text answers will be reviewed manually.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Retake Button */}
        {submitted && quizResults && !quizResults.passed && (
          <Button
            onPress={handleRetake}
            variant="outline"
            style={styles.retakeButton}
          >
            Retake Quiz
          </Button>
        )}

        {/* Continue Button - Auto-navigation happens, but show button as fallback */}
        {submitted && quizResults && quizResults.passed && (
          <Button
            onPress={() => {
              if (nextModule) {
                router.replace(`/(tabs)/chef/onboarding/course/${courseId}/module/${nextModule.moduleId}`);
              } else {
                router.replace('/(tabs)/chef/onboarding');
              }
            }}
            style={styles.continueButton}
          >
            {nextModule ? 'Continue to Next Module' : 'Complete Training'}
          </Button>
        )}
      </ScrollView>

      {/* Full Screen Feedback Overlay */}
      {showingFeedback && currentFeedback && (
        <Animated.View
          style={[
            styles.feedbackOverlay,
            { opacity: feedbackOpacity }
          ]}
        >
          <View style={styles.feedbackContainer}>
            {currentFeedback.isCorrect ? (
              <View style={styles.feedbackContent}>
                <View style={styles.feedbackIconContainer}>
                  <CheckCircle size={80} color={COLORS.secondary} strokeWidth={2} />
                </View>
                <Text style={styles.feedbackTitle}>Correct!</Text>
                <Text style={styles.feedbackSubtitle}>Great job</Text>
              </View>
            ) : (
              <View style={styles.feedbackContent}>
                <View style={styles.feedbackIconContainer}>
                  <XCircle size={80} color={COLORS.link} strokeWidth={2} />
                </View>
                <Text style={styles.feedbackTitle}>Not quite</Text>
                <View style={styles.correctAnswerContainer}>
                  <Text style={styles.correctAnswerLabel}>Correct answer:</Text>
                  <Text style={styles.correctAnswerText}>
                    {typeof currentFeedback.correctAnswer === 'string'
                      ? currentFeedback.correctAnswer
                      : JSON.stringify(currentFeedback.correctAnswer)}
                  </Text>
                </View>
                {currentFeedback.explanation && (
                  <View style={styles.feedbackExplanationContainer}>
                    <Text style={styles.feedbackExplanationTitle}>Why:</Text>
                    <Text style={styles.feedbackExplanationText}>{currentFeedback.explanation}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// Brand colors matching main mobile app design system
const COLORS = {
  primary: '#094327',      // Dark green - main brand color
  secondary: '#0B9E58',    // Green - secondary brand color
  lightGreen: '#E6FFE8',   // Light green - background
  background: '#FAFFFA',   // Light green tinted background
  white: '#FFFFFF',
  text: {
    primary: '#02120A',   // Dark text - matching main app
    secondary: '#374151',  // Medium text
    muted: '#6B7280',      // Muted text
  },
  border: '#E5E7EB',       // Light border
  success: '#0B9E58',      // Success green
  warning: '#FF6B35',      // Orange warning
  link: '#FF3B30',         // CribNosh red for links/errors
  error: '#FF3B30',         // Error red
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    color: COLORS.text.muted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 36,
    color: COLORS.text.primary,
  },
  resultsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passedCard: {
    backgroundColor: COLORS.lightGreen,
    borderColor: COLORS.secondary,
    borderWidth: 2,
  },
  failedCard: {
    backgroundColor: '#FFEBEE',
    borderColor: COLORS.link,
    borderWidth: 2,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  resultsTitle: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
  },
  passedText: {
    color: COLORS.secondary,
  },
  failedText: {
    color: COLORS.link,
  },
  resultsScore: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
    color: COLORS.text.primary,
  },
  resultsMessage: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
    marginTop: 8,
  },
  questionCard: {
    marginBottom: 24,
  },
  questionText: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 24,
    color: COLORS.text.primary,
  },
  optionsContainer: {
    marginTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: COLORS.link,
    backgroundColor: '#FFF5F5',
  },
  optionCorrect: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.lightGreen,
  },
  optionWrong: {
    borderColor: COLORS.link,
    backgroundColor: '#FFEBEE',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: COLORS.link,
  },
  radioButtonCorrect: {
    borderColor: COLORS.secondary,
  },
  radioButtonWrong: {
    borderColor: COLORS.link,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.link,
  },
  optionText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    color: COLORS.text.primary,
  },
  textAnswerContainer: {
    marginTop: 8,
  },
  textAnswerLabel: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    color: COLORS.text.primary,
  },
  textAnswerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: COLORS.border,
    borderRadius: 8,
  },
  textAnswerText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    color: COLORS.text.primary,
  },
  textAnswerResult: {
    marginLeft: 12,
  },
  textAnswerNote: {
    fontFamily: 'SF Pro',
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.text.muted,
  },
  explanationContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.border,
    borderRadius: 8,
  },
  explanationTitle: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    color: COLORS.text.primary,
  },
  explanationText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  retakeButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  continueButton: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: COLORS.secondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  feedbackContainer: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  feedbackContent: {
    alignItems: 'center',
    width: '100%',
  },
  feedbackIconContainer: {
    marginBottom: 24,
  },
  feedbackTitle: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 40,
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  feedbackSubtitle: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 18,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  correctAnswerContainer: {
    width: '100%',
    marginTop: 24,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
  },
  correctAnswerLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  correctAnswerText: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.white,
  },
  feedbackExplanationContainer: {
    width: '100%',
    marginTop: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  feedbackExplanationTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  feedbackExplanationText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.white,
  },
});

