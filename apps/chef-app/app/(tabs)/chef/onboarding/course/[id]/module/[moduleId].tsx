import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, X, ChevronRight } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Pressable, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Cribnosh brand colors
const BRAND_COLORS = {
  primary: '#FF3B30', // Cribnosh red/orange
  primaryDark: '#ed1d12',
  primaryLight: '#ff5e54',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textTertiary: 'rgba(255, 255, 255, 0.6)',
};

interface ModuleVideo {
  id: string;
  videoUrl: string;
  title: string;
  description?: string;
  order: number;
}

interface ModuleContent {
  moduleId: string;
  moduleName: string;
  moduleNumber: number;
  videos: ModuleVideo[];
  content: Array<{
    type: 'video' | 'text' | 'interactive';
    title: string;
    data?: any;
    order: number;
  }>;
  quiz: any;
}

export default function ModuleDetailScreen() {
  const { chef, sessionToken } = useChefAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; moduleId: string }>();
  const { showSuccess, showError } = useToast();
  const insets = useSafeAreaInsets();
  
  const courseId = params.id;
  const moduleId = params.moduleId;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get course enrollment to find module progress
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const enrollment = useQuery(
    // @ts-ignore
    api.queries.chefCourses.getByChefAndCourse,
    chef?._id && courseId && sessionToken
      ? { chefId: chef._id, courseId, sessionToken }
      : 'skip'
  );

  // Get module content
  const moduleContent = useQuery(
    api.queries.courseModules.getModuleContent,
    chef?._id && courseId && moduleId && sessionToken
      ? { courseId, moduleId, sessionToken }
      : 'skip'
  ) as ModuleContent | null | undefined;

  const updateProgress = useMutation(api.mutations.chefCourses.updateModuleProgress);

  // Find current module from enrollment
  const currentModule = useMemo(() => {
    if (!enrollment?.progress) return null;
    return enrollment.progress.find((m: any) => m.moduleId === moduleId);
  }, [enrollment, moduleId]);

  // Extract videos from module content
  const moduleVideos = useMemo(() => {
    if (!moduleContent) return [];
    
    const videos: ModuleVideo[] = [];
    
    // Extract videos from videos array (primary source for vertical playback)
    if (moduleContent.videos && Array.isArray(moduleContent.videos)) {
      moduleContent.videos.forEach((video: any) => {
        if (video.videoUrl) {
          videos.push({
            id: video.id || `${moduleId}-video-${videos.length}`,
            videoUrl: video.videoUrl,
            title: video.title || 'Video',
            description: video.description,
            order: video.order || videos.length + 1,
          });
        }
      });
    }
    
    // Also extract videos from content array (secondary source)
    if (moduleContent.content && Array.isArray(moduleContent.content)) {
      moduleContent.content.forEach((item: any, index: number) => {
        if (item.type === 'video' && item.data?.videoUrl) {
          videos.push({
            id: `${moduleId}-content-video-${index}`,
            videoUrl: item.data.videoUrl,
            title: item.title || 'Video',
            description: item.data.description,
            order: item.order || videos.length + 1,
          });
        }
      });
    }
    
    // Sort by order
    return videos.sort((a, b) => a.order - b.order);
  }, [moduleContent, moduleId]);

  // Restore video index from saved progress
  useEffect(() => {
    if (currentModule?.lastVideoIndex !== undefined && moduleVideos && moduleVideos.length > 0) {
      const savedIndex = Math.min(currentModule.lastVideoIndex, moduleVideos.length - 1);
      setCurrentIndex(savedIndex);
      // Scroll to saved position after a brief delay
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: savedIndex, animated: false });
      }, 100);
    }
  }, [currentModule?.lastVideoIndex, moduleVideos]);

  // Save video progress when index changes
  const saveVideoProgress = useCallback(async (videoIndex: number) => {
    if (!chef?._id || !courseId || !moduleId || !sessionToken || !currentModule || !moduleContent) return;
    
    // Clear existing timeout
    if (saveProgressTimeoutRef.current) {
      clearTimeout(saveProgressTimeoutRef.current);
    }
    
    // Debounce saves - only save after 1 second of no changes
    saveProgressTimeoutRef.current = setTimeout(async () => {
      try {
        await updateProgress({
          chefId: chef._id,
          courseId,
          moduleId,
          moduleName: currentModule.moduleName || moduleContent.moduleName || 'Module',
          moduleNumber: currentModule.moduleNumber,
          completed: currentModule.completed || false,
          sessionToken,
          lastVideoIndex: videoIndex,
        });
      } catch (error) {
        console.error('Error saving video progress:', error);
      }
    }, 1000);
  }, [chef, courseId, moduleId, sessionToken, currentModule, moduleContent, updateProgress]);

  // Save video progress when currentIndex changes
  useEffect(() => {
    if (moduleVideos && moduleVideos.length > 0 && currentIndex >= 0) {
      saveVideoProgress(currentIndex);
    }
  }, [currentIndex, moduleVideos, saveVideoProgress]);

  // Get sorted modules to find next module
  const sortedModules = useMemo(() => {
    if (!enrollment?.progress) return [];
    return [...enrollment.progress].sort((a: any, b: any) => a.moduleNumber - b.moduleNumber);
  }, [enrollment]);

  // Find next incomplete module
  const nextModule = useMemo(() => {
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

  // Track time spent watching videos
  const startTimeRef = useRef<number>(Date.now());
  const totalTimeSpentRef = useRef<number>(currentModule?.timeSpent || 0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    return () => {
      // Calculate time spent when component unmounts
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      totalTimeSpentRef.current += timeSpent;
    };
  }, []);

  // Handle video playback based on visibility
  const handleVideoPlayback = useCallback((index: number, shouldPlay: boolean) => {
    const video = moduleVideos[index];
    if (!video) return;

    if (shouldPlay) {
      videoRefs.current[video.id]?.playAsync();
      setPlayingVideos(prev => new Set([...prev, video.id]));
    } else {
      videoRefs.current[video.id]?.pauseAsync();
      setPlayingVideos(prev => {
        const next = new Set(prev);
        next.delete(video.id);
        return next;
      });
    }
  }, [moduleVideos]);

  // Handle scroll to change videos
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (!viewableItems || viewableItems.length === 0) return;
    
    const newIndex = viewableItems[0].index;
    if (typeof newIndex === 'number' && newIndex >= 0 && newIndex !== currentIndex) {
      // Pause previous video
      handleVideoPlayback(currentIndex, false);
      // Play new video
      setCurrentIndex(newIndex);
      handleVideoPlayback(newIndex, true);
    }
  }, [currentIndex, handleVideoPlayback]);

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    waitForInteraction: false,
    minimumViewTime: 300,
  }), []);

  // Mark module as complete
  const handleCompleteModule = useCallback(async () => {
    if (!chef?._id || !courseId || !moduleId || !sessionToken || !currentModule) return;

    try {
      const timeSpent = totalTimeSpentRef.current;
      
      await updateProgress({
        chefId: chef._id,
        courseId,
        moduleId,
        moduleName: currentModule.moduleName || moduleContent?.moduleName || 'Module',
        moduleNumber: currentModule.moduleNumber,
        completed: true,
        timeSpent,
        sessionToken,
      });
      
      // If module has quiz and hasn't been passed, navigate to quiz
      if (moduleContent?.quiz && (!currentModule.quizScore || currentModule.quizScore < (moduleContent.quiz.passingScore || 80))) {
        router.push(`/(tabs)/chef/onboarding/course/${courseId}/module/${moduleId}/quiz`);
      } else {
        // No quiz or already passed - navigate to next module or completion
        if (nextModule && !nextModule.completed) {
          router.replace(`/(tabs)/chef/onboarding/course/${courseId}/module/${nextModule.moduleId}`);
        } else {
          // All modules completed
          router.replace('/(tabs)/chef/onboarding');
        }
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to complete module');
    }
  }, [chef, courseId, moduleId, sessionToken, currentModule, moduleContent, updateProgress, showSuccess, showError, router, nextModule]);

  // Render video item
  const renderVideoItem = useCallback(({ item, index }: { item: ModuleVideo; index: number }) => {
    const isCurrentItem = index === currentIndex;
    const isPlaying = playingVideos.has(item.id);

    return (
      <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: BRAND_COLORS.black }}>
        <Video
          ref={(ref) => {
            videoRefs.current[item.id] = ref;
          }}
          source={{ uri: item.videoUrl }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isCurrentItem && isPlaying}
          isLooping={false}
          isMuted={false}
          onLoad={() => {
            if (isCurrentItem) {
              handleVideoPlayback(index, true);
            }
          }}
          onError={(error) => {
            console.error('Video error:', error);
          }}
        />
        
        {/* Video Overlay with Title and Description */}
        {/* Adjust bottom padding when action buttons are shown */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingTop: 24,
            paddingHorizontal: 20,
            paddingBottom: index === moduleVideos.length - 1 && currentModule && !currentModule.completed
              ? insets.bottom + 100 // Extra space for action button
              : insets.bottom + 24,
          }}
        >
          <View
            style={{
              backgroundColor: BRAND_COLORS.overlay,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Text 
              style={{ 
                color: BRAND_COLORS.white, 
                fontSize: 24, 
                fontWeight: '700', 
                marginBottom: 8,
                letterSpacing: -0.5,
              }}
            >
              {item.title}
            </Text>
            {item.description && (
              <Text 
                style={{ 
                  color: BRAND_COLORS.textSecondary, 
                  fontSize: 15, 
                  lineHeight: 22,
                }}
              >
                {item.description}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }, [currentIndex, playingVideos, insets, currentModule, moduleVideos.length, handleVideoPlayback]);

  useEffect(() => {
    // Set loading state based on moduleContent query
    if (moduleContent === undefined) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [moduleContent]);

  // Auto-skip if no videos available - go to quiz or next module
  useEffect(() => {
    if (!isLoading && moduleContent !== undefined && moduleVideos.length === 0 && currentModule && !currentModule.completed) {
      // If module has quiz and hasn't been passed, navigate to quiz
      if (moduleContent?.quiz && (!currentModule.quizScore || currentModule.quizScore < (moduleContent.quiz.passingScore || 80))) {
        router.replace(`/(tabs)/chef/onboarding/course/${courseId}/module/${moduleId}/quiz`);
      } else {
        // No quiz or already passed - navigate to next module or completion
        if (nextModule && !nextModule.completed) {
          router.replace(`/(tabs)/chef/onboarding/course/${courseId}/module/${nextModule.moduleId}`);
        } else {
          // All modules completed
          router.replace('/(tabs)/chef/onboarding');
        }
      }
    }
  }, [isLoading, moduleContent, moduleVideos.length, currentModule, nextModule, courseId, moduleId, router]);

  if (isLoading || moduleContent === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: BRAND_COLORS.black, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
        <Text style={{ color: BRAND_COLORS.white, marginTop: 16, fontSize: 15, fontWeight: '500' }}>
          Loading module content...
        </Text>
      </View>
    );
  }

  // If no videos, show loading while auto-navigating
  if (moduleVideos.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: BRAND_COLORS.black, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
        <Text style={{ color: BRAND_COLORS.white, marginTop: 16, fontSize: 15, fontWeight: '500' }}>
          Skipping to next step...
        </Text>
      </View>
    );
  }

  const moduleName = moduleContent?.moduleName || currentModule?.moduleName || `Module ${currentModule?.moduleNumber || ''}`;

  return (
    <View style={{ flex: 1, backgroundColor: BRAND_COLORS.black }}>
      <StatusBar hidden />
      
      {/* Vertical Video List */}
      <FlatList
        ref={flatListRef}
        data={moduleVideos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        disableIntervalMomentum
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={1}
        extraData={currentIndex}
      />

      {/* Header with Close Button */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 16,
          left: 20,
          zIndex: 10000,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: BRAND_COLORS.overlay,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <X size={22} color={BRAND_COLORS.white} strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Action Buttons (shown on last video) */}
      {currentIndex === moduleVideos.length - 1 && currentModule && !currentModule.completed ? (
        <View
          style={{
            position: 'absolute',
            bottom: insets.bottom + 24,
            left: 20,
            right: 20,
            zIndex: 10000,
            gap: 12,
            paddingBottom: 8, // Extra padding to ensure visibility
          }}
        >
          {/* Quiz Button (if quiz exists) */}
          {moduleContent?.quiz && (
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/chef/onboarding/course/${courseId}/module/${moduleId}/quiz`)}
              activeOpacity={0.8}
              style={{
                backgroundColor: BRAND_COLORS.primary,
                paddingVertical: 18,
                paddingHorizontal: 24,
                borderRadius: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                shadowColor: BRAND_COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Text 
                style={{ 
                  color: BRAND_COLORS.white, 
                  fontSize: 17, 
                  fontWeight: '700',
                  letterSpacing: 0.3,
                }}
              >
                Continue to Quiz
              </Text>
              <ChevronRight size={20} color={BRAND_COLORS.white} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
          
          {/* Complete Button (if no quiz or quiz already passed) */}
          {(!moduleContent?.quiz || (currentModule.quizScore && currentModule.quizScore >= (moduleContent.quiz.passingScore || 80))) && (
            <TouchableOpacity
              onPress={handleCompleteModule}
              activeOpacity={0.8}
              style={{
                backgroundColor: BRAND_COLORS.primary,
                paddingVertical: 18,
                paddingHorizontal: 24,
                borderRadius: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                shadowColor: BRAND_COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <CheckCircle size={22} color={BRAND_COLORS.white} strokeWidth={2.5} />
              <Text 
                style={{ 
                  color: BRAND_COLORS.white, 
                  fontSize: 17, 
                  fontWeight: '700',
                  letterSpacing: 0.3,
                }}
              >
                Complete Module
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Swipe indicator */}
      {moduleVideos.length > 1 && currentIndex < moduleVideos.length - 1 && (
        <View
          style={{
            position: 'absolute',
            bottom: insets.bottom + 180, // Moved higher to avoid overlap with video overlay
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 10000,
          }}
        >
          <View
            style={{
              backgroundColor: BRAND_COLORS.overlay,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Text
              style={{
                color: BRAND_COLORS.textSecondary,
                fontSize: 13,
                fontWeight: '500',
              }}
            >
              Swipe up for next video
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

