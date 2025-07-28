import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface TakeAwayItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
}

interface TakeAwaysProps {
  onOpenDrawer?: () => void;
}

const takeAwayItems: TakeAwayItem[] = [
  {
    id: '1',
    name: 'Chicken burger', 
    description: '100 gr chicken + tomato + cheese Lettuce',
    price: '£20.00',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=180&h=120&fit=crop'
  },
  {
    id: '2',
    name: 'Chicken burger', 
    description: '100 gr chicken + tomato + cheese Lettuce',
    price: '£20.00',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=180&h=120&fit=crop'
  },
  {
    id: '3',
    name: 'Chicken burger', 
    description: '100 gr chicken + tomato + cheese Lettuce',
    price: '£20.00',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=180&h=120&fit=crop'
  },
];

export function TakeAways({ onOpenDrawer }: TakeAwaysProps) {
  return (
    <View style={{ paddingVertical: 20 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16, 
        paddingHorizontal: 20 
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
          Take away's
        </Text>
        <TouchableOpacity onPress={onOpenDrawer}>
          <Text style={{ fontSize: 16, color: '#666' }}>→</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {takeAwayItems.map((item, index) => (
          <View
            key={item.id}
            style={{ 
              width: 180,
              backgroundColor: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              marginRight: index < takeAwayItems.length - 1 ? 12 : 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}
          >
            <Image
              source={{ uri: item.image }}
              style={{ width: 180, height: 100 }}
              contentFit="cover"
            />
            
            <View style={{ padding: 12 }}>
              <Text style={{ 
                fontSize: 14, 
                fontWeight: 'bold', 
                color: '#000',
                marginBottom: 4
              }}>
                {item.name}
              </Text>
              
              <Text style={{ 
                fontSize: 11, 
                color: '#6b7280',
                marginBottom: 12,
                lineHeight: 14
              }}>
                {item.description}
              </Text>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: 'bold', 
                  color: '#ef4444' 
                }}>
                  {item.price}
                </Text>
                
                <TouchableOpacity style={{ 
                  width: 28, 
                  height: 28, 
                  borderRadius: 14,
                  backgroundColor: '#ef4444',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ 
                    color: '#fff', 
                    fontSize: 16, 
                    fontWeight: 'bold' 
                  }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
} 