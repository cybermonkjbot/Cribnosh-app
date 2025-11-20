import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { Play, Clock } from 'lucide-react-native';

export type ContentItem = {
  id: string;
  type: 'recipe' | 'live' | 'video' | 'meal';
  title: string;
  thumbnail?: string | null;
  duration?: number; // in seconds
  views?: number;
  createdAt: number;
};

interface ContentGridProps {
  items: ContentItem[];
  onItemPress: (item: ContentItem) => void;
  numColumns?: number;
}

export function ContentGrid({ items, onItemPress, numColumns = 3 }: ContentGridProps) {
  const renderItem = ({ item }: { item: ContentItem }) => {
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onItemPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.thumbnailContainer}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Text style={styles.placeholderText}>
                {item.title?.charAt(0).toUpperCase() || 'C'}
              </Text>
            </View>
          )}
          {item.type === 'video' && (
            <View style={styles.playOverlay}>
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          )}
          {item.type === 'live' && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          {item.duration && (
            <View style={styles.durationBadge}>
              <Clock size={12} color="#FFFFFF" />
              <Text style={styles.durationText}>
                {formatDuration(item.duration)}
              </Text>
            </View>
          )}
        </View>
        {item.title && (
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      numColumns={numColumns}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      showsVerticalScrollIndicator={false}
    />
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return `${secs}s`;
}

const styles = StyleSheet.create({
  container: {
    padding: 2,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  item: {
    flex: 1,
    margin: 1,
    maxWidth: '33.33%',
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#999',
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 12,
    color: '#000',
    marginTop: 4,
    paddingHorizontal: 2,
  },
});

