import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface MascotProps {
  emotion: 'happy' | 'sad' | 'excited' | 'hungry' | 'satisfied' | 'default';
  size?: number;
  style?: any;
}

// Memoize the component to prevent re-creation on every render
const MemoizedMascot = React.memo<MascotProps>(({ emotion = 'default', size = 100, style }) => {
  const [imageError, setImageError] = useState(false);
  
  // Validate and sanitize size to prevent invalid dimensions (NaN, Infinity, 0, or negative)
  const validSize = typeof size === 'number' && isFinite(size) && size > 0 ? size : 100;
  const validHeight = validSize * (265/291); // Maintain aspect ratio
  
  // Handle image load errors gracefully
  const handleImageError = (error: any) => {
    if (__DEV__) {
      console.error('Mascot image load error:', error);
    }
    setImageError(true);
  };
  
  // If image fails to load, show empty view instead of crashing
  if (imageError) {
    return (
      <View style={[styles.container, style, { width: validSize, height: validHeight }]} />
    );
  }
  
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../assets/images/mascotoptimized.png')}
        style={{
          width: validSize,
          height: validHeight,
        }}
        contentFit="contain"
        cachePolicy="memory-disk"
        onError={handleImageError}
        transition={200}
      />
    </View>
  );
});

MemoizedMascot.displayName = 'Mascot';

// Export the memoized component
export const Mascot = MemoizedMascot;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

