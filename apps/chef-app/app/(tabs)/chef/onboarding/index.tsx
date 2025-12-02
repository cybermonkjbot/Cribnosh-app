import { Mascot } from '@/components/Mascot';
import { Button } from '@/components/ui/Button';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const { chef, user, sessionToken, isBasicOnboardingComplete, isLoading } = useChefAuth();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const skipTraining = useMutation(api.mutations.chefs.skipComplianceTraining);

  // Use hardcoded courseId for compliance course
  const courseId = "compliance-course-v1";
  const courseName = "Home Cooking Compliance Course";

  // Get chef courses - should only be one course
  const courses: any = useQuery(
    api.queries.chefCourses.getByChefId,
    chef?._id && sessionToken
      ? { chefId: chef._id, sessionToken }
      : 'skip'
  );

  // Get the first (and only) course enrollment
  const course = courses && courses.length > 0 ? courses.find((c: any) => c.courseId === courseId) : null;

  // Get course enrollment with modules
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const enrollment: any = useQuery(
    // @ts-ignore
    api.queries.chefCourses.getByChefAndCourse,
    chef?._id && sessionToken
      ? { chefId: chef._id, courseId, sessionToken }
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

  // Auto-enroll immediately if not enrolled - this ensures ALL chefs are enrolled
  useEffect(() => {
    if (!chef?._id || !sessionToken) return;
    
    // If enrollment is null (explicitly not enrolled), enroll immediately
    if (enrollment === null) {
      console.log('Auto-enrolling chef in compliance course...');
      enrollInCourse({
        chefId: chef._id,
        courseId,
        courseName,
        sessionToken,
      })
        .then(() => {
          console.log('Successfully auto-enrolled chef');
          syncModules({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
          markAccessed({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
        })
        .catch((error: any) => {
          // If already enrolled, that's fine - just sync modules and mark as accessed
          if (error?.message?.includes('Already enrolled') || error?.message?.includes('already enrolled')) {
            console.log('Chef already enrolled, syncing modules...');
            syncModules({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
            markAccessed({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
          } else {
            console.error('Error auto-enrolling in course:', error);
          }
        });
    } else if (enrollment) {
      // If enrolled, ensure modules are synced
      syncModules({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
      markAccessed({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
    }
    // If enrollment is undefined (still loading), we wait for it to resolve
  }, [chef?._id, sessionToken, enrollment, enrollInCourse, syncModules, markAccessed, courseId, courseName]);

  // Calculate progress
  const completedModules = sortedModules.filter((m: any) => m.completed).length;
  const totalModules = sortedModules.length || 13;
  const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
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
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
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

  // Note: We don't check for course enrollment here anymore since we auto-enroll
  // The course modules exist, so we can proceed even if not enrolled yet

  // Handle starting the training flow - navigate directly to first incomplete module
  const handleStartTraining = async () => {
    if (!chef?._id || !sessionToken) {
      showError('Error', 'Please log in to start training.');
      return;
    }

    // Ensure enrollment (should already be done by useEffect, but double-check)
    if (!enrollment) {
      try {
        await enrollInCourse({
          chefId: chef._id,
          courseId,
          courseName,
          sessionToken,
        });
        // Sync modules after enrollment
        await syncModules({ chefId: chef._id, courseId, sessionToken });
        await markAccessed({ chefId: chef._id, courseId, sessionToken });
        // Wait a moment for the query to update
        await new Promise(resolve => setTimeout(resolve, 500));
        // Re-fetch enrollment by navigating to course page which will handle it
        router.push(`/(tabs)/chef/onboarding/course/${courseId}`);
        return;
      } catch (error: any) {
        if (error?.message?.includes('Already enrolled')) {
          // Already enrolled, just sync modules and continue
          await syncModules({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
          await markAccessed({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
        } else {
          showError('Error', error.message || 'Failed to enroll in course');
          return;
        }
      }
    }

    // If no modules yet, try syncing
    if (sortedModules.length === 0) {
      try {
        await syncModules({ chefId: chef._id, courseId, sessionToken });
        await markAccessed({ chefId: chef._id, courseId, sessionToken });
        // Wait for query to update
        await new Promise(resolve => setTimeout(resolve, 500));
        // Navigate to course page which will show modules
        router.push(`/(tabs)/chef/onboarding/course/${courseId}`);
        return;
      } catch (error: any) {
        console.error('Error syncing modules:', error);
        // Still navigate to course page
        router.push(`/(tabs)/chef/onboarding/course/${courseId}`);
        return;
      }
    }

    // If all completed, show completion (shouldn't reach here due to early return above)
    if (allModulesCompleted) {
      return;
    }

    // Find first incomplete module
    const nextModule = firstIncompleteModule || sortedModules[0];
    if (!nextModule) {
      // If no module found, navigate to course page
      router.push(`/(tabs)/chef/onboarding/course/${courseId}`);
      return;
    }

    // Navigate directly to first module videos
    router.push(`/(tabs)/chef/onboarding/course/${courseId}/module/${nextModule.moduleId}`);
  };

  // Render completion screen if all modules completed
  if (allModulesCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
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
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.contentWrapper}>
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Compliance Training</Text>
              <Text style={styles.subtitle}>
                Complete all {totalModules} modules to start receiving orders
              </Text>
            </View>

            {/* Progress Percentage and Mascot */}
            <View style={styles.progressMascotContainer}>
              {/* Progress Percentage on Left */}
              <View style={styles.progressPercentageContainer}>
                <Text style={styles.progressPercentageDisplay}>{Math.round(progress)}%</Text>
                <Text style={styles.progressPercentageSubtitle}>Training Complete</Text>
              </View>
              
              {/* Mascot on Right */}
              <View style={styles.mascotContainer}>
                <View style={[styles.speechBubble, styles.speechBubbleRight]}>
                  <Text style={styles.speechBubbleText}>
                    Let's get you started to start receiving orders
                  </Text>
                </View>
                <View style={styles.mascotZoom}>
                  <Mascot emotion="excited" size={400} />
                </View>
              </View>
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
          </ScrollView>

          {/* Start Button - Always rendered, fixed at bottom */}
          <View style={styles.buttonContainer}>
            <Button
              onPress={handleStartTraining}
              variant="danger"
              size="lg"
              elevated={true}
              backgroundColor="#FF3B30"
              style={styles.startButton}
            >
              Start Training
            </Button>
          </View>
        </View>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 16,
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
  progressMascotContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingVertical: 16,
    position: 'relative',
  },
  progressPercentageContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingTop: 20,
    zIndex: 20,
  },
  progressPercentageDisplay: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 48,
    lineHeight: 56,
    color: COLORS.primary,
    marginBottom: 4,
  },
  progressPercentageSubtitle: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    overflow: 'visible',
    position: 'relative',
    zIndex: 1,
  },
  mascotZoom: {
    transform: [{ scale: 1.0 }],
  },
  speechBubble: {
    position: 'absolute',
    top: -5,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 280,
  },
  speechBubbleLeft: {
    left: -40,
  },
  speechBubbleRight: {
    right: 40,
  },
  speechBubbleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 16,
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
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    width: '100%',
  },
  startButton: {
    width: '100%',
    borderRadius: 12,
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
