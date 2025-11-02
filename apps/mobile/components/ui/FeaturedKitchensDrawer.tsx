import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CategoryFullDrawer } from './CategoryFullDrawer';
import { FeaturedKitchensSection } from './FeaturedKitchensSection';

interface Kitchen {
  id: string;
  name: string;
  cuisine: string;
  sentiment: 'bussing' | 'mid' | 'notIt' | 'fire' | 'slaps' | 'decent' | 'meh' | 'trash' | 'elite' | 'solid' | 'average' | 'skip';
  deliveryTime: string;
  distance: string;
  image: any;
  isLive?: boolean;
  liveViewers?: number;
}

interface FeaturedKitchensDrawerProps {
  onBack: () => void;
  kitchens?: Kitchen[];
  onKitchenPress?: (kitchen: Kitchen) => void;
}

export function FeaturedKitchensDrawer({
  onBack,
  kitchens = [],
  onKitchenPress
}: FeaturedKitchensDrawerProps) {
  // Enhanced default kitchens with more realistic data
  const defaultKitchens: Kitchen[] = [
    {
      id: '1',
      name: 'Amara\'s Kitchen',
      cuisine: 'Nigerian',
      sentiment: 'elite',
      deliveryTime: '25 min',
      distance: '0.8 mi',
      image: { uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop' },
      isLive: true,
      liveViewers: 156,
    },
    {
      id: '2',
      name: 'Bangkok Bites',
      cuisine: 'Thai',
      sentiment: 'fire',
      deliveryTime: '30 min',
      distance: '1.2 mi',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isLive: false,
    },
    {
      id: '3',
      name: 'Marrakech Delights',
      cuisine: 'Moroccan',
      sentiment: 'slaps',
      deliveryTime: '35 min',
      distance: '1.5 mi',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isLive: true,
      liveViewers: 89,
    },
    {
      id: '4',
      name: 'Seoul Street',
      cuisine: 'Korean',
      sentiment: 'solid',
      deliveryTime: '28 min',
      distance: '1.0 mi',
      image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
      isLive: false,
    },
    {
      id: '5',
      name: 'Nonna\'s Table',
      cuisine: 'Italian',
      sentiment: 'bussing',
      deliveryTime: '32 min',
      distance: '1.3 mi',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isLive: false,
    },
    {
      id: '6',
      name: 'Tokyo Dreams',
      cuisine: 'Japanese',
      sentiment: 'decent',
      deliveryTime: '22 min',
      distance: '0.6 mi',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isLive: true,
      liveViewers: 234,
    },
    {
      id: '7',
      name: 'Mumbai Spice',
      cuisine: 'Indian',
      sentiment: 'average',
      deliveryTime: '40 min',
      distance: '1.8 mi',
      image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
      isLive: false,
    },
    {
      id: '8',
      name: 'Parisian Bistro',
      cuisine: 'French',
      sentiment: 'mid',
      deliveryTime: '45 min',
      distance: '2.1 mi',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isLive: true,
      liveViewers: 67,
    },
  ];

  const displayKitchens = kitchens.length > 0 ? kitchens : defaultKitchens;

  // Enhanced filter chips for kitchen categories
  const filterChips = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'live', label: 'Live', icon: 'radio' },
    { id: 'elite', label: 'Elite', icon: 'star' },
    { id: 'quick', label: 'Quick', icon: 'flash' },
    { id: 'nearby', label: 'Nearby', icon: 'location' },
    { id: 'trending', label: 'Trending', icon: 'flame' },
  ];

  const liveKitchens = displayKitchens.filter(kitchen => kitchen.isLive);
  const eliteKitchens = displayKitchens.filter(kitchen => 
    ['elite', 'bussing', 'fire', 'slaps'].includes(kitchen.sentiment)
  );
  const quickKitchens = displayKitchens.filter(kitchen => {
    const deliveryTime = parseInt(kitchen.deliveryTime.split(' ')[0]);
    return deliveryTime <= 30;
  });
  const nearbyKitchens = displayKitchens.filter(kitchen => {
    const distance = parseFloat(kitchen.distance.split(' ')[0]);
    return distance <= 1.5;
  });

  return (
    <CategoryFullDrawer
      categoryName="Featured Kitchens"
      categoryDescription="Discover exceptional home kitchens with authentic flavors and live cooking experiences"
      onBack={onBack}
      filterChips={filterChips}
      activeFilters={[]}
      searchPlaceholder="Search kitchens by name or cuisine..."
    >
      <View style={styles.content}>
        {/* Live Kitchens Section */}
        {liveKitchens.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Live Now</Text>
            <Text style={styles.sectionDescription}>
              Watch these kitchens cook in real-time
            </Text>
            <FeaturedKitchensSection
              kitchens={liveKitchens}
              onKitchenPress={onKitchenPress}
            />
          </View>
        )}

        {/* Elite Kitchens Section */}
        {eliteKitchens.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Elite Kitchens</Text>
            <Text style={styles.sectionDescription}>
              Top-rated kitchens with exceptional food quality
            </Text>
            <FeaturedKitchensSection
              kitchens={eliteKitchens}
              onKitchenPress={onKitchenPress}
            />
          </View>
        )}

        {/* Quick Delivery Section */}
        {quickKitchens.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Delivery</Text>
            <Text style={styles.sectionDescription}>
              Get your food in 30 minutes or less
            </Text>
            <FeaturedKitchensSection
              kitchens={quickKitchens}
              onKitchenPress={onKitchenPress}
            />
          </View>
        )}

        {/* Nearby Kitchens Section */}
        {nearbyKitchens.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby</Text>
            <Text style={styles.sectionDescription}>
              Great kitchens close to your location
            </Text>
            <FeaturedKitchensSection
              kitchens={nearbyKitchens}
              onKitchenPress={onKitchenPress}
            />
          </View>
        )}

        {/* All Kitchens Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Featured Kitchens</Text>
          <Text style={styles.sectionDescription}>
            Complete collection of our featured home kitchens
          </Text>
          <FeaturedKitchensSection
            kitchens={displayKitchens}
            onKitchenPress={onKitchenPress}
          />
        </View>
      </View>
    </CategoryFullDrawer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#094327',
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
}); 