import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface ImageStackItem {
  _id?: string;
  dish_id?: string;
  id?: string;
  image_url?: string;
  imageUrl?: string;
  image?: string;
}

interface ImageStackProps {
  items: ImageStackItem[];
  size?: 'small' | 'large';
  maxItems?: number;
}

interface StackedImageProps {
  item: ImageStackItem;
  offset: number;
  rotation: number;
  zIndex: number;
  imageSize: number;
  containerSize: number;
}

const StackedImage: React.FC<StackedImageProps> = ({
  item,
  offset,
  rotation,
  zIndex,
  imageSize,
  containerSize,
}) => {
  const [imageError, setImageError] = useState(false);

  // Get image URL from various possible fields
  const imageUrl = item.image_url || item.imageUrl || item.image;

  // Reset error state when image_url changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  if (!imageUrl || imageError) {
    return (
      <View
        style={[
          styles.stackedImage,
          {
            width: imageSize,
            height: imageSize,
            transform: [
              { translateX: offset },
              { translateY: offset * 0.5 },
              { rotate: `${rotation}deg` },
            ],
            zIndex,
          },
        ]}
      >
        <View style={[styles.stackedImageContent, styles.placeholderImage]}>
          <Ionicons name="cube-outline" size={imageSize * 0.25} color="#9CA3AF" />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.stackedImage,
        {
          width: imageSize,
          height: imageSize,
          transform: [
            { translateX: offset },
            { translateY: offset * 0.5 },
            { rotate: `${rotation}deg` },
          ],
          zIndex,
        },
      ]}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.stackedImageContent}
        onError={() => {
          setImageError(true);
        }}
      />
    </View>
  );
};

export function ImageStack({ items, size = 'large', maxItems = 4 }: ImageStackProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const imageSize = size === 'small' ? 48 : 80;
  const containerSize = size === 'small' ? 48 : 120;
  const itemsToShow = items.slice(0, maxItems);
  const remainingCount = items.length - maxItems;

  return (
    <View
      style={[
        styles.imageStackContainer,
        {
          width: containerSize,
          height: containerSize,
        },
      ]}
    >
      {itemsToShow.map((item, idx) => {
        const offset = idx * 8;
        const rotation = (idx % 2 === 0 ? 1 : -1) * (idx * 3);
        return (
          <StackedImage
            key={item._id || item.dish_id || item.id || idx}
            item={item}
            offset={offset}
            rotation={rotation}
            zIndex={items.length - idx}
            imageSize={imageSize}
            containerSize={containerSize}
          />
        );
      })}
      {remainingCount > 0 && (
        <View
          style={[
            styles.stackedImage,
            styles.moreItemsOverlay,
            {
              width: imageSize,
              height: imageSize,
              transform: [
                { translateX: maxItems * 8 },
                { translateY: maxItems * 8 * 0.5 },
              ],
              zIndex: 0,
            },
          ]}
        >
          <View style={[styles.stackedImageContent, styles.moreItemsContainer]}>
            <Text
              style={[
                styles.moreItemsText,
                {
                  fontSize: size === 'small' ? 12 : 18,
                },
              ]}
            >
              +{remainingCount}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageStackContainer: {
    position: 'relative',
  },
  stackedImage: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EAEAEA',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stackedImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  placeholderImage: {
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreItemsOverlay: {
    backgroundColor: '#02120A',
    borderColor: '#374151',
  },
  moreItemsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#02120A',
  },
  moreItemsText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

