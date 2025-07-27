import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CategoryFullDrawer } from './CategoryFullDrawer';

interface TooFreshItem {
  id: string;
  name: string;
  origin: string;
  price: number;
  imageUrl?: string;
}

interface TooFreshToWasteDrawerProps {
  onBack: () => void;
  items?: TooFreshItem[];
  onAddToCart?: (id: string) => void;
  onItemPress?: (id: string) => void;
}

export function TooFreshToWasteDrawer({
  onBack,
  items = [],
  onAddToCart,
  onItemPress
}: TooFreshToWasteDrawerProps) {
  const defaultItems: TooFreshItem[] = [
    {
      id: '1',
      name: 'Salmon Fillet',
      origin: 'African',
      price: 20.00,
      imageUrl: undefined, // Will use placeholder
    },
    {
      id: '2',
      name: 'Parsley Bunch',
      origin: 'African',
      price: 20.00,
      imageUrl: undefined,
    },
    {
      id: '3',
      name: 'Meat Cut',
      origin: 'African',
      price: 20.00,
      imageUrl: undefined,
    },
  ];

  const displayItems = items.length > 0 ? items : defaultItems;

  return (
    <CategoryFullDrawer
      categoryName="Too Fresh to Waste"
      categoryDescription="High-quality meals and groceries that didn't make it to full menu — still fresh, still delicious, priced to move. Good for you, good for the kitchen, great for the planet."
      onBack={onBack}
    >
      <View style={styles.content}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {displayItems.map((item) => (
            <View key={item.id} style={styles.itemContainer}>
              {/* Food Container */}
              <View style={styles.foodContainer}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.foodImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.foodPlaceholder}>
                    <Ionicons name="restaurant" size={40} color="#9CA3AF" />
                  </View>
                )}
                
                {/* Packaging Strip */}
                <View style={styles.packagingStrip}>
                  <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                      <Ionicons name="grid" size={12} color="#094327" />
                    </View>
                    <Text style={styles.logoText}>Crib Nosh</Text>
                  </View>
                  <Text style={styles.packagingText}>FRESH FOOD CONTAINER</Text>
                </View>
              </View>
              
              {/* Item Details */}
              <View style={styles.itemDetails}>
                <Text style={styles.originText}>{item.origin}</Text>
                <Text style={styles.priceText}>£ {item.price.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </CategoryFullDrawer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 20,
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: 20,
  },
  itemContainer: {
    alignItems: 'center',
    gap: 8,
  },
  foodContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  foodPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packagingStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  packagingText: {
    fontSize: 6,
    fontWeight: '700',
    color: '#000000',
  },
  itemDetails: {
    alignItems: 'center',
    gap: 4,
  },
  originText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#094327',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF3B30',
  },
}); 