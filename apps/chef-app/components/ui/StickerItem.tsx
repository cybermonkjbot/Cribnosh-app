import type { Sticker } from '@/utils/stickerData';
import { RotateCw, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Dimensions, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface StickerItemData {
  id: string;
  sticker: Sticker;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface StickerItemProps {
  stickerData: StickerItemData;
  onUpdate: (data: StickerItemData) => void;
  onDelete: () => void;
  imageWidth: number;
  imageHeight: number;
  imageX: number;
  imageY: number;
}

const MIN_SIZE = 60;
const MIN_SIZE = 60;

export function StickerItem({
  stickerData,
  onUpdate,
  onDelete,
  imageWidth,
  imageHeight,
  imageX,
  imageY,
}: StickerItemProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [position, setPosition] = useState({ x: stickerData.x, y: stickerData.y });
  const [scale, setScale] = useState(stickerData.width / MIN_SIZE);
  const [rotation, setRotation] = useState(stickerData.rotation);
  const panStart = useRef({ x: 0, y: 0, scale: 1, rotation: 0 });
  const lastTapTime = useRef(0);
  const scaleStart = useRef(1);
  const rotationStart = useRef(0);

  // Update when stickerData changes externally
  React.useEffect(() => {
    setPosition({ x: stickerData.x, y: stickerData.y });
    setScale(stickerData.width / MIN_SIZE);
    setRotation(stickerData.rotation);
  }, [stickerData.x, stickerData.y, stickerData.width, stickerData.rotation]);

  // Single tap to select/deselect, double tap to delete
  const handleSingleTap = () => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      // Double tap - delete
      onDelete();
    } else {
      // Single tap - toggle selection
      setIsSelected(!isSelected);
    }
    lastTapTime.current = now;
  };

  // Pan responder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isSelected,
      onMoveShouldSetPanResponder: (_: any, gestureState: any) => {
        return isSelected && (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5);
      },
      onPanResponderGrant: () => {
        panStart.current = { x: position.x, y: position.y, scale, rotation };
        scaleStart.current = scale;
        rotationStart.current = rotation;
      },
      onPanResponderMove: (_: any, gestureState: any) => {
        // Single finger drag
        const newX = Math.max(
          imageX,
          Math.min(imageX + imageWidth - (currentWidth), panStart.current.x + gestureState.dx)
        );
        const newY = Math.max(
          imageY,
          Math.min(imageY + imageHeight - (currentHeight), panStart.current.y + gestureState.dy)
        );
        setPosition({ x: newX, y: newY });
      },
      onPanResponderRelease: () => {
        onUpdate({
          ...stickerData,
          x: position.x,
          y: position.y,
          width: MIN_SIZE * scale,
          height: (stickerData.height / stickerData.width) * MIN_SIZE * scale,
          rotation,
        });
      },
    })
  ).current;

  const currentWidth = MIN_SIZE * scale;
  const currentHeight = (stickerData.height / stickerData.width) * MIN_SIZE * scale;

  return (
    <View
      style={[
        styles.container,
        {
          left: position.x,
          top: position.y,
          width: currentWidth,
          height: currentHeight,
          transform: [{ rotate: `${rotation}deg` }],
        },
      ]}
      {...(isSelected ? panResponder.panHandlers : {})}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleSingleTap}
        style={StyleSheet.absoluteFill}
      >
        <View
          style={[
            styles.stickerContent,
            {
              backgroundColor: stickerData.sticker.backgroundColor || '#FF3B30',
              minWidth: currentWidth,
              minHeight: currentHeight,
              borderWidth: isSelected ? 3 : 2,
              borderColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
            },
          ]}
        >
          {isSelected && (
            <>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={onDelete}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.rotationHandle}>
                <RotateCw size={16} color="#FFFFFF" />
              </View>
              {/* Corner handles for resize */}
              <View style={[styles.resizeHandle, styles.topLeftHandle]} />
              <View style={[styles.resizeHandle, styles.topRightHandle]} />
              <View style={[styles.resizeHandle, styles.bottomLeftHandle]} />
              <View style={[styles.resizeHandle, styles.bottomRightHandle]} />
            </>
          )}
          <View style={styles.stickerTextContainer}>
            {stickerData.sticker.emoji && (
              <Text style={styles.emoji}>{stickerData.sticker.emoji}</Text>
            )}
            <Text
              style={[
                styles.stickerText,
                { color: stickerData.sticker.color || '#FFFFFF' },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {stickerData.sticker.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  stickerContent: {
    borderRadius: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  stickerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  stickerText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  rotationHandle: {
    position: 'absolute',
    bottom: -16,
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  resizeHandle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#007AFF',
    zIndex: 1001,
  },
  topLeftHandle: {
    top: -6,
    left: -6,
  },
  topRightHandle: {
    top: -6,
    right: -6,
  },
  bottomLeftHandle: {
    bottom: -6,
    left: -6,
  },
  bottomRightHandle: {
    bottom: -6,
    right: -6,
  },
});
