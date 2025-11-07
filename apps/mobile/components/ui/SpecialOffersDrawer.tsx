import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCategoryDrawerSearch } from '@/hooks/useCategoryDrawerSearch';
import { CategoryFullDrawer } from './CategoryFullDrawer';

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  discount: string;
  image: any;
  validUntil: string;
  isLimited?: boolean;
  remainingTime?: string;
}

interface SpecialOffersDrawerProps {
  onBack: () => void;
  offers?: SpecialOffer[];
  onOfferPress?: (offer: SpecialOffer) => void;
}

// Utility function to format date without year
const formatDateWithoutYear = (dateString: string): string => {
  if (!dateString.includes(',')) {
    return dateString;
  }
  try {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  } catch {
    return dateString.replace(/,?\s*\d{4}$/, '');
  }
};

export function SpecialOffersDrawer({
  onBack,
  offers = [],
  onOfferPress
}: SpecialOffersDrawerProps) {
  const defaultOffers: SpecialOffer[] = [
    {
      id: '1',
      title: 'Weekend Special',
      description: 'Get 20% off on all orders this weekend',
      discount: '20%',
      image: { uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop' },
      validUntil: 'Dec 31, 2024',
      isLimited: true,
      remainingTime: '2 days left',
    },
    {
      id: '2',
      title: 'New User Bonus',
      description: 'First order gets 15% discount',
      discount: '15%',
      image: { uri: 'https://images.unsplash.com/photo-1565958911770-bed387754dfa?w=400&h=300&fit=crop' },
      validUntil: 'Jan 15, 2025',
      isLimited: false,
    },
    {
      id: '3',
      title: 'Happy Hour Deal',
      description: 'Special prices from 3PM to 6PM',
      discount: '25%',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      validUntil: 'Ongoing',
      isLimited: false,
    },
  ];

  const baseOffers = offers.length > 0 ? offers : defaultOffers;

  // Search functionality with debouncing
  const { setSearchQuery, filteredItems: displayOffers } = useCategoryDrawerSearch({
    items: baseOffers,
    searchFields: ['title', 'description'],
  });

  const renderOfferCard = (offer: SpecialOffer) => (
    <TouchableOpacity
      key={offer.id}
      style={styles.offerCard}
      onPress={() => onOfferPress?.(offer)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={offer.image}
          style={styles.image}
          contentFit="cover"
        />
        
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{offer.discount} OFF</Text>
        </View>
        
        {offer.isLimited && (
          <View style={styles.limitedBadge}>
            <Text style={styles.limitedText}>Limited Time</Text>
          </View>
        )}
      </View>
      
      <View style={styles.offerContent}>
        <Text style={styles.offerTitle}>{offer.title}</Text>
        <Text style={styles.offerDescription}>{offer.description}</Text>
        
        <View style={styles.offerFooter}>
          <View style={styles.validUntilContainer}>
            <Text style={styles.validUntilLabel}>Valid until:</Text>
            <Text style={styles.validUntilText}>{formatDateWithoutYear(offer.validUntil)}</Text>
          </View>
          {offer.remainingTime && (
            <Text style={styles.remainingTime}>{offer.remainingTime}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <CategoryFullDrawer
      categoryName="Special Offers"
      categoryDescription="Discover exclusive deals and promotions from top kitchens"
      onBack={onBack}
      showTabs={false}
      onSearch={setSearchQuery}
      searchPlaceholder="Search offers..."
      backButtonInSearchBar={true}
    >
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayOffers.map(renderOfferCard)}
      </ScrollView>
    </CategoryFullDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 16,
  },
  offerCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  limitedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  limitedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  offerContent: {
    padding: 16,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#094327',
    marginBottom: 6,
  },
  offerDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validUntilContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validUntilLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  validUntilText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#094327',
  },
  remainingTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

