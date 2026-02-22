import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { useCart } from '@/hooks/useCart';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { VideoPost } from '@/types/customer';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Share } from 'react-native';
import { useFeatureFlag } from '../../context/FeatureFlagContext';
import {
  showError,
  showSuccess,
  showWarning,
} from '../../lib/GlobalToastManager';
import { navigateToSignIn } from '../../utils/signInNavigationGuard';
import { NoshHeavenErrorBoundary } from './ErrorBoundary';
import { MealData, NoshHeavenPlayer } from './NoshHeavenPlayer';

interface NoshHeavenModalProps {
  onClose: () => void;
}

// Transform VideoPost to MealData format
const transformVideoToMeal = (video: VideoPost): MealData => {
  // Format price if meal is linked, otherwise empty string (will hide price and button)
  let price = '';
  if ((video as any).mealPrice && typeof (video as any).mealPrice === 'number') {
    // Convert cents to pounds
    price = `£${((video as any).mealPrice / 100).toFixed(2)}`;
  }

  return {
    id: video._id,
    videoSource: video.videoUrl || '',
    title: video.title,
    description: video.description || '',
    foodCreatorName: video.creator.name,
    price,
    likes: video.likesCount,
    comments: video.commentsCount,
    mealId: (video as any).mealId, // Include mealId if video is linked to a meal
  };
};

