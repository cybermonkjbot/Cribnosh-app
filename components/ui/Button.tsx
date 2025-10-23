import { BlurView } from 'expo-blur';
import type { FC, ReactNode } from 'react';
import { useRef } from 'react';
import { ActivityIndicator, Animated, Platform, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { cn } from './utils';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
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
  loading?: boolean;
}

const base = 'items-center justify-center rounded-xl min-h-[44px] min-w-[44px]';
const variants = {
  default: 'bg-gray-900 active:bg-gray-800',
  outline: 'border border-gray-300 bg-white',
  ghost: 'bg-transparent',
  danger: 'bg-[#FF3B30]'
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
  danger: 'text-white text-base font-semibold',
};

export const Button: FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  disabled = false,
  children,
  glass = false,
  elevated = false,
  style,
  backgroundColor,
  textColor,
  borderRadius,
  paddingVertical,
  paddingHorizontal,
  fontFamily,
  fontWeight,
  loading = false,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const handlePressIn = (event: any) => {
    if (isDisabled) return;
    
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
    
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    if (isDisabled) return;
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
    
    onPressOut?.(event);
  };

  const buttonContent = (
    <View
      className={cn(
        base,
        variants[variant],
        sizes[size],
        glass && 'bg-white/60',
        elevated && !glass && 'shadow-lg',
        isDisabled && 'opacity-50',
        props.className
      )}
      style={[
        {
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: backgroundColor,
          borderRadius: borderRadius,
          paddingVertical: paddingVertical,
          paddingHorizontal: paddingHorizontal,
          // Ensure proper dimensions for touch handling
          minWidth: 44,
          minHeight: 44,
        },
        style,
      ]}
    >
      {/* Glass effect background - positioned behind content with pointerEvents none */}
      {glass && (
        <View 
          style={[
            StyleSheet.absoluteFill,
            { 
              zIndex: 0,
              pointerEvents: 'none'
            }
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView 
              intensity={24} 
              tint="light" 
              style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
            />
          ) : Platform.OS === 'android' ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.7)', pointerEvents: 'none' }]} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.6)', pointerEvents: 'none' }]} />
          )}
        </View>
      )}

      {/* Button content - positioned above glass effect */}
      <View style={{ zIndex: 1, pointerEvents: 'none', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={textColor || (variant === 'outline' || variant === 'ghost' ? '#000000' : '#FFFFFF')} 
          />
        ) : (
          children !== undefined && children !== null ? (
            <Text
              className={cn(text[variant])}
              style={[
                {
                  textAlign: 'center',
                  fontSize: 16,
                  lineHeight: 24,
                },
                textColor && { color: textColor },
                fontFamily && { fontFamily },
                fontWeight ? { fontWeight: fontWeight as any } : undefined,
              ]}
            >
              {children}
            </Text>
          ) : null
        )}
      </View>
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        minWidth: 44,
        minHeight: 44,
      }}
      {...props}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {buttonContent}
      </Animated.View>
    </TouchableOpacity>
  );
};
