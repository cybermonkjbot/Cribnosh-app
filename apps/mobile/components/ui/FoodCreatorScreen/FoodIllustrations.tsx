import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Circle, Path, Rect, Svg, Text as SvgText } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export const FoodIllustrations: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Sushi Section */}
      <View style={styles.sushiContainer}>
        {/* Sushi Roll 1 - Main */}
        <View style={styles.sushiMain}>
          <Svg width={width * 0.408} height={width * 0.408} viewBox="0 0 153 153" fill="none">
            {/* Sushi roll base */}
            <Rect x="20" y="20" width="113" height="113" rx="56.5" fill="#4CAF50" />
            {/* Sushi pieces */}
            <Circle cx="40" cy="40" r="8" fill="#FFD700" />
            <Circle cx="60" cy="40" r="8" fill="#FFD700" />
            <Circle cx="80" cy="40" r="8" fill="#FFD700" />
            <Circle cx="40" cy="60" r="8" fill="#FFD700" />
            <Circle cx="60" cy="60" r="8" fill="#FFD700" />
            <Circle cx="80" cy="60" r="8" fill="#FFD700" />
            <Circle cx="40" cy="80" r="8" fill="#FFD700" />
            <Circle cx="60" cy="80" r="8" fill="#FFD700" />
            <Circle cx="80" cy="80" r="8" fill="#FFD700" />
            {/* Nori wrapper */}
            <Rect x="30" y="30" width="93" height="93" rx="46.5" fill="#2E7D32" stroke="#1B5E20" strokeWidth="2" />
          </Svg>
        </View>
        
        {/* Sushi Roll 2 - Blurred */}
        <View style={styles.sushiBlur}>
          <Svg width={width * 0.261} height={width * 0.259} viewBox="0 0 98 97" fill="none">
            <Rect x="15" y="15" width="68" height="67" rx="33.5" fill="#4CAF50" opacity="0.7" />
            <Circle cx="25" cy="25" r="5" fill="#FFD700" opacity="0.7" />
            <Circle cx="40" cy="25" r="5" fill="#FFD700" opacity="0.7" />
            <Circle cx="55" cy="25" r="5" fill="#FFD700" opacity="0.7" />
            <Circle cx="25" cy="40" r="5" fill="#FFD700" opacity="0.7" />
            <Circle cx="40" cy="40" r="5" fill="#FFD700" opacity="0.7" />
            <Circle cx="55" cy="40" r="5" fill="#FFD700" opacity="0.7" />
            <Circle cx="25" cy="55" r="5" fill="#FFD700" opacity="0.7" />
            <Circle cx="40" cy="55" r="5" fill="#FFD700" opacity="0.7" />
            <Circle cx="55" cy="55" r="5" fill="#FFD700" opacity="0.7" />
            <Rect x="20" y="20" width="58" height="57" rx="28.5" fill="#2E7D32" opacity="0.7" />
          </Svg>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: width,
    height: height,
    left: 0,
    top: 0,
  },
  sushiContainer: {
    position: 'absolute',
    width: width * 0.408, // 153px on 375px screen
    height: width * 0.408,
    left: width * 0.021, // 8px on 375px screen
    top: height * 0.131, // 106px on 812px screen
  },
  sushiMain: {
    position: 'absolute',
    width: width * 0.408,
    height: width * 0.408,
    left: 0,
    top: 0,
  },
  sushiBlur: {
    position: 'absolute',
    width: width * 0.261, // 98px on 375px screen
    height: width * 0.259, // 97px on 375px screen
    left: width * 0.117, // 44px on 375px screen
    top: width * 0.136, // 51px on 375px screen
    opacity: 0.6,
  },
}); 