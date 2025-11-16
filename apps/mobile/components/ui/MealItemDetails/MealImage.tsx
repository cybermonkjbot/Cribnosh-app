import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

interface MealImageProps {
  imageUrl?: string;
  title: string;
}

export function MealImage({ imageUrl, title }: MealImageProps) {
  const [imageError, setImageError] = useState(false);
  const fallbackImage = require('@/assets/images/cribnoshpackaging.png');

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <View style={styles.container}>
      {/* Food Image */}
      <Image 
        source={
          imageUrl && !imageError
            ? { uri: imageUrl }
            : fallbackImage
        }
        style={styles.foodImage}
        resizeMode="contain"
        onError={handleImageError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  
  // Food Image with drop shadow
  foodImage: {
    width: 280,
    height: 320,
    // Drop shadow effect
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    // For Android shadow
    elevation: 12,
  },
}); 