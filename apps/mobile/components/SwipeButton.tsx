import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRACK_WIDTH = SCREEN_WIDTH - 32;
const THUMB_SIZE = 56;
const BORDER_RADIUS = 28;

interface SwipeButtonProps {
  onSwipeSuccess?: () => void;
  text?: string;
}

export const SwipeButton: React.FC<SwipeButtonProps> = ({
  onSwipeSuccess,
      text = 'Swipe to complete selection',
}) => {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = Math.min(
        Math.max(0, event.translationX),
        TRACK_WIDTH - THUMB_SIZE
      );
    })
    .onEnd(() => {
      if (translateX.value >= TRACK_WIDTH - THUMB_SIZE - 10) {
        if (onSwipeSuccess) {
          runOnJS(onSwipeSuccess)();
        }
      }
      translateX.value = withTiming(0); // Return to start
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, TRACK_WIDTH - THUMB_SIZE],
      [1, 0]
    ),
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <Animated.Text style={[styles.text, textStyle]}>
          {text}
        </Animated.Text>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.thumb, thumbStyle]}>
            <Text style={styles.arrow}>{'→'}</Text>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  track: {
    width: TRACK_WIDTH,
    height: THUMB_SIZE,
    backgroundColor: '#E6FFE8',
    borderRadius: BORDER_RADIUS,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  text: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#094327',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#094327',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    color: '#E6FFE8',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
