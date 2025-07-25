import React, { useRef, useState } from 'react';
import { Animated, PanResponder, Text, View } from 'react-native';

interface SwipeButtonProps {
  onSwipeSuccess?: () => void;
  text?: string;
  className?: string;
}

const SWIPE_HEIGHT = 58;
const SWIPE_RADIUS = 20;
const SWIPE_VERTICAL_DISTANCE = 40; // How far up to swipe to trigger

export const SwipeButton: React.FC<SwipeButtonProps> = ({
  onSwipeSuccess,
  text = 'Swipe to Chip in',
  className = '',
}) => {
  const [swiped, setSwiped] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: Animated.event([
        null,
        { dy: translateY },
      ], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        // Negative dy means swipe up
        if (-gestureState.dy > SWIPE_VERTICAL_DISTANCE) {
          Animated.timing(translateY, {
            toValue: -SWIPE_HEIGHT + 8, // Move button up, leave a little visible
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            setSwiped(true);
            onSwipeSuccess && onSwipeSuccess();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={{ transform: [{ translateY }] }}
      {...panResponder.panHandlers}
    >
      <View
        className={`w-full h-[58px] bg-[#E6FFE8] rounded-[20px] justify-center items-center relative overflow-hidden ${className}`}
      >
        <Text className="font-poppins font-semibold text-[18px] leading-[27px] text-center text-[#094327]">
          {text}
        </Text>
      </View>
    </Animated.View>
  );
};


// Styles moved to nativewind classes above

export default SwipeButton;
