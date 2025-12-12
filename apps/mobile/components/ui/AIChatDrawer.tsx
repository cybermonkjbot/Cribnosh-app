import { useAuthContext } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useToast } from '@/lib/ToastContext';
import { DishRecommendation } from '@/types/customer';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { useTopPosition } from '@/utils/positioning';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Avatar } from './Avatar';
import { CribNoshLogo } from './CribNoshLogo';

// App color constants - matching the home page components exactly
const COLORS = {
  primary: '#094327',      // Dark green - main brand color
  secondary: '#0B9E58',    // Green - secondary brand color
  lightGreen: '#E6FFE8',   // Light green - background
  white: '#FFFFFF',
  black: '#000000',        // Pure black used in home components
  darkGray: '#111827',     // Dark gray for active states (from Header)
  gray: {
    50: '#FAFFFA',
    100: '#F7FAFC',
    200: '#F0F0F0',
    300: '#E2E8F0',
    400: '#A0AEC0',
    500: '#6B7280',        // Used in Header for muted text
    600: '#374151',        // Used in Header for button text
    700: '#2D3748',
    800: '#1A202C',
  },
  // Home page gradient colors for softer feel
  homePink: '#f8e6f0',     // Soft pink from home page
  homeCream: '#faf2e8',    // Soft cream from home page
  homePinkLight: '#f5e6f0', // Lighter pink from Header
  homeCreamLight: '#f9f2e8', // Lighter cream from Header
  accent: '#FF6B35',       // Orange accent for highlights
  // Glass-like transparent colors from home components
  glass: {
    white: 'rgba(255, 255, 255, 0.1)',      // From Header sticky state
    white80: 'rgba(255, 255, 255, 0.8)',    // From Header button states
    white20: 'rgba(255, 255, 255, 0.2)',    // From CategoryFilterChips
    white30: 'rgba(255, 255, 255, 0.3)',    // From CategoryFilterChips borders
  },
  red: '#dc2626',        // CribNosh red from logo
  orange: '#FF6B35',
};

// Badge Component
interface BadgeProps {
  text: string;
  type?: 'hot' | 'bestfit' | 'highprotein';
}

const Badge: React.FC<BadgeProps> = ({ text, type = 'hot' }) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'hot':
        return COLORS.red;        // CribNosh red
      case 'bestfit':
        return COLORS.red;        // CribNosh red instead of orange
      case 'highprotein':
        return COLORS.secondary;
      default:
        return COLORS.red;        // CribNosh red
    }
  };

  return (
    <View style={{
      backgroundColor: getBackgroundColor(),
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginRight: 4,
    }}>
      <Text style={{
        color: COLORS.white,
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
      }}>
        {text}
      </Text>
    </View>
  );
};

// Product Card Props Interface
interface ProductCardProps {
  dish_id?: string; // Optional - used for cart operations, not displayed
  name: string;
  price: string;
  image: any;
  badge?: { text: string; type?: 'hot' | 'bestfit' | 'highprotein' };
  hasFireEmoji?: boolean;
}

