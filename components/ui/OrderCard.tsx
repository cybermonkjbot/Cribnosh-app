import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

// Import the OrderStatus type from the orders page
export type OrderStatus = 'preparing' | 'ready' | 'on-the-way' | 'delivered' | 'cancelled';
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

interface OrderCardProps {
  time: string;
  description: string;
  price: string;
  status?: OrderStatus;
  estimatedTime?: string;
  orderNumber?: string;
  items?: string[];
  orderType?: OrderType;
  groupOrder?: GroupOrder;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  showSeparator?: boolean;
  index?: number;
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
        icon: 'checkmark-circle-outline' as keyof typeof Ionicons.glyphMap,
      };
    case 'on-the-way':
      return {
        backgroundColor: 'rgba(33, 150, 243, 0.12)',
        textColor: '#1565C0',
        text: 'On the way',
        icon: 'car-outline' as keyof typeof Ionicons.glyphMap,
      };
    case 'delivered':
      return {
        backgroundColor: 'rgba(156, 39, 176, 0.12)',
        textColor: '#7B1FA2',
        text: 'Delivered',
        icon: 'checkmark-done-circle-outline' as keyof typeof Ionicons.glyphMap,
      };
    case 'cancelled':
      return {
        backgroundColor: 'rgba(244, 67, 54, 0.12)',
        textColor: '#C62828',
        text: 'Cancelled',
        icon: 'close-circle-outline' as keyof typeof Ionicons.glyphMap,
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
  orderType,
  groupOrder,
  icon,
  onPress,
  style,
  showSeparator = true,
  index = 0,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const delay = index * 100; // Stagger animation for each card
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const statusStyle = status ? getStatusStyle(status) : null;
  const isOngoingOrder = status && status !== 'delivered' && status !== 'cancelled';
  const isGroupOrder = orderType === 'group' && groupOrder;

  const CardContent = (
    <Animated.View 
      style={[
        styles.orderItem, 
        style,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.orderDetails}>
        <View style={styles.orderHeader}>
          <View style={styles.timeAndOrderNumber}>
            <Text style={styles.orderTime} numberOfLines={1}>
              {time.replace(',', ' •')}
            </Text>
            {orderNumber && (
              <Text style={styles.orderNumber} numberOfLines={1}>
                {orderNumber}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            {isGroupOrder && (
              <GroupAvatars users={groupOrder.users} totalUsers={groupOrder.totalUsers} />
            )}
            {statusStyle && (
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                <Ionicons 
                  name={statusStyle.icon} 
                  size={14} 
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
            <Text style={styles.itemsLabel}>Items:</Text>
            {items.slice(0, 2).map((item, itemIndex) => (
              <Text key={itemIndex} style={styles.itemText}>
                • {item}
              </Text>
            ))}
            {items.length > 2 && (
              <Text style={styles.moreItemsText}>
                +{items.length - 2} more items
              </Text>
            )}
          </View>
        )}
        
        <View style={styles.orderFooter}>
          <Text style={styles.orderPrice}>{price}</Text>
          {estimatedTime && (
            <View style={styles.estimatedTimeContainer}>
              <Ionicons 
                name="time-outline" 
                size={12} 
                color="#687076" 
                style={styles.timeIcon}
              />
              <Text style={styles.estimatedTime}>{estimatedTime}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>›</Text>
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
    paddingVertical: 16,
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
    marginRight: 16,
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
    marginBottom: 4,
  },
  timeAndOrderNumber: {
    flex: 1,
    marginRight: 8,
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
    color: '#9CA3AF',
    fontWeight: '400',
    marginTop: 2,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
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
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDescription: {
    fontSize: 16,
    color: '#11181C',
    marginBottom: 8,
    fontWeight: '600',
    lineHeight: 20,
  },
  itemsContainer: {
    marginBottom: 8,
  },
  itemsLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
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
  orderPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
  },
  estimatedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 4,
  },
  estimatedTime: {
    fontSize: 14,
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
}); 