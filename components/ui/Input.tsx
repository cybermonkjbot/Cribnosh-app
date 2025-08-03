import type { FC, ReactNode } from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { cn } from './utils';

export interface InputProps extends TextInputProps {
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
}

const base =
  'border border-gray-300 rounded-xl bg-white text-gray-900 font-[System] flex-row items-center';
const sizes = {
  sm: 'h-10 text-base px-3',
  md: 'h-12 text-lg px-4',
  lg: 'h-14 text-xl px-4',
};

export const Input: FC<InputProps> = ({ size = 'md', leftIcon, style, ...props }) => {
  return (
    <View
      className={cn(base, sizes[size])}
      style={[{ paddingLeft: leftIcon ? 8 : 1, backgroundColor:'#C4C4C4' },  style]}
    >
      {leftIcon && <View style={{ marginRight: 8, }}>{leftIcon}</View>}

      <TextInput
      className="flex-1 text-gray-900"
      placeholderTextColor="#E6FFE8"
      placeholder={props.placeholder}
      accessibilityRole="search"
      {...props}
      />
    </View>
  );
};