// Helper function to transform dish recommendation to product card props
function transformDishToProductCard(dish: DishRecommendation): ProductCardProps {
  const imageSource = dish.image_url 
    ? { uri: dish.image_url.startsWith('http') ? dish.image_url : `https://cribnosh.com${dish.image_url}` }
    : require('../../assets/images/cribnoshpackaging.png');

  // Determine badge type from dish badge text
  let badgeType: 'hot' | 'bestfit' | 'highprotein' | undefined;
  let badgeText: string | undefined;
  
  if (dish.badge) {
    const badgeUpper = dish.badge.toUpperCase();
    if (badgeUpper === 'BUSSIN') {
      badgeType = 'hot';
      badgeText = 'Bussin';
    } else if (badgeUpper === 'BEST FIT' || badgeUpper === 'BESTFIT') {
      badgeType = 'bestfit';
      badgeText = 'Best fit';
    } else if (badgeUpper === 'HIGH PROTEIN' || badgeUpper === 'HIGHPROTEIN') {
      badgeType = 'highprotein';
      badgeText = 'High Protein';
    } else {
      badgeText = dish.badge;
    }
  }

  const hasFireEmoji = dish.badge?.toUpperCase() === 'BUSSIN';

  return {
    dish_id: dish.dish_id,
    name: dish.name,
    price: `£${(dish.price / 100).toFixed(0)}`, // Convert pence to pounds
    image: imageSource,
    badge: badgeText ? { text: badgeText, type: badgeType } : undefined,
    hasFireEmoji,
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  name, 
  price, 
  image, 
  badge,
  hasFireEmoji = false 
}) => {
  return (
    <View style={{
      width: 140,
      backgroundColor: COLORS.white,
      borderRadius: 16,
      padding: 12,
      marginRight: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: COLORS.gray[200],
    }}>
      <View style={{
        width: '100%',
        height: 80,
        borderRadius: 12,
        backgroundColor: COLORS.gray[100],
        marginBottom: 8,
        overflow: 'hidden',
      }}>
        <Image 
          source={image} 
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        {badge && <Badge text={badge.text} type={badge.type} />}
        {hasFireEmoji && <Ionicons name="flame" size={12} color={COLORS.red} />}
      </View>
      
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 4,
      }}>
        {name}
      </Text>
      
      <Text style={{
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.red,
      }}>
        {price}
      </Text>
    </View>
  );
};

// User Message Component
interface UserMessageProps {
  message: string;
  userAvatarUri?: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ message, userAvatarUri }) => {
  // Determine the avatar source - use user avatar if available, otherwise fallback to default
  const avatarSource = userAvatarUri 
    ? { uri: userAvatarUri }
    : require('../../assets/images/adaptive-icon.png');

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 20,
      paddingHorizontal: 16,
    }}>
      <View style={{
        maxWidth: '80%',
        backgroundColor: COLORS.glass.white80,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: COLORS.glass.white30,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
      }}>
        <Text style={{
          color: COLORS.darkGray,
          fontSize: 16,
          lineHeight: 22,
          fontWeight: '400',
        }}>
          {message}
        </Text>
      </View>
      
      <Avatar 
        source={avatarSource} 
        size="sm"
        glass={true}
        elevated={true}
      />
    </View>
  );
};

// AI Message Component
interface AIMessageProps {
  message: string;
  products?: ProductCardProps[];
  title?: string;
  onAddToCart?: () => void;
  isLoadingCart?: boolean;
}

