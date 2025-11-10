import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  useGetVideoFeedQuery,
  useLikeVideoMutation,
  useUnlikeVideoMutation,
  useShareVideoMutation,
  useRecordVideoViewMutation,
  useAddToCartMutation,
} from '@/store/customerApi';
import { VideoPost } from '@/types/customer';
import { MealData, NoshHeavenPlayer } from './NoshHeavenPlayer';
import { NoshHeavenErrorBoundary } from './ErrorBoundary';
import {
  showError,
  showSuccess,
  showWarning,
} from '../../lib/GlobalToastManager';
import { navigateToSignIn } from '../../utils/signInNavigationGuard';

interface NoshHeavenModalProps {
  onClose: () => void;
}

// Transform VideoPost to MealData format
const transformVideoToMeal = (video: VideoPost): MealData => {
  return {
    id: video._id,
    videoSource: video.videoUrl || '',
    title: video.title,
    description: video.description || '',
    kitchenName: video.creator.name,
    price: '', // Videos don't have prices
    chef: video.creator.name,
    likes: video.likesCount,
    comments: video.commentsCount,
  };
};

export function NoshHeavenModal({ onClose }: NoshHeavenModalProps) {
  const router = useRouter();
  const { isAuthenticated, token, checkTokenExpiration, refreshAuthState } = useAuthContext();
  const [noshHeavenMeals, setNoshHeavenMeals] = useState<MealData[]>([]);
  const [videoCursor, setVideoCursor] = useState<string | undefined>(undefined);

  // Nosh Heaven video hooks
  const {
    data: videoFeedData,
    isLoading: isLoadingVideos,
    error: videoFeedError,
    refetch: refetchVideos,
  } = useGetVideoFeedQuery(
    { limit: 20, cursor: videoCursor },
    { skip: false } // Always fetch when modal is open
  );

  const [likeVideo] = useLikeVideoMutation();
  const [unlikeVideo] = useUnlikeVideoMutation();
  const [shareVideo] = useShareVideoMutation();
  const [recordVideoView] = useRecordVideoViewMutation();
  const [addToCart] = useAddToCartMutation();

  // Transform video feed data to meal format
  useEffect(() => {
    if (videoFeedData?.success && videoFeedData.data?.videos) {
      const transformedMeals = videoFeedData.data.videos.map(transformVideoToMeal);
      if (videoCursor) {
        // Append for pagination
        setNoshHeavenMeals((prev) => [...prev, ...transformedMeals]);
      } else {
        // Replace for initial load
        setNoshHeavenMeals(transformedMeals);
      }
      // Update cursor for next page
      if (videoFeedData.data.nextCursor) {
        setVideoCursor(videoFeedData.data.nextCursor);
      }
    }
  }, [videoFeedData, videoCursor]);

  // Handle video feed errors
  useEffect(() => {
    if (videoFeedError) {
      showError('Failed to load videos', 'Please try again');
    }
  }, [videoFeedError]);

  // Reset video state when modal closes
  useEffect(() => {
    return () => {
      setNoshHeavenMeals([]);
      setVideoCursor(undefined);
    };
  }, []);

  // Load more meals for Nosh Heaven
  const handleLoadMoreMeals = useCallback(() => {
    // Trigger next page load if cursor is available
    if (videoCursor && !isLoadingVideos) {
      // Cursor is already set, refetch will use it automatically
      refetchVideos();
    }
  }, [videoCursor, isLoadingVideos, refetchVideos]);

  // Handle meal interactions
  const handleMealLike = useCallback(
    async (mealId: string) => {
      if (!isAuthenticated) {
        showWarning('Authentication Required', 'Please sign in to like videos');
        navigateToSignIn();
        return;
      }

      try {
        const video = noshHeavenMeals.find((m) => m.id === mealId);
        if (!video) return;

        // Check if already liked (optimistic)
        const isLiked = video.likes > 0; // Simple check, could be improved with actual like state

        // Optimistically update UI
        setNoshHeavenMeals((prev) =>
          prev.map((meal) =>
            meal.id === mealId
              ? { ...meal, likes: isLiked ? Math.max(0, meal.likes - 1) : meal.likes + 1 }
              : meal
          )
        );

        if (isLiked) {
          await unlikeVideo({ videoId: mealId }).unwrap();
        } else {
          await likeVideo({ videoId: mealId }).unwrap();
        }
      } catch (error) {
        // Revert optimistic update on error
        setNoshHeavenMeals((prev) =>
          prev.map((meal) =>
            meal.id === mealId
              ? { ...meal, likes: Math.max(0, meal.likes - 1) }
              : meal
          )
        );
        showError('Failed to like video', 'Please try again');
      }
    },
    [isAuthenticated, noshHeavenMeals, likeVideo, unlikeVideo]
  );

  const handleMealComment = useCallback(
    (mealId: string) => {
      // Navigate to comments screen or open comment modal
      router.push({
        pathname: '/meal-comments',
        params: { mealId },
      });
    },
    [router]
  );

  const handleMealShare = useCallback(
    async (mealId: string) => {
      try {
        await shareVideo({ videoId: mealId }).unwrap();
        showSuccess('Video shared!', 'Thanks for sharing');
      } catch (error) {
        showError('Failed to share video', 'Please try again');
      }
    },
    [shareVideo]
  );

  // Handle video view tracking
  const handleVideoView = useCallback(
    async (mealId: string, watchDuration: number, completionRate: number) => {
      try {
        await recordVideoView({
          videoId: mealId,
          watchDuration,
          completionRate,
          deviceInfo: {
            type: 'mobile',
            os: 'iOS', // Could be dynamic
          },
        }).unwrap();
      } catch (error) {
        // Silently fail view tracking
        console.warn('Failed to record video view:', error);
      }
    },
    [recordVideoView]
  );

  const handleAddToCart = useCallback(
    async (mealId: string) => {
      // Check authentication and token validity
      if (!isAuthenticated || !token) {
        showWarning(
          'Authentication Required',
          'Please sign in to add items to cart'
        );
        navigateToSignIn();
        return;
      }

      // Check if token is expired and refresh auth state if needed
      const isExpired = checkTokenExpiration();
      if (isExpired) {
        // Refresh auth state to update isAuthenticated
        await refreshAuthState();
        showWarning(
          'Session Expired',
          'Please sign in again to add items to cart'
        );
        navigateToSignIn();
        return;
      }

      try {
        const result = await addToCart({
          dish_id: mealId,
          quantity: 1,
          special_instructions: undefined,
        }).unwrap();

        if (result.success) {
          showSuccess('Added to Cart!', result.data.dish_name);
        }
      } catch {
        showError('Failed to add item to cart', 'Please try again');
      }
    },
    [isAuthenticated, token, checkTokenExpiration, refreshAuthState, addToCart]
  );

  const handleKitchenPress = useCallback(
    (kitchenName: string) => {
      // Navigate to kitchen profile or main screen
      // For now, we'll just close and navigate - could be improved
      onClose();
      // Could navigate to kitchen detail page if needed
    },
    [onClose]
  );

  return (
    <NoshHeavenErrorBoundary>
      <NoshHeavenPlayer
        isVisible={true}
        meals={noshHeavenMeals}
        onClose={onClose}
        onLoadMore={handleLoadMoreMeals}
        onMealLike={handleMealLike}
        onMealComment={handleMealComment}
        onMealShare={handleMealShare}
        onAddToCart={handleAddToCart}
        onKitchenPress={handleKitchenPress}
      />
    </NoshHeavenErrorBoundary>
  );
}

