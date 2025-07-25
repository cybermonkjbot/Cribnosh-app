import * as React from 'react';
import { useRef, useState } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';


interface HearEmoteIconProps {
  width?: number;
  height?: number;
  style?: any;
  liked?: boolean;
  onLikeChange?: (liked: boolean) => void;
}


const HEART_PATH =
  "M28.5 21C30.735 18.81 33 16.185 33 12.75C33 10.562 32.1308 8.46354 30.5836 6.91637C29.0365 5.36919 26.938 4.5 24.75 4.5C22.11 4.5 20.25 5.25 18 7.5C15.75 5.25 13.89 4.5 11.25 4.5C9.06196 4.5 6.96354 5.36919 5.41637 6.91637C3.86919 8.46354 3 10.562 3 12.75C3 16.2 5.25 18.825 7.5 21L18 31.5L28.5 21Z";

const HearEmoteIcon: React.FC<HearEmoteIconProps> = ({ width = 36, height = 36, style, liked: likedProp, onLikeChange }) => {
  const [liked, setLiked] = useState(!!likedProp);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Pop animation
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.2,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
    setLiked((prev) => {
      const next = !prev;
      if (onLikeChange) onLikeChange(next);
      return next;
    });
  };

  return (
    <Pressable onPress={handlePress} style={style} accessibilityRole="button" accessibilityState={{ selected: liked }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Svg width={width} height={height} viewBox="0 0 36 36" fill="none">
          <Path
            d={HEART_PATH}
            stroke="url(#paint0_linear_276_2006)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={liked ? 'url(#paint0_linear_276_2006)' : 'none'}
          />
          <Defs>
            <LinearGradient id="paint0_linear_276_2006" x1="18" y1="4.5" x2="18" y2="31.5" gradientUnits="userSpaceOnUse">
              <Stop stopColor="#FF3B30" />
              <Stop offset={1} stopColor="#E6FFE8" />
            </LinearGradient>
          </Defs>
        </Svg>
      </Animated.View>
    </Pressable>
  );
};

export default HearEmoteIcon;
