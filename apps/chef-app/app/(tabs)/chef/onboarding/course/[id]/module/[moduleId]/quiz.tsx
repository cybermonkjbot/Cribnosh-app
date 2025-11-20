import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [quizResults, setQuizResults] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    passed: boolean;
    questionResults: Record<string, { isCorrect: boolean; userAnswer: any; correctAnswer: any }>;
  } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Get module content to access quiz
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  }, [submitted]);

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
      });

      if (results.passed) {
        showSuccess('Quiz Passed!', `You scored ${results.score}%. Module completed!`);
        
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
      } else {
        showError('Quiz Failed', `You scored ${results.score}%. Minimum ${quiz.passingScore}% required. You can retake the quiz.`);
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to submit quiz');
      setSubmitted(false);
    }
  }, [quiz, answers, chef, courseId, moduleId, sessionToken, currentModule, moduleContent, updateProgress, calculateScore, showSuccess, showError, nextModule, router]);

  const handleRetake = useCallback(() => {
    setAnswers({});
    setSubmitted(false);
    setQuizResults(null);
    if (quiz?.timeLimit) {
      setTimeRemaining(quiz.timeLimit);
    }
  }, [quiz?.timeLimit]);

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
  const allAnswered = sortedQuestions.every((q) => answers[q.questionId] !== undefined && answers[q.questionId] !== null);

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

        {/* Quiz Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Questions:</Text>
            <Text style={styles.infoValue}>{quiz.questions.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Passing Score:</Text>
            <Text style={styles.infoValue}>{quiz.passingScore}%</Text>
          </View>
          {quiz.timeLimit && (
            <View style={styles.infoRow}>
              <Clock size={16} color={COLORS.text.muted} />
              <Text style={styles.infoLabel}>Time Limit:</Text>
              <Text style={styles.infoValue}>
                {timeRemaining !== null
                  ? `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}`
                  : `${Math.floor(quiz.timeLimit / 60)}:${String(quiz.timeLimit % 60).padStart(2, '0')}`}
              </Text>
            </View>
          )}
          {currentModule && currentModule.quizAttempts > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Previous Attempts:</Text>
              <Text style={styles.infoValue}>{currentModule.quizAttempts}</Text>
            </View>
          )}
        </View>

        {/* Quiz Results */}
        {submitted && quizResults && (
          <Card style={[styles.resultsCard, quizResults.passed ? styles.passedCard : styles.failedCard]}>
            <View style={styles.resultsHeader}>
              {quizResults.passed ? (
                <CheckCircle size={32} color={COLORS.secondary} />
              ) : (
                <XCircle size={32} color={COLORS.link} />
              )}
              <Text style={[styles.resultsTitle, quizResults.passed ? styles.passedText : styles.failedText]}>
                {quizResults.passed ? 'Quiz Passed!' : 'Quiz Failed'}
              </Text>
            </View>
            <Text style={styles.resultsScore}>
              Score: {quizResults.score}% ({quizResults.correctAnswers}/{quizResults.totalQuestions} correct)
            </Text>
            {!quizResults.passed && (
              <Text style={styles.resultsMessage}>
                Minimum {quiz.passingScore}% required to pass. You can retake the quiz.
              </Text>
            )}
          </Card>
        )}

        {/* Questions */}
        {sortedQuestions.map((question, index) => {
          const userAnswer = answers[question.questionId];
          const isAnswered = userAnswer !== undefined && userAnswer !== null;
          const questionResult = submitted && quizResults ? quizResults.questionResults[question.questionId] : null;

          return (
            <View key={question.questionId} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                {questionResult && (
                  questionResult.isCorrect ? (
                    <CheckCircle size={20} color={COLORS.secondary} />
                  ) : (
                    <XCircle size={20} color={COLORS.link} />
                  )
                )}
              </View>
              <Text style={styles.questionText}>{question.question}</Text>

              {/* Multiple Choice */}
              {question.type === 'multiple_choice' && question.options && (
                <View style={styles.optionsContainer}>
                  {question.options.map((option, optIndex) => {
                    const isSelected = userAnswer === option;
                    const isCorrect = questionResult && questionResult.correctAnswer === option;
                    const isWrong = questionResult && !questionResult.isCorrect && isSelected;

                    return (
                      <TouchableOpacity
                        key={optIndex}
                        onPress={() => !submitted && handleAnswerChange(question.questionId, option)}
                        disabled={submitted}
                        style={[
                          styles.option,
                          isSelected && !submitted && styles.optionSelected,
                          isCorrect && submitted && styles.optionCorrect,
                          isWrong && submitted && styles.optionWrong,
                        ]}
                      >
                        <View style={styles.optionContent}>
                          <View style={[
                            styles.radioButton,
                            isSelected && styles.radioButtonSelected,
                            isCorrect && submitted && styles.radioButtonCorrect,
                            isWrong && submitted && styles.radioButtonWrong,
                          ]}>
                            {isSelected && <View style={styles.radioButtonInner} />}
                          </View>
                          <Text style={styles.optionText}>{option}</Text>
                        </View>
                        {submitted && isCorrect && <CheckCircle size={20} color={COLORS.secondary} />}
                        {submitted && isWrong && <XCircle size={20} color={COLORS.link} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* True/False */}
              {question.type === 'true_false' && (
                <View style={styles.optionsContainer}>
                  {['True', 'False'].map((option) => {
                    const isSelected = userAnswer === option;
                    const isCorrect = questionResult && questionResult.correctAnswer === option;
                    const isWrong = questionResult && !questionResult.isCorrect && isSelected;

                    return (
                      <TouchableOpacity
                        key={option}
                        onPress={() => !submitted && handleAnswerChange(question.questionId, option)}
                        disabled={submitted}
                        style={[
                          styles.option,
                          isSelected && !submitted && styles.optionSelected,
                          isCorrect && submitted && styles.optionCorrect,
                          isWrong && submitted && styles.optionWrong,
                        ]}
                      >
                        <View style={styles.optionContent}>
                          <View style={[
                            styles.radioButton,
                            isSelected && styles.radioButtonSelected,
                            isCorrect && submitted && styles.radioButtonCorrect,
                            isWrong && submitted && styles.radioButtonWrong,
                          ]}>
                            {isSelected && <View style={styles.radioButtonInner} />}
                          </View>
                          <Text style={styles.optionText}>{option}</Text>
                        </View>
                        {submitted && isCorrect && <CheckCircle size={20} color={COLORS.secondary} />}
                        {submitted && isWrong && <XCircle size={20} color={COLORS.link} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Text Answer */}
              {question.type === 'text' && (
                <View style={styles.textAnswerContainer}>
                  <Text style={styles.textAnswerLabel}>Your Answer:</Text>
                  {submitted ? (
                    <View style={styles.textAnswerDisplay}>
                      <Text style={styles.textAnswerText}>{userAnswer || 'No answer provided'}</Text>
                      {questionResult && (
                        <View style={styles.textAnswerResult}>
                          {questionResult.isCorrect ? (
                            <CheckCircle size={20} color={COLORS.secondary} />
                          ) : (
                            <XCircle size={20} color={COLORS.link} />
                          )}
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.textAnswerNote}>
                      Text answers will be reviewed manually.
                    </Text>
                  )}
                </View>
              )}

              {/* Explanation */}
              {submitted && question.explanation && (
                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationTitle}>Explanation:</Text>
                  <Text style={styles.explanationText}>{question.explanation}</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Submit Button */}
        {!submitted && (
          <Button
            onPress={handleSubmit}
            disabled={!allAnswered}
            style={[styles.submitButton, !allAnswered && styles.submitButtonDisabled]}
          >
            {allAnswered ? 'Submit Quiz' : `Answer ${sortedQuestions.length - Object.keys(answers).length} more question(s)`}
          </Button>
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
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
  },
  infoValue: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.primary,
  },
  resultsCard: {
    padding: 16,
    marginBottom: 16,
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
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
  },
  questionText: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 16,
    color: COLORS.text.primary,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
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
});

