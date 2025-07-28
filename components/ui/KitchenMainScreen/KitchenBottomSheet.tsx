import { BlurView } from 'expo-blur';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { CartButton } from '../CartButton';
import { KitchenBottomSheetContent } from './KitchenBottomSheetContent';
import { KitchenBottomSheetHeader } from './KitchenBottomSheetHeader';

const { width, height } = Dimensions.get('window');

interface KitchenBottomSheetProps {
  deliveryTime: string;
  cartItems: number;
  onCartPress?: () => void;
  onHeartPress?: () => void;
  onSearchPress?: () => void;
}

export const KitchenBottomSheet: React.FC<KitchenBottomSheetProps> = ({
  deliveryTime,
  cartItems,
  onCartPress,
  onHeartPress,
  onSearchPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Backdrop blur */}
      <BlurView intensity={27.5} tint="light" style={styles.backdrop} />
      
      {/* Bottom sheet content */}
      <View style={styles.bottomSheet}>
        {/* Header */}
        <KitchenBottomSheetHeader
          deliveryTime={deliveryTime}
          onHeartPress={onHeartPress}
          onSearchPress={onSearchPress}
        />
        
        {/* Content */}
        <KitchenBottomSheetContent />
        
        {/* Cart Button */}
        <CartButton
          quantity={cartItems}
          onPress={onCartPress || (() => {})}
          variant="view"
          position="absolute"
          showIcon={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.57, // 57% of screen height
  },
  backdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
  },
  bottomSheet: {
    position: 'absolute',
    width: width,
    height: '100%',
    left: 0,
    top: 0,
    backgroundColor: '#02120A',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
}); 