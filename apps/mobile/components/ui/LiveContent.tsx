import { LinearGradient } from "expo-linear-gradient";
import { BookOpen, Clock, Eye, Radio, Video } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import {
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import LiveScreenView from "./LiveViewerScreen";
import { MealData, NoshHeavenPlayer } from "./NoshHeavenPlayer";
import { RecipeDetailScreen } from "./RecipeDetailScreen";
import { StoryDetailScreen } from "./StoryDetailScreen";

// Customer API imports
import { api } from "@/convex/_generated/api";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { LiveStream } from "@/types/customer";
import { useQuery } from "convex/react";

// Global toast imports
import { showInfo, showWarning, showSuccess, showError } from "../../lib/GlobalToastManager";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { navigateToSignIn } from "@/utils/signInNavigationGuard";

interface LiveKitchen {
  id: string;
  name: string;
  cuisine: string;
  viewers: number;
  isLive: boolean;
  image: string;
  description: string;
  chef: string;
}


export type NoshHeavenCategory = 'all' | 'recipes' | 'stories' | 'live';

interface LiveContentProps {
  scrollViewRef?: React.RefObject<any>;
  scrollY?: SharedValue<number>;
  isHeaderSticky?: boolean;
  contentFadeAnim?: SharedValue<number>;
  refreshing?: boolean;
  onRefresh?: () => void;
  onScroll?: (event: any) => void;
  activeCategory?: NoshHeavenCategory;
  onCategoryChange?: (category: NoshHeavenCategory) => void;
}

// Memoized Kitchen Card Component to prevent unnecessary re-renders
const KitchenCard = React.memo(({ 
  kitchen, 
  onPress, 
  formatNumber 
}: { 
  kitchen: LiveKitchen; 
  onPress: (kitchen: LiveKitchen) => void;
  formatNumber: (num: number) => string;
}) => (
  <TouchableOpacity
    style={styles.kitchenCard}
    onPress={() => onPress(kitchen)}
    activeOpacity={0.8}
  >
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: kitchen.image }}
        style={styles.kitchenImage}
        contentFit="cover"
      />
      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      <View style={styles.viewersContainer}>
        <Eye size={16} color="#fff" style={styles.eyeIcon} />
        <Text style={styles.viewersText}>
          {formatNumber(kitchen.viewers)}
        </Text>
      </View>
    </View>

    <View style={styles.kitchenInfo}>
      <Text style={styles.kitchenName}>{kitchen.name}</Text>
      <Text style={styles.kitchenCuisine}>
        {kitchen.cuisine}
      </Text>
      <Text style={styles.kitchenDescription}>
        {kitchen.description}
      </Text>
    </View>
  </TouchableOpacity>
));

KitchenCard.displayName = 'KitchenCard';

// Recipe Card Component - Distinct styling with recipe icon
const RecipeCard = React.memo(({ 
  recipe, 
  onPress,
  onVideoPress,
  hasVideo
}: { 
  recipe: any; 
  onPress: (recipeId: string) => void;
  onVideoPress?: (videoId: string) => void;
  hasVideo?: boolean;
}) => (
  <TouchableOpacity
    style={styles.recipeCard}
    onPress={() => {
      if (hasVideo && recipe.videoId && onVideoPress) {
        onVideoPress(recipe.videoId);
      } else {
        onPress(recipe._id);
      }
    }}
    activeOpacity={0.8}
  >
    <View style={styles.recipeImageContainer}>
      {recipe.featuredImage ? (
        <Image
          source={{ uri: recipe.featuredImage }}
          style={styles.recipeImage}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.recipeImage, { backgroundColor: '#F3F4F6' }]} />
      )}
      <View style={styles.recipeBadge}>
        <BookOpen size={12} color="#FF3B30" />
      </View>
      {hasVideo && (
        <View style={styles.recipeVideoIndicator}>
          <Video size={14} color="#fff" fill="#fff" />
        </View>
      )}
      <View style={styles.recipeMeta}>
        <View style={styles.recipeMetaItem}>
          <Clock size={10} color="#6B7280" />
          <Text style={styles.recipeMetaText}>
            {recipe.prepTime + recipe.cookTime}min
          </Text>
        </View>
      </View>
    </View>
    <View style={styles.recipeInfo}>
      <Text style={styles.recipeTitle} numberOfLines={2}>
        {recipe.title}
      </Text>
      <Text style={styles.recipeCuisine}>{recipe.cuisine}</Text>
    </View>
  </TouchableOpacity>
));

