import { BlurView } from 'expo-blur';
import React from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';
import { BackgroundElements } from './KitchenMainScreen/BackgroundElements';
import { FoodIllustrations } from './KitchenMainScreen/FoodIllustrations';
import { KitchenBottomSheet } from './KitchenMainScreen/KitchenBottomSheet';
import { KitchenIntroCard } from './KitchenMainScreen/KitchenIntroCard';

const { width, height } = Dimensions.get('window');

interface KitchenMainScreenProps {
  kitchenName?: string;
  cuisine?: string;
  rating?: string;
  deliveryTime?: string;
  cartItems?: number;
  onCartPress?: () => void;
  onHeartPress?: () => void;
  onSearchPress?: () => void;
  onClose?: () => void;
}

export const KitchenMainScreen: React.FC<KitchenMainScreenProps> = ({
  kitchenName = "Stans Kitchen",
  cuisine = "African cuisine (Top Rated)",
  deliveryTime = "30-45 Mins",
  cartItems = 2,
  onCartPress,
  onHeartPress,
  onSearchPress,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Background with blur */}
      <View style={styles.background}>
        <BackgroundElements />
        <FoodIllustrations />
        
        {/* Blur overlay */}
        <BlurView intensity={82.5} tint="light" style={styles.blurOverlay} />
      </View>

      {/* Close button */}
      <TouchableOpacity 
        style={[styles.closeButton, { top: insets.top + 20 }]} 
        onPress={onClose} 
        activeOpacity={0.8}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 6L6 18M6 6L18 18"
            stroke="#4C3F59"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      {/* Kitchen Intro Card */}
      <View style={[styles.introCardContainer, { top: insets.top + 100 }]}>
        <KitchenIntroCard 
          kitchenName={kitchenName}
          cuisine={cuisine}
        />
      </View>

      {/* Bottom Sheet */}
      <KitchenBottomSheet
        deliveryTime={deliveryTime}
        cartItems={cartItems}
        onCartPress={onCartPress}
        onHeartPress={onHeartPress}
        onSearchPress={onSearchPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF599',
  },
  background: {
    position: 'absolute',
    width: width,
    height: height,
    left: 0,
    top: 0,
  },
  blurOverlay: {
    position: 'absolute',
    width: width,
    height: height,
    left: 0,
    top: 0,
    backgroundColor: 'rgba(250, 250, 250, 0.75)',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introCardContainer: {
    position: 'absolute',
    width: Math.min(346, width - 28),
    height: 74,
    left: 14,
    zIndex: 100,
  },
});

export default KitchenMainScreen; 