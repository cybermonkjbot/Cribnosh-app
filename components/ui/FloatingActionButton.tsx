import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FloatingActionButtonProps {
  bottomPosition?: number;
  rightPosition?: number;
  onCameraPress?: () => void;
  onRecipePress?: () => void;
}

export function FloatingActionButton({
  bottomPosition = 120,
  rightPosition = 20,
  onCameraPress,
  onRecipePress,
}: FloatingActionButtonProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const router = useRouter();

  const handleCameraPress = () => {
    if (onCameraPress) {
      onCameraPress();
    } else {
      router.push('/camera-modal' as any);
    }
    setIsActionMenuOpen(false);
  };

  const handleRecipePress = () => {
    if (onRecipePress) {
      onRecipePress();
    } else {
      console.log('Recipe Share pressed');
    }
    setIsActionMenuOpen(false);
  };

  return (
    <View style={[styles.floatingActionButton, { bottom: bottomPosition, right: rightPosition }]}>
      <TouchableOpacity
        style={[
          styles.mainActionButton,
          isActionMenuOpen && styles.mainActionButtonOpen
        ]}
        
        onPress={() => setIsActionMenuOpen(!isActionMenuOpen)}
        activeOpacity={0.8}
      >
        <View style={styles.mainButtonIcon}>
          <View style={styles.plusIcon} />
        </View>
      </TouchableOpacity>

      {/* Expanded Action Menu */}
      {isActionMenuOpen && (
        <>
          {/* Camera Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.cameraActionButton]}
            onPress={handleCameraPress}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonIcon}>
              <View style={styles.cameraIcon} />
            </View>
            <Text style={styles.actionButtonLabel}>Create Food Content</Text>
          </TouchableOpacity>

          {/* Recipe Share Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.recipeActionButton]}
            onPress={handleRecipePress}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonIcon}>
              <View style={styles.recipeIcon} />
            </View>
            <Text style={styles.actionButtonLabel}>RecipeShare</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingActionButton: {
    position: 'absolute',
    zIndex: 1000,
    alignItems: 'flex-end',
  },
  mainActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF3B30', // Cribnosh red
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainActionButtonOpen: {
    transform: [{ translateY: -20 }], // Move button up by 20px when open
  },
  mainButtonIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    width: 16,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraActionButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  recipeActionButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#0B9E58', // Cribnosh green
  },
  actionButtonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cameraIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  recipeIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0B9E58',
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
});
