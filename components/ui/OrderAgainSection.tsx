import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface OrderItem {
  id: string;
  name: string;
  price: string;
  image: string;
  hasBussinBadge?: boolean;
}

const mockOrderItems: OrderItem[] = [
  {
    id: '1',
    name: 'Hosomaki roll',
    price: '£19',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=120&h=120&fit=crop',
    hasBussinBadge: true
  },
  {
    id: '2',
    name: 'Hosomaki roll',
    price: '£19',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=120&h=120&fit=crop',
  },
  {
    id: '3',
    name: 'Hosomaki roll',
    price: '£19',  
    image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=120&h=120&fit=crop',
    hasBussinBadge: true
  },
];

export function OrderAgainSection() {
  return (
    <View style={{ paddingVertical: 20 }}>
      <Text style={{ 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#000', 
        marginBottom: 16, 
        paddingHorizontal: 20 
      }}>
        Order again
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {mockOrderItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={{ 
              width: 120,
              marginRight: index < mockOrderItems.length - 1 ? 12 : 0,
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}
          >
            <View style={{ position: 'relative', marginBottom: 8 }}>
              <Image
                source={{ uri: item.image }}
                style={{ 
                  width: 96, 
                  height: 96, 
                  borderRadius: 12 
                }}
                contentFit="cover"
              />
              {item.hasBussinBadge && (
                <View style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  backgroundColor: '#ff4444',
                  borderRadius: 12,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', marginRight: 2 }}>
                    Bussin
                  </Text>
                  <Text style={{ fontSize: 8 }}>🔥</Text>
                </View>
              )}
            </View>
            
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '500', 
              color: '#000',
              marginBottom: 4 
            }} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: 'bold', 
              color: '#000' 
            }}>
              {item.price}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
} 