import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface HeadingProps {
  title: string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  variant?: 'light' | 'dark';
  style?: TextStyle;
  containerStyle?: ViewStyle;
}

const Heading: React.FC<HeadingProps> = ({
  title,
  color = '#E6FFE8',
  strokeColor = '#FF3B30',
  strokeWidth = 3,
  style = {},
  containerStyle = {},
}) => {
  // For a solid stroke, render the text multiple times offset in all directions
  const offsets = [
    [-strokeWidth, 0], [strokeWidth, 0], [0, -strokeWidth], [0, strokeWidth],
    [-strokeWidth, -strokeWidth], [-strokeWidth, strokeWidth], [strokeWidth, -strokeWidth], [strokeWidth, strokeWidth]
  ];
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Stroke/Outline: 8 directions */}
      {offsets.map(([dx, dy], i) => (
        <Text
          key={i}
          style={[
            styles.heading,
            styles.stroke,
            {
              color: strokeColor,
              position: 'absolute',
              left: dx,
              top: dy,
            },
            style,
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {title}
        </Text>
      ))}
      {/* Fill */}
      <Text
        style={[
          styles.heading,
          {
            color,
          },
          style,
        ]}
      >
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Remove border/background, just center content
    justifyContent: 'center',
    alignItems: 'flex-start',
    // Optionally allow custom width/height via containerStyle
  },
  heading: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '900',
    fontSize: 36,
    lineHeight: 40,
    textAlign: 'left',
    // No color here, set in-line
  },
  stroke: {
    zIndex: 0,
  },
});

export default Heading;
