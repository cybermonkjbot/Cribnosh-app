import type { FC } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

export interface SeparatorProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator: FC<SeparatorProps> = ({ orientation = 'horizontal', style, ...props }) => (
  <View
    style={[
      orientation === 'horizontal' ? styles.horizontal : styles.vertical,
      style,
    ]}
    accessibilityRole="none"
    {...props}
  />
);

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
    backgroundColor: '#D1D5DB', // gray-300
    marginVertical: 12, // my-3
    borderRadius: 9999, // rounded-full
  },
  vertical: {
    width: 1,
    height: '100%',
    backgroundColor: '#D1D5DB', // gray-300
    marginHorizontal: 12, // mx-3
    borderRadius: 9999, // rounded-full
  },
});