const AIMessage: React.FC<AIMessageProps> = ({ message, products, title, onAddToCart, isLoadingCart }) => {
  return (
    <View style={{
      marginBottom: 24,
      paddingHorizontal: 16,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <Avatar 
          source={require('../../assets/images/adaptive-icon.png')} 
          size="md"
          glass={true}
          elevated={true}
        />
      </View>
      
      {title && (
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: COLORS.gray[600],
          marginBottom: 12,
        }}>
          {title}
        </Text>
      )}
      
      {products && products.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
          style={{ marginBottom: 16 }}
        >
          {products.map((product, index) => (
            <ProductCard
              key={index}
              name={product.name}
              price={product.price}
              image={product.image}
              badge={product.badge}
              hasFireEmoji={product.hasFireEmoji}
            />
          ))}
        </ScrollView>
      )}
      
      <Text style={{
        fontSize: 16,
        lineHeight: 24,
        color: COLORS.gray[700],
        marginBottom: 16,
      }}>
        {message}
      </Text>
      
      {products && products.length > 0 && (
        <TouchableOpacity 
          style={{
          backgroundColor: COLORS.red,
          borderRadius: 25,
          paddingVertical: 12,
          paddingHorizontal: 24,
          alignSelf: 'flex-start',
            opacity: onAddToCart && !isLoadingCart ? 1 : 0.5,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
          onPress={onAddToCart}
          disabled={!onAddToCart || isLoadingCart}
        >
          {isLoadingCart && (
            <ActivityIndicator size="small" color={COLORS.white} />
          )}
          <Text style={{
            color: COLORS.white,
            fontSize: 16,
            fontWeight: '600',
          }}>
            {isLoadingCart ? 'Adding...' : 'Add to cart with instructions'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Chat Input Component
const ChatInput: React.FC<{ onSend: (message: string) => void; isLoading?: boolean }> = ({ onSend, isLoading = false }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: COLORS.glass.white80,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    }}>
      <View style={{
        flex: 1,
        backgroundColor: COLORS.glass.white80,
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: COLORS.glass.white30,
      }}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Ask Cribnosh"
          placeholderTextColor={COLORS.gray[400]}
          style={{
            fontSize: 16,
            color: COLORS.gray[700],
          }}
          multiline
        />
      </View>
      
              <TouchableOpacity
          onPress={handleSend}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.red,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
            stroke={COLORS.white}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
};

interface AIChatDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  products?: ProductCardProps[];
  title?: string;
  dishIds?: string[]; // Store dish IDs for cart operations
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ isVisible, onClose }) => {
  const topPosition = useTopPosition(0);
  const { showError, showSuccess, showInfo } = useToast();
  const locationState = useUserLocation();
  const { isAuthenticated, token, checkTokenExpiration, refreshAuthState } = useAuthContext();
  const { addToCart: addToCartAction, isLoading: isAddingToCart } = useCart();
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Send AI chat message function using Convex
  const sendChatMessage = useCallback(async (data: {
    message: string;
    conversation_id?: string;
    location?: { latitude: number; longitude: number };
  }) => {
    const convex = getConvexClient();
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
      throw new Error('Not authenticated');
    }

    const result = await convex.action(api.actions.users.customerSendAIChatMessage, {
      sessionToken,
      message: data.message,
      conversation_id: data.conversation_id,
      location: data.location,
    });

    if (result.success === false) {
      throw new Error(result.error || 'Failed to send chat message');
    }

    // Transform to match expected format
    return {
      success: true,
      data: result.data,
    };
  }, []);
  
  // Profile state
  const [profileData, setProfileData] = useState<any>(null);

  // Fetch profile data from Convex
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) return;
      
      try {
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          return;
        }

        const result = await convex.action(api.actions.users.customerGetProfile, {
          sessionToken,
        });

        if (result.success === false) {
          return;
        }

        // Transform to match expected format
        setProfileData({
          data: {
            ...result.user,
          },
        });
      } catch (error: any) {
        console.error('Error fetching profile:', error);
      }
    };

    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  // Get profile picture URL, converting relative URLs to absolute
  const userAvatarUri = useMemo(() => {
    if (!profileData?.data) {
      return undefined;
    }
    
    // Check multiple possible locations for the picture
    const picture = 
      profileData.data.picture || 
      (profileData.data as any)?.user?.picture || 
      (profileData.data as any)?.user?.avatar ||
      (profileData.data as any)?.avatar;
    
    if (picture) {
      const absoluteUrl = getAbsoluteImageUrl(picture);
      return absoluteUrl;
    }
    
    return undefined;
  }, [profileData?.data]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Animation values
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);
  const translateYValue = useSharedValue(0);
  const isClosing = useRef(false);

  // Initialize with welcome message if no messages
  useEffect(() => {
    if (isVisible && messages.length === 0) {
      setMessages([{
        id: 1,
        type: 'ai',
        content: 'Hi! I\'m CribNosh AI. Ask me anything about food - I can help you find the perfect meal based on your preferences, mood, or dietary needs. What are you in the mood for today?',
        title: undefined,
        products: undefined,
      }]);
    }
  }, [isVisible, messages.length]);

  // Get user location on mount
  useEffect(() => {
    if (isVisible && !locationState.location && locationState.permissionStatus === 'undetermined') {
      locationState.getCurrentLocation();
    }
  }, [isVisible, locationState]);

  // Handle smooth exit animation
  const handleCloseWithAnimation = () => {
    if (isClosing.current) return;
    isClosing.current = true;

    // Smooth exit animation
    scaleValue.value = withTiming(0.95, { duration: 200, easing: Easing.out(Easing.cubic) });
    opacityValue.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    translateYValue.value = withTiming(50, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
      runOnJS(onClose)();
    });
  };

  // Reset animation values when becoming visible
  useEffect(() => {
    if (isVisible) {
      isClosing.current = false;
      scaleValue.value = 1;
      opacityValue.value = 1;
      translateYValue.value = 0;
      setError(null);
    }
  }, [isVisible, scaleValue, opacityValue, translateYValue]);

  // Handle add to cart for all recommendations in a message
  const handleAddToCart = useCallback(async (message: Message) => {
    if (!message.products || message.products.length === 0 || !message.dishIds) {
      showError('No items to add', 'Please select items to add to cart');
      return;
    }

    // Check authentication and token validity
    if (!isAuthenticated || !token) {
      showError('Authentication Required', 'Please sign in to add items to cart');
      return;
    }

    // Check if token is expired and refresh auth state if needed
    const isExpired = checkTokenExpiration();
    if (isExpired) {
      // Refresh auth state to update isAuthenticated
      await refreshAuthState();
      showError('Session Expired', 'Please sign in again to add items to cart');
      return;
    }

    try {
      // Get special instructions from the conversation context
      const userMessages = messages
        .filter(m => m.type === 'user')
        .map(m => m.content)
        .join(' ');

      const specialInstructions = userMessages.length > 0 
        ? `Based on conversation: ${userMessages.slice(0, 200)}` // Limit to 200 chars
        : undefined;

      // Add all dishes from the recommendations
      const addPromises = message.dishIds.map(dishId =>
        addToCartAction(dishId, 1)
      );

      await Promise.all(addPromises);
      
      showSuccess('Added to cart', `${message.products.length} item(s) added to your cart`);
    } catch (err: any) {
      const errorMessage = err?.data?.error?.message || err?.message || 'Failed to add items to cart';
      showError('Cart error', errorMessage);
    }
  }, [isAuthenticated, token, checkTokenExpiration, refreshAuthState, messages, addToCartAction, showSuccess, showError]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now(),
        type: 'user',
      content: messageText.trim(),
      };
    setMessages(prev => [...prev, userMessage]);
    setError(null);
    setIsLoadingMessage(true);

    try {
      // Prepare location data
      const location = locationState.location ? {
        latitude: locationState.location.latitude,
        longitude: locationState.location.longitude,
      } : undefined;

      // Send chat message
      setIsSendingMessage(true);
      const response = await sendChatMessage({
        message: messageText.trim(),
        conversation_id: conversationId,
        location,
      });
      setIsSendingMessage(false);

      // Transform recommendations to product cards
      const products: ProductCardProps[] = response.data.recommendations
        ? response.data.recommendations.map(transformDishToProductCard)
        : [];

      // Store dish IDs for cart operations
      const dishIds = response.data.recommendations?.map(r => r.dish_id) || [];

      // Add AI response message
      const aiMessage: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.message,
        products: products.length > 0 ? products : undefined,
        title: products.length > 0 ? 'I picked these for you' : undefined,
        dishIds: dishIds.length > 0 ? dishIds : undefined,
      };

      setMessages(prev => [...prev, aiMessage]);
      setConversationId(response.data.conversation_id);
      setRetryCount(0);

      // Show helpful message if no recommendations
      if (products.length === 0) {
        showInfo('No specific recommendations', 'Try asking more specifically about what you\'d like to eat');
      }
    } catch (err: any) {
      setIsSendingMessage(false);
      const errorMessage = err?.message || 'Failed to get AI response';
      setError(errorMessage);
      
      // Handle network errors with deduplication
      const { isNetworkError, handleConvexError } = require("@/utils/networkErrorHandler");
      if (isNetworkError(err)) {
        handleConvexError(err);
      } else {
        // Add error message to chat
        const errorMessageObj: Message = {
          id: Date.now() + 1,
            type: 'ai',
          content: 'Sorry, I\'m having trouble processing your request. Please try again.',
          products: undefined,
          title: undefined,
        };
        setMessages(prev => [...prev, errorMessageObj]);
        
        showError('Request failed', errorMessage);
      }
    } finally {
      setIsLoadingMessage(false);
    }
  }, [conversationId, locationState.location, sendChatMessage, showError, showInfo]);

  // Retry failed message
  const handleRetry = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find(m => m.type === 'user');
    if (lastUserMessage && retryCount < 3) {
      setRetryCount(prev => prev + 1);
      handleSendMessage(lastUserMessage.content);
    } else {
      showError('Max retries reached', 'Please try sending a new message');
    }
  }, [messages, retryCount, handleSendMessage, showError]);

  // Memoized render function for FlatList
  const renderMessageItem = useCallback(({ item: message }: { item: Message }) => {
    return (
      <View>
        {message.type === 'user' ? (
          <UserMessage
            message={message.content}
            userAvatarUri={userAvatarUri}
          />
        ) : (
          <AIMessage
            message={message.content}
            products={message.products}
            title={message.title}
            onAddToCart={message.products && message.products.length > 0 ? () => handleAddToCart(message) : undefined}
            isLoadingCart={isAddingToCart}
          />
        )}
      </View>
    );
  }, [userAvatarUri, handleAddToCart, isAddingToCart]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: Message) => item.id.toString(), []);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleValue.value },
      { translateY: translateYValue.value }
    ],
    opacity: opacityValue.value,
  }));

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      transparent={false}
      onRequestClose={handleCloseWithAnimation}
      statusBarTranslucent={true}
      presentationStyle="fullScreen"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={[COLORS.homePink, COLORS.homeCream]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            paddingTop: topPosition,
            zIndex: 99999, // High z-index but lower than bottom tabs (999999)
          }}
        >
        <Animated.View style={[animatedContainerStyle, { flex: 1 }]}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: COLORS.glass.white,
            shadowColor: COLORS.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <TouchableOpacity 
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: COLORS.black,
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }} 
              onPress={handleCloseWithAnimation} 
              activeOpacity={0.8}
            >
              <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                <Path
                  d="M15 5L5 15M5 5L15 15"
                  stroke={COLORS.darkGray}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CribNoshLogo size={120} variant="default" />
            </View>
          </View>

          {/* Messages */}
          <FlatList
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderMessageItem}
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <Text style={{ fontSize: 16, color: COLORS.gray[600], textAlign: 'center' }}>
                  Start a conversation with CribNosh AI to discover amazing meals!
                </Text>
              </View>
            }
            ListFooterComponent={
              <>
                {/* Loading indicator */}
                {isLoadingMessage && (
                  <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar 
                      source={require('../../assets/images/adaptive-icon.png')} 
                      size="md"
                      glass={true}
                      elevated={true}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <ActivityIndicator size="small" color={COLORS.gray[500]} />
                      <Text style={{ marginTop: 8, fontSize: 14, color: COLORS.gray[500] }}>
                        AI is thinking...
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* Error state with retry */}
                {error && !isLoadingMessage && (
                  <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                    <View style={{
                      backgroundColor: COLORS.glass.white80,
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: '#EF4444',
                    }}>
                      <Text style={{ fontSize: 14, color: '#EF4444', marginBottom: 8 }}>
                        {error}
                      </Text>
                      {retryCount < 3 && (
                        <TouchableOpacity
                          onPress={handleRetry}
                          style={{
                            backgroundColor: COLORS.red,
                            borderRadius: 8,
                            paddingVertical: 8,
                            paddingHorizontal: 16,
                            alignSelf: 'flex-start',
                          }}
                        >
                          <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: '600' }}>
                            Retry
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </>
            }
            contentContainerStyle={{ paddingVertical: 20, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={true}
            style={{ flex: 1 }}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
            updateCellsBatchingPeriod={50}
          />

          {/* Chat Input */}
          <ChatInput onSend={handleSendMessage} isLoading={isLoadingMessage || isSendingMessage} />
        </Animated.View>
      </LinearGradient>
      </KeyboardAvoidingView>
    </Modal>
  );
}; 