import { Ionicons } from '@expo/vector-icons';
import { CheckCircle, CheckCircle2, Clock, Package } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { ImageStack } from './ImageStack';

// Import the OrderStatus type from the orders page
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on-the-way' | 'cancelled' | 'completed';
export type OrderType = 'individual' | 'group';

// User interface for group orders
interface GroupUser {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  color?: string;
}

// Group order interface
interface GroupOrder {
  id: string;
  users: GroupUser[];
  totalUsers: number;
  isActive: boolean;
}

interface OrderItemWithImage {
  _id?: string;
  dish_id?: string;
  name?: string;
  image_url?: string;
  image_urls?: string[];
  images?: string[];
}

interface OrderCardProps {
  time: string;
  description: string;
  price: string;
  status?: OrderStatus;
  estimatedTime?: string;
  orderNumber?: string;
  items?: string[];
  orderItems?: OrderItemWithImage[];
  orderType?: OrderType;
  groupOrder?: GroupOrder;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  showSeparator?: boolean;
  index?: number;
  // Food Creator-specific props
  showFoodCreatorEarnings?: boolean;
  totalAmount?: number; // Total amount in pence
  onQuickAction?: (action: 'accept' | 'preparing' | 'ready' | 'complete') => void;
  showQuickActions?: boolean;
}


