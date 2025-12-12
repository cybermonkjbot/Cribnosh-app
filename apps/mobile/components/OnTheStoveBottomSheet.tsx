import { ExternalLink } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import BottomSheetBase from './BottomSheetBase';
import CompactMealSelection from './CompactMealSelection';
import CustomLiveButton from './CustomLiveButton';
import { AISparkles } from './ui/AISparkles';
import LoveThisButton from './ui/LoveThisButton';
import { OnTheStoveBottomSheetSkeleton } from './ui/OnTheStoveBottomSheetSkeleton';

// Screen dimensions and snap point constants (following search drawer pattern)
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = Math.min(SCREEN_HEIGHT * 0.85, 600); // Max 85% of screen or 600px
const COLLAPSED_HEIGHT = 200; // Slightly higher than search drawer for content visibility

// Snap points represent the visible height of the drawer - no closed state
const SNAP_POINTS = {
  COLLAPSED: COLLAPSED_HEIGHT,
  EXPANDED: DRAWER_HEIGHT
};


interface OnTheStoveBottomSheetProps {
  isVisible: boolean;
  isLoading?: boolean;
  onToggleVisibility: () => void;
  onShareLive?: () => void;
  onTreatSomeone?: () => void;
  onExpandedChange?: (isExpanded: boolean) => void;
  onSnapPointChange?: (snapPoint: number) => void;
  onAddToCart?: () => void;
  onQuantityChange?: (quantity: number) => void;
  onReaction?: (reactionType: 'heart' | 'fire' | 'clap' | 'star') => void;
  mealId?: string;
  isOrdered?: boolean;
  mealData?: {
    title: string;
    price: string;
    imageSource: any;
    description: string;
    kitchenName: string;
    ingredients?: string[];
    cookingTime?: string;
    chefBio?: string;
    liveViewers?: number;
  };
}
const OnTheStoveBottomSheet: React.FC<OnTheStoveBottomSheetProps> = ({
  isVisible,
  isLoading = false,
  onToggleVisibility,
  onShareLive,
  onTreatSomeone,
  onExpandedChange,
  onSnapPointChange,
  onAddToCart,
  onQuantityChange,
  onReaction,
  mealId,
  isOrdered = false,
  mealData = {
    title: 'Nigerian Jollof',
    price: '£ 16',
    imageSource: 'https://avatar.iran.liara.run/public/44',
    description: 'Watch Chef Minnie craft authentic Nigerian Jollof Rice live! Fresh tomatoes, aromatic spices, and perfectly seasoned rice - order now before it\'s ready.',
    kitchenName: 'Minnies Kitchen',
    ingredients: ['Premium Basmati Rice', 'Fresh Tomatoes', 'Bell Peppers', 'Red Onions', 'Secret Spice Blend'],
    cookingTime: '25 minutes',
    chefBio: 'Chef Minnie brings 15+ years of authentic Nigerian cooking experience. Every dish tells a story of tradition and love.',
    liveViewers: 127,
  },  
}) => {
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSnapPoint, setCurrentSnapPoint] = useState(0);

  // Fixed snap points - always provide both collapsed and expanded states
  // Use useMemo to ensure consistent snap points
  const snapPoints = useMemo(() => {
    const collapsedPercentage = Math.round((SNAP_POINTS.COLLAPSED / SCREEN_HEIGHT) * 100);
    const expandedPercentage = Math.round((SNAP_POINTS.EXPANDED / SCREEN_HEIGHT) * 100);
    return [`${collapsedPercentage}%`, `${expandedPercentage}%`];
  }, []);


  // Notify parent component when expanded state changes
  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  // Notify parent component when snap point changes
  useEffect(() => {
    onSnapPointChange?.(currentSnapPoint);
  }, [currentSnapPoint, onSnapPointChange]);

  const handleSheetChanges = useCallback((index: number) => {
    setCurrentSnapPoint(index);
    
    // Update expanded state based on snap point
    if (index === 1) {
      setIsExpanded(true);
    } else if (index === 0) {
      setIsExpanded(false);
    }
    
    if (index === -1) {
      onToggleVisibility();
    }
  }, [onToggleVisibility]);

  const handleQuantityChange = useCallback((value: number) => {
    onQuantityChange?.(value);
  }, [onQuantityChange]);
  
  const handleOrder = useCallback(() => {
    // Trigger add to cart when Order button is clicked
    onAddToCart?.();
  }, [onAddToCart]);



  const handleReaction = useCallback((liked: boolean) => {
    // Send heart reaction when user likes/unlikes
    if (liked && onReaction) {
      onReaction('heart');
    }
  }, [onReaction]);

  // Memoize button position style to avoid recalculation on every render
  const buttonPositionStyle = useMemo(() => ({
    position: 'absolute' as const,
    bottom: (currentSnapPoint === 1 ? SNAP_POINTS.EXPANDED : SNAP_POINTS.COLLAPSED) + 20,
    left: 23,
    zIndex: 1000,
  }), [currentSnapPoint]);

  // Always render the sheet when isVisible is true
  if (!isVisible) {
    return null;
  }

  // Show skeleton when loading
  if (isLoading) {
    return (
      <>
        {/* Love This Button - positioned above the sheet and follows its movement */}
        <View style={buttonPositionStyle}>
          <LoveThisButton onLikeChange={onReaction ? handleReaction : undefined} />
        </View>
        
        {/* Skeleton Loading State */}
        <OnTheStoveBottomSheetSkeleton 
          isVisible={true} 
          isExpanded={isExpanded} 
        />
      </>
    );
  }

  return (
    <>
      {/* Love This Button - positioned above the sheet and follows its movement */}
      <View style={buttonPositionStyle}>
        <LoveThisButton onLikeChange={onReaction ? handleReaction : undefined} />
      </View>
      
      <BottomSheetBase
        snapPoints={snapPoints}
        index={0}
        onChange={handleSheetChanges}
        enablePanDownToClose={false}
        backgroundStyle={{
          backgroundColor: 'rgba(250, 255, 250, 0.9)',
          borderTopLeftRadius: 35,
          borderTopRightRadius: 35,
        }}

        containerStyle={{
          zIndex: 9999,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 0,
        }}
      >
        <View style={styles.contentContainer}>

          {/* Title with Sparkles Icon */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              #{mealData.title}
            </Text>
            
            {/* Sparkles Icon */}
            <View style={styles.sparklesContainer}>
              <AISparkles size={32} color="#094327" />
            </View>
          </View>

          {/* Description */}
          <Text
            style={styles.description}
            numberOfLines={4}
          >
            {mealData.description}
          </Text>

          {/* Compact Meal Selection */}
          <View style={styles.mealSelectionContainer}>
            <CompactMealSelection
              title={mealData.title}
              price={mealData.price}
              imageSource={mealData.imageSource}
              onChange={handleQuantityChange}
              onOrder={onAddToCart ? handleOrder : undefined}
              isOrdered={isOrdered}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Add to Cart Button */}
            {onAddToCart && (
              <CustomLiveButton
                text="Add to Cart"
                backgroundColor="#FF3B30"
                textColor="#FFFFFF"
                style={{ flex: 1, marginBottom: 12 }}
                onPress={onAddToCart}
              />
            )}

            {/* Share Live Button */}
            <CustomLiveButton
              text="Share live"
              backgroundColor="#094327"
              textColor="#E6FFE8"
              style={{ flex: 1 }}
              onPress={onShareLive}
            />

            {/* Treat Someone Button */}
            <CustomLiveButton
              text="Treat Someone"
              icon={<ExternalLink color="#FFFFFF" size={16} strokeWidth={1.33} />}
              backgroundColor="rgba(0, 0, 0, 0.3)"
              textColor="#FFFFFF"
              style={{ flex: 1 }}
              onPress={onTreatSomeone}
            />
          </View>
        </View>
      </BottomSheetBase>
    </>
  );
};

