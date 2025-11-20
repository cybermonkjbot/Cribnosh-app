import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { CheckCircle, Play } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const { chef, user, sessionToken, isBasicOnboardingComplete, isLoading } = useChefAuth();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const skipTraining = useMutation(api.mutations.chefs.skipComplianceTraining);

  // Get chef courses - should only be one course
  const courses: any = useQuery(
    api.queries.chefCourses.getByChefId,
    chef?._id && sessionToken
      ? { chefId: chef._id, sessionToken }
      : 'skip'
  );

  // Get the first (and only) course
  const course = courses && courses.length > 0 ? courses[0] : null;

  // Get course enrollment with modules
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const enrollment: any = useQuery(
    // @ts-ignore
    api.queries.chefCourses.getByChefAndCourse,
    chef?._id && course?._id && sessionToken
      ? { chefId: chef._id, courseId: course._id, sessionToken }
      : 'skip'
  );

  const enrollInCourse = useMutation(api.mutations.chefCourses.enrollInCourse);
  const syncModules = useMutation(api.mutations.chefCourses.syncCourseModules);
  const markAccessed = useMutation(api.mutations.chefCourses.markCourseAccessed);

  // Get sorted modules from enrollment
  const sortedModules = useMemo(() => {
    if (!enrollment?.progress) return [];
    return [...enrollment.progress].sort((a: any, b: any) => a.moduleNumber - b.moduleNumber);
  }, [enrollment]);

  // Find first incomplete module
  const firstIncompleteModule = useMemo(() => {
    if (!sortedModules.length) return null;
    return sortedModules.find((m: any) => !m.completed) || null;
  }, [sortedModules]);

  // Check if all modules are completed
  const allModulesCompleted = useMemo(() => {
    if (!sortedModules.length) return false;
    return sortedModules.every((m: any) => m.completed);
  }, [sortedModules]);

  // Auto-enroll if not enrolled
  useEffect(() => {
    // Only try to enroll if enrollment is explicitly null (not undefined, which means loading)
    if (chef?._id && course?._id && sessionToken && enrollment === null) {
      const courseName = course.courseName || 'Home Cooking Compliance Course';
      enrollInCourse({
        chefId: chef._id,
        courseId: course._id,
        courseName,
        sessionToken,
      })
        .then(() => {
          syncModules({ chefId: chef._id, courseId: course._id, sessionToken }).catch(console.error);
          markAccessed({ chefId: chef._id, courseId: course._id, sessionToken }).catch(console.error);
        })
        .catch((error: any) => {
          // If already enrolled, that's fine - just sync modules and mark as accessed
          if (error?.message?.includes('Already enrolled') || error?.message?.includes('already enrolled')) {
            syncModules({ chefId: chef._id, courseId: course._id, sessionToken }).catch(console.error);
            markAccessed({ chefId: chef._id, courseId: course._id, sessionToken }).catch(console.error);
          } else {
            console.error('Error enrolling in course:', error);
          }
        });
    }
  }, [chef?._id, course?._id, sessionToken, enrollment, enrollInCourse, syncModules, markAccessed]);

  // Calculate progress
  const completedModules = sortedModules.filter((m: any) => m.completed).length;
  const totalModules = sortedModules.length || 13;
  const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If basic onboarding not complete, show message
  if (chef && !isBasicOnboardingComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile Setup Required</Text>
          <Text style={styles.subtitle}>
            Please complete your chef profile setup before starting compliance training.
          </Text>
          <Button onPress={() => router.replace('/(tabs)/profile')}>
            Complete Profile
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // If no course available
  if (!course) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <EmptyState
            title="No courses available yet"
            subtitle="Contact support to enroll in the compliance course"
            icon="school-outline"
            style={{ paddingVertical: 40 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Handle starting the training flow - navigate directly to first incomplete module
  const handleStartTraining = () => {
    if (sortedModules.length === 0) {
      showError('Error', 'No modules available. Please contact support.');
      return;
    }

    // If all completed, show completion
    if (allModulesCompleted) {
      return;
    }

    // Find first incomplete module
    const nextModule = firstIncompleteModule || sortedModules[0];
    if (!nextModule || !course?._id) {
      showError('Error', 'Unable to start training. Please contact support.');
      return;
    }

    // Navigate directly to first module videos
    router.push(`/(tabs)/chef/onboarding/course/${course._id}/module/${nextModule.moduleId}`);
  };

  // Render completion screen if all modules completed
  if (allModulesCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.completionContainer}>
            <CheckCircle size={80} color={COLORS.secondary} />
            <Text style={styles.completionTitle}>Training Complete!</Text>
            <Text style={styles.completionText}>
              Congratulations! You've completed all {totalModules} compliance training modules.
              You're now ready to start receiving orders.
            </Text>
            <Button
              onPress={() => router.replace('/(tabs)')}
              style={styles.completionButton}
            >
              Go to Dashboard
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render introduction screen
  return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Compliance Training</Text>
            <Text style={styles.subtitle}>
              Complete all {totalModules} modules to start receiving orders
            </Text>
          </View>

          {/* Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {completedModules} of {totalModules} modules completed
            </Text>
          </View>

          {/* Introduction Content */}
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>Welcome to Compliance Training</Text>
            <Text style={styles.introText}>
              This training will guide you through all the essential compliance requirements
              for operating as a chef on our platform. You'll watch instructional videos
              and complete quizzes to demonstrate your understanding.
            </Text>
            <Text style={styles.introText}>
              The training is designed to be completed in one session, but you can pause
              and resume at any time. Your progress will be saved automatically.
            </Text>
          </View>

          {/* Skip Button */}
          {chef && !chef.complianceTrainingSkipped && (
            <View style={styles.skipSection}>
              <Text style={styles.skipText}>
                You can complete compliance training later, but you'll need to finish it before receiving your first order.
              </Text>
              <Button
                variant="outline"
                onPress={async () => {
                  if (!chef?._id || !sessionToken) return;
                  try {
                    await skipTraining({
                      chefId: chef._id,
                      sessionToken,
                    });
                    showSuccess('Training Skipped', 'You can complete compliance training later from your profile.');
                    router.replace('/(tabs)');
                  } catch (error: any) {
                    showError('Error', error.message || 'Failed to skip training');
                  }
                }}
                style={styles.skipButton}
              >
                Skip for Now
              </Button>
            </View>
          )}

          {/* Start Button */}
          <Button
            onPress={handleStartTraining}
            style={styles.startButton}
            disabled={!course}
          >
            <Play size={20} color="#fff" style={{ marginRight: 8 }} />
            {enrollment === undefined 
              ? 'Loading...' 
              : completedModules > 0 
                ? 'Continue Training' 
                : 'Start Training'}
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
}

// Brand colors matching main mobile app design system
const COLORS = {
  primary: '#094327',
  secondary: '#0B9E58',
  lightGreen: '#E6FFE8',
  background: '#FAFFFA',
  white: '#FFFFFF',
  text: {
    primary: '#02120A',
    secondary: '#374151',
    muted: '#6B7280',
  },
  border: '#E5E7EB',
  success: '#0B9E58',
  warning: '#FF6B35',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 8,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text.muted,
  },
  progressCard: {
    padding: 16,
    marginBottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: COLORS.text.primary,
  },
  progressPercentage: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: COLORS.secondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
  },
  introCard: {
    padding: 20,
    marginBottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  introTitle: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 12,
    color: COLORS.text.primary,
  },
  introText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  skipSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
    textAlign: 'center',
    marginBottom: 12,
  },
  skipButton: {
    width: '100%',
  },
  startButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  loadingButton: {
    width: '100%',
    padding: 16,
    backgroundColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loadingButtonText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text.muted,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  completionTitle: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 40,
    marginTop: 24,
    marginBottom: 16,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  completionText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  completionButton: {
    width: '100%',
    maxWidth: 300,
  },
});