export function NoshHeavenModal({ onClose }: NoshHeavenModalProps) {
  const router = useRouter();
  const { isAuthenticated, token, checkTokenExpiration, refreshAuthState } = useAuthContext();
  const { isEnabled } = useFeatureFlag();
  const [noshHeavenMeals, setNoshHeavenMeals] = useState<MealData[]>([]);
  const [videoCursor, setVideoCursor] = useState<string | undefined>(undefined);

  // Video feed state
  const [videoFeedData, setVideoFeedData] = useState<any>(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videoFeedError, setVideoFeedError] = useState<any>(null);

  // Fetch video feed from Convex
  const fetchVideoFeed = useCallback(async () => {
    if (!isAuthenticated) return;


    // Feature Flag Check: Community Feed (Phase 3)
    if (!isEnabled('ENABLE_COMMUNITY_FEED')) {
      setVideoFeedData({ success: true, data: { videos: [], nextCursor: undefined } });
      return;
    }

    try {
      setIsLoadingVideos(true);
      setVideoFeedError(null);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        return;
      }

      const result = await convex.action(api.actions.search.customerGetVideoFeed, {
        sessionToken,
        limit: 20,
        cursor: videoCursor,
      });

      if (result.success === false) {
        setVideoFeedError(new Error(result.error || 'Failed to fetch video feed'));
        return;
      }

      // Transform to match expected format
      setVideoFeedData({
        success: true,
        data: {
          videos: result.videos || [],
          nextCursor: result.nextCursor,
        },
      });
    } catch (error: any) {
      setVideoFeedError(error);
      console.error('Error fetching video feed:', error);
    } finally {
      setIsLoadingVideos(false);
    }
  }, [isAuthenticated, videoCursor]);

  useEffect(() => {
    fetchVideoFeed();
  }, [fetchVideoFeed]);

  const refetchVideos = fetchVideoFeed;
  const { addToCart: addToCartAction } = useCart();

  // Video interaction functions using Convex
  const likeVideo = useCallback(async ({ videoId }: { videoId: string }) => {
    const convex = getConvexClient();
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
      throw new Error('Not authenticated');
    }

    const result = await convex.action(api.actions.search.customerLikeVideo, {
      sessionToken,
      videoId,
    });

    if (result.success === false) {
      throw new Error(result.error || 'Failed to like video');
    }

    return { success: true, data: result };
  }, []);

  const unlikeVideo = useCallback(async ({ videoId }: { videoId: string }) => {
    const convex = getConvexClient();
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
      throw new Error('Not authenticated');
    }

    const result = await convex.action(api.actions.search.customerUnlikeVideo, {
      sessionToken,
      videoId,
    });

    if (result.success === false) {
      throw new Error(result.error || 'Failed to unlike video');
    }

    return { success: true, data: result };
  }, []);

  const shareVideo = useCallback(async ({ videoId }: { videoId: string }) => {
    const convex = getConvexClient();
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
      throw new Error('Not authenticated');
    }

    const result = await convex.action(api.actions.search.customerShareVideo, {
      sessionToken,
      videoId,
      platform: 'internal',
    });

    if (result.success === false) {
      throw new Error(result.error || 'Failed to share video');
    }

    return { success: true, data: result };
  }, []);

  const recordVideoView = useCallback(async ({ videoId, watchDuration, completionRate, deviceInfo }: {
    videoId: string;
    watchDuration: number;
    completionRate: number;
    deviceInfo?: { type: string; os: string };
  }) => {
    const convex = getConvexClient();
    const sessionToken = await getSessionToken();

    // Note: sessionToken can be undefined for anonymous views
    const result = await convex.action(api.actions.search.customerRecordVideoView, {
      sessionToken: sessionToken || '',
      videoId,
      watchDuration,
      completionRate,
      deviceInfo,
    });

    if (result.success === false) {
      throw new Error(result.error || 'Failed to record video view');
    }

    return { success: true, data: result };
  }, []);

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

  // Error state is shown in UI - no toast needed

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
          await unlikeVideo({ videoId: mealId });
        } else {
          await likeVideo({ videoId: mealId });
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

  const handleMealShare = useCallback(
    async (mealId: string) => {
      try {
        const meal = noshHeavenMeals.find((m) => m.id === mealId);
        if (!meal) return;

        // Create share message
        const shareMessage = `Check out this video: ${meal.title}\n\n${meal.videoSource}`;

        // Use native share sheet
        const result = await Share.share({
          message: shareMessage,
          title: meal.title,
        });

        // Record share in backend if authenticated and share was successful
        if (isAuthenticated && result.action === Share.sharedAction) {
          try {
            await shareVideo({ videoId: mealId });
          } catch (error) {
            // Silently fail - share was successful even if backend recording fails
            console.error('Failed to record share:', error);
          }
        }
      } catch (error: any) {
        showError('Failed to share video', error?.message || 'Please try again');
      }
    },
    [noshHeavenMeals, isAuthenticated, shareVideo]
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
        });
      } catch (error) {
        // Silently fail view tracking
        console.warn('Failed to record video view:', error);
      }
    },
    [recordVideoView]
  );

  const handleAddToCart = useCallback(
    async (mealId: string) => {
      // Find the meal data to get mealId (the actual meal ID, not video ID)
      const meal = noshHeavenMeals.find((m) => m.id === mealId);
      if (!meal?.mealId) {
        showError('Cannot add to cart', 'This video is not linked to a meal');
        return;
      }

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
        const result = await addToCartAction(meal.mealId, 1);

        if (result.success) {
          showSuccess('Added to Cart!', result.data.item?.name || meal.title);
        }
      } catch {
        showError('Failed to add item to cart', 'Please try again');
      }
    },
    [noshHeavenMeals, isAuthenticated, token, checkTokenExpiration, refreshAuthState, addToCartAction]
  );

  const handleFoodCreatorPress = useCallback(
    (foodCreatorName: string) => {
      // Navigate to foodCreator profile or main screen
      // For now, we'll just close and navigate - could be improved
      onClose();
      // Could navigate to foodCreator detail page if needed
    },
    [onClose]
  );

  return (
    <>
      <NoshHeavenErrorBoundary>
        <NoshHeavenPlayer
          isVisible={true}
          meals={noshHeavenMeals}
          onClose={onClose}
          onLoadMore={handleLoadMoreMeals}
          onMealLike={handleMealLike}
          onMealShare={handleMealShare}
          onAddToCart={handleAddToCart}
          onFoodCreatorPress={handleFoodCreatorPress}
        />
      </NoshHeavenErrorBoundary>
    </>
  );
}