export default OnTheStoveBottomSheet

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1, // flex-1
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleContainer: {
    flexDirection: 'row', // flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    marginBottom: 16, // mb-4
  },
  title: {
    fontFamily: 'Inter', // font-inter
    fontWeight: '700', // font-bold
    fontSize: 30, // text-[30px]
    lineHeight: 36, // leading-9
    color: '#094327', // text-[#094327]
    flex: 1, // flex-1
  },
  sparklesContainer: {
    width: 35, // w-[35px]
    height: 32, // h-8
    justifyContent: 'center', // justify-center
    alignItems: 'center', // items-center
  },
  description: {
    fontFamily: 'SF Pro', // font-sf-pro
    fontWeight: '700', // font-bold
    fontSize: 17, // text-[17px]
    lineHeight: 22, // leading-[22px]
    letterSpacing: -0.43, // tracking-[-0.43px]
    color: '#094327', // text-[#094327]
    marginBottom: 24, // mb-6
  },
  mealSelectionContainer: {
    marginBottom: 24, // mb-6
  },
  buttonsContainer: {
    flexDirection: 'row', // flex-row
    gap: 8, // gap-2
    marginBottom: 24, // mb-6
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    height: 35,
    minWidth: 150,
    paddingHorizontal: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontFamily: 'Lato',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.03,
    textAlign: 'center',
  },
  buttonIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },

}); 

function setQuantity(value: number) {
  throw new Error('Function not implemented.');
}
