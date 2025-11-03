import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

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

// Utility function to format date without year
const formatDateWithoutYear = (dateString: string): string => {
  // If it's already formatted without year, return as is
  if (!dateString.includes(',')) {
    return dateString;
  }
  
  // Parse date and format without year
  try {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  } catch (e) {
    // If parsing fails, try to remove year from string
    return dateString.replace(/,?\s*\d{4}$/, '');
  }
};

interface SpecialOffersSectionProps {
  offers: SpecialOffer[];
  onOfferPress?: (offer: SpecialOffer) => void;
  onSeeAllPress?: () => void;
}

export const SpecialOffersSection: React.FC<SpecialOffersSectionProps> = ({
  offers,
  onOfferPress,
  onSeeAllPress
}) => {
  const renderOfferCard = (offer: SpecialOffer, index: number) => (
    <TouchableOpacity
      key={offer.id}
      style={{
        width: 280,
        marginRight: 16,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
      }}
      onPress={() => onOfferPress?.(offer)}
      activeOpacity={0.8}
    >
      {/* Offer Image */}
      <View style={{ position: 'relative' }}>
        <Image
          source={offer.image}
          style={{
            width: '100%',
            height: 140,
            resizeMode: 'cover',
          }}
        />
        
        {/* Discount Badge */}
        <View style={{
          position: 'absolute',
          top: 12,
          left: 12,
          backgroundColor: '#ef4444',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
        }}>
          <Text style={{
            color: '#ffffff',
            fontSize: 14,
            fontWeight: '700',
          }}>
            {offer.discount} OFF
          </Text>
        </View>
        
        {/* Limited Time Badge */}
        {offer.isLimited && (
          <View style={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 10,
              fontWeight: '600',
            }}>
              LIMITED
            </Text>
          </View>
        )}
        
        {/* Remaining Time */}
        {offer.remainingTime && (
          <View style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 10,
              fontWeight: '500',
            }}>
              {offer.remainingTime}
            </Text>
          </View>
        )}
      </View>
      
      {/* Offer Info */}
      <View style={{ padding: 16 }}>
        <Text style={{
          color: '#1a1a1a',
          fontSize: 16,
          fontWeight: '700',
          marginBottom: 4,
          lineHeight: 20,
        }}>
          {offer.title}
        </Text>
        
        <Text style={{
          color: '#666666',
          fontSize: 13,
          fontWeight: '400',
          marginBottom: 8,
          lineHeight: 16,
        }}>
          {offer.description}
        </Text>
        
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={{
            color: '#ef4444',
            fontSize: 12,
            fontWeight: '600',
          }}>
            Valid until {formatDateWithoutYear(offer.validUntil)}
          </Text>
          
          <TouchableOpacity style={{
            backgroundColor: '#ef4444',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 12,
              fontWeight: '600',
            }}>
              Claim Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 12,
      }}>
        <Text style={{
          color: '#1a1a1a',
          fontSize: 20,
          fontWeight: '700',
          lineHeight: 24,
        }}>
          Special Offers
        </Text>
        
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={{
            color: '#ef4444',
            fontSize: 14,
            fontWeight: '600',
          }}>
            See All
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 12, // Changed from paddingHorizontal to paddingLeft only
        }}
      >
        {offers.map(renderOfferCard)}
      </ScrollView>
    </View>
  );
}; 