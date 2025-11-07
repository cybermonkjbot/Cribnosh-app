import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCategoryDrawerSearch } from '@/hooks/useCategoryDrawerSearch';
import { CategoryFullDrawer } from './CategoryFullDrawer';

interface TooFreshItem {
  id: string;
  name: string;
  origin: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  category?: string;
  discount?: number;
  ecoImpact?: string;
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
      name: 'Fresh Salmon Fillet',
      origin: 'Scottish Highlands',
      price: 12.99,
      originalPrice: 24.99,
      category: 'Seafood',
      discount: 48,
      ecoImpact: 'Saves 2.3kg CO2',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop'
    },
    {
      id: '2',
      name: 'Organic Parsley Bunch',
      origin: 'Local Farm',
      price: 2.49,
      originalPrice: 4.99,
      category: 'Herbs',
      discount: 50,
      ecoImpact: 'Saves 0.8kg CO2',
      imageUrl: 'https://images.unsplash.com/photo-1565958911770-bed387754dfa?w=200&h=200&fit=crop'
    },
    {
      id: '3',
      name: 'Premium Beef Cut',
      origin: 'Grass-fed Farm',
      price: 15.99,
      originalPrice: 32.99,
      category: 'Meat',
      discount: 52,
      ecoImpact: 'Saves 3.1kg CO2',
      imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop'
    },
    {
      id: '4',
      name: 'Artisan Bread Loaf',
      origin: 'Local Bakery',
      price: 3.99,
      originalPrice: 7.99,
      category: 'Bakery',
      discount: 50,
      ecoImpact: 'Saves 1.2kg CO2',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop'
    },
    {
      id: '5',
      name: 'Fresh Berries Mix',
      origin: 'Organic Farm',
      price: 4.99,
      originalPrice: 12.99,
      category: 'Fruits',
      discount: 62,
      ecoImpact: 'Saves 1.8kg CO2',
      imageUrl: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=200&h=200&fit=crop'
    },
  ];

  const baseItems = items.length > 0 ? items : defaultItems;

  // Search functionality with debouncing
  const { setSearchQuery, filteredItems: displayItems } = useCategoryDrawerSearch({
    items: baseItems,
    searchFields: ['name', 'origin', 'category'],
  });

  const handleAddToCart = (id: string) => {
    onAddToCart?.(id);
  };

  const handleItemPress = (id: string) => {
    onItemPress?.(id);
  };

  return (
    <CategoryFullDrawer
      categoryName="Too Fresh to Waste"
      categoryDescription="High-quality meals and groceries that didn't make it to full menu — still fresh, still delicious, priced to move. Good for you, good for the kitchen, great for the planet."
      onBack={onBack}
      onSearch={setSearchQuery}
      searchPlaceholder="Search eco-friendly items..."
      backButtonInSearchBar={true}
    >
      <View style={styles.content}>
        {/* Eco Impact Summary */}
        <View style={styles.ecoSummary}>
          <View style={styles.ecoIconContainer}>
            <Ionicons name="leaf" size={20} color="#10B981" />
          </View>
          <View style={styles.ecoTextContainer}>
            <Text style={styles.ecoTitle}>Eco Impact</Text>
            <Text style={styles.ecoSubtitle}>Save 9.2kg CO2 with these items</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {displayItems.map((item) => (
            <View key={item.id} style={styles.itemContainer}>
              {/* Food Container - Clickable for item details */}
              <TouchableOpacity
                onPress={() => handleItemPress(item.id)}
                activeOpacity={0.9}
                style={styles.foodContainerTouchable}
              >
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
                  
                  {/* Discount Badge */}
                  {item.discount && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-{item.discount}%</Text>
                    </View>
                  )}
                  
                  {/* Category Badge */}
                  {item.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  )}
                  
                  {/* Packaging Strip */}
                  <View style={styles.packagingStrip}>
                    <View style={styles.logoContainer}>
                      <View style={styles.logoIcon}>
                        <Ionicons name="leaf" size={10} color="#10B981" />
                      </View>
                      <Text style={styles.logoText}>Eco Fresh</Text>
                    </View>
                    <Text style={styles.packagingText}>FRESH FOOD CONTAINER</Text>
                  </View>
                </View>
              </TouchableOpacity>
              
              {/* Item Details */}
              <View style={styles.itemDetails}>
                <View style={styles.itemContent}>
                  <TouchableOpacity
                    onPress={() => handleItemPress(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.originText}>{item.origin}</Text>
                    
                    {/* Eco Impact */}
                    {item.ecoImpact && (
                      <View style={styles.ecoImpactContainer}>
                        <Ionicons name="leaf-outline" size={12} color="#10B981" />
                        <Text style={styles.ecoImpactText}>{item.ecoImpact}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                
                {/* Price Section - Always at bottom */}
                <View style={styles.priceSection}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>£ {item.price.toFixed(2)}</Text>
                    {item.originalPrice && (
                      <Text style={styles.originalPriceText}>£ {item.originalPrice.toFixed(2)}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                      handleAddToCart(item.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
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
  },
  ecoSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  ecoIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#10B981',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ecoTextContainer: {
    flex: 1,
  },
  ecoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 2,
  },
  ecoSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#047857',
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: 16,
  },
  itemContainer: {
    width: 160,
    height: 280,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  foodContainerTouchable: {
    width: '100%',
  },
  foodContainer: {
    width: 160,
    height: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
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
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#094327',
  },
  packagingStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  packagingText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemDetails: {
    width: '100%',
    paddingTop: 12,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#094327',
    textAlign: 'center',
    lineHeight: 20,
  },
  originText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
  },
  ecoImpactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  ecoImpactText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#10B981',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 8,
  },
  priceContainer: {
    flex: 1,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    lineHeight: 22,
  },
  originalPriceText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    lineHeight: 16,
  },
  addButton: {
    width: 32,
    height: 32,
    backgroundColor: '#10B981',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
}); 