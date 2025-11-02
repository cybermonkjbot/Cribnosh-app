import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';

interface SvgHeadingProps {
  title: string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  style?: any;
  containerStyle?: ViewStyle;
}

const SvgHeading: React.FC<SvgHeadingProps> = ({
  title,
  color = '#E6FFE8',
  strokeColor = '#FF3B30',
  strokeWidth = 4,
  fontSize = 30,
  fontFamily = 'Inter',
  style = {},
  containerStyle = {},
}) => {
  // Support multi-line text
  const lines = title.split('\n');
  const lineHeight = style.lineHeight || fontSize * 1.1;
  return (
    <View style={containerStyle}>
      <Svg
        height={lineHeight * lines.length}
        width="100%"
        style={{ minWidth: 10, minHeight: 10 }}
      >
        {lines.map((line, i) => (
          <SvgText
            key={i}
            x={0}
            y={fontSize + i * lineHeight}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill={color}
            fontSize={fontSize}
            fontWeight="900"
            fontFamily={fontFamily}
            paintOrder="stroke"
            strokeLinejoin="round"
            {...style}
          >
            {line}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};

export default SvgHeading;
