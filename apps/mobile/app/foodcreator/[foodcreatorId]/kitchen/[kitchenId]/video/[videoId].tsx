import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useRef, useEffect, useState } from 'react';
import { getSessionToken } from '@/lib/convexClient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Id } from '@/convex/_generated/dataModel';

export default function KitchenVideoPage() {
  const { videoId } = useLocalSearchParams<{
    foodcreatorId: string;
    kitchenId: string;
    videoId: string;
  }>();
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Load session token
  useEffect(() => {
    const loadToken = async () => {
      const token = await getSessionToken();
      setSessionToken(token);
    };
    loadToken();
  }, []);
  
  // Fetch video data from Convex
  const videoData = useQuery(
    api.queries.videoPosts.getVideoById,
    videoId ? { videoId: videoId as Id<'videoPosts'>, sessionToken: sessionToken || undefined } : "skip"
  );

  const isLoading = videoData === undefined;
  const videoError = videoData === null && !isLoading ? new Error('Video not found') : null;

  const handleBack = () => {
    router.back();
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      // Handle playback status updates
      if (status.didJustFinish) {
        // Video finished playing
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if ((videoError || !videoData) && !isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color="#000" />
        </Pressable>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load video</Text>
          <Text style={styles.errorText}>
            {videoError ? 'Failed to load video' : 'Video not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back Button */}
      <Pressable style={styles.backButton} onPress={handleBack}>
        <ChevronLeft size={24} color="#fff" />
      </Pressable>

      {/* Video Player */}
      {videoData.videoUrl ? (
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoData.videoUrl }}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          useNativeControls
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
      ) : (
        <View style={styles.videoPlaceholder}>
          <Text style={styles.placeholderText}>Video URL not available</Text>
        </View>
      )}

      {/* Video Info Overlay */}
      {videoData && (
        <View style={styles.infoOverlay}>
          <Text style={styles.videoTitle}>{videoData.title}</Text>
          {videoData.description && (
            <Text style={styles.videoDescription}>{videoData.description}</Text>
          )}
          {videoData.creator && (
            <Text style={styles.creatorName}>by {videoData.creator.name}</Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  videoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    opacity: 0.9,
  },
  creatorName: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
});

