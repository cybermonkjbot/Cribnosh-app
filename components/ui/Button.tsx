import { BlurView } from 'expo-blur';
import type { FC, ReactNode } from 'react';
import { useRef } from 'react';
import { Animated, Platform, Pressable, PressableProps, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { cn } from './utils';

export interface ButtonProps extends PressableProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: ReactNode;
  glass?: boolean;
  elevated?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
  fontFamily?: string;
  fontWeight?: string | number;
}

const base = 'items-center justify-center rounded-xl min-h-[44px] min-w-[44px]';
const variants = {
  default: 'bg-gray-900 active:bg-gray-800',
  outline: 'border border-gray-300 bg-white',
  ghost: 'bg-transparent',
};
const sizes = {
  sm: 'h-10 px-4',
  md: 'h-12 px-5',
  lg: 'h-14 px-6',
};
const text = {
  default: 'text-white text-base font-semibold',
  outline: 'text-gray-900 text-base font-semibold',
  ghost: 'text-gray-900 text-base font-semibold',
};

export const Button: FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  disabled,
  children,
  glass,
  elevated,
  style,
  backgroundColor,
  textColor,
  borderRadius,
  paddingVertical,
  paddingHorizontal,
  fontFamily,
  fontWeight,
  ...props
}) => {
  const hasGlass = !!glass;
  const hasElevation = !!elevated;
  const shadowClass = hasElevation && !hasGlass ? 'shadow-lg' : '';
  const innerStyle = [glass ? { position: 'relative' as const } : undefined, ...(Array.isArray(style) ? style : style ? [style] : [])];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const content = (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      {hasGlass ? (
        Platform.OS === 'ios' ? (
          <BlurView intensity={24} tint="light" style={StyleSheet.absoluteFill} />
        ) : Platform.OS === 'android' ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.6)' }]} />
        )
      ) : null}
      <View
        className={cn(
          base,
          variants[variant],
          sizes[size],
          hasGlass && 'bg-white/60',
          shadowClass,
          disabled && 'opacity-40',
          props.className
        )}
        style={[
          innerStyle as any,
          backgroundColor ? { backgroundColor } : {},
          borderRadius !== undefined ? { borderRadius } : {},
          paddingVertical !== undefined ? { paddingVertical } : {},
          paddingHorizontal !== undefined ? { paddingHorizontal } : {},
        ]}
      >
        {children !== undefined && children !== null ? (
          <Text
            className={cn(text[variant])}
            style={[
              textColor ? { color: textColor } : {},
              fontFamily ? { fontFamily } : {},
              fontWeight && [
                'normal','bold','100','200','300','400','500','600','700','800','900',
                'light','regular','ultralight','thin','medium','semibold','heavy','black'
              ].includes(fontWeight.toString())
                ? { fontWeight: fontWeight as any }
                : {},
              { fontSize: 18, lineHeight: 27, textAlign: 'center' },
            ]}
          >
            {children}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
  if (Platform.OS === 'ios') {
    // Remove null/undefined props for TouchableOpacity
    const filteredProps = Object.fromEntries(
      Object.entries(props).filter(([, v]) => v !== null && v !== undefined)
    );
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        hitSlop={8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...filteredProps}
      >
        {content}
      </TouchableOpacity>
    );
  }
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      hitSlop={8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {content}
    </Pressable>
  );
};
