import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

interface ProfileScreenBackgroundProps {
  children?: React.ReactNode;
}

// Memoized background component to prevent unnecessary re-renders
// Uses PNG image as a stretched background that covers edge to edge
const ProfileScreenBackground: React.FC<ProfileScreenBackgroundProps> = memo(({
  children
}) => {
  return (
    <View style={styles.container}>
      {/* Background image that stretches to fill the entire container */}
      <Image
        source={require('../../assets/profilebackground.png')}
        style={styles.imageBackground}
        contentFit="fill"
        cachePolicy="memory-disk"
        priority="high"
      />
      
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
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FF3B30', // Red background to fill areas the image didn't fill
  },
  imageBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '130%',
    height: '130%',
    opacity: 0.4,
    pointerEvents: 'none',
    zIndex: 0,
    transform: [{ scale: 1.3 }],
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
    width: '100%',
    height: '100%',
  },
});

export { ProfileScreenBackground };
export default ProfileScreenBackground; 