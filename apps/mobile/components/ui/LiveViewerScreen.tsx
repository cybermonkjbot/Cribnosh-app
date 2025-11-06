import { useAuthContext } from '@/contexts/AuthContext';
import {
  useAddToCartMutation,
  useGetCartQuery,
  useGetLiveSessionQuery,
  useUpdateCartItemMutation,
  useGetLiveCommentsQuery,
  useSendLiveCommentMutation,
  useGetLiveViewersQuery,
  useSendLiveReactionMutation,
  useGetLiveReactionsQuery,
} from '@/store/customerApi';
import { LiveComment } from '@/types/customer';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, Modal, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showError, showSuccess, showWarning } from '../../lib/GlobalToastManager';
import LiveComments from '../LiveComments';
import OnTheStoveBottomSheet from '../OnTheStoveBottomSheet';
import { CartButton } from './CartButton';
import { CribnoshLiveHeader } from './CribnoshLiveHeader';

interface LiveViewerScreenProps {
  sessionId: string;
  mockKitchenData?: {
    id: string;
    name: string;
    cuisine: string;
    viewers: number;
    isLive: boolean;
    image: string;
    description: string;
    chef: string;
  } | null;
  onClose: () => void;
}

const LiveScreenView: React.FC<LiveViewerScreenProps> = ({ sessionId, mockKitchenData, onClose }) => {
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { isAuthenticated } = useAuthContext();
  const router = useRouter();
  const [addToCart] = useAddToCartMutation();
  const [updateCartItem] = useUpdateCartItemMutation();
  const insets = useSafeAreaInsets();
  
  // Detect if this is a mock ID (simple numeric string like "1", "2", etc.)
  const isMockId = useMemo(() => {
    return /^\d+$/.test(sessionId) && sessionId.length <= 3;
  }, [sessionId]);

  // Fetch live session data only if not a mock ID
  const { 
    data: sessionData, 
    isLoading: isLoadingSession, 
    error: sessionError 
  } = useGetLiveSessionQuery(sessionId, {
    skip: !sessionId || isMockId,
  });
  
  // Fetch cart data to show cart button when items exist
  const { data: cartData, refetch: refetchCart } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  });
  
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
    if (isMockId && mockKitchenData) {
      return mockKitchenData.viewers || 0;
    }
    
    return 0;
  }, [liveViewersData, sessionData, isMockId, mockKitchenData]);

  // Fetch live comments from API - only use API data
  const { data: liveCommentsData, isLoading: isLoadingComments } = useGetLiveCommentsQuery(
    { sessionId, limit: 50, offset: 0 },
    { skip: !sessionId || isMockId, pollingInterval: 5000 } // Poll every 5 seconds for new comments
  );

  // Fetch live viewers from API
  const { data: liveViewersData } = useGetLiveViewersQuery(
    { sessionId, limit: 100, includeAnonymous: true },
    { skip: !sessionId || isMockId, pollingInterval: 10000 } // Poll every 10 seconds for viewer count
  );

  const [sendLiveComment] = useSendLiveCommentMutation();
  const [sendLiveReaction] = useSendLiveReactionMutation();

  // Fetch live reactions from API
  const { data: liveReactionsData } = useGetLiveReactionsQuery(
    { sessionId, limit: 100, offset: 0 },
    { skip: !sessionId || isMockId, pollingInterval: 5000 } // Poll every 5 seconds for new reactions
  );

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

  // Handle sending live reaction
  const handleSendReaction = useCallback(async (reactionType: 'heart' | 'fire' | 'clap' | 'star') => {
    if (!isAuthenticated) {
      showWarning('Authentication Required', 'Please sign in to send reactions');
      router.push('/auth/sign-in' as any);
      return;
    }

    if (!sessionId || isMockId) {
      return;
    }

    try {
      await sendLiveReaction({
        sessionId,
        reactionType,
        intensity: 'medium',
      }).unwrap();
      // Reaction sent successfully - no need to show toast for reactions
    } catch (err: any) {
      const errorMessage = err?.data?.error?.message || err?.message || 'Failed to send reaction';
      showError('Failed to send reaction', errorMessage);
    }
  }, [isAuthenticated, sessionId, isMockId, sendLiveReaction, router]);

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
      await sendLiveComment({
        sessionId,
        content: content.trim(),
        commentType: 'general',
      }).unwrap();
      showSuccess('Comment sent!', '');
    } catch (err: any) {
      const errorMessage = err?.data?.error?.message || err?.message || 'Failed to send comment';
      showError('Failed to send comment', errorMessage);
    }
  }, [isAuthenticated, sessionId, isMockId, sendLiveComment, router]);

  // Handle session errors
  useEffect(() => {
    if (sessionError) {
      showError('Failed to load live session', 'Please try again');
    }
  }, [sessionError]);

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
    if (!isAuthenticated) {
      showWarning(
        'Authentication Required',
        'Please sign in to add items to cart'
      );
      router.push('/auth/sign-in' as any);
      return;
    }

    if (!sessionData?.data?.meal?._id) {
      showError('Meal not available', 'Cannot add to cart');
      return;
    }

    try {
      const result = await addToCart({
        dish_id: sessionData.data.meal._id,
        quantity: 1,
        special_instructions: undefined,
      }).unwrap();

      if (result.success) {
        showSuccess('Added to Cart!', result.data.dish_name || sessionData.data.meal.name);
        // Refetch cart to update the cart button
        refetchCart();
      }
    } catch (err: any) {
      const errorMessage = err?.data?.error?.message || err?.message || 'Failed to add item to cart';
      showError('Failed to add item to cart', errorMessage);
    }
  }, [isAuthenticated, sessionData, addToCart, router, refetchCart]);

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
        await updateCartItem({
          cartItemId: String(cartItemId),
          data: { quantity },
        }).unwrap();
        refetchCart();
      } catch (err: any) {
        const errorMessage = err?.data?.error?.message || err?.message || 'Failed to update cart item';
        showError('Failed to update quantity', errorMessage);
      }
    } else if (isOrdered || quantity >= 1) {
      // If ordered or quantity changed, add/update in cart
      // This handles the case where increment happens after order button is clicked
      try {
        await addToCart({
          dish_id: sessionData.data.meal._id,
          quantity,
          special_instructions: undefined,
        }).unwrap();
        refetchCart();
      } catch (err: any) {
        const errorMessage = err?.data?.error?.message || err?.message || 'Failed to add item to cart';
        showError('Failed to add item to cart', errorMessage);
      }
    }
  }, [isAuthenticated, sessionData, cartData, isOrdered, updateCartItem, addToCart, refetchCart]);

  const handleClose = () => {
    onClose();
  };

  // Transform API data or mock data to component format
  const mealData = useMemo(() => {
    // Use mock data if available
    if (isMockId && mockKitchenData) {
      return {
        title: mockKitchenData.description || mockKitchenData.name || 'Live Cooking',
        price: '£ 16', // Default price for mock data
        imageSource: mockKitchenData.image || require('../../assets/images/cribnoshpackaging.png'),
        description: mockKitchenData.description || `Watch ${mockKitchenData.chef} cook amazing ${mockKitchenData.cuisine} cuisine live!`,
        kitchenName: mockKitchenData.name || 'Chef\'s Kitchen',
        ingredients: ['Fresh Ingredients', 'Premium Spices', 'Authentic Recipe'],
        cookingTime: '25 minutes',
        chefBio: `${mockKitchenData.chef} brings years of ${mockKitchenData.cuisine} cooking experience.`,
        liveViewers: mockKitchenData.viewers || 0,
      };
    }

    // Use API data
    if (!sessionData?.data) {
      return {
        title: 'Loading...',
        price: '£ 0',
        imageSource: require('../../assets/images/cribnoshpackaging.png'),
        description: 'Loading meal details...',
        kitchenName: 'Loading...',
        ingredients: [],
        cookingTime: undefined,
        chefBio: undefined,
        liveViewers: 0,
      };
    }

    const { session, chef, meal } = sessionData.data;

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
      kitchenName: chef?.kitchen_name || 'Chef\'s Kitchen',
      ingredients,
      cookingTime,
      chefBio: chef?.bio || undefined,
      liveViewers: viewerCount,
    };
  }, [sessionData, isMockId, mockKitchenData, viewerCount]);

  // Get chef info for header
  const chefInfo = useMemo(() => {
    // Use mock data if available
    if (isMockId && mockKitchenData) {
      return {
        name: mockKitchenData.chef || mockKitchenData.name || 'Chef',
        avatar: mockKitchenData.image || 'https://fhfhfhhf',
        viewers: viewerCount,
      };
    }

    // Use API data
    if (!sessionData?.data?.chef) {
      return {
        name: 'Loading...',
        avatar: 'https://fhfhfhhf',
        viewers: viewerCount,
      };
    }

    const { chef } = sessionData.data;
    return {
      name: chef.name || 'Chef',
      avatar: chef.profile_image || 'https://fhfhfhhf',
      viewers: viewerCount,
    };
  }, [sessionData, isMockId, mockKitchenData, viewerCount]);

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
            (isMockId && mockKitchenData?.image)
              ? { uri: mockKitchenData.image }
              : (sessionData?.data?.session?.thumbnail_url)
              ? { uri: sessionData.data.session.thumbnail_url }
              : require('../../assets/images/KitchenLive-01.png')
          }
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {/* Back Button and Live Info Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <ChevronLeft color="#E6FFE8" size={24} />
            </TouchableOpacity>
            
            {/* Live Header Info */}
            <View style={styles.liveInfoContainer}>
              <CribnoshLiveHeader
                kitchenTitle={chefInfo.name}
                viewers={chefInfo.viewers}
              />
            </View>
          </View>

          {/* Live Comments - Positioned like TikTok */}
          <View style={styles.commentsContainer}>
            <LiveComments comments={liveComments} />
          </View>

          {/* Comment Input - Positioned at bottom */}
          {!isMockId && (
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
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
            </View>
          )}

          {/* Love Button is now rendered inside OnTheStoveBottomSheet */}
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
    </Modal>
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
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 250, // Positioned above the comment input
    paddingHorizontal: 16,
    zIndex: 500,
    maxHeight: 300,
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 200, // Positioned above the bottom sheet
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 600,
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default LiveScreenView;
