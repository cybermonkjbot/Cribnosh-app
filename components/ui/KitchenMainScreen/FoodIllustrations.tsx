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

      {/* Noodles Section */}
      <View style={styles.noodlesContainer}>
        {/* Noodles 1 - Main */}
        <View style={styles.noodlesMain}>
          <Svg width={width * 0.712} height={width * 0.709} viewBox="0 0 267 266" fill="none">
            {/* Takeout box */}
            <Rect x="50" y="80" width="167" height="120" rx="8" fill="#FF6B6B" />
            <Rect x="60" y="70" width="147" height="20" rx="4" fill="#FF5252" />
            {/* Box handle */}
            <Rect x="120" y="60" width="27" height="20" rx="10" fill="#FF5252" />
            {/* Noodles */}
            <Path d="M70 100 Q90 90 110 100 Q130 110 150 100 Q170 90 190 100 Q210 110 230 100" stroke="#FFD700" strokeWidth="3" fill="none" />
            <Path d="M70 110 Q90 100 110 110 Q130 120 150 110 Q170 100 190 110 Q210 120 230 110" stroke="#FFD700" strokeWidth="3" fill="none" />
            <Path d="M70 120 Q90 110 110 120 Q130 130 150 120 Q170 110 190 120 Q210 130 230 120" stroke="#FFD700" strokeWidth="3" fill="none" />
            <Path d="M70 130 Q90 120 110 130 Q130 140 150 130 Q170 120 190 130 Q210 140 230 130" stroke="#FFD700" strokeWidth="3" fill="none" />
            <Path d="M70 140 Q90 130 110 140 Q130 150 150 140 Q170 130 190 140 Q210 150 230 140" stroke="#FFD700" strokeWidth="3" fill="none" />
            <Path d="M70 150 Q90 140 110 150 Q130 160 150 150 Q170 140 190 150 Q210 160 230 150" stroke="#FFD700" strokeWidth="3" fill="none" />
            <Path d="M70 160 Q90 150 110 160 Q130 170 150 160 Q170 150 190 160 Q210 170 230 160" stroke="#FFD700" strokeWidth="3" fill="none" />
            <Path d="M70 170 Q90 160 110 170 Q130 180 150 170 Q170 160 190 170 Q210 180 230 170" stroke="#FFD700" strokeWidth="3" fill="none" />
            {/* Chopsticks */}
            <Rect x="180" y="85" width="4" height="80" rx="2" fill="#8D6E63" transform="rotate(15 182 125)" />
            <Rect x="185" y="85" width="4" height="80" rx="2" fill="#8D6E63" transform="rotate(15 187 125)" />
            {/* Japanese character */}
            <SvgText x="200" y="200" fontSize="16" fill="#333" textAnchor="middle">あ</SvgText>
          </Svg>
        </View>
        
        {/* Noodles 2 - Blurred */}
        <View style={styles.noodlesBlur}>
          <Svg width={width * 0.525} height={width * 0.523} viewBox="0 0 197 196" fill="none">
            <Rect x="40" y="60" width="117" height="80" rx="6" fill="#FF6B6B" opacity="0.7" />
            <Rect x="50" y="50" width="97" height="15" rx="3" fill="#FF5252" opacity="0.7" />
            <Rect x="90" y="40" width="17" height="15" rx="7" fill="#FF5252" opacity="0.7" />
            <Path d="M50 70 Q65 65 80 70 Q95 75 110 70 Q125 65 140 70" stroke="#FFD700" strokeWidth="2" fill="none" opacity="0.7" />
            <Path d="M50 80 Q65 75 80 80 Q95 85 110 80 Q125 75 140 80" stroke="#FFD700" strokeWidth="2" fill="none" opacity="0.7" />
            <Path d="M50 90 Q65 85 80 90 Q95 95 110 90 Q125 85 140 90" stroke="#FFD700" strokeWidth="2" fill="none" opacity="0.7" />
            <Path d="M50 100 Q65 95 80 100 Q95 105 110 100 Q125 95 140 100" stroke="#FFD700" strokeWidth="2" fill="none" opacity="0.7" />
            <Path d="M50 110 Q65 105 80 110 Q95 115 110 110 Q125 105 140 110" stroke="#FFD700" strokeWidth="2" fill="none" opacity="0.7" />
            <Rect x="130" y="65" width="3" height="60" rx="1.5" fill="#8D6E63" opacity="0.7" transform="rotate(15 131.5 95)" />
            <Rect x="133" y="65" width="3" height="60" rx="1.5" fill="#8D6E63" opacity="0.7" transform="rotate(15 134.5 95)" />
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
  noodlesContainer: {
    position: 'absolute',
    width: width * 0.712, // 267px on 375px screen
    height: height * 0.34, // 276px on 812px screen
    left: width * 0.365, // 137px on 375px screen
    top: height * 0.143, // 116px on 812px screen
  },
  noodlesMain: {
    position: 'absolute',
    width: width * 0.712,
    height: width * 0.709, // 266px on 375px screen
    left: 0,
    top: 0,
  },
  noodlesBlur: {
    position: 'absolute',
    width: width * 0.525, // 197px on 375px screen
    height: width * 0.523, // 196px on 375px screen
    left: width * 0.136, // 51px on 375px screen
    top: height * 0.098, // 80px on 812px screen
    opacity: 0.6,
  },
}); 