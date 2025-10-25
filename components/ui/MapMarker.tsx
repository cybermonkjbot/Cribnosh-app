// Custom MapMarker component with chef styling
import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MapMarkerProps } from '../../app/types/maps';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export function MapMarker({ chef, onPress, isSelected = false }: MapMarkerProps) {
  const colorScheme = useColorScheme();

  // Get sentiment-based colors
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'fire':
      case 'elite':
        return '#FF6B35'; // Orange-red
      case 'bussing':
      case 'slaps':
        return '#4ECDC4'; // Teal
      case 'solid':
      case 'decent':
        return '#45B7D1'; // Blue
      case 'mid':
      case 'meh':
        return '#96CEB4'; // Light green
      case 'notIt':
      case 'trash':
        return '#FFEAA7'; // Yellow
      case 'average':
        return '#DDA0DD'; // Plum
      case 'skip':
        return '#F8BBD9'; // Pink
      default:
        return '#95A5A6'; // Gray
    }
  };

  const sentimentColor = getSentimentColor(chef.sentiment);
  const isLive = chef.is_live && chef.live_viewers && chef.live_viewers > 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selected,
        { borderColor: sentimentColor }
      ]}
      onPress={() => onPress?.(chef)}
      activeOpacity={0.8}
    >
      {/* Chef Avatar */}
      <View style={[styles.avatarContainer, { backgroundColor: sentimentColor }]}>
        {chef.image_url ? (
          <Image
            source={{ uri: chef.image_url }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {chef.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* Live Indicator */}
        {isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Kitchen Name */}
      <View style={styles.nameContainer}>
        <Text 
          style={[
            styles.kitchenName,
            { color: Colors[colorScheme as keyof typeof Colors].text }
          ]}
          numberOfLines={1}
        >
          {chef.kitchen_name}
        </Text>
        
        {/* Rating */}
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>★ {chef.rating}</Text>
          <Text style={styles.distanceText}>{chef.distance}</Text>
        </View>
      </View>

      {/* Sentiment Badge */}
      <View style={[styles.sentimentBadge, { backgroundColor: sentimentColor }]}>
        <Text style={styles.sentimentText}>{chef.sentiment}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 3,
    padding: 8,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selected: {
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 4,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  liveIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF0000',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    marginRight: 2,
  },
  liveText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  kitchenName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  ratingText: {
    fontSize: 8,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  distanceText: {
    fontSize: 7,
    color: '#666',
  },
  sentimentBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sentimentText: {
    color: 'white',
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default MapMarker;
