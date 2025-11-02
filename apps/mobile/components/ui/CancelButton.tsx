import * as React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';

interface CancelButtonProps {
  color?: string;
  size?: number;
  onPress?: () => void;
  style?: object;
  background?: string;
}

/**
 * A simple Cancel (X) button, customizable color and size.
 * Usage: <CancelButton color="#E6FFE8" onPress={...} />
 */
export const CancelButton: React.FC<CancelButtonProps> = ({
  color = '#094327', // dark green default
  size = 44,
  onPress,
  style,
  background,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        { width: size, height: size },
        background ? { backgroundColor: background, borderRadius: size / 2 } : null,
        style,
      ]}
      hitSlop={8}
    >
      <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <Line
          x1="12"
          y1="12"
          x2="32"
          y2="32"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Line
          x1="32"
          y1="12"
          x2="12"
          y2="32"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CancelButton;