// Group Avatar Component
const GroupAvatars: React.FC<{ users: GroupUser[]; totalUsers: number }> = ({ users, totalUsers }) => {
  const maxVisibleAvatars = 3;
  const visibleUsers = users.slice(0, maxVisibleAvatars);
  const remainingCount = totalUsers - maxVisibleAvatars;

  return (
    <View style={styles.groupAvatarsContainer}>
      {visibleUsers.map((user, index) => (
        <View
          key={user.id}
          style={[
            styles.avatar,
            {
              backgroundColor: user.color || '#6B7280',
              marginLeft: index > 0 ? -8 : 0,
              zIndex: visibleUsers.length - index,
            },
          ]}
        >
          <Text style={styles.avatarText}>
            {user.initials || user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      ))}
      {remainingCount > 0 && (
        <View style={[styles.avatar, styles.remainingAvatar]}>
          <Text style={styles.remainingText}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
};

// Helper function to get status styling
const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return {
        backgroundColor: 'rgba(158, 158, 158, 0.12)',
        textColor: '#616161',
        text: 'Pending',
        icon: 'hourglass-outline' as keyof typeof Ionicons.glyphMap,
      };
    case 'confirmed':
      return {
        backgroundColor: 'rgba(33, 150, 243, 0.12)',
        textColor: '#1565C0',
        text: 'Confirmed',
        icon: 'checkmark-circle-outline' as keyof typeof Ionicons.glyphMap,
      };
    case 'preparing':
      return {
        backgroundColor: 'rgba(255, 193, 7, 0.12)',
        textColor: '#B8860B',
        text: 'Preparing',
        icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
      };
    case 'ready':
      return {
        backgroundColor: 'rgba(76, 175, 80, 0.12)',
        textColor: '#2E7D32',
        text: 'Ready',
        icon: 'restaurant-outline' as keyof typeof Ionicons.glyphMap,
      };
    case 'on-the-way':
      return {
        backgroundColor: 'rgba(33, 150, 243, 0.12)',
        textColor: '#1565C0',
        text: 'On the way',
        icon: 'car-outline' as keyof typeof Ionicons.glyphMap,
      };
    case 'cancelled':
      return {
        backgroundColor: 'rgba(244, 67, 54, 0.12)',
        textColor: '#C62828',
        text: 'Cancelled',
        icon: 'close-circle-outline' as keyof typeof Ionicons.glyphMap,
      };
    case 'completed':
      return {
        backgroundColor: 'rgba(76, 175, 80, 0.12)',
        textColor: '#2E7D32',
        text: 'Completed',
        icon: 'checkmark-done-circle-outline' as keyof typeof Ionicons.glyphMap,
      };
    default:
      return {
        backgroundColor: 'rgba(158, 158, 158, 0.12)',
        textColor: '#616161',
        text: 'Unknown',
        icon: 'help-circle-outline' as keyof typeof Ionicons.glyphMap,
      };
  }
};

export const OrderCard: React.FC<OrderCardProps> = ({
  time,
  description,
  price,
  status,
  estimatedTime,
  orderNumber,
  items,
  orderItems,
  orderType,
  groupOrder,
  icon,
  onPress,
  style,
  showSeparator = true,
  index = 0,
  showFoodCreatorEarnings = false,
  totalAmount,
  onQuickAction,
  showQuickActions = false,
}) => {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.95);

  useEffect(() => {
    const delay = index * 100; // Stagger animation for each card

    fadeAnim.value = withDelay(delay, withTiming(1, { duration: 600 }));
    slideAnim.value = withDelay(delay, withTiming(0, { duration: 600 }));
    scaleAnim.value = withDelay(delay, withTiming(1, { duration: 600 }));
  }, [index, fadeAnim, slideAnim, scaleAnim]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [
        { translateY: slideAnim.value },
        { scale: scaleAnim.value },
      ],
    };
  });

  const statusStyle = status ? getStatusStyle(status) : null;
  const isOngoingOrder = status && status !== 'cancelled' && status !== 'completed';
  const isGroupOrder = orderType === 'group' && groupOrder;

  // Calculate foodCreator earnings (85% of total, 15% platform fee)
  const calculateFoodCreatorEarnings = (total: number): number => {
    const platformFee = Math.round(total * 0.15);
    return total - platformFee;
  };

  const foodCreatorEarnings = totalAmount ? calculateFoodCreatorEarnings(totalAmount) : null;
  const foodCreatorEarningsDisplay = foodCreatorEarnings ? `£${(foodCreatorEarnings / 100).toFixed(2)}` : null;

  // Get available quick actions based on status
  const getAvailableActions = (): ('accept' | 'preparing' | 'ready' | 'complete')[] => {
    if (!status) return [];
    switch (status) {
      case 'pending':
        return ['accept'];
      case 'confirmed':
        return ['preparing'];
      case 'preparing':
        return ['ready'];
      case 'ready':
        return ['complete'];
      default:
        return [];
    }
  };

  const availableActions = getAvailableActions();
  const hasActions = showQuickActions && availableActions.length > 0 && onQuickAction;

  // Get items with images for stacking
  // Flatten items to include all images (one item per image)
  const itemsWithImages: OrderItemWithImage[] = [];
  if (orderItems && orderItems.length > 0) {
    orderItems.forEach((item) => {
      // Get images from various possible fields
      const images = item.image_urls || item.images || (item.image_url ? [item.image_url] : []);
      if (images.length > 0) {
        // Filter out invalid/empty URLs
        const validImages = images.filter(url => url && typeof url === 'string' && url.trim().length > 0);
        if (validImages.length > 0) {
          // Create one entry per image for stacking
          validImages.forEach((imageUrl, idx) => {
            itemsWithImages.push({
              ...item,
              _id: `${item._id || item.dish_id || idx}_${idx}`,
              image_url: imageUrl,
            });
          });
        }
      }
    });
  }

  // Render stacked images or fallback to icon
  const renderImageStack = () => {
    if (itemsWithImages.length > 0) {
      return (
        <View style={styles.imageStackContainer}>
          <ImageStack items={itemsWithImages} size="small" maxItems={4} />
        </View>
      );
    }
    // Fallback to icon if no images available
    return (
      <View style={styles.iconContainer}>
        {icon}
      </View>
    );
  };

  const CardContent = (
    <Animated.View
      style={[
        styles.orderItem,
        style,
        animatedStyle,
      ]}
    >
      {renderImageStack()}
      <View style={styles.orderDetails}>
        <View style={styles.orderHeader}>
          <View style={styles.timeAndOrderNumber}>
            <View style={styles.timeAndIdRow}>
              <Text style={styles.orderTime} numberOfLines={1}>
                {time.replace(',', ' •')}
              </Text>
              {orderNumber && (
                <Text style={styles.orderNumber} numberOfLines={1}>
                  {orderNumber}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            {isGroupOrder && (
              <GroupAvatars users={groupOrder.users} totalUsers={groupOrder.totalUsers} />
            )}
            {statusStyle && (
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                <Ionicons
                  name={statusStyle.icon}
                  size={13}
                  color={statusStyle.textColor}
                  style={styles.statusIcon}
                />
                <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
                  {statusStyle.text}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.orderDescription}>{description}</Text>

        {/* Show items for ongoing orders */}
        {isOngoingOrder && items && items.length > 0 && (
          <View style={styles.itemsContainer}>
            <View style={styles.itemsRow}>
              <Text style={styles.itemsLabel}>Items: </Text>
              <Text style={styles.itemText}>
                • {items[0]}
              </Text>
            </View>
            {items.length > 1 && (
              <Text style={styles.itemText}>
                • {items[1]}
              </Text>
            )}
            {items.length > 2 && (
              <Text style={styles.moreItemsText}>
                +{items.length - 2} more items
              </Text>
            )}
          </View>
        )}

        <View style={styles.orderFooter}>
          <View style={styles.priceContainer}>
            <View>
              <Text style={styles.orderPrice}>{price}</Text>
              {showFoodCreatorEarnings && foodCreatorEarningsDisplay && (
                <Text style={styles.foodCreatorEarningsText}>
                  You earn: {foodCreatorEarningsDisplay}
                </Text>
              )}
            </View>
          </View>
          {estimatedTime && (
            <View style={styles.estimatedTimeContainer}>
              <Ionicons
                name="time-outline"
                size={11}
                color="#687076"
                style={styles.timeIcon}
              />
              <Text style={styles.estimatedTime}>{estimatedTime}</Text>
            </View>
          )}
        </View>

        {/* Quick Actions for Food Creator */}
        {hasActions && (
          <View style={styles.quickActionsContainer} pointerEvents="box-none">
            {availableActions.includes('accept') && (
              <TouchableOpacity
                style={[styles.quickActionButton, styles.acceptButton]}
                onPress={() => onQuickAction?.('accept')}
                activeOpacity={0.7}
              >
                <CheckCircle size={16} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Accept</Text>
              </TouchableOpacity>
            )}
            {availableActions.includes('preparing') && (
              <TouchableOpacity
                style={[styles.quickActionButton, styles.preparingButton]}
                onPress={() => onQuickAction?.('preparing')}
                activeOpacity={0.7}
              >
                <Clock size={16} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Start Preparing</Text>
              </TouchableOpacity>
            )}
            {availableActions.includes('ready') && (
              <TouchableOpacity
                style={[styles.quickActionButton, styles.readyButton]}
                onPress={() => onQuickAction?.('ready')}
                activeOpacity={0.7}
              >
                <Package size={16} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Mark Ready</Text>
              </TouchableOpacity>
            )}
            {availableActions.includes('complete') && (
              <TouchableOpacity
                style={[styles.quickActionButton, styles.completeButton]}
                onPress={() => onQuickAction?.('complete')}
                activeOpacity={0.7}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.touchableContainer}
      >
        {CardContent}
        {showSeparator && <View style={styles.separator} />}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {CardContent}
      {showSeparator && <View style={styles.separator} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  touchableContainer: {
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    marginRight: 12,
    marginLeft: 4,
    marginTop: 2,
  },
  orderDetails: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  timeAndOrderNumber: {
    flex: 1,
    marginRight: 8,
  },
  timeAndIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  orderTime: {
    fontSize: 14,
    color: '#687076',
    fontWeight: '500',
  },
  orderNumber: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  groupAvatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  remainingAvatar: {
    backgroundColor: '#9CA3AF',
  },
  remainingText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'white',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statusIcon: {
    marginRight: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderDescription: {
    fontSize: 16,
    color: '#11181C',
    marginBottom: 6,
    fontWeight: '600',
    lineHeight: 20,
  },
  itemsContainer: {
    marginBottom: 6,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  itemsLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  itemText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: 2,
  },
  moreItemsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
  },
  foodCreatorEarningsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#0B9E58',
  },
  preparingButton: {
    backgroundColor: '#F59E0B',
  },
  readyButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  estimatedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 3,
  },
  estimatedTime: {
    fontSize: 13,
    color: '#687076',
    fontWeight: '500',
  },
  arrowContainer: {
    marginRight: 4,
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: '#687076',
    fontWeight: '300',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(229, 231, 235, 0.5)',
    marginTop: 8,
    marginHorizontal: 12,
  },
  imageStackContainer: {
    marginRight: 12,
    marginLeft: 4,
    marginTop: 2,
  },
});

