import { ExternalLink } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import BottomSheetBase from './BottomSheetBase';
import CompactMealSelection from './CompactMealSelection';
import CustomLiveButton from './CustomLiveButton';
import AISparkles from './ui/AISparkles';
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

  // Debug logging for snap point calculations
  useEffect(() => {
    console.log('OnTheStoveBottomSheet mounted with:', {
      isVisible,
      isExpanded,
      snapPoints,
      collapsedHeight: SNAP_POINTS.COLLAPSED,
      expandedHeight: SNAP_POINTS.EXPANDED,
      screenHeight: SCREEN_HEIGHT
    });
  }, [isVisible, isExpanded, snapPoints]);

  // Notify parent component when expanded state changes
  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  // Notify parent component when snap point changes
  useEffect(() => {
    onSnapPointChange?.(currentSnapPoint);
  }, [currentSnapPoint, onSnapPointChange]);

  const handleSheetChanges = (index: number) => {
    console.log('Sheet index changed from', currentSnapPoint, 'to', index);
    setCurrentSnapPoint(index);
    
    // Update expanded state based on snap point
    if (index === 1) {
      setIsExpanded(true);
    } else if (index === 0) {
      setIsExpanded(false);
    }
    
    if (index === -1) {
      console.log('Sheet closed, calling onToggleVisibility');
      onToggleVisibility();
    }
  };

  const handleQuantityChange = (value: number) => {
    // Handle quantity change if needed
    console.log('Quantity changed to:', value);
  };

  const handleToggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    console.log('Toggling expanded state to:', newExpandedState);
  };

  // Always render the sheet when isVisible is true
  if (!isVisible) {
    console.log('OnTheStoveBottomSheet: isVisible is false, not rendering');
    return null;
  }

  console.log('OnTheStoveBottomSheet: Rendering with snapPoints:', snapPoints, 'and index:', 0);

  // Show skeleton when loading
  if (isLoading) {
    return (
      <>
        {/* Love This Button - positioned above the sheet and follows its movement */}
        <View style={{
          position: 'absolute',
          bottom: (currentSnapPoint === 1 ? SNAP_POINTS.EXPANDED : SNAP_POINTS.COLLAPSED) + 20,
          left: 23,
          zIndex: 1000,
        }}>
          <LoveThisButton />
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
      <View style={{
        position: 'absolute',
        bottom: (currentSnapPoint === 1 ? SNAP_POINTS.EXPANDED : SNAP_POINTS.COLLAPSED) + 20,
        left: 23,
        zIndex: 1000,
      }}>
        <LoveThisButton />
      </View>
      
      {/* Debug info for button positioning */}
      {console.log('Button positioning:', {
        currentSnapPoint,
        isExpanded,
        collapsedHeight: SNAP_POINTS.COLLAPSED,
        expandedHeight: SNAP_POINTS.EXPANDED,
        buttonBottom: (currentSnapPoint === 1 ? SNAP_POINTS.EXPANDED : SNAP_POINTS.COLLAPSED) + 20
      })}
      
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
        }}
      >
        <View className="flex-1" style={{ marginTop: -550 }}>

          {/* Title with Sparkles Icon */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-inter font-bold text-[30px] leading-9 text-[#094327] flex-1">
              #{mealData.title}
            </Text>
            
            {/* Sparkles Icon */}
            <View className="w-[35px] h-8 justify-center items-center">
              <AISparkles size={32} color="#094327" />
            </View>
          </View>

          {/* Description */}
          <Text
            className="font-sf-pro font-bold text-[17px] leading-[22px] tracking-[-0.43px] text-[#094327] mb-6"
            numberOfLines={4}
          >
            {mealData.description}
          </Text>

          {/* Compact Meal Selection */}
          <View className="mb-6">
            <CompactMealSelection
              title={mealData.title}
              price={mealData.price}
              imageSource={mealData.imageSource}
              onChange={handleQuantityChange}
            />
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2 mb-6">
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
              icon={<ExternalLink color="#094327" size={16} strokeWidth={1.33} />}
              backgroundColor="rgba(0, 0, 0, 0.3)"
              textColor="#094327"
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
