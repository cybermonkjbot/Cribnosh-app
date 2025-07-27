import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface OrderCardProps {
  time: string;
  description: string;
  price: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  showSeparator?: boolean;
  index?: number;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  time,
  description,
  price,
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
        <Text style={styles.orderTime}>{time}</Text>
        <Text style={styles.orderDescription}>{description}</Text>
        <Text style={styles.orderPrice}>{price}</Text>
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
    alignItems: 'center',
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
  },
  orderDetails: {
    flex: 1,
  },
  orderTime: {
    fontSize: 14,
    color: '#687076',
    marginBottom: 4,
    fontWeight: '500',
  },
  orderDescription: {
    fontSize: 16,
    color: '#11181C',
    marginBottom: 4,
    fontWeight: '600',
    lineHeight: 20,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
  },
  arrowContainer: {
    marginRight: 4,
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