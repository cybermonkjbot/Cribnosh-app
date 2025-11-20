import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Pressable, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
      <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' }}>
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
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            paddingBottom: insets.bottom + 20,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={{ color: '#fff', fontSize: 14, opacity: 0.9 }}>
              {item.description}
            </Text>
          )}
        </View>

        {/* Progress indicator */}
        {currentModule && (
          <View
            style={{
              position: 'absolute',
              top: insets.top + 60,
              left: 20,
              right: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <View style={{ flex: 1, height: 4, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 2 }}>
              <View
                style={{
                  width: `${((index + 1) / moduleVideos.length) * 100}%`,
                  height: '100%',
                  backgroundColor: '#fff',
                  borderRadius: 2,
                }}
              />
            </View>
            <Text style={{ color: '#fff', fontSize: 12 }}>
              {index + 1} / {moduleVideos.length}
            </Text>
          </View>
        )}
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
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Loading module content...</Text>
      </View>
    );
  }

  // If no videos, show loading while auto-navigating
  if (moduleVideos.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar hidden />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Skipping to next step...</Text>
      </View>
    );
  }

  const moduleName = moduleContent?.moduleName || currentModule?.moduleName || `Module ${currentModule?.moduleNumber || ''}`;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
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

      {/* Close Button */}
      <Pressable
        onPress={() => router.back()}
        style={{
          position: 'absolute',
          top: insets.top + 16,
          left: 20,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}
      >
        <X size={24} color="#fff" />
      </Pressable>

      {/* Module Info */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 16,
          right: 20,
          zIndex: 10000,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
          {moduleName}
        </Text>
      </View>

      {/* Action Buttons (shown on last video) */}
      {currentIndex === moduleVideos.length - 1 && currentModule && !currentModule.completed && (
        <View
          style={{
            position: 'absolute',
            bottom: insets.bottom + 100,
            left: 20,
            right: 20,
            zIndex: 10000,
            gap: 12,
          }}
        >
          {/* Quiz Button (if quiz exists) - Auto-navigate after a short delay */}
          {moduleContent?.quiz && (
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/chef/onboarding/course/${courseId}/module/${moduleId}/quiz`)}
              style={{
                backgroundColor: '#007AFF',
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                Continue to Quiz
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Complete Button (if no quiz or quiz already passed) */}
          {(!moduleContent?.quiz || (currentModule.quizScore && currentModule.quizScore >= (moduleContent.quiz.passingScore || 80))) && (
            <TouchableOpacity
              onPress={handleCompleteModule}
              style={{
                backgroundColor: '#4CAF50',
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <CheckCircle size={20} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                Complete Module
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Swipe indicator */}
      {moduleVideos.length > 1 && (
        <View
          style={{
            position: 'absolute',
            top: insets.top + 70,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 10000,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 14,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            Swipe up for next video
          </Text>
        </View>
      )}
    </View>
  );
}

