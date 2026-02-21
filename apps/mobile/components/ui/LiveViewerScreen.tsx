import { useAuthContext } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { LiveComment } from '@/types/customer';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, ImageBackground, KeyboardAvoidingView, Modal, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../../packages/convex/_generated/api';
import { showError, showSuccess, showWarning } from '../../lib/GlobalToastManager';
import LiveComments from '../LiveComments';
import OnTheStoveBottomSheet from '../OnTheStoveBottomSheet';
import { CartButton } from './CartButton';
import { CribnoshLiveHeader } from './CribnoshLiveHeader';
import { LivePinnedMeal } from './LivePinnedMeal';
import { LiveReactionsOverlay } from './LiveReactionsOverlay';

interface LiveViewerScreenProps {
  sessionId: string;
  mockFoodCreatorData?: {
    id: string;
    name: string;
    cuisine: string;
    viewers: number;
    isLive: boolean;
    image: string;
    description: string;
    foodCreator: string;
  } | null;
  onClose: () => void;
}

const LiveScreenView: React.FC<LiveViewerScreenProps> = ({ sessionId, mockFoodCreatorData, onClose }) => {
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { isAuthenticated, token, checkTokenExpiration, refreshAuthState } = useAuthContext();
  const router = useRouter();
  const { getCart, addToCart: addToCartAction, updateCartItem: updateCartItemAction } = useCart();
  const [cartData, setCartData] = useState<any>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reactionCount, setReactionCount] = useState(0);
  const insets = useSafeAreaInsets();

  // Detect if this is a mock ID (simple numeric string like "1", "2", etc.)
  const isMockId = useMemo(() => {
    return /^\d+$/.test(sessionId) && sessionId.length <= 3;
  }, [sessionId]);

  // Live session state
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState<any>(null);

  // Fetch live session from Convex
  useEffect(() => {
    const fetchLiveSession = async () => {
      if (!sessionId || isMockId || !isAuthenticated) return;

      try {
        setIsLoadingSession(true);
        setSessionError(null);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          return;
        }

        const result = await convex.action(api.actions.liveStreaming.customerGetLiveSession, {
          sessionToken,
          sessionId,
        });

        if (result.success === false) {
          setSessionError(new Error(result.error || 'Failed to fetch live session'));
          return;
        }

        // Transform to match expected format
        setSessionData({
          data: {
            session: result.session,
            meal: result.session.meal,
            foodCreator: result.session.foodCreator || result.session.chef,
          },
        });
      } catch (error: any) {
        setSessionError(error);
        console.error('Error fetching live session:', error);
      } finally {
        setIsLoadingSession(false);
      }
    };

    fetchLiveSession();
  }, [sessionId, isMockId, isAuthenticated]);

  // Load cart data to show cart button when items exist
  useEffect(() => {
    if (isAuthenticated) {
      const loadCart = async () => {
        try {
          setCartLoading(true);
          const result = await getCart();
          if (result.success) {
            setCartData(result.data);
          }
        } catch (error) {
          // Silently fail - cart button will just not show
        } finally {
          setCartLoading(false);
        }
      };
      loadCart();
    }
  }, [isAuthenticated, getCart]);

  const refetchCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const result = await getCart();
        if (result.success) {
          setCartData(result.data);
        }
      } catch (error) {
        // Silently fail
      }
    }
  }, [isAuthenticated, getCart]);

  // Calculate cart item count
  const cartItemCount = useMemo(() => {
    if (!cartData?.data?.items) return 0;
    return cartData.data.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  }, [cartData]);

  // Find if the meal is already in cart and get its cart item ID
  const cartItem = useMemo(() => {
    if (!cartData?.data?.items || !sessionData?.data?.meal?._id) return null;
    return cartData.data.items.find((item: any) =>
      item.dish_id === sessionData.data.meal?._id ||
      item.dish_id === String(sessionData.data.meal?._id) ||
      item.meal_id === sessionData.data.meal?._id ||
      item.meal_id === String(sessionData.data.meal?._id)
    );
  }, [cartData, sessionData]);

  const isOrdered = !!cartItem;

  // Get viewer count from API - prioritize liveViewersData over session data
  // Live comments state
  const [liveCommentsData, setLiveCommentsData] = useState<any>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Live viewers state
  const [liveViewersData, setLiveViewersData] = useState<any>(null);

  // Live reactions state
  const [liveReactionsData, setLiveReactionsData] = useState<any>(null);

  const viewerCount = useMemo(() => {
    // Use API viewers data if available
    if (liveViewersData?.success && liveViewersData.data?.summary?.totalViewers !== undefined) {
      return liveViewersData.data.summary.totalViewers;
    }

    // Fallback to session data
    if (sessionData?.data?.session) {
      return sessionData.data.session.viewer_count || sessionData.data.session.current_viewers || 0;
    }

    // Fallback to mock data
    if (isMockId && mockFoodCreatorData) {
      return mockFoodCreatorData.viewers || 0;
    }

    return 0;
  }, [liveViewersData, sessionData, isMockId, mockFoodCreatorData]);

  // Fetch live comments from Convex
  const fetchLiveComments = useCallback(async () => {
    if (!sessionId || isMockId || !isAuthenticated) return;

    try {
      setIsLoadingComments(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        return;
      }

      const result = await convex.action(api.actions.liveStreaming.customerGetLiveComments, {
        sessionToken,
        sessionId,
        limit: 50,
        offset: 0,
      });

      if (result.success === false) {
        return;
      }

      // Transform to match expected format
      setLiveCommentsData({
        success: true,
        data: {
          comments: result.comments || [],
        },
      });
    } catch (error: any) {
      console.error('Error fetching live comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [sessionId, isMockId, isAuthenticated]);

  // Fetch live viewers from Convex
  const fetchLiveViewers = useCallback(async () => {
    if (!sessionId || isMockId || !isAuthenticated) return;

    try {
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        return;
      }

      const result = await convex.action(api.actions.liveStreaming.customerGetLiveViewers, {
        sessionToken,
        sessionId,
        limit: 100,
        offset: 0,
      });

      if (result.success === false) {
        return;
      }

      // Transform to match expected format
      setLiveViewersData({
        success: true,
        data: {
          summary: {
            totalViewers: result.total || 0,
          },
          viewers: result.viewers || [],
        },
      });
    } catch (error: any) {
      console.error('Error fetching live viewers:', error);
    }
  }, [sessionId, isMockId, isAuthenticated]);

  // Fetch live reactions from Convex
  const fetchLiveReactions = useCallback(async () => {
    if (!sessionId || isMockId || !isAuthenticated) return;

    try {
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        return;
      }

      const result = await convex.action(api.actions.liveStreaming.customerGetLiveReactions, {
        sessionToken,
        sessionId,
        limit: 100,
        offset: 0,
      });

      if (result.success === false) {
        return;
      }

      // Transform to match expected format
      setLiveReactionsData({
        success: true,
        data: {
          reactions: result.reactions || [],
        },
      });
    } catch (error: any) {
      console.error('Error fetching live reactions:', error);
    }
  }, [sessionId, isMockId, isAuthenticated]);

  // Refetch session data to check if it ended
  const refetchSession = useCallback(async () => {
    if (!sessionId || isMockId || !isAuthenticated) return;

    try {
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        return;
      }

      const result = await convex.action(api.actions.liveStreaming.customerGetLiveSession, {
        sessionToken,
        sessionId,
      });

      if (result.success === false) {
        return;
      }

      // Transform to match expected format
      setSessionData({
        data: {
          session: result.session,
          meal: result.session.meal,
          foodCreator: result.session.foodCreator || result.session.chef,
        },
      });
    } catch (error: any) {
      console.error('Error refetching live session:', error);
    }
  }, [sessionId, isMockId, isAuthenticated]);

  // Set up polling for live data with app state detection
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!sessionId || isMockId || !isAuthenticated) return;

    let commentsInterval: ReturnType<typeof setInterval> | null = null;
    let viewersInterval: ReturnType<typeof setInterval> | null = null;
    let reactionsInterval: ReturnType<typeof setInterval> | null = null;
    let sessionCheckInterval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      // Clear existing intervals
      if (commentsInterval) clearInterval(commentsInterval);
      if (viewersInterval) clearInterval(viewersInterval);
      if (reactionsInterval) clearInterval(reactionsInterval);
      if (sessionCheckInterval) clearInterval(sessionCheckInterval);

      // Start polling with optimized intervals
      commentsInterval = setInterval(() => {
        if (appState.current === 'active') fetchLiveComments();
      }, 8000); // Increased from 5s to 8s for better performance

      viewersInterval = setInterval(() => {
        if (appState.current === 'active') fetchLiveViewers();
      }, 15000); // Increased from 10s to 15s

      reactionsInterval = setInterval(() => {
        if (appState.current === 'active') fetchLiveReactions();
      }, 8000); // Increased from 5s to 8s

      sessionCheckInterval = setInterval(() => {
        if (appState.current === 'active') refetchSession();
      }, 15000); // Increased from 10s to 15s
    };

    const stopPolling = () => {
      if (commentsInterval) clearInterval(commentsInterval);
      if (viewersInterval) clearInterval(viewersInterval);
      if (reactionsInterval) clearInterval(reactionsInterval);
      if (sessionCheckInterval) clearInterval(sessionCheckInterval);
      commentsInterval = null;
      viewersInterval = null;
      reactionsInterval = null;
      sessionCheckInterval = null;
    };

    // Handle app state changes to pause/resume polling
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - resume polling
        startPolling();
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App went to background - pause polling
        stopPolling();
      }
      appState.current = nextAppState;
    };

    // Initial fetch
    fetchLiveComments();
    fetchLiveViewers();
    fetchLiveReactions();

    // Start polling
    startPolling();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, [sessionId, isMockId, isAuthenticated, fetchLiveComments, fetchLiveViewers, fetchLiveReactions, refetchSession]);

  // Transform API comments to component format
  const liveComments = useMemo(() => {
    if (liveCommentsData?.success && liveCommentsData.data?.comments) {
      return liveCommentsData.data.comments.map((comment: LiveComment) => ({
        name: comment.userDisplayName || 'Anonymous',
        comment: comment.content,
      }));
    }
    return []; // Return empty array if API has no data
  }, [liveCommentsData]);

  const handleSendReaction = useCallback(async (reactionType: 'heart' | 'fire' | 'clap' | 'star') => {
    // Fire the local animation immediately for perceived performance
    setReactionCount(prev => prev + 1);

    if (!isAuthenticated) {
      showWarning('Authentication Required', 'Please sign in to send reactions');
      router.push('/auth/sign-in' as any);
      return;
    }

    if (!sessionId || isMockId) {
      return;
    }

    try {
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error('Not authenticated');
      }

      const result = await convex.action(api.actions.liveStreaming.customerSendLiveReaction, {
        sessionToken,
        sessionId,
        reactionType,
        intensity: 'medium',
      });

      if (result.success === false) {
        throw new Error(result.error || 'Failed to send reaction');
      }

      // Refresh reactions after sending
      fetchLiveReactions();
      // Reaction sent successfully - no need to show toast for reactions
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to send reaction';
      showError('Failed to send reaction', errorMessage);
    }
  }, [isAuthenticated, sessionId, isMockId, router, fetchLiveReactions]);

  // Handle sending live comment
  const handleSendComment = useCallback(async (content: string) => {
    if (!isAuthenticated) {
      showWarning('Authentication Required', 'Please sign in to send comments');
      router.push('/auth/sign-in' as any);
      return;
    }

    if (!sessionId || isMockId || !content.trim()) {
      return;
    }

    try {
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error('Not authenticated');
      }

      const result = await convex.action(api.actions.liveStreaming.customerSendLiveComment, {
        sessionToken,
        sessionId,
        content: content.trim(),
        commentType: 'general',
      });

      if (result.success === false) {
        throw new Error(result.error || 'Failed to send comment');
      }

      // Refresh comments after sending
      fetchLiveComments();
      showSuccess('Comment sent!', '');
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to send comment';
      showError('Failed to send comment', errorMessage);
    }
  }, [isAuthenticated, sessionId, isMockId, router, fetchLiveComments]);

  // Error state is shown in UI - no toast needed

  const toggleBottomSheet = () => {
    setIsBottomSheetVisible(!isBottomSheetVisible);
  };

  const handleShareLive = () => {
    console.log('Share live pressed');
    // Add your share functionality here
  };

  const handleTreatSomeone = () => {
    console.log('Treat someone pressed');
    // Add your treat someone functionality here
  };

  const handleAddToCart = useCallback(async () => {
    // Prevent rapid clicks
    if (isAddingToCart) return;

    // Check authentication and token validity
    if (!isAuthenticated || !token) {
      showWarning(
        'Authentication Required',
        'Please sign in to add items to cart'
      );
      router.push('/auth/sign-in' as any);
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
      router.push('/auth/sign-in' as any);
      return;
    }

    if (!sessionData?.data?.meal?._id) {
      showError('Meal not available', 'Cannot add to cart');
      return;
    }

    try {
      setIsAddingToCart(true);
      const result = await addToCartAction(sessionData.data.meal._id, 1);

      if (result.success) {
        showSuccess('Added to Cart!', result.data.item?.name || sessionData.data.meal.name);
        // Refetch cart to update the cart button
        await refetchCart();
      }
    } catch (err: any) {
      const errorMessage = err?.data?.error?.message || err?.message || 'Failed to add item to cart';
      showError('Failed to add item to cart', errorMessage);
    } finally {
      setIsAddingToCart(false);
    }
  }, [isAuthenticated, token, checkTokenExpiration, refreshAuthState, sessionData, addToCartAction, router, refetchCart, isAddingToCart]);

  const handleQuantityChange = useCallback(async (quantity: number) => {
    if (!isAuthenticated || !sessionData?.data?.meal?._id) {
      return;
    }

    // Wait for cart to be refetched if we just added an item
    // If item is already in cart, update it
    const currentCartItem = cartData?.data?.items?.find((item: any) =>
      item.dish_id === sessionData.data.meal?._id ||
      item.dish_id === String(sessionData.data.meal?._id) ||
      item.meal_id === sessionData.data.meal?._id ||
      item.meal_id === String(sessionData.data.meal?._id)
    );

    if (currentCartItem && currentCartItem.id) {
      const cartItemId = currentCartItem.id;
      try {
        await updateCartItemAction(String(cartItemId), quantity);
        await refetchCart();
      } catch (err: any) {
        const errorMessage = err?.data?.error?.message || err?.message || 'Failed to update cart item';
        showError('Failed to update quantity', errorMessage);
      }
    } else if (isOrdered || quantity >= 1) {
      // If ordered or quantity changed, add/update in cart
      // This handles the case where increment happens after order button is clicked
      try {
        await addToCartAction(sessionData.data.meal._id, quantity);
        await refetchCart();
      } catch (err: any) {
        const errorMessage = err?.data?.error?.message || err?.message || 'Failed to add item to cart';
        showError('Failed to add item to cart', errorMessage);
      }
    }
  }, [isAuthenticated, sessionData, cartData, isOrdered, updateCartItemAction, addToCartAction, refetchCart]);

  const handleClose = () => {
    onClose();
  };

  // Transform API data or mock data to component format
  const mealData = useMemo(() => {
    // Use mock data if available
    if (isMockId && mockFoodCreatorData) {
      return {
        title: mockFoodCreatorData.description || mockFoodCreatorData.name || 'Live Cooking',
        price: '£ 16', // Default price for mock data
        imageSource: mockFoodCreatorData.image || require('../../assets/images/cribnoshpackaging.png'),
        description: mockFoodCreatorData.description || `Watch ${mockFoodCreatorData.name} cook amazing ${mockFoodCreatorData.cuisine} cuisine live!`,
        foodCreatorName: mockFoodCreatorData.name || 'Food Creator',
        ingredients: ['Fresh Ingredients', 'Premium Spices', 'Authentic Recipe'],
        cookingTime: '25 minutes',
        foodCreatorBio: `${mockFoodCreatorData.name} brings years of ${mockFoodCreatorData.cuisine} cooking experience.`,
        liveViewers: mockFoodCreatorData.viewers || 0,
      };
    }

    // Use API data
    if (!sessionData?.data) {
      return {
        title: 'Loading...',
        price: '£ 0',
        imageSource: require('../../assets/images/cribnoshpackaging.png'),
        description: 'Loading meal details...',
        foodCreatorName: 'Loading...',
        ingredients: [],
        cookingTime: undefined,

        foodCreatorBio: undefined,
        liveViewers: 0,
      };
    }

    const { session, foodCreator, meal } = sessionData.data;

    // Format price
    const price = meal
      ? `£ ${typeof meal.price === 'number' ? meal.price.toFixed(2) : meal.price || '0'}`
      : '£ 0';

    // Get meal image
    const mealImage = meal?.images && meal.images.length > 0
      ? meal.images[0]
      : require('../../assets/images/cribnoshpackaging.png');

    // Get ingredients
    const ingredients = meal?.ingredients || [];

    // Get cooking time
    const cookingTime = meal?.cooking_time
      ? `${meal.cooking_time}`
      : undefined;

    return {
      title: meal?.name || session.title || 'Live Cooking',
      price,
      imageSource: typeof mealImage === 'string' ? mealImage : mealImage,
      description: meal?.description || session.description || 'Watch this amazing live cooking session!',
      foodCreatorName: foodCreator?.foodCreator_name || 'Food Creator',
      ingredients,
      cookingTime,
      foodCreatorBio: foodCreator?.bio || undefined,
      liveViewers: viewerCount,
    };
  }, [sessionData, isMockId, mockFoodCreatorData, viewerCount]);

  // Get food creator info for header
  const foodCreatorInfo = useMemo(() => {
    // Use mock data if available
    if (isMockId && mockFoodCreatorData) {
      return {
        name: mockFoodCreatorData.name || 'Food Creator',
        avatar: mockFoodCreatorData.image || 'https://fhfhfhhf',
        viewers: viewerCount,
      };
    }

    // Use API data
    if (!sessionData?.data?.foodCreator) {
      return {
        name: 'Loading...',
        avatar: 'https://fhfhfhhf',
        viewers: viewerCount,
      };
    }

    const { foodCreator } = sessionData.data;
    return {
      name: foodCreator.name || 'Food Creator',
      avatar: foodCreator.profile_image || 'https://fhfhfhhf',
      viewers: viewerCount,
    };
  }, [sessionData, isMockId, mockFoodCreatorData, viewerCount]);

  // Show loading state only if not using mock data
  if (isLoadingSession && !isMockId) {
    return (
      <Modal
        visible={true}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          <StatusBar
            hidden={true}
            backgroundColor="transparent"
            translucent={true}
            barStyle="light-content"
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E6FFE8" />
          </View>
        </View>
      </Modal>
    );
  }

  // Show error state only if not using mock data and there was an actual error
  if (sessionError && !isMockId) {
    return (
      <Modal
        visible={true}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          <StatusBar
            hidden={true}
            backgroundColor="transparent"
            translucent={true}
            barStyle="light-content"
          />
          <View style={styles.errorContainer}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <ChevronLeft color="#E6FFE8" size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Check if livestream has ended
  const isEnded = isMockId ? false : (!sessionData?.data?.session ? false : (sessionData.data.session.status === "ended" || sessionData.data.session.ended_at));

  // Show ended view if livestream has ended
  if (isEnded && !isMockId) {
    return (
      <Modal
        visible={true}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          <StatusBar
            hidden={true}
            backgroundColor="transparent"
            translucent={true}
            barStyle="light-content"
          />
          <ImageBackground
            source={
              sessionData?.data?.session?.thumbnail_url
                ? { uri: sessionData.data.session.thumbnail_url }
                : sessionData?.data?.foodCreator?.profile_image
                  ? { uri: sessionData.data.foodCreator.profile_image }
                  : require('../../assets/images/FoodCreatorLive-01.png')
            }
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <View style={styles.endedContainer}>
              <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                <ChevronLeft color="#E6FFE8" size={24} />
              </TouchableOpacity>

              <View style={styles.endedContent}>
                <Text style={styles.endedTitle}>Livestream Ended</Text>
                <Text style={styles.endedSubtitle}>
                  This livestream has ended. Thank you for watching!
                </Text>
                {sessionData?.data?.foodCreator && (
                  <Text style={styles.endedFoodCreatorName}>
                    {sessionData.data.foodCreator.name}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.backToHomeButton}
                  onPress={handleClose}
                >
                  <Text style={styles.backToHomeButtonText}>Back to Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        hidden={true}
        backgroundColor="transparent"
        translucent={true}
        barStyle="light-content"
      />
      <ImageBackground
        source={
          (isMockId && mockFoodCreatorData?.image)
            ? { uri: mockFoodCreatorData.image }
            : (sessionData?.data?.session?.thumbnail_url)
              ? { uri: sessionData.data.session.thumbnail_url }
              : (sessionData?.data?.chef?.profile_image)
                ? { uri: sessionData.data.foodCreator.profile_image }
                : require('../../assets/images/FoodCreatorLive-01.png')
        }
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Back Button and Live Info Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <ChevronLeft color="#E6FFE8" size={24} />
            </TouchableOpacity>

            {/* Live Header Info */}
            <View style={styles.liveInfoContainer}>
              <CribnoshLiveHeader
                foodCreatorTitle={foodCreatorInfo.name}
                viewers={foodCreatorInfo.viewers}
              />
            </View>
          </View>

          {/* Live Reactions Overlay */}
          <LiveReactionsOverlay reactionCount={reactionCount} />

          {/* Spacer to push everything to the bottom */}
          <View style={styles.flexSpacer} />

          <View style={[styles.bottomStack, { paddingBottom: 120 }]}>
            {/* Pinned Meal Card */}
            {!isMockId && mealData && (
              <LivePinnedMeal
                mealData={mealData}
                onPress={() => toggleBottomSheet()}
              />
            )}

            {/* Live Comments */}
            <View style={styles.commentsContainer}>
              <LiveComments comments={liveComments} />
            </View>

            {/* Comment Input */}
            {!isMockId && (
              <TouchableOpacity
                activeOpacity={1}
                style={styles.commentInputContainer}
                onPress={() => {
                  if (!isAuthenticated) {
                    showWarning('Authentication Required', 'Please sign in to comment');
                    router.push('/auth/sign-in' as any);
                  }
                }}
              >
                <TextInput
                  style={styles.commentInput}
                  placeholder={isAuthenticated ? "Add a comment..." : "Sign in to comment"}
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline={false}
                  maxLength={200}
                  editable={isAuthenticated}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!commentText.trim() || !isAuthenticated) && styles.sendButtonDisabled,
                  ]}
                  onPress={() => {
                    if (commentText.trim() && isAuthenticated) {
                      handleSendComment(commentText);
                      setCommentText('');
                    }
                  }}
                  disabled={!commentText.trim() || !isAuthenticated}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>

      {/* Bottom Sheet - moved outside ImageBackground for better persistence */}
      <OnTheStoveBottomSheet
        isVisible={true}
        isLoading={isLoadingSession && !isMockId}
        onToggleVisibility={toggleBottomSheet}
        onShareLive={handleShareLive}
        onTreatSomeone={handleTreatSomeone}
        mealData={mealData}
        mealId={sessionData?.data?.meal?._id}
        onAddToCart={isMockId ? undefined : handleAddToCart}
        onQuantityChange={isMockId ? undefined : handleQuantityChange}
        isOrdered={isOrdered}
        onReaction={isMockId ? undefined : handleSendReaction}
      />

      {/* Floating Cart Button - shows when cart has items */}
      {cartItemCount > 0 && (
        <CartButton
          quantity={cartItemCount}
          onPress={() => router.push('/orders/cart')}
          variant="view"
          position="absolute"
          bottom={Math.max(insets.bottom, 30)}
          left={20}
          right={20}
          showIcon={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02120A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#02120A',
  },
  errorContainer: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 10,
    backgroundColor: '#02120A',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  flexSpacer: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bottomStack: {
    justifyContent: 'flex-end',
    width: '100%',
  },
  headerContainer: {
    paddingHorizontal: 10,
    paddingTop: 50,
    paddingBottom: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveInfoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  toggleButton: {
    backgroundColor: '#094327',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
  },
  commentsContainer: {
    height: 250,
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(230, 255, 232, 0.1)',
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  sendButton: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  endedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  endedContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(2, 18, 10, 0.9)',
    borderRadius: 24,
    padding: 32,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  endedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E6FFE8',
    fontFamily: 'Inter',
    marginBottom: 12,
    textAlign: 'center',
  },
  endedSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(230, 255, 232, 0.8)',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  endedFoodCreatorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    fontFamily: 'Inter',
    marginTop: 16,
    marginBottom: 24,
  },
  backToHomeButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToHomeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
});

export default LiveScreenView;