RecipeCard.displayName = 'RecipeCard';

// Story Card Component - Distinct styling with story icon
const StoryCard = React.memo(({ 
  story, 
  onPress,
  onVideoPress,
  hasVideo
}: { 
  story: any; 
  onPress: (storyId: string) => void;
  onVideoPress?: (videoId: string) => void;
  hasVideo?: boolean;
}) => (
  <TouchableOpacity
    style={styles.storyCard}
    onPress={() => {
      if (hasVideo && story.videoId && onVideoPress) {
        onVideoPress(story.videoId);
      } else {
        onPress(story._id);
      }
    }}
    activeOpacity={0.8}
  >
    <View style={styles.storyImageContainer}>
      {(story.coverImage || story.featuredImage) ? (
        <Image
          source={{ uri: story.coverImage || story.featuredImage }}
          style={styles.storyImage}
          contentFit="cover"
          onError={() => {
            console.log('Failed to load story image:', story.coverImage || story.featuredImage);
          }}
        />
      ) : (
        <View style={[styles.storyImage, { backgroundColor: '#F3F4F6' }]} />
      )}
      <View style={styles.storyBadge}>
        <Text style={styles.storyBadgeText}>STORY</Text>
      </View>
      {hasVideo && (
        <View style={styles.storyVideoIndicator}>
          <Video size={14} color="#fff" fill="#fff" />
        </View>
      )}
    </View>
    <View style={styles.storyInfo}>
      <Text style={styles.storyTitle} numberOfLines={2}>
        {story.title}
      </Text>
      <Text style={styles.storyAuthor} numberOfLines={1}>
        {typeof story.author === 'string' ? story.author : story.author?.name || 'Unknown'}
      </Text>
    </View>
  </TouchableOpacity>
));

StoryCard.displayName = 'StoryCard';

// Video Card Component - Distinct styling with video icon
const VideoCard = React.memo(({ 
  video, 
  onPress 
}: { 
  video: any; 
  onPress: (video: any) => void;
}) => (
  <TouchableOpacity
    style={styles.videoCard}
    onPress={() => onPress(video)}
    activeOpacity={0.8}
  >
    <View style={styles.videoImageContainer}>
      {video.thumbnailUrl ? (
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={styles.videoImage}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.videoImage, { backgroundColor: '#F3F4F6' }]} />
      )}
      <View style={styles.videoPlayButton}>
        <Video size={16} color="#fff" fill="#fff" />
      </View>
    </View>
    <View style={styles.videoInfo}>
      <Text style={styles.videoTitle} numberOfLines={2}>
        {video.title}
      </Text>
      {video.creator && (
        <Text style={styles.videoCreator} numberOfLines={1}>
          {video.creator.name}
        </Text>
      )}
    </View>
  </TouchableOpacity>
));

VideoCard.displayName = 'VideoCard';

