import { BlurView } from 'expo-blur';
import { forwardRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Circle, Path, Rect, Svg } from 'react-native-svg';

interface KitchenBottomSheetContentProps {
  isExpanded?: boolean;
  onScrollAttempt?: () => void;
  deliveryTime?: string;
}

const KitchenBottomSheetContent = forwardRef<ScrollView, KitchenBottomSheetContentProps>(({
  isExpanded = false,
  onScrollAttempt,
  deliveryTime = "30-45 mins",
}, ref) => {
  const categories = [
    {
      id: 'candy',
      name: 'Sweet Treats',
      icon: (
        <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
          <Rect x="2" y="2" width="31" height="31" rx="4" fill="#EAEAEA" stroke="#EAEAEA" strokeWidth="1" />
          <Circle cx="17.5" cy="17.5" r="8" fill="#FFD700" />
          <Circle cx="17.5" cy="17.5" r="4" fill="#FF6B6B" />
        </Svg>
      ),
      backgroundColor: 'rgba(16, 185, 129, 0.9)',
    },
    {
      id: 'sushi',
      name: 'Fresh Sushi',
      icon: (
        <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
          <Rect x="2" y="2" width="31" height="31" rx="4" fill="#EAEAEA" stroke="#EAEAEA" strokeWidth="1" />
          <Circle cx="12" cy="12" r="3" fill="#4CAF50" />
          <Circle cx="23" cy="12" r="3" fill="#4CAF50" />
          <Circle cx="17.5" cy="17.5" r="3" fill="#4CAF50" />
          <Circle cx="12" cy="23" r="3" fill="#4CAF50" />
          <Circle cx="23" cy="23" r="3" fill="#4CAF50" />
        </Svg>
      ),
      backgroundColor: 'rgba(59, 130, 246, 0.9)',
    },
    {
      id: 'bao',
      name: 'Steamed Bao',
      icon: (
        <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
          <Rect x="2" y="2" width="31" height="31" rx="4" fill="#EAEAEA" stroke="#EAEAEA" strokeWidth="1" />
          <Path d="M8 15 Q17.5 8 27 15 Q17.5 22 8 15" fill="#FFD700" />
          <Path d="M8 20 Q17.5 13 27 20 Q17.5 27 8 20" fill="#FFD700" />
        </Svg>
      ),
      backgroundColor: 'rgba(245, 158, 11, 0.9)',
    },
    {
      id: 'pastry',
      name: 'Artisan Pastries',
      icon: (
        <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
          <Rect x="2" y="2" width="31" height="31" rx="4" fill="#EAEAEA" stroke="#EAEAEA" strokeWidth="1" />
          <Path d="M8 12 Q17.5 8 27 12 Q17.5 16 8 12" fill="#8D6E63" />
          <Path d="M8 16 Q17.5 12 27 16 Q17.5 20 8 16" fill="#8D6E63" />
          <Path d="M8 20 Q17.5 16 27 20 Q17.5 24 8 20" fill="#8D6E63" />
        </Svg>
      ),
      backgroundColor: 'rgba(168, 85, 247, 0.9)',
    },
  ];

  const popularMeals = [
    {
      id: '1',
      name: 'Jollof Rice',
      price: '£12',
      originalPrice: '£15',
      image: require('../../../assets/images/cribnoshpackaging.png'),
      isPopular: true,
      deliveryTime: '25 min',
    },
    {
      id: '2',
      name: 'Pounded Yam',
      price: '£10',
      image: require('../../../assets/images/cribnoshpackaging.png'),
      deliveryTime: '25 min',
    },
    {
      id: '3',
      name: 'Egusi Soup',
      price: '£14',
      image: require('../../../assets/images/cribnoshpackaging.png'),
      isNew: true,
      deliveryTime: '30 min',
    },
  ];

  const featuredItems = [
    {
      id: '1',
      name: 'Chef\'s Special',
      description: 'Today\'s signature dish',
      price: '£18',
      image: require('../../../assets/images/cribnoshpackaging.png'),
      badge: 'Chef\'s Pick',
    },
    {
      id: '2',
      name: 'Weekend Special',
      description: 'Limited time offer',
      price: '£16',
      originalPrice: '£20',
      image: require('../../../assets/images/cribnoshpackaging.png'),
      badge: '20% OFF',
    },
  ];

  return (
    <ScrollView 
      ref={ref}
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      scrollEnabled={isExpanded}
      onScrollBeginDrag={() => {
        if (!isExpanded && onScrollAttempt) {
          onScrollAttempt();
        }
      }}
    >
      {/* Delivery information */}
      <Text style={styles.deliveryInfo}>
        Fresh from our kitchen to your door in {deliveryTime}
      </Text>

      {/* Feature chips */}
      <View style={styles.chipsContainer}>
        <TouchableOpacity
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: '#10B981',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#10B981',
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
            elevation: 4,
            overflow: 'hidden',
          }}
          activeOpacity={0.8}
        >
          <BlurView
            intensity={40}
            tint="light"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 14,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: 0.2,
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}
          >
            Keto-friendly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: '#F59E0B',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#F59E0B',
            shadowColor: '#F59E0B',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
            elevation: 4,
            overflow: 'hidden',
          }}
          activeOpacity={0.8}
        >
          <BlurView
            intensity={40}
            tint="light"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 14,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: 0.2,
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}
          >
            Late-night cravings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Today's Menu Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today&apos;s Menu</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity key={category.id} style={styles.categoryItem}>
              <View style={[styles.categoryIcon, { backgroundColor: category.backgroundColor }]}>
                {category.icon}
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Popular Meals Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Meals</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mealsContainer}
        >
          {popularMeals.map((meal) => (
            <TouchableOpacity key={meal.id} style={styles.mealCard}>
              <View style={styles.mealImageContainer}>
                <Image source={meal.image} style={styles.mealImage} />
                {meal.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.badgeText}>Popular</Text>
                  </View>
                )}
                {meal.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.badgeText}>New</Text>
                  </View>
                )}
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                <View style={styles.mealPriceRow}>
                  <Text style={styles.mealPrice}>{meal.price}</Text>
                  {meal.originalPrice && (
                    <Text style={styles.originalPrice}>{meal.originalPrice}</Text>
                  )}
                </View>
                <Text style={styles.deliveryTime}>{meal.deliveryTime}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Items Section */}
      <View style={[styles.section, styles.lastSection]}>
        <Text style={styles.sectionTitle}>Featured Items</Text>
        
        <View style={styles.featuredContainer}>
          {featuredItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.featuredCard}>
              <View style={styles.featuredImageContainer}>
                <Image source={item.image} style={styles.featuredImage} />
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>{item.badge}</Text>
                </View>
              </View>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredName}>{item.name}</Text>
                <Text style={styles.featuredDescription}>{item.description}</Text>
                <View style={styles.featuredPriceRow}>
                  <Text style={styles.featuredPrice}>{item.price}</Text>
                  {item.originalPrice && (
                    <Text style={styles.featuredOriginalPrice}>{item.originalPrice}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
});

KitchenBottomSheetContent.displayName = 'KitchenBottomSheetContent';

export { KitchenBottomSheetContent };

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20, // Reduced from 25 for better visual balance
    paddingBottom: 250, // Increased from 180 to 250 for much more bottom padding
  },
  deliveryInfo: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.03,
    color: '#FAFAFA',
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
    marginBottom: 15,
  },
  section: {
    marginBottom: 20,
  },
  lastSection: {
    paddingBottom: 80, // Add extra bottom padding to the last section
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.03,
    color: '#F3F4F6',
  },
  seeAllText: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.03,
    color: '#6B7280',
  },
  categoriesContainer: {
    // Removed paddingRight for better horizontal scrolling
  },
  categoryItem: {
    width: 75,
    height: 102,
    marginRight: 30,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 75,
    height: 75,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryName: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.03,
    color: '#FAFAFA',
  },
  mealsContainer: {
    // Removed paddingRight completely
  },
  mealCard: {
    width: 150,
    height: 200,
    marginRight: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Changed to semi-transparent white for dark background
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)', // Subtle white border
  },
  mealImageContainer: {
    width: '100%',
    height: '60%',
    position: 'relative',
  },
  mealImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  popularBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.03,
    color: '#FFFFFF',
  },
  mealInfo: {
    padding: 10,
    flex: 1,
  },
  mealName: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.03,
    color: '#FAFAFA',
    marginBottom: 5,
  },
  mealPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  mealPrice: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.03,
    color: '#FF3B30', // Nosh orange-red
  },
  originalPrice: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.03,
    color: '#6B7280',
    textDecorationLine: 'line-through',
    marginLeft: 5,
  },
  deliveryTime: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.03,
    color: '#6B7280',
  },
  featuredContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  featuredCard: {
    width: '48%', // Two items per row
    height: 150,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Slightly more transparent for featured items
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)', // Subtle white border
  },
  featuredImageContainer: {
    width: '100%',
    height: '60%',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  featuredBadgeText: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.03,
    color: '#FFFFFF',
  },
  featuredInfo: {
    padding: 10,
    flex: 1,
  },
  featuredName: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.03,
    color: '#FAFAFA',
    marginBottom: 5,
  },
  featuredDescription: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.03,
    color: '#6B7280',
    marginBottom: 5,
  },
  featuredPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  featuredPrice: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.03,
    color: '#FF3B30', // Nosh orange-red
  },
  featuredOriginalPrice: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.03,
    color: '#6B7280',
    textDecorationLine: 'line-through',
    marginLeft: 5,
  },
}); 