import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface ProgressGaugeProps {
  progress: number; // 0-100
  percentage?: number; // Display percentage (can be different from progress)
  message?: string;
  size?: number;
}

export const ProgressGauge: React.FC<ProgressGaugeProps> = ({
  progress = 67.2,
  percentage = 67.2,
  message = "You should treat yourself a nice dinner",
  size = 200
}) => {
  // Calculate how many segments should be filled
  const totalSegments = 15;
  const filledSegments = Math.round((progress / 100) * totalSegments);
  
  // Generate segment paths for a semi-circle
  const generateSegmentPath = (index: number, isFilled: boolean) => {
    const centerX = size / 2;
    const centerY = size * 0.8; // Position center below the arc
    const radius = size * 0.35;
    const segmentAngle = Math.PI / totalSegments; // 180 degrees / 15 segments
    const startAngle = Math.PI + (index * segmentAngle); // Start from left side
    const endAngle = startAngle + segmentAngle;
    
    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);
    
    // Inner radius for segment thickness
    const innerRadius = radius * 0.7;
    const innerStartX = centerX + innerRadius * Math.cos(startAngle);
    const innerStartY = centerY + innerRadius * Math.sin(startAngle);
    const innerEndX = centerX + innerRadius * Math.cos(endAngle);
    const innerEndY = centerY + innerRadius * Math.sin(endAngle);
    
    // Create rounded rectangle path
    const path = `
      M ${startX} ${startY}
      A ${radius} ${radius} 0 0 1 ${endX} ${endY}
      L ${innerEndX} ${innerEndY}
      A ${innerRadius} ${innerRadius} 0 0 0 ${innerStartX} ${innerStartY}
      Z
    `;
    
    return path;
  };

  return (
    <View style={[styles.container, { width: size, height: size * 0.46 }]}>
      <Svg width={size} height={size * 0.46} style={styles.svg}>
        {/* Generate all 15 segments */}
        {Array.from({ length: totalSegments }, (_, index) => {
          const isFilled = index < filledSegments;
          return (
            <Path
              key={index}
              d={generateSegmentPath(index, isFilled)}
              fill={isFilled ? '#094327' : '#F6F6F6'}
            />
          );
        })}
      </Svg>
      
      {/* Percentage Display */}
      <View style={styles.percentageContainer}>
        <Text style={styles.percentageText}>
          {percentage.toFixed(1)}%
        </Text>
      </View>
      
      {/* Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
  },
  percentageContainer: {
    position: 'absolute',
    left: '33.89%',
    right: '33.29%',
    top: '62.29%',
    bottom: '-3.61%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontFamily: 'Inter-Bold',
    fontSize: 38,
    lineHeight: 46,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  messageContainer: {
    position: 'absolute',
    left: '-46.9%',
    right: '-47.71%',
    top: '107.91%',
    bottom: '-47.25%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 15,
    color: '#EAEAEA',
    textAlign: 'center',
  },
});

export default ProgressGauge; 