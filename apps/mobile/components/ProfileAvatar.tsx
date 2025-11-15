import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useState, useEffect } from 'react';
import { Camera } from 'lucide-react-native';

interface ProfileAvatarProps {
  size?: number;
  style?: any;
  containerStyle?: any;
  onImageSelected?: (uri: string) => void;
  selectedImageUri?: string;
  isAuthenticated?: boolean;
}

// Simple user icon component - replaced SVG with View-based icon
const UserIcon = ({ size }: { size: number }) => (
  <View style={[userIconStyles.container, { width: size, height: size }]}>
    <View style={[userIconStyles.head, { width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15 }]} />
    <View style={[userIconStyles.body, { width: size * 0.6, height: size * 0.4, borderRadius: size * 0.2 }]} />
  </View>
);

// Camera icon component using lucide-react-native
const CameraIcon = ({ size }: { size: number }) => (
  <Camera size={size * 0.6} color="#FFFFFF" strokeWidth={2.5} />
);

export function ProfileAvatar({ 
  size = 80, 
  style, 
  containerStyle, 
  onImageSelected,
  selectedImageUri,
  isAuthenticated = true
}: ProfileAvatarProps) {
  const containerSize = size;
  const userIconSize = size * 0.5; // 40px for 80px container
  const cameraIconSize = size * 0.3; // 24px for 80px container
  const [imageError, setImageError] = useState(false);

  // Reset error state when image URI changes
  useEffect(() => {
    setImageError(false);
  }, [selectedImageUri]);

  const handleImageSelection = async () => {
    // Prevent image selection when not authenticated
    if (!isAuthenticated) {
      return;
    }

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to make this work!'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        onImageSelected?.(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  return (
    <View style={[{ width: containerSize, height: containerSize }, containerStyle, { position: 'relative' }]}>
      <TouchableOpacity 
        style={[styles.container, { width: containerSize, height: containerSize }]} 
        onPress={handleImageSelection}
        activeOpacity={0.8}
        disabled={!isAuthenticated}
      >
        {selectedImageUri && !imageError ? (
          // Display selected image
          <Image 
            source={{ uri: selectedImageUri }} 
            style={[styles.selectedImage, { width: containerSize, height: containerSize }]}
            contentFit="cover"
            transition={200}
            onError={(error) => {
              console.error('ProfileAvatar image load error:', error);
              console.error('Image URI:', selectedImageUri);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('ProfileAvatar image loaded successfully:', selectedImageUri);
              setImageError(false);
            }}
          />
        ) : (
          // Display default user icon
          <View style={[styles.userIconContainer, { width: userIconSize, height: userIconSize }]}>
            <UserIcon size={userIconSize} />
          </View>
        )}
        
        {/* Camera icon overlay - only show when authenticated */}
        {isAuthenticated && (
        <View style={[styles.cameraIconOverlay, { width: cameraIconSize, height: cameraIconSize }]}>
          <CameraIcon size={cameraIconSize} />
        </View>
        )}
      </TouchableOpacity>
      
      {/* Not signed in badge */}
      {!isAuthenticated && (
        <View
          style={{
            position: 'absolute',
            top: -12,
            right: -8,
            zIndex: 10,
            transform: [{ rotate: '-5deg' }],
          }}
        >
          <View
            style={{
              backgroundColor: '#ef4444',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 10,
                fontWeight: '700',
                textTransform: 'uppercase',
              }}
            >
              NOT SIGNED IN
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ECECEC',
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    // Glowing red shadow effect matching the CSS specifications
    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.41,
    shadowRadius: 80,
    elevation: 20, // Android shadow equivalent
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'relative',
  },
  userIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 8,
  },
  selectedImage: {
    borderRadius: 35, // Slightly smaller than container to account for border
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

const userIconStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: {
    backgroundColor: '#A0A0A0',
    marginBottom: 2,
  },
  body: {
    backgroundColor: '#A0A0A0',
  },
});

