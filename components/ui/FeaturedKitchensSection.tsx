import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Kitchen {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  distance: string;
  image: any;
  isLive?: boolean;
  liveViewers?: number;
}

interface FeaturedKitchensSectionProps {
  kitchens: Kitchen[];
  onKitchenPress?: (kitchen: Kitchen) => void;
}

export const FeaturedKitchensSection: React.FC<FeaturedKitchensSectionProps> = ({
  kitchens,
  onKitchenPress
}) => {
  const renderKitchenCard = (kitchen: Kitchen, index: number) => (
    <TouchableOpacity
      key={kitchen.id}
      style={{
        width: 160,
        marginRight: 12,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
      }}
      onPress={() => onKitchenPress?.(kitchen)}
      activeOpacity={0.8}
    >
      {/* Kitchen Image */}
      <View style={{ position: 'relative' }}>
        <Image
          source={kitchen.image}
          style={{
            width: '100%',
            height: 100,
            resizeMode: 'cover',
          }}
        />
        
        {/* Live Badge */}
        {kitchen.isLive && (
          <View style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: '#ef4444',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}>
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#ffffff',
            }} />
            <Text style={{
              color: '#ffffff',
              fontSize: 10,
              fontWeight: '600',
            }}>
              LIVE
            </Text>
          </View>
        )}
        
        {/* Rating Badge */}
        <View style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          paddingHorizontal: 6,
          paddingVertical: 3,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2,
        }}>
          <Text style={{
            color: '#ffffff',
            fontSize: 10,
            fontWeight: '600',
          }}>
            ⭐ {kitchen.rating}
          </Text>
        </View>
      </View>
      
      {/* Kitchen Info */}
      <View style={{ padding: 12 }}>
        <Text style={{
          color: '#1a1a1a',
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 2,
          lineHeight: 18,
        }}>
          {kitchen.name}
        </Text>
        
        <Text style={{
          color: '#666666',
          fontSize: 12,
          fontWeight: '400',
          marginBottom: 6,
        }}>
          {kitchen.cuisine}
        </Text>
        
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Text style={{
            color: '#666666',
            fontSize: 11,
            fontWeight: '500',
          }}>
            {kitchen.deliveryTime}
          </Text>
          <Text style={{
            color: '#666666',
            fontSize: 11,
            fontWeight: '500',
          }}>
            {kitchen.distance}
          </Text>
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
          Featured Kitchens
        </Text>
        
        <TouchableOpacity>
          <Text style={{
            color: '#ef4444',
            fontSize: 14,
            fontWeight: '600',
          }}>
            See All
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* First Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          gap: 12,
        }}
        style={{ marginBottom: 12 }}
      >
        {kitchens.slice(0, 3).map(renderKitchenCard)}
      </ScrollView>
      
      {/* Second Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          gap: 12,
        }}
      >
        {kitchens.slice(3, 6).map(renderKitchenCard)}
      </ScrollView>
    </View>
  );
}; 