import { BlurView } from 'expo-blur';
import React, { memo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProfileScreenBackgroundProps {
  children?: React.ReactNode;
}

// Memoized background component to prevent unnecessary re-renders
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
      
      {/* Layer 2: Circle glows - optimized with static positioning */}
      <View style={styles.circleContainer}>
        {/* Top-left orange glow layers */}
        <View style={styles.orangeGlowLeftOuter} />
        <View style={styles.orangeGlowLeftMiddle} />
        <View style={styles.orangeGlowLeftInner} />
        
        {/* Top-right yellow-orange glow layers */}
        <View style={styles.yellowOrangeGlowRightOuter} />
        <View style={styles.yellowOrangeGlowRightMiddle} />
        <View style={styles.yellowOrangeGlowRightInner} />
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
  // Optimized circle styles with static positioning
  orangeGlowLeftOuter: {
    position: 'absolute',
    width: 300,
    height: 300,
    left: -120,
    top: -20,
    backgroundColor: '#FF5E00',
    borderRadius: 150,
    opacity: 0.15,
  },
  orangeGlowLeftMiddle: {
    position: 'absolute',
    width: 220,
    height: 220,
    left: -70,
    top: 30,
    backgroundColor: '#FF5E00',
    borderRadius: 110,
    opacity: 0.25,
  },
  orangeGlowLeftInner: {
    position: 'absolute',
    width: 160,
    height: 160,
    left: -30,
    top: 70,
    backgroundColor: '#FF5E00',
    borderRadius: 80,
    opacity: 0.35,
  },
  yellowOrangeGlowRightOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    right: -100,
    top: 10,
    backgroundColor: '#FF9900',
    borderRadius: 140,
    opacity: 0.12,
  },
  yellowOrangeGlowRightMiddle: {
    position: 'absolute',
    width: 200,
    height: 200,
    right: -60,
    top: 50,
    backgroundColor: '#FF9900',
    borderRadius: 100,
    opacity: 0.20,
  },
  yellowOrangeGlowRightInner: {
    position: 'absolute',
    width: 140,
    height: 140,
    right: -20,
    top: 90,
    backgroundColor: '#FF9900',
    borderRadius: 70,
    opacity: 0.28,
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