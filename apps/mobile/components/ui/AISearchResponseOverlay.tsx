import { useAuthContext } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/lib/ToastContext';
import { DishRecommendation } from '@/types/customer';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from './Avatar';
import { InlineAILoader } from './InlineAILoader';

// App color constants - matching AIChatDrawer
const COLORS = {
  primary: '#094327',
  secondary: '#0B9E58',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#111827',
  gray: {
    50: '#FAFFFA',
    100: '#F7FAFC',
    200: '#F0F0F0',
    300: '#E2E8F0',
    400: '#A0AEC0',
    500: '#6B7280',
    600: '#374151',
    700: '#2D3748',
    800: '#1A202C',
  },
  glass: {
    white: 'rgba(255, 255, 255, 0.1)',
    white80: 'rgba(255, 255, 255, 0.8)',
    white20: 'rgba(255, 255, 255, 0.2)',
    white30: 'rgba(255, 255, 255, 0.3)',
  },
  red: '#dc2626',
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
        return COLORS.red;
      case 'bestfit':
        return COLORS.red;
      case 'highprotein':
        return COLORS.secondary;
      default:
        return COLORS.red;
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
export interface ProductCardProps {
  dish_id?: string;
  name: string;
  price: string;
  image: any;
  badge?: { text: string; type?: 'hot' | 'bestfit' | 'highprotein' };
  hasFireEmoji?: boolean;
}

// Helper function to transform dish recommendation to product card props
// Note: This function is also exported from @/utils/aiChatUtils for reuse
export function transformDishToProductCard(dish: DishRecommendation): ProductCardProps {
  const imageSource = dish.image_url 
    ? { uri: dish.image_url.startsWith('http') ? dish.image_url : `https://cribnosh.com${dish.image_url}` }
    : require('../../assets/images/cribnoshpackaging.png');

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
    price: `£${(dish.price / 100).toFixed(0)}`,
    image: imageSource,
    badge: badgeText ? { text: badgeText, type: badgeType } : undefined,
    hasFireEmoji,
  };
}

interface SelectableProductCardProps extends ProductCardProps {
  isSelected: boolean;
  onPress: () => void;
}

const SelectableProductCard: React.FC<SelectableProductCardProps> = ({ 
  name, 
  price, 
  image, 
  badge,
  hasFireEmoji = false,
  isSelected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: 140,
        borderRadius: 16,
        padding: 12,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? COLORS.red : COLORS.gray[200],
        backgroundColor: isSelected ? 'rgba(220, 38, 38, 0.05)' : COLORS.white,
      }}
    >
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
      
      {isSelected && (
        <View style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: COLORS.red,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Ionicons name="checkmark" size={16} color={COLORS.white} />
        </View>
      )}
    </TouchableOpacity>
  );
};

interface AISearchResponseOverlayProps {
  message: string;
  products: ProductCardProps[];
  dishIds: string[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onContinueConversation: () => void;
  conversationId?: string;
}

export const AISearchResponseOverlay: React.FC<AISearchResponseOverlayProps> = ({
  message,
  products,
  dishIds,
  isLoading = false,
  error = null,
  onRetry,
  onContinueConversation,
}) => {
  const { showError, showSuccess } = useToast();
  const { isAuthenticated, token, checkTokenExpiration, refreshAuthState } = useAuthContext();
  const { addToCart: addToCartAction, isLoading: isAddingToCart } = useCart();
  const [selectedDishIds, setSelectedDishIds] = useState<Set<string>>(new Set());

  // Toggle selection for a dish
  const toggleSelection = useCallback((dishId: string) => {
    setSelectedDishIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dishId)) {
        newSet.delete(dishId);
      } else {
        newSet.add(dishId);
      }
      return newSet;
    });
  }, []);

  // Handle add to cart for selected items
  const handleAddSelectedToCart = useCallback(async () => {
    if (selectedDishIds.size === 0) {
      showError('No items selected', 'Please select items to add to cart');
      return;
    }

    if (!isAuthenticated || !token) {
      showError('Authentication Required', 'Please sign in to add items to cart');
      return;
    }

    const isExpired = checkTokenExpiration();
    if (isExpired) {
      await refreshAuthState();
      showError('Session Expired', 'Please sign in again to add items to cart');
      return;
    }

    try {
      const addPromises = Array.from(selectedDishIds).map(dishId =>
        addToCartAction(dishId, 1)
      );

      await Promise.all(addPromises);
      showSuccess('Added to cart', `${selectedDishIds.size} item(s) added to your cart`);
      setSelectedDishIds(new Set());
    } catch (err: any) {
      const errorMessage = err?.data?.error?.message || err?.message || 'Failed to add items to cart';
      showError('Cart error', errorMessage);
    }
  }, [selectedDishIds, isAuthenticated, token, checkTokenExpiration, refreshAuthState, addToCartAction, showSuccess, showError]);

  // Handle add all to cart
  const handleAddAllToCart = useCallback(async () => {
    if (dishIds.length === 0) {
      showError('No items to add', 'No suggestions available');
      return;
    }

    if (!isAuthenticated || !token) {
      showError('Authentication Required', 'Please sign in to add items to cart');
      return;
    }

    const isExpired = checkTokenExpiration();
    if (isExpired) {
      await refreshAuthState();
      showError('Session Expired', 'Please sign in again to add items to cart');
      return;
    }

    try {
      const addPromises = dishIds.map(dishId =>
        addToCartAction(dishId, 1)
      );

      await Promise.all(addPromises);
      showSuccess('Added to cart', `${dishIds.length} item(s) added to your cart`);
      setSelectedDishIds(new Set());
    } catch (err: any) {
      const errorMessage = err?.data?.error?.message || err?.message || 'Failed to add items to cart';
      showError('Cart error', errorMessage);
    }
  }, [dishIds, isAuthenticated, token, checkTokenExpiration, refreshAuthState, addToCartAction, showSuccess, showError]);

  if (isLoading) {
    return <InlineAILoader isVisible={true} />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorHeader}>
            <Ionicons name="alert-circle-outline" size={20} color={COLORS.red} style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
          {onRetry && (
            <TouchableOpacity
              onPress={onRetry}
              style={styles.retryButton}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* AI Avatar and Message */}
        <View style={styles.header}>
          <Avatar 
            source={require('../../assets/images/adaptive-icon.png')} 
            size="sm"
            glass={true}
            elevated={true}
          />
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        </View>

        {/* Product Cards with Selection */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>I picked these for you</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsScroll}
          >
            {products.map((product, index) => {
              const dishId = product.dish_id || dishIds[index];
              const isSelected = dishId ? selectedDishIds.has(dishId) : false;
              
              return (
                <SelectableProductCard
                  key={index}
                  {...product}
                  isSelected={isSelected}
                  onPress={() => dishId && toggleSelection(dishId)}
                />
              );
            })}
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {selectedDishIds.size > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.addSelectedButton]}
              onPress={handleAddSelectedToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart && (
                <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 8 }} />
              )}
              <Text style={styles.actionButtonText}>
                {isAddingToCart ? 'Adding...' : `Add selected (${selectedDishIds.size})`}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.addAllButton]}
            onPress={handleAddAllToCart}
            disabled={isAddingToCart}
          >
            {isAddingToCart && (
              <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 8 }} />
            )}
            <Text style={styles.actionButtonText}>
              {isAddingToCart ? 'Adding...' : 'Add all suggestions to cart'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.continueButton]}
            onPress={onContinueConversation}
          >
            <Text style={[styles.actionButtonText, styles.continueButtonText]}>
              Continue conversation
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  content: {
    backgroundColor: COLORS.glass.white80,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glass.white30,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  messageContainer: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.gray[700],
    fontWeight: '400',
  },
  productsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginBottom: 12,
  },
  productsScroll: {
    paddingRight: 20,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSelectedButton: {
    backgroundColor: COLORS.red,
  },
  addAllButton: {
    backgroundColor: COLORS.red,
  },
  continueButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonText: {
    color: COLORS.red,
  },
  errorContainer: {
    backgroundColor: COLORS.glass.white80,
    borderRadius: 16,
    padding: 16,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  errorIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.gray[700],
    fontWeight: '400',
  },
  retryButton: {
    backgroundColor: COLORS.red,
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

