import type { FC } from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from './utils';

export interface SeparatorProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator: FC<SeparatorProps> = ({ orientation = 'horizontal', ...props }) => (
  <View
    className={cn(
      orientation === 'horizontal'
        ? 'h-[1px] w-full bg-gray-300 my-3 rounded-full'
        : 'w-[1px] h-full bg-gray-300 mx-3 rounded-full',
      props.className
    )}
    accessibilityRole="none"
    {...props}
  />
);
