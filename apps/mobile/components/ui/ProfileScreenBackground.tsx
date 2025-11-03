import { BlurView } from 'expo-blur';
import React, { memo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProfileScreenBackgroundProps {
  children?: React.ReactNode;
}

// Memoized background component to prevent unnecessary re-renders
// Optimized to use SVG for all circles - single rendering pass instead of 6 separate Views
const ProfileScreenBackground: React.FC<ProfileScreenBackgroundProps> = memo(({
  children
}) => {
  // Use full screen dimensions instead of fixed values
  const containerStyle = [styles.container];
  const backgroundStyle = [styles.background];
  const blurOverlayStyle = [styles.blurOverlay];

  return (
    <View style={containerStyle}>
      {/* Layer 1: Main background with rounded top corners */}
      <View style={backgroundStyle} />
      
      {/* Layer 2: Circle glows - optimized using single SVG for better performance */}
      {/* Using SVG instead of multiple Views reduces rendering passes and improves performance */}
      {/* SVG renders all circles in a single native rendering pass, more efficient than 6 separate Views */}
      <View style={styles.circleContainer} collapsable={false}>
        <Svg
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          style={styles.svgContainer}
        >
          {/* Top-left orange glow layers */}
          {/* Original: left: -120, top: -20, width: 300, height: 300, radius: 150 */}
          <Circle
            cx={-120 + 150} // left + (width/2)
            cy={-20 + 150}  // top + (height/2)
            r={150}
            fill="#FF5E00"
            opacity={0.15}
          />
          {/* Original: left: -70, top: 30, width: 220, height: 220, radius: 110 */}
          <Circle
            cx={-70 + 110}
            cy={30 + 110}
            r={110}
            fill="#FF5E00"
            opacity={0.25}
          />
          {/* Original: left: -30, top: 70, width: 160, height: 160, radius: 80 */}
          <Circle
            cx={-30 + 80}
            cy={70 + 80}
            r={80}
            fill="#FF5E00"
            opacity={0.35}
          />
          
          {/* Top-right yellow-orange glow layers */}
          {/* Original: right: -100, top: 10, width: 280, height: 280, radius: 140 */}
          <Circle
            cx={SCREEN_WIDTH - 100 + 140} // right offset + radius
            cy={10 + 140}
            r={140}
            fill="#FF9900"
            opacity={0.12}
          />
          {/* Original: right: -60, top: 50, width: 200, height: 200, radius: 100 */}
          <Circle
            cx={SCREEN_WIDTH - 60 + 100}
            cy={50 + 100}
            r={100}
            fill="#FF9900"
            opacity={0.20}
          />
          {/* Original: right: -20, top: 90, width: 140, height: 140, radius: 70 */}
          <Circle
            cx={SCREEN_WIDTH - 20 + 70}
            cy={90 + 70}
            r={70}
            fill="#FF9900"
            opacity={0.28}
          />
        </Svg>
      </View>
      
      {/* Layer 3: Blur overlay for enhanced diffusion */}
      <BlurView intensity={80} style={blurOverlayStyle} />
      
      {/* Content overlay */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
});

// Add display name for debugging
ProfileScreenBackground.displayName = 'ProfileScreenBackground';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  background: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#FF3B30',
    opacity: 0.97,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000000',
    shadowOffset: {
      width: 40,
      height: 44,
    },
    shadowOpacity: 0.15,
    shadowRadius: 84,
    elevation: 20,
  },
  // Container for all circles to optimize rendering
  circleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    pointerEvents: 'none', // Prevents touch events on background elements
    overflow: 'hidden',
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  blurOverlay: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    opacity: 0.3,
    pointerEvents: 'none', // Prevents touch events on blur overlay
  },
  contentContainer: {
    position: 'relative',
    flex: 1,
    zIndex: 1,
    width: SCREEN_WIDTH,
  },
});

export { ProfileScreenBackground };
export default ProfileScreenBackground; 