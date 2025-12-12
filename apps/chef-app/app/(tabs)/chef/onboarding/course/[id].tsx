import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CourseModuleViewer() {
  const { chef, sessionToken, isBasicOnboardingComplete, isLoading } = useChefAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  
  const courseId = params.id;

  // Show loading while auth state is being determined
  // The layout handles redirects, so we just need to wait here
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If basic onboarding not complete, show message (layout should redirect, but show fallback)
  if (chef && !isBasicOnboardingComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Profile Setup Required</Text>
          <Text style={styles.loadingText}>
            Please complete your chef profile setup before starting compliance training.
          </Text>
          <Button onPress={() => router.replace('/(tabs)/profile')}>
            Complete Profile
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Get course enrollment
  const enrollmentQueryArgs: any = chef?._id && courseId && sessionToken
    ? { chefId: chef._id, courseId, sessionToken }
    : 'skip';
  
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
   
  // @ts-ignore
  const enrollment: any = useQuery(
    // @ts-ignore
    api.queries.chefCourses.getByChefAndCourse,
    enrollmentQueryArgs
  );

  // Mark course as accessed
  const markAccessed = useMutation(api.mutations.chefCourses.markCourseAccessed);
  const enrollInCourse = useMutation(api.mutations.chefCourses.enrollInCourse);

  // Sync modules and mark course as accessed when component mounts
  const syncModules = useMutation(api.mutations.chefCourses.syncCourseModules);
  
  React.useEffect(() => {
    if (chef?._id && courseId && sessionToken && enrollment === undefined) {
      // Wait for enrollment query to resolve
      return;
    }
    
    if (chef?._id && courseId && sessionToken) {
      // If not enrolled, enroll first
      if (!enrollment) {
        // Default course name - could be improved by fetching course details
        const courseName = courseId === 'compliance-course-v1' 
          ? 'Home Cooking Compliance Course' 
          : `Course ${courseId}`;
        
        enrollInCourse({ 
          chefId: chef._id, 
          courseId, 
          courseName,
          sessionToken 
        })
          .then(() => {
            // After enrollment, sync modules and mark as accessed
            syncModules({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
            markAccessed({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
          })
          .catch((error) => {
            // If already enrolled, try to sync and mark as accessed anyway
            if (error.message?.includes('Already enrolled')) {
              syncModules({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
              markAccessed({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
            } else {
              console.error('Error enrolling in course:', error);
            }
          });
      } else {
        // Already enrolled, sync modules and mark as accessed
        syncModules({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
        markAccessed({ chefId: chef._id, courseId, sessionToken }).catch(console.error);
      }
    }
  }, [chef?._id, courseId, sessionToken, enrollment]);

  const handleModulePress = async (moduleId: string, moduleName: string, moduleNumber: number) => {
    if (!chef?._id || !courseId || !sessionToken) return;

    // Navigate to module detail screen
    router.push(`/(tabs)/chef/onboarding/course/${courseId}/module/${moduleId}`);
  };

  // Show message if basic onboarding is not complete
  if (chef && !isBasicOnboardingComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Profile Setup Required</Text>
          <Text style={[styles.loadingText, { marginTop: 8, fontSize: 14 }]}>
            Please complete your chef profile setup before accessing compliance training.
          </Text>
          <Button 
            onPress={() => router.replace('/(tabs)/profile')}
            style={{ marginTop: 16 }}
          >
            Complete Profile
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!enrollment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading course...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedCount = enrollment.progress?.filter((m: any) => m.completed).length || 0;
  const totalCount = enrollment.progress?.length || 0;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Sort modules by module number
  const sortedModules = [...(enrollment.progress || [])].sort(
    (a, b) => a.moduleNumber - b.moduleNumber
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{enrollment.courseName}</Text>
        </View>

        {/* Simple Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedCount} of {totalCount} modules
          </Text>
        </View>

        {/* Modules List */}
        {sortedModules.length > 0 ? (
          sortedModules.map((module, index) => {
            const isCompleted = module.completed;
            const isLocked = index > 0 && !sortedModules[index - 1].completed;

            return (
              <TouchableOpacity
                key={module.moduleId}
                style={[styles.moduleCard, isLocked && styles.moduleCardLocked]}
                onPress={() => !isLocked && handleModulePress(module.moduleId, module.moduleName, module.moduleNumber)}
                disabled={isLocked}
              >
                <View style={styles.moduleContent}>
                  {isCompleted && (
                    <CheckCircle size={20} color={COLORS.secondary} style={styles.moduleIcon} />
                  )}
                  <View style={styles.moduleInfo}>
                    <Text style={styles.moduleTitle}>{module.moduleName}</Text>
                  </View>
                </View>
                {!isLocked && (
                  <Text style={styles.moduleButton}>
                    {isCompleted ? 'Continue' : 'Start'}
                  </Text>
                )}
                {isLocked && (
                  <Text style={styles.lockedText}>Locked</Text>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <EmptyState
            title="No modules available yet"
            subtitle="Course content will be available soon"
            icon="book-outline"
            style={{ paddingVertical: 40 }}
          />
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
  link: '#FF3B30',         // CribNosh red for links
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: COLORS.text.primary,
    flex: 1,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.link,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
  },
  moduleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleCardLocked: {
    opacity: 0.6,
  },
  moduleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  moduleIcon: {
    marginRight: 4,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.text.primary,
  },
  moduleButton: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.link,
  },
  lockedText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
  },
});

