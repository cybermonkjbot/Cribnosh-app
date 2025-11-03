import type { FC } from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';

export interface LabelProps extends TextProps {
  children: React.ReactNode;
}

export const Label: FC<LabelProps> = ({ children, style, ...props }) => (
  <Text
    style={[styles.label, { fontFamily: 'Poppins' }, style]}
    accessibilityRole="text"
    {...props}
  >
    {children}
  </Text>
);

const styles = StyleSheet.create({
  label: {
    fontSize: 16, // text-base
    fontWeight: '600', // font-semibold
    color: '#1F2937', // text-gray-800
    marginBottom: 4, // mb-1
  },
});
