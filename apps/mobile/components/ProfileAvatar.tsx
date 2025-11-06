import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface ProfileAvatarProps {
  size?: number;
  style?: any;
  containerStyle?: any;
  onImageSelected?: (uri: string) => void;
  selectedImageUri?: string;
  isAuthenticated?: boolean;
}

// Generic user icon SVG
const userIconSVG = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="20" fill="#A0A0A0"/>
  <circle cx="20" cy="16" r="6" fill="#A0A0A0"/>
  <path d="M8 32C8 26.4772 12.4772 22 18 22H22C27.5228 22 32 26.4772 32 32V40H8V32Z" fill="#A0A0A0"/>
</svg>`;

// Camera icon SVG for the overlay
const cameraIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

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
        {selectedImageUri ? (
          // Display selected image
          <Image 
            source={{ uri: selectedImageUri }} 
            style={[styles.selectedImage, { width: containerSize, height: containerSize }]}
          />
        ) : (
          // Display default user icon
          <View style={[styles.userIconContainer, { width: userIconSize, height: userIconSize }]}>
            <SvgXml 
              xml={userIconSVG} 
              width={userIconSize} 
              height={userIconSize}
            />
          </View>
        )}
        
        {/* Camera icon overlay - only show when authenticated */}
        {isAuthenticated && (
        <View style={[styles.cameraIconOverlay, { width: cameraIconSize, height: cameraIconSize }]}>
          <SvgXml 
            xml={cameraIconSVG} 
            width={cameraIconSize} 
            height={cameraIconSize}
          />
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
