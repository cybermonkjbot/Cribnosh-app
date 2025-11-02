import type { FC } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export interface TextareaProps extends TextInputProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: { fontSize: 16 }, // text-base
  md: { fontSize: 18 }, // text-lg
  lg: { fontSize: 20 }, // text-xl
};

export const Textarea: FC<TextareaProps> = ({ size = 'md', style, ...props }) => (
  <TextInput
    style={[
      styles.base,
      sizeStyles[size],
      style,
    ]}
    multiline
    placeholderTextColor="#A3A3A3"
    accessibilityRole="text"
    {...props}
  />
);

const styles = StyleSheet.create({
  base: {
    borderWidth: 1, // border
    borderColor: '#D1D5DB', // border-gray-300
    borderRadius: 12, // rounded-xl
    paddingHorizontal: 16, // px-4
    paddingVertical: 12, // py-3
    minHeight: 100, // min-h-[100px]
    backgroundColor: '#FFFFFF', // bg-white
    color: '#111827', // text-gray-900
  },
});
