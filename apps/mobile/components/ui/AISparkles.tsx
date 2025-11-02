import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, TouchableOpacity, View, ViewStyle } from 'react-native';
import Svg, {
    Defs,
    Mask,
    Path,
    Stop,
    LinearGradient as SvgLinearGradient,
    Rect as SvgRect
} from 'react-native-svg';

interface AISparklesProps {
  color?: string;
  size?: number;
  duration?: number;
  shimmerColor?: string;
  shimmerOpacity?: number;
  autoPlay?: boolean;
  loop?: boolean;
  enableShimmer?: boolean;
  onAnimationComplete?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const DEFAULT_SIZE = 36;
const DEFAULT_DURATION = 1200;
const DEFAULT_COLOR = '#062C1A';
const DEFAULT_SHIMMER_COLOR = '#fff';
const DEFAULT_SHIMMER_OPACITY = 0.7;

// SVG path data - extracted for reusability
const SPARKLE_PATH = "M29.6667 3.99993V9.33326M32.5834 6.66659H26.7501M6.33339 22.6666V25.3333M7.79172 23.9999H4.87506M14.9915 20.6666C14.8613 20.2052 14.5983 19.7841 14.2297 19.4471C13.8612 19.1101 13.4006 18.8696 12.8959 18.7506L3.94901 16.6413C3.79637 16.6016 3.66203 16.5176 3.56636 16.4019C3.4707 16.2861 3.41895 16.145 3.41895 15.9999C3.41895 15.8549 3.4707 15.7137 3.56636 15.598C3.66203 15.4823 3.79637 15.3982 3.94901 15.3586L12.8959 13.2479C13.4004 13.129 13.8609 12.8887 14.2294 12.552C14.5979 12.2153 14.8611 11.7944 14.9915 11.3333L17.2986 3.15326C17.3415 3.01315 17.4333 2.88971 17.5601 2.80178C17.6869 2.71386 17.8417 2.66626 18.0008 2.66626C18.1599 2.66626 18.3147 2.71386 18.4415 2.80178C18.5682 2.88971 18.6601 3.01315 18.703 3.15326L21.0086 11.3333C21.1388 11.7947 21.4019 12.2158 21.7704 12.5527C22.139 12.8897 22.5995 13.1302 23.1042 13.2493L32.0511 15.3573C32.205 15.3961 32.3406 15.4799 32.4373 15.596C32.534 15.7121 32.5864 15.854 32.5864 15.9999C32.5864 16.1458 32.534 16.2877 32.4373 16.4038C32.3406 16.5199 32.205 16.6038 32.0511 16.6426L23.1042 18.7506C22.5995 18.8696 22.139 19.1101 21.7704 19.4471C21.4019 19.7841 21.1388 20.2052 21.0086 20.6666L18.7015 28.8466C18.6586 28.9867 18.5668 29.1101 18.44 29.1981C18.3132 29.286 18.1585 29.3336 17.9993 29.3336C17.8402 29.3336 17.6854 29.286 17.5586 29.1981C17.4319 29.1101 17.34 28.9867 17.2971 28.8466L14.9915 20.6666Z";

export const AISparkles: React.FC<AISparklesProps> = ({
  color = DEFAULT_COLOR,
  size = DEFAULT_SIZE,
  duration = DEFAULT_DURATION,
  shimmerColor = DEFAULT_SHIMMER_COLOR,
  shimmerOpacity = DEFAULT_SHIMMER_OPACITY,
  autoPlay = true,
  loop = false,
  enableShimmer = true,
  onAnimationComplete,
  onPress,
  disabled = false,
  style,
  testID,
  ...props
}) => {
  // State management
  const [animationState, setAnimationState] = useState<'idle' | 'animating' | 'completed'>('idle');
  const [webShimmer, setWebShimmer] = useState(-1);
  
  // Refs
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const rafRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Derived values
  const aspectRatio = 36 / 32; // Original aspect ratio
  const height = size / aspectRatio;
  const viewBox = `0 0 36 ${32}`;
  const strokeWidth = Math.max(1, size / 18); // Scale stroke width with size

  // Memoized styles and values
  const containerStyle = useMemo(() => {
    // Only use valid CSS properties for web, filter out React Native specific ones
    if (Platform.OS === 'web') {
      // Create a clean web-compatible style object
      const webStyle: any = {
        width: size,
        height: height,
        position: 'relative' as const,
      };
      
      // Only allow a safe subset of CSS properties for the web container
      const allowedCssProps = [
        'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
        'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
        'borderRadius', 'borderWidth', 'borderStyle', 'borderColor',
        'boxShadow', 'background', 'backgroundColor', 'opacity',
        'top', 'left', 'right', 'bottom', 'zIndex', 'display', 'overflow',
        'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
        'position', 'transition', 'animation', 'animationDuration',
        'animationName', 'animationTimingFunction', 'transform', 'cursor', 'pointerEvents',
        'maskImage', 'WebkitMaskImage', 'backgroundSize', 'backgroundPosition',
      ];
      
      const styleAny = style as any;
      if (styleAny) {
        for (const key of allowedCssProps) {
          if (key in styleAny && styleAny[key] !== undefined) {
            webStyle[key] = styleAny[key];
          }
        }
        
        // Special handling for animationDelay to ensure proper string type
        if ('animationDelay' in styleAny) {
          let val = styleAny.animationDelay;
          if (typeof val === 'number') {
            webStyle.animationDelay = `${val}ms`;
          } else if (Array.isArray(val)) {
            webStyle.animationDelay = val.map((v: any) => typeof v === 'number' ? `${v}ms` : String(v)).filter((v: any) => typeof v === 'string');
          } else if (val !== undefined) {
            webStyle.animationDelay = String(val);
          }
        }
      }
      
      return webStyle;
    }
    return {
      width: size,
      height: height,
      position: 'relative' as const,
      ...style,
    };
  }, [size, height, style]);

  const svgMaskUrl = useMemo(() => {
    if (Platform.OS !== 'web') return '';
    
    const encodedSvg = encodeURIComponent(
      `<svg width='36' height='32' viewBox='0 0 36 32' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='${SPARKLE_PATH}' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
      </svg>`
    );
    return `url("data:image/svg+xml;utf8,${encodedSvg}")`;
  }, []);

  // Animation control functions
  const startAnimation = useCallback(() => {
    if (!enableShimmer || animationState === 'animating') return;
    
    setAnimationState('animating');

    if (Platform.OS === 'web') {
      // Web animation using RAF
      let start: number | null = null;
      
      const animate = (timestamp: number) => {
        if (!isMountedRef.current) return;
        
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = Easing.inOut(Easing.ease)(progress);
        
        setWebShimmer(-1 + 2 * easedProgress);
        
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setAnimationState('completed');
          onAnimationComplete?.();
          
          if (loop && isMountedRef.current) {
            // Restart animation after a brief delay for looping
            setTimeout(() => {
              if (isMountedRef.current) {
                setAnimationState('idle');
                setWebShimmer(-1);
                startAnimation();
              }
            }, 100);
          }
        }
      };
      
      rafRef.current = requestAnimationFrame(animate);
    } else {
      // Native animation using Animated API
      shimmerAnim.setValue(-1);
      
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }).start((finished) => {
        if (!isMountedRef.current) return;
        
        if (finished) {
          setAnimationState('completed');
          onAnimationComplete?.();
          
          if (loop) {
            // Restart animation for looping
            setTimeout(() => {
              if (isMountedRef.current) {
                setAnimationState('idle');
                startAnimation();
              }
            }, 100);
          }
        }
      });
    }
  }, [enableShimmer, animationState, duration, loop, onAnimationComplete, shimmerAnim]);



  // Removed unused resetAnimation function

  // Effects
  useEffect(() => {
    isMountedRef.current = true;
    
    if (autoPlay && enableShimmer && animationState === 'idle') {
      startAnimation();
    }
    
    return () => {
      isMountedRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [autoPlay, enableShimmer, startAnimation, animationState, shimmerAnim]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Error boundary fallback
  if (!color || size <= 0 || duration <= 0) {
    console.warn('AISparkles: Invalid props provided');
    return null;
  }

  // Web implementation
  if (Platform.OS === 'web') {
    const webContent = (
      <div style={containerStyle} data-testid={testID}>
        <svg
          width={size}
          height={height}
          viewBox={viewBox}
          fill="none"
          style={{ display: 'block', width: '100%', height: '100%' }}
          {...props}
        >
          <path
            d={SPARKLE_PATH}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        
        {enableShimmer && animationState === 'animating' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 2,
              maskImage: svgMaskUrl,
              WebkitMaskImage: svgMaskUrl,
              background: `linear-gradient(120deg, transparent 40%, rgba(${
                shimmerColor === '#fff' ? '255,255,255' : 
                shimmerColor.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(',') || '255,255,255'
              },${shimmerOpacity}) 50%, transparent 60%)`,
              backgroundSize: '200% 200%',
              backgroundPosition: `${webShimmer * 100}% ${webShimmer * 100}%`,
            }}
          />
        )}
      </div>
    );

    // Wrap in clickable container if onPress is provided
    if (onPress && !disabled) {
      return (
        <div 
          onClick={onPress}
          style={{ 
            cursor: 'pointer',
            display: 'inline-block',
            opacity: disabled ? 0.6 : 1,
          }}
          data-testid={testID}
        >
          {webContent}
        </div>
      );
    }

    return webContent;
  }

  // Native implementation
  const AnimatedRect = Animated.createAnimatedComponent(SvgRect);
  
  const nativeContent = (
    <View style={containerStyle} testID={testID}>
      <Svg width={size} height={height} viewBox={viewBox} fill="none" {...props}>
        <Defs>
          <Mask id="shimmer-mask" x={0} y={0} width={36} height={32} maskUnits="userSpaceOnUse">
            <Path
              d={SPARKLE_PATH}
              fill="#fff"
              stroke="#fff"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Mask>
          
          <SvgLinearGradient 
            id="shimmer-gradient" 
            x1="0" 
            y1="0" 
            x2="36" 
            y2="32" 
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="40%" stopColor="transparent" />
            <Stop offset="50%" stopColor={shimmerColor} stopOpacity={shimmerOpacity} />
            <Stop offset="60%" stopColor="transparent" />
          </SvgLinearGradient>
        </Defs>
        
        <Path
          d={SPARKLE_PATH}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {enableShimmer && animationState === 'animating' && (
          <AnimatedRect
            x={0}
            y={0}
            width={36}
            height={32}
            mask="url(#shimmer-mask)"
            fill="url(#shimmer-gradient)"
            opacity={1}
          />
        )}
      </Svg>
    </View>
  );
  
  // Wrap in TouchableOpacity if onPress is provided
  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
        style={{ opacity: disabled ? 0.6 : 1 }}
      >
        {nativeContent}
      </TouchableOpacity>
    );
  }

  return nativeContent;
};

// Export additional utilities
export const AISparklesUtils = {
  startAnimation: (ref: React.RefObject<any>) => {
    ref.current?.startAnimation?.();
  },
  stopAnimation: (ref: React.RefObject<any>) => {
    ref.current?.stopAnimation?.();
  },
  resetAnimation: (ref: React.RefObject<any>) => {
    ref.current?.resetAnimation?.();
  },
};

export default AISparkles;