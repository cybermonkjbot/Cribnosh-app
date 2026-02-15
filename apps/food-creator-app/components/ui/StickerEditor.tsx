import type { Sticker } from '@/utils/stickerData';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { StickerItem, type StickerItemData } from './StickerItem';
import { StickerLibrary } from './StickerLibrary';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StickerEditorProps {
  imageUri: string;
  onSave: (editedImageUri: string) => void;
  onCancel: () => void;
  visible: boolean;
}

export function StickerEditor({ imageUri, onSave, onCancel, visible }: StickerEditorProps) {
  const [stickers, setStickers] = useState<StickerItemData[]>([]);
  const [showStickerLibrary, setShowStickerLibrary] = useState(false);
  const [imageLayout, setImageLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const viewRef = useRef<View>(null);

  const handleAddSticker = (sticker: Sticker) => {
    const newSticker: StickerItemData = {
      id: `${sticker.id}-${Date.now()}`,
      sticker,
      x: imageLayout.x + imageLayout.width / 2 - 60,
      y: imageLayout.y + imageLayout.height / 2 - 30,
      width: 120,
      height: 60,
      rotation: 0,
    };
    setStickers([...stickers, newSticker]);
    // Don't close library - let user add multiple stickers
    // Library stays open for quick sticker addition
  };

  const handleUpdateSticker = (updatedSticker: StickerItemData) => {
    setStickers(stickers.map(s => s.id === updatedSticker.id ? updatedSticker : s));
  };

  const handleDeleteSticker = (stickerId: string) => {
    setStickers(stickers.filter(s => s.id !== stickerId));
  };

  const handleSave = async () => {
    try {
      if (!viewRef.current) {
        console.error('View ref not available');
        return;
      }

      const uri = await captureRef(viewRef.current, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
      });

      onSave(uri);
    } catch (error) {
      console.error('Error saving image with stickers:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      if (!viewRef.current) {
        console.error('View ref not available');
        return;
      }

      const uri = await captureRef(viewRef.current, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share your meal',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image. Please try again.');
    }
  };

  const handleImageLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setImageLayout({ x, y, width, height });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Photo</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={styles.saveButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.imageContainer}
          activeOpacity={1}
          onPress={() => {
            // Deselect all stickers when tapping background
            setStickers(stickers.map(s => ({ ...s })));
          }}
        >
          <View ref={viewRef} collapsable={false} style={StyleSheet.absoluteFill}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="contain"
              onLayout={handleImageLayout}
            />
            {stickers.map((stickerData) => (
              <StickerItem
                key={stickerData.id}
                stickerData={stickerData}
                onUpdate={handleUpdateSticker}
                onDelete={() => handleDeleteSticker(stickerData.id)}
                imageWidth={imageLayout.width}
                imageHeight={imageLayout.height}
                imageX={imageLayout.x}
                imageY={imageLayout.y}
              />
            ))}
          </View>
        </TouchableOpacity>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addStickerButton}
            onPress={() => {
              setShowStickerLibrary(true);
            }}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.addStickerButtonText}>
              {stickers.length > 0 ? `Add More (${stickers.length})` : 'Add Sticker'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Ionicons name="share-social" size={24} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        <StickerLibrary
          onSelectSticker={handleAddSticker}
          onClose={() => setShowStickerLibrary(false)}
          isVisible={showStickerLibrary}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#000000',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: '#000000',
    gap: 12,
  },
  addStickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  addStickerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