// Skeleton Card Component for loading states
const SkeletonCard = React.memo(() => {
  const shimmerOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  const shimmerOpacityInterpolated = useDerivedValue(() => {
    return interpolate(
      shimmerOpacity.value,
      [0.3, 1, 0.3],
      [0.3, 0.7, 0.3]
    );
  });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacityInterpolated.value,
  }));

  return (
    <View style={styles.kitchenCard}>
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        <View style={[styles.kitchenImage, { backgroundColor: 'rgba(156, 163, 175, 0.3)' }]} />
      </Animated.View>
      <View style={styles.kitchenInfo}>
        <Animated.View style={[{ marginBottom: 6, overflow: 'hidden' }, animatedStyle]}>
          <View style={{ height: 14, backgroundColor: 'rgba(156, 163, 175, 0.3)', borderRadius: 4, width: '80%', marginBottom: 4 }} />
          <View style={{ height: 14, backgroundColor: 'rgba(156, 163, 175, 0.3)', borderRadius: 4, width: '60%' }} />
        </Animated.View>
        <Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
          <View style={{ height: 11, backgroundColor: 'rgba(156, 163, 175, 0.3)', borderRadius: 4, width: '40%' }} />
        </Animated.View>
      </View>
    </View>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

// Skeleton Grid Component
const SkeletonGrid = React.memo(({ count = 6 }: { count?: number }) => (
  <View style={styles.kitchensContainer}>
    <View style={styles.kitchensGrid}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  </View>
));

SkeletonGrid.displayName = 'SkeletonGrid';

export default function LiveContent({
  scrollViewRef: externalScrollViewRef,
  scrollY: externalScrollY,
  isHeaderSticky: externalIsHeaderSticky,
  contentFadeAnim: externalContentFadeAnim,
  refreshing: externalRefreshing,
  onRefresh: externalOnRefresh,
  onScroll: externalOnScroll,
  activeCategory: externalActiveCategory = 'all',
  onCategoryChange: externalOnCategoryChange,
}: LiveContentProps) {
  const [refreshing, setRefreshing] = useState(externalRefreshing || false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(
    externalIsHeaderSticky || false
  );
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedKitchen, setSelectedKitchen] = useState<LiveKitchen | null>(null);
  const [activeCategory, setActiveCategory] = useState<NoshHeavenCategory>(externalActiveCategory);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoPlayerMeals, setVideoPlayerMeals] = useState<MealData[]>([]);
  const [videoPlayerStartIndex, setVideoPlayerStartIndex] = useState(0);
  
  // Auth and cart hooks
  const { isAuthenticated, token, checkTokenExpiration, refreshAuthState } = useAuthContext();
  const { addToCart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Sync internal state with external prop
  useEffect(() => {
    setActiveCategory(externalActiveCategory);
  }, [externalActiveCategory]);
  const internalScrollViewRef = useRef<any>(null);
  const scrollViewRef = externalScrollViewRef || internalScrollViewRef;
  const internalContentFadeAnim = useRef({ value: 1 });
  const contentFadeAnim =
    externalContentFadeAnim || internalContentFadeAnim.current;

  // Live streams state (still using action since it requires auth)
  const [liveStreamsData, setLiveStreamsData] = useState<any>(null);
  const [liveStreamsError, setLiveStreamsError] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoadingSessionToken, setIsLoadingSessionToken] = useState(true);

  // Load session token for live streams
  useEffect(() => {
    const loadToken = async () => {
      setIsLoadingSessionToken(true);
      const token = await getSessionToken();
      setSessionToken(token);
      setIsLoadingSessionToken(false);
    };
    loadToken();
  }, []);

  // Fetch live streams from Convex (using action since it requires auth)
  useEffect(() => {
    const fetchLiveStreams = async () => {
      if (!isAuthenticated || !sessionToken) return;

      try {
        setLiveStreamsError(null);
        const convex = getConvexClient();

        const result = await convex.action(api.actions.liveStreaming.customerGetLiveStreams, {
          sessionToken,
          page: 1,
          limit: 20,
        });

        if (result.success === false) {
          setLiveStreamsError(new Error(result.error || 'Failed to fetch live streams'));
          return;
        }

        // Transform to match expected format
        setLiveStreamsData({
          success: true,
          data: result.streams || [],
        });
      } catch (error: any) {
        setLiveStreamsError(error);
        console.error('Error fetching live streams:', error);
      }
    };

    fetchLiveStreams();
  }, [isAuthenticated, sessionToken]);

  // Reactive queries for recipes, stories, and videos
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  const recipesData = useQuery(
    api.queries.recipes.getRecipes,
    (activeCategory === 'recipes' || activeCategory === 'all') ? { limit: 20 } : "skip"
  );

  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  const storiesData = useQuery(
    api.queries.blog.getBlogPosts,
    (activeCategory === 'stories' || activeCategory === 'all') ? { limit: 20, status: 'published' } : "skip"
  );

  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  const videosData = useQuery(
    api.queries.videoPosts.getVideoFeed,
    (activeCategory === 'stories' || activeCategory === 'all') ? { limit: 20 } : "skip" // Videos are shown in stories category and all
  );

  // Transform API live streams to component format
  const transformLiveStreamsData = useCallback((apiStreams: LiveStream[]) => {
    return apiStreams.map((stream) => ({
      id: stream.id,
      name: stream.kitchen_name,
      cuisine: "Live Cooking", // Default cuisine since API doesn't provide it
      viewers: stream.viewer_count,
      isLive: stream.is_live,
      image:
        stream.thumbnail_url ||
        "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop",
      description: stream.description || "Live cooking session",
      chef: stream.chef_name,
    }));
  }, []);

  // Process live streams data from API
  const liveKitchens = useMemo(() => {
    if (liveStreamsData?.success && liveStreamsData.data && isAuthenticated) {
      const transformedData = transformLiveStreamsData(liveStreamsData.data);
      // Show success toast when live streams are loaded
      if (transformedData.length > 0) {
        showInfo(
          `Found ${transformedData.length} live streams`,
          "Live Content"
        );
      }
      return transformedData;
    }

    // Return empty array when not authenticated or no API results
    return [];
  }, [liveStreamsData, isAuthenticated, transformLiveStreamsData]);

  // Error state is shown in UI - no toast needed

  const handleKitchenPress = useCallback((kitchen: LiveKitchen) => {
    // Pass session ID and kitchen data when opening live viewer
    setSelectedSessionId(kitchen.id);
    setSelectedKitchen(kitchen);
    setShowLiveModal(true);
  }, []);

  const handleCloseLiveModal = useCallback(() => {
    setShowLiveModal(false);
    setSelectedSessionId(null);
    setSelectedKitchen(null);
  }, []);

  // Function to format numbers to K, M format
  const formatNumber = useCallback((num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  }, []);

  const filteredKitchens = useMemo(() => {
    return liveKitchens.filter((kitchen) => {
      // For now, show all kitchens since we removed the category filter
      return true;
    });
  }, [liveKitchens]);

  const handleRefresh = useCallback(async () => {
    if (externalOnRefresh) {
      externalOnRefresh();
    } else {
      setRefreshing(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setRefreshing(false);
    }
  }, [externalOnRefresh]);

  const handleScroll = useCallback(
    (event: any) => {
      if (externalOnScroll) {
        externalOnScroll(event);
      } else {
        const y = event.nativeEvent.contentOffset.y;
        setIsHeaderSticky(y > 0);
      }
    },
    [externalOnScroll]
  );

  const contentFadeStyle = useAnimatedStyle(() => {
    return {
      opacity: contentFadeAnim.value,
    };
  });

  const handleCategoryPress = useCallback((category: NoshHeavenCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(category);
    if (externalOnCategoryChange) {
      externalOnCategoryChange(category);
    }
  }, [externalOnCategoryChange]);

  // Transform video to MealData format for NoshHeavenPlayer
  const transformVideoToMealData = useCallback((video: any): MealData => {
    // Format price if meal is linked, otherwise empty string (will hide price and button)
    let price = '';
    if (video.mealPrice && typeof video.mealPrice === 'number') {
      // Convert cents to pounds
      price = `£${(video.mealPrice / 100).toFixed(2)}`;
    }
    
    return {
      id: video._id,
      videoSource: video.videoUrl || '',
      title: video.title,
      description: video.description || '',
      kitchenName: video.creator?.name || 'Unknown Chef',
      price,
      chef: video.creator?.name,
      likes: video.likesCount || 0,
      comments: video.commentsCount || 0,
      mealId: video.mealId, // Include mealId if video is linked to a meal
    };
  }, []);

  // Handle video press - open NoshHeavenPlayer
  const handleVideoPress = useCallback(async (videoId: string) => {
    try {
      const convex = getConvexClient();
      const video = await convex.query(api.queries.videoPosts.getVideoById, {
        videoId: videoId as any,
      });

      if (!video) {
        console.error('Video not found');
        return;
      }

      const mealData = transformVideoToMealData(video);
      setVideoPlayerMeals([mealData]);
      setVideoPlayerStartIndex(0);
      setShowVideoPlayer(true);
    } catch (error) {
      console.error('Error fetching video:', error);
    }
  }, [transformVideoToMealData]);

  // Handle video card press - open NoshHeavenPlayer with all videos
  const handleVideoCardPress = useCallback((video: any) => {
    // Get all videos for the feed
    const allVideos = videosData?.videos || [];
    const allMeals = allVideos.map(transformVideoToMealData);
    
    // Find the index of the clicked video
    const videoIndex = allMeals.findIndex((m: MealData) => m.id === video._id);
    
    setVideoPlayerMeals(allMeals);
    setVideoPlayerStartIndex(videoIndex >= 0 ? videoIndex : 0);
    setShowVideoPlayer(true);
  }, [videosData, transformVideoToMealData]);

  // Close video player
  const handleCloseVideoPlayer = useCallback(() => {
    setShowVideoPlayer(false);
    setVideoPlayerMeals([]);
    setVideoPlayerStartIndex(0);
  }, []);

  // Handle add to cart
  const handleAddToCart = useCallback(
    async (mealId: string) => {
      // Find the meal data to get mealId
      const meal = videoPlayerMeals.find((m) => m.id === mealId);
      if (!meal?.mealId) {
        showError('Cannot add to cart', 'This video is not linked to a meal');
        return;
      }

      // Prevent rapid clicks
      if (isAddingToCart) return;

      // Check authentication
      if (!isAuthenticated || !token) {
        showWarning('Authentication Required', 'Please sign in to add items to cart');
        navigateToSignIn();
        return;
      }

      // Check if token is expired
      const isExpired = checkTokenExpiration();
      if (isExpired) {
        await refreshAuthState();
        showWarning('Session Expired', 'Please sign in again to add items to cart');
        navigateToSignIn();
        return;
      }

      try {
        setIsAddingToCart(true);
        const result = await addToCart(meal.mealId, 1);
        if (result.success) {
          showSuccess('Added to Cart!', result.data?.item?.name || meal.title);
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to add item to cart';
        showError('Failed to add item to cart', errorMessage);
      } finally {
        setIsAddingToCart(false);
      }
    },
    [videoPlayerMeals, isAuthenticated, token, checkTokenExpiration, refreshAuthState, addToCart, isAddingToCart]
  );

  // Handle like video
  const handleLikeVideo = useCallback(
    async (videoId: string) => {
      if (!isAuthenticated) {
        showWarning('Authentication Required', 'Please sign in to like videos');
        navigateToSignIn();
        return;
      }

      try {
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          throw new Error('Not authenticated');
        }

        // Optimistically update UI
        setVideoPlayerMeals((prev) =>
          prev.map((meal) =>
            meal.id === videoId
              ? { ...meal, likes: meal.likes + 1 }
              : meal
          )
        );

        const result = await convex.action(api.actions.search.customerLikeVideo, {
          sessionToken,
          videoId,
        });

        if (result.success === false) {
          // Revert optimistic update
          setVideoPlayerMeals((prev) =>
            prev.map((meal) =>
              meal.id === videoId
                ? { ...meal, likes: Math.max(0, meal.likes - 1) }
                : meal
            )
          );
          throw new Error(result.error || 'Failed to like video');
        }
      } catch (error: any) {
        showError('Failed to like video', error?.message || 'Please try again');
      }
    },
    [isAuthenticated]
  );

  // Handle share video
  const handleShareVideo = useCallback(
    async (videoId: string) => {
      try {
        const meal = videoPlayerMeals.find((m) => m.id === videoId);
        if (!meal) return;

        // Create share message
        const shareMessage = `Check out this video: ${meal.title}\n\n${meal.videoSource}`;

        // Use native share sheet
        const result = await Share.share({
          message: shareMessage,
          title: meal.title,
        });

        // Record share in backend if authenticated
        if (isAuthenticated && result.action === Share.sharedAction) {
          try {
            const convex = getConvexClient();
            const sessionToken = await getSessionToken();
            if (sessionToken) {
              await convex.action(api.actions.search.customerShareVideo, {
                sessionToken,
                videoId,
                platform: 'other',
              });
            }
          } catch (error) {
            // Silently fail - share was successful even if backend recording fails
            console.error('Failed to record share:', error);
          }
        }
      } catch (error: any) {
        showError('Failed to share video', error?.message || 'Please try again');
      }
    },
    [videoPlayerMeals, isAuthenticated]
  );


  const renderContent = () => {
    switch (activeCategory) {
      case 'all':
        // Show all content types combined
        const isLoadingAll = (activeCategory === 'all' && recipesData === undefined) || 
                            (activeCategory === 'all' && storiesData === undefined) || 
                            (activeCategory === 'all' && videosData === undefined);
        const allRecipesForAll = recipesData?.recipes || [];
        const allStoriesForAll = storiesData || [];
        const allVideosForAll = videosData?.videos || [];
        const allLiveKitchensForAll = filteredKitchens || [];
        
        // Transform each content type with metadata
        const recipesWithType = allRecipesForAll.map((recipe: any) => ({ type: 'recipe', ...recipe }));
        const storiesWithType = allStoriesForAll.map((story: any) => ({ type: 'story', ...story }));
        const videosWithType = allVideosForAll.map((video: any) => ({ type: 'video', ...video }));
        const liveWithType = allLiveKitchensForAll.map((kitchen: any) => ({ type: 'live', ...kitchen }));
        
        // Interleave content types for better mixing
        const allContentArrays = [
          recipesWithType,
          storiesWithType,
          videosWithType,
          liveWithType,
        ].filter(arr => arr.length > 0); // Remove empty arrays
        
        const allContent: any[] = [];
        const maxLength = Math.max(
          recipesWithType.length,
          storiesWithType.length,
          videosWithType.length,
          liveWithType.length
        );
        
        // Round-robin mixing: take one from each array in turn
        for (let i = 0; i < maxLength; i++) {
          allContentArrays.forEach((arr) => {
            if (arr[i]) {
              allContent.push(arr[i]);
            }
          });
        }

        if (isLoadingAll) {
          return <SkeletonGrid count={6} />;
        }

        if (allContent.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateSubtitle}>
                Discover recipes, stories, videos, and live cooking sessions
              </Text>
            </View>
          );
        }

        return (
          <View style={styles.kitchensContainer}>
            <View style={styles.kitchensGrid}>
              {allContent.map((item: any) => {
                if (item.type === 'recipe') {
                  return (
                    <RecipeCard
                      key={`recipe-${item._id}`}
                      recipe={item}
                      onPress={(recipeId) => setSelectedRecipeId(recipeId)}
                      onVideoPress={handleVideoPress}
                      hasVideo={!!item.videoId}
                    />
                  );
                } else if (item.type === 'story') {
                  return (
                    <StoryCard
                      key={`story-${item._id}`}
                      story={item}
                      onPress={(storyId) => setSelectedStoryId(storyId)}
                      onVideoPress={handleVideoPress}
                      hasVideo={!!item.videoId}
                    />
                  );
                } else if (item.type === 'video') {
                  return (
                    <VideoCard
                      key={`video-${item._id}`}
                      video={item}
                      onPress={handleVideoCardPress}
                    />
                  );
                } else if (item.type === 'live') {
                  return (
                    <KitchenCard
                      key={`live-${item.id}`}
                      kitchen={item}
                      onPress={handleKitchenPress}
                      formatNumber={formatNumber}
                    />
                  );
                }
                return null;
              })}
            </View>
          </View>
        );

      case 'recipes':
        if (recipesData === undefined) {
          return <SkeletonGrid count={6} />;
        }
        if (!recipesData?.recipes || recipesData.recipes.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateSubtitle}>
                Discover amazing recipes from our community chefs
              </Text>
            </View>
          );
        }
        return (
          <View style={styles.kitchensContainer}>
            <View style={styles.kitchensGrid}>
              {recipesData.recipes.map((recipe: any) => (
                <RecipeCard
                  key={recipe._id}
                  recipe={recipe}
                  onPress={(recipeId) => setSelectedRecipeId(recipeId)}
                  onVideoPress={handleVideoPress}
                  hasVideo={!!recipe.videoId}
                />
              ))}
            </View>
          </View>
        );

      case 'stories':
        const isLoadingStories = storiesData === undefined || videosData === undefined;
        const hasStories = storiesData && storiesData.length > 0;
        const hasVideos = videosData && videosData.videos && videosData.videos.length > 0;

        if (isLoadingStories) {
          return <SkeletonGrid count={6} />;
        }
        if (!hasStories && !hasVideos) {
          return (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateSubtitle}>
                Watch videos and read engaging food stories
              </Text>
            </View>
          );
        }

        // Combine stories and videos
        const allStories = [
          ...(storiesData || []).map((story: any) => ({ type: 'story', ...story })),
          ...(videosData?.videos || []).map((video: any) => ({ type: 'video', ...video })),
        ];

        return (
          <View style={styles.kitchensContainer}>
            <View style={styles.kitchensGrid}>
              {allStories.map((item: any) => {
                if (item.type === 'story') {
                  return (
                    <StoryCard
                      key={item._id}
                      story={item}
                      onPress={(storyId) => setSelectedStoryId(storyId)}
                      onVideoPress={handleVideoPress}
                      hasVideo={!!item.videoId}
                    />
                  );
                } else {
                  return (
                    <VideoCard
                      key={item._id}
                      video={item}
                      onPress={handleVideoCardPress}
                    />
                  );
                }
              })}
            </View>
          </View>
        );

      case 'live':
      default:
        // Show skeleton while loading live streams
        // Show skeleton if: loading session token, or authenticated and loading live streams
        const isLoadingLive = isLoadingSessionToken ||
                              (isAuthenticated && sessionToken && liveStreamsData === null && !liveStreamsError);
        
        if (isLoadingLive) {
          return <SkeletonGrid count={6} />;
        }
        
        return (
          <View style={styles.kitchensContainer}>
            {filteredKitchens.length > 0 ? (
              <View style={styles.kitchensGrid}>
                {filteredKitchens.map((kitchen) => (
                  <KitchenCard
                    key={kitchen.id}
                    kitchen={kitchen}
                    onPress={handleKitchenPress}
                    formatNumber={formatNumber}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateSubtitle}>
                  You&apos;ll be able to order meals right from the stove from here when anyone goes live
                </Text>
              </View>
            )}
          </View>
        );
    }
  };

  return (
    <>
      <LinearGradient
        colors={["#f8e6f0", "#faf2e8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <Animated.ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
          alwaysBounceVertical={true}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: isHeaderSticky ? 0 : 320,
            paddingHorizontal: 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF3B30"
              colors={["#FF3B30"]}
              progressBackgroundColor="rgba(255, 255, 255, 0.8)"
              progressViewOffset={0}
              title="Pull to refresh"
              titleColor="#FF3B30"
            />
          }
          onScroll={externalOnScroll || handleScroll}
          scrollEventThrottle={8}
        >
          {/* Main Content with fade animation */}
          <Animated.View style={contentFadeStyle}>
            {/* Content based on selected category */}
            {renderContent()}

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </Animated.View>
        </Animated.ScrollView>
      </LinearGradient>

      {/* Live Screen Modal */}
      {showLiveModal && selectedSessionId && (
        <LiveScreenView 
          sessionId={selectedSessionId} 
          mockKitchenData={selectedKitchen}
          onClose={handleCloseLiveModal} 
        />
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipeId && (
        <RecipeDetailScreen
          recipeId={selectedRecipeId}
          onClose={() => setSelectedRecipeId(null)}
        />
      )}

      {/* Story Detail Modal */}
      {selectedStoryId && (
        <StoryDetailScreen
          storyId={selectedStoryId}
          onClose={() => setSelectedStoryId(null)}
        />
      )}

      {/* NoshHeaven Video Player */}
      <Modal
        visible={showVideoPlayer && videoPlayerMeals.length > 0}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseVideoPlayer}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        {showVideoPlayer && videoPlayerMeals.length > 0 && (
          <NoshHeavenPlayer
            isVisible={showVideoPlayer}
            meals={videoPlayerMeals}
            mode="meals"
            initialIndex={videoPlayerStartIndex}
            onClose={handleCloseVideoPlayer}
            onAddToCart={handleAddToCart}
            onMealLike={handleLikeVideo}
            onMealShare={handleShareVideo}
          />
        )}
      </Modal>

    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8e6f0",
  },

  liveHeaderGradient: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  liveHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  liveIconContainer: {
    position: "relative",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  liveIconPulse: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  liveIconDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFE5E5",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  liveHeaderText: {
    alignItems: "flex-start",
    flex: 1,
    marginLeft: 6,
  },
  liveHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 3,
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  liveHeaderSubtitle: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
    fontWeight: "500",
  },
  liveStatsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 0,
  },
  statLabel: {
    fontSize: 8,
    color: "#fff",
    opacity: 0.7,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 6,
  },
  kitchensContainer: {
    paddingHorizontal: 12,
    gap: 12,
  },
  kitchensGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  kitchenCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: "47%",
    marginBottom: 12,
  },
  imageContainer: {
    position: "relative",
    height: 160,
  },
  kitchenImage: {
    width: "100%",
    height: "100%",
  },
  // Recipe Card Styles - Compact with orange accent
  recipeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    width: "47%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.1)",
  },
  recipeImageContainer: {
    position: "relative",
    height: 140,
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeVideoIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 6,
    padding: 4,
    zIndex: 2,
  },
  recipeMeta: {
    position: "absolute",
    bottom: 8,
    right: 8,
  },
  recipeMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4,
  },
  recipeMetaText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
  },
  recipeInfo: {
    padding: 10,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 18,
  },
  recipeCuisine: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  // Story Card Styles - Compact with blue accent
  storyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    width: "47%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.1)",
  },
  storyImageContainer: {
    position: "relative",
    height: 140,
  },
  storyImage: {
    width: "100%",
    height: "100%",
  },
  storyBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  storyVideoIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 6,
    padding: 4,
    zIndex: 2,
  },
  storyBadgeText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  storyInfo: {
    padding: 10,
  },
  storyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 18,
  },
  storyAuthor: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  // Video Card Styles - Compact with purple accent
  videoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    width: "47%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.1)",
  },
  videoImageContainer: {
    position: "relative",
    height: 140,
  },
  videoImage: {
    width: "100%",
    height: "100%",
  },
  videoPlayButton: {
    position: "absolute",
    top: 52,
    left: "50%",
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoInfo: {
    padding: 10,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 18,
  },
  videoCreator: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  liveIndicator: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  videoIndicator: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginRight: 4,
  },
  liveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  viewersContainer: {
    position: "absolute",
    top: 12,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  viewersText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  eyeIcon: {
    marginRight: 4,
  },
  kitchenInfo: {
    padding: 12,
  },
  kitchenName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 18,
  },
  kitchenCuisine: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 6,
    fontWeight: "500",
  },
  kitchenDescription: {
    fontSize: 11,
    color: "#9CA3AF",
    lineHeight: 15,
  },
  chefName: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingBottom: 120,
    paddingTop: 40,
    paddingHorizontal: 32,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    opacity: 0.7,
  },
  categorySelector: {
    paddingTop: 0,
    paddingBottom: 12,
    marginTop: -30,
    backgroundColor: "transparent",
  },
  categoryScrollContent: {
    paddingLeft: 16,
    gap: 8,
  },
  categoryChipContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    minHeight: 36,
  },
  categoryChipActive: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderColor: "rgba(255, 59, 48, 0.3)",
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  categoryChipTextActive: {
    fontWeight: "600",
    color: "#FF3B30",
  },
  bottomSpacing: {
    height: 280,
  },
});
