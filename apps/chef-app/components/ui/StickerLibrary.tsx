import { getStickersByCategory, type Sticker, type StickerCategory } from '@/utils/stickerData';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StickerLibraryProps {
  onSelectSticker: (sticker: Sticker) => void;
  onClose: () => void;
  isVisible: boolean;
}

const CATEGORIES: { id: StickerCategory; label: string; icon: string }[] = [
  { id: 'reactions', label: 'Reactions', icon: 'happy' },
  { id: 'ratings', label: 'Ratings', icon: 'star' },
  { id: 'food', label: 'Food', icon: 'restaurant' },
];

export function StickerLibrary({ onSelectSticker, onClose, isVisible }: StickerLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<StickerCategory>('reactions');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = React.useMemo(() => ['50%', '75%'], []);

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const stickers = getStickersByCategory(selectedCategory);

  const handleStickerSelect = (sticker: Sticker) => {
    onSelectSticker(sticker);
    // Don't close immediately - let user add multiple stickers
  };

  if (!isVisible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stickers</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.categoryTabs}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.id && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={20}
                color={selectedCategory === category.id ? '#FF3B30' : '#8E8E93'}
              />
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === category.id && styles.categoryTabTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.stickersGrid}
          contentContainerStyle={styles.stickersGridContent}
          showsVerticalScrollIndicator={false}
        >
          {stickers.map((sticker) => (
            <TouchableOpacity
              key={sticker.id}
              style={[
                styles.stickerButton,
                { backgroundColor: sticker.backgroundColor || '#FF3B30' },
              ]}
              onPress={() => handleStickerSelect(sticker)}
              activeOpacity={0.7}
            >
              {sticker.emoji && <Text style={styles.stickerEmoji}>{sticker.emoji}</Text>}
              <Text
                style={[styles.stickerButtonText, { color: sticker.color || '#FFFFFF' }]}
                numberOfLines={2}
              >
                {sticker.text}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 8,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  categoryTabText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  stickersGrid: {
    flex: 1,
  },
  stickersGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 16,
    gap: 12,
    paddingBottom: 40,
  },
  stickerButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stickerEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  stickerButtonText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
