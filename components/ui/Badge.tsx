import { BlurView } from 'expo-blur';
import type { FC, ReactNode } from 'react';
import { Platform, Text, View, ViewProps } from 'react-native';
import { cn } from './utils';

export interface BadgeProps extends ViewProps {
  variant?: 'default' | 'secondary';
  children: ReactNode;
  glass?: boolean;
  elevated?: boolean;
}

const variants = {
  default: 'bg-gray-900',
  secondary: 'bg-gray-200',
};

export const Badge: FC<BadgeProps> = ({ variant = 'default', children, glass, elevated, style, ...props }) => {
  const hasGlass = !!glass;
  const hasElevation = !!elevated;
  const shadowClass = hasElevation && !hasGlass ? 'shadow-lg' : '';
  return (
    <View className={props.className}>
      {hasGlass ? (
        Platform.OS === 'ios' ? (
          <BlurView intensity={18} tint="light" className="absolute inset-0" />
        ) : Platform.OS === 'android' ? (
          <View className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }} />
        ) : (
          <View className="absolute inset-0" style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(255,255,255,0.6)' }} />
        )
      ) : null}
      <View
        className={cn(
          'px-3 py-1 rounded-full min-h-[24px] min-w-[24px] justify-center items-center',
          variants[variant],
          hasGlass && 'bg-white/60',
          shadowClass,
          props.className
        )}
        style={glass ? { position: 'relative' } : undefined}
      >
        {children !== undefined && children !== null ? (
          <Text className={cn('text-xs font-semibold', variant === 'default' ? 'text-white' : 'text-gray-900')} style={{ fontFamily: 'Poppins' }}>{children}</Text>
        ) : null}
      </View>
    </View>
  );
};
