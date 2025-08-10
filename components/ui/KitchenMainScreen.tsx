import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Path, Svg } from 'react-native-svg';
import { Mascot } from '../Mascot';
import { BackgroundElements } from './KitchenMainScreen/BackgroundElements';
import { FoodIllustrations } from './KitchenMainScreen/FoodIllustrations';
import { KitchenBottomSheet } from './KitchenMainScreen/KitchenBottomSheet';
import { KitchenIntroCard } from './KitchenMainScreen/KitchenIntroCard';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface KitchenMainScreenProps {
  kitchenName?: string;
  cuisine?: string;
  rating?: string;
  deliveryTime?: string;
  cartItems?: number;
  distance?: string;
  onCartPress?: () => void;
  onHeartPress?: () => void;
  onSearchPress?: () => void;
  onClose?: () => void;
}

export const KitchenMainScreen: React.FC<KitchenMainScreenProps> = ({
  kitchenName = "Amara's Kitchen",
  cuisine = "Nigerian",
  deliveryTime = "30-45 Mins",
  cartItems = 2,
  distance = "0.8 km",
  onCartPress,
  onHeartPress,
  onSearchPress,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [playIconScale] = useState(new Animated.Value(1));

  // Continuous play icon animation
  React.useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(playIconScale, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(playIconScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [playIconScale]);

  const handlePlayPress = () => {
    // Play button press handler
    console.log('Play button pressed');
  };

  return (
    <View style={styles.container}>
      {/* Background with blur */}
      <View style={styles.background}>
        <BackgroundElements />
        <FoodIllustrations />
        
        {/* Blur overlay */}
        <BlurView intensity={82.5} tint="light" style={styles.blurOverlay} />
      </View>

      {/* Header Container with Kitchen Info Card and Close Button */}
      <View style={[styles.headerContainer, { top: insets.top + 20 }]}>
        {/* Kitchen Intro Card */}
        <View style={styles.introCardContainer}>
          <KitchenIntroCard 
            kitchenName={kitchenName}
            cuisine={cuisine}
          />
        </View>

        {/* Close button */}
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose} 
          activeOpacity={0.8}
        >
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path
              d="M15 5L5 15M5 5L15 15"
              stroke="#4C3F59"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <KitchenBottomSheet
        deliveryTime="30-45 mins"
        cartItems={3}
        kitchenName={kitchenName}
        distance={distance}
        onCartPress={() => console.log('Cart pressed')}
        onHeartPress={() => console.log('Heart pressed')}
        onSearchSubmit={(query) => console.log('Search submitted:', query)}
      />

      {/* Floating Play Button */}
      <TouchableOpacity 
        style={styles.floatingPlayButton} 
        onPress={handlePlayPress} 
        activeOpacity={0.8}
      >
        <BlurView
          intensity={60}
          tint="light"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 50,
          }}
        />
        <Animated.View style={{ 
          position: 'absolute',
          transform: [{ scale: playIconScale }] 
        }}>
          <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
            <Circle cx="18" cy="18" r="18" fill="rgba(76, 63, 89, 0.3)" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1" />
            <Path d="M15 12 L27 18 L15 24 Z" fill="#094327" />
          </Svg>
        </Animated.View>
      </TouchableOpacity>

      {/* Mascot */}
      <View style={styles.mascotContainer}>
        <Mascot emotion="excited" size={320} />
      </View>
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
  headerContainer: {
    position: 'absolute',
    width: width,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  introCardContainer: {
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingPlayButton: {
    position: 'absolute',
    bottom: height * 0.6,
    right: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1000,
  },
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.5,
    left: 20,
    zIndex: 50,
  },
});

export default KitchenMainScreen; 