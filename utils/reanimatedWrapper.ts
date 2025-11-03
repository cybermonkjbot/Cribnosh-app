/**
 * Reanimated Wrapper for Expo Go Compatibility
 * 
 * Expo Go doesn't support react-native-reanimated's native modules.
 * This wrapper provides fallbacks when reanimated is not available.
 */

import { View, ScrollView } from 'react-native';
import { useState } from 'react';
import Constants from 'expo-constants';

// Check if we're running in Expo Go (which doesn't support custom native modules)
// storeClient = Expo Go, bare = bare React Native, standalone = standalone build
const isExpoGo = Constants.executionEnvironment === 'storeClient';

let Reanimated: any = undefined;
let reanimatedAvailable = false;

// IMPORTANT: Metro config redirects ALL react-native-reanimated imports to this wrapper.
// This means we can NEVER require('react-native-reanimated') here - it would cause 
// infinite recursion. We must ALWAYS use fallbacks.
// 
// In Expo Go: Always use fallbacks (reanimated not supported)
// In dev builds: Metro also redirects to wrapper, so we always use fallbacks
// 
// This ensures the app works in Expo Go without native module errors.

// Always use fallbacks - Metro redirect ensures all reanimated imports come here
reanimatedAvailable = false;
Reanimated = undefined;

// Export availability check
export const isReanimatedAvailable = () => reanimatedAvailable;

// Fallback components
const FallbackAnimatedView = View;
const FallbackAnimatedScrollView = ScrollView;

// Conditional exports - Animated needs to be the default export
const AnimatedImpl = reanimatedAvailable && Reanimated?.default
  ? Reanimated.default 
  : {
      View: FallbackAnimatedView,
      ScrollView: FallbackAnimatedScrollView,
    };

// Export Animated as both named and default for compatibility
export const Animated = AnimatedImpl;
export default AnimatedImpl;

// Conditional hook exports
export const useSharedValue = (reanimatedAvailable && Reanimated?.useSharedValue)
  ? Reanimated.useSharedValue
  : (initialValue: any) => {
      const [value] = useState(initialValue);
      return { value, setValue: (v: any) => {} };
    };

export const useAnimatedStyle = (reanimatedAvailable && Reanimated?.useAnimatedStyle)
  ? Reanimated.useAnimatedStyle
  : (styleFactory: () => any) => {
      const [style] = useState(styleFactory());
      return style;
    };

export const useAnimatedScrollHandler = (reanimatedAvailable && Reanimated?.useAnimatedScrollHandler)
  ? Reanimated.useAnimatedScrollHandler
  : (handlers: any) => {
      const scrollHandler = (event: any) => {
        if (handlers?.onScroll) {
          handlers.onScroll(event);
        }
      };
      return scrollHandler;
    };

export const withTiming = (reanimatedAvailable && Reanimated?.withTiming)
  ? Reanimated.withTiming
  : (value: any, config?: any) => value;

export const runOnJS = (reanimatedAvailable && Reanimated?.runOnJS)
  ? Reanimated.runOnJS
  : (fn: Function) => fn;

// Worklet directive (no-op if reanimated not available)
export const worklet = reanimatedAvailable ? 'worklet' : '';

// Re-export everything else if available, otherwise provide no-ops
export const interpolate = (reanimatedAvailable && Reanimated?.interpolate)
  ? Reanimated.interpolate
  : (value: any, inputRange: number[], outputRange: number[]) => {
      // Simple linear interpolation fallback
      if (value <= inputRange[0]) return outputRange[0];
      if (value >= inputRange[inputRange.length - 1]) return outputRange[outputRange.length - 1];
      // Find the range
      for (let i = 0; i < inputRange.length - 1; i++) {
        if (value >= inputRange[i] && value <= inputRange[i + 1]) {
          const ratio = (value - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
          return outputRange[i] + ratio * (outputRange[i + 1] - outputRange[i]);
        }
      }
      return outputRange[0];
    };

export const useAnimatedReaction = (reanimatedAvailable && Reanimated?.useAnimatedReaction)
  ? Reanimated.useAnimatedReaction
  : () => {}; // No-op

export const cancelAnimation = (reanimatedAvailable && Reanimated?.cancelAnimation)
  ? Reanimated.cancelAnimation
  : () => {}; // No-op

export const withRepeat = (reanimatedAvailable && Reanimated?.withRepeat)
  ? Reanimated.withRepeat
  : (animation: any) => animation;

export const withSequence = (reanimatedAvailable && Reanimated?.withSequence)
  ? Reanimated.withSequence
  : (...animations: any[]) => animations[animations.length - 1];

export const withDelay = (reanimatedAvailable && Reanimated?.withDelay)
  ? Reanimated.withDelay
  : (delay: number, animation: any) => animation;

export const withSpring = (reanimatedAvailable && Reanimated?.withSpring)
  ? Reanimated.withSpring
  : (value: any) => value;

export const useDerivedValue = (reanimatedAvailable && Reanimated?.useDerivedValue)
  ? Reanimated.useDerivedValue
  : (fn: () => any) => {
      const [value] = useState(fn());
      return { value };
    };

export const Extrapolate = (reanimatedAvailable && Reanimated?.Extrapolate)
  ? Reanimated.Extrapolate
  : {
      EXTEND: 'extend',
      CLAMP: 'clamp',
      IDENTITY: 'identity',
    };

// Type export for TypeScript
export type SharedValue<T> = T;

export const Easing = (reanimatedAvailable && Reanimated?.Easing)
  ? Reanimated.Easing
  : {
      linear: (t: number) => t,
      ease: (t: number) => t,
      quad: (t: number) => t * t,
      cubic: (t: number) => t * t * t,
    };

