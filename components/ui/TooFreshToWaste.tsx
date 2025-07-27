import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface FreshItem {
  id: string;
  name: string;
  cuisine: string;  
  image: string;
}

const freshItems: FreshItem[] = [
  {
    id: '1',
    name: 'Salmon',
    cuisine: 'African',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=120&h=160&fit=crop'
  },
  {
    id: '2',
    name: 'Broccoli',
    cuisine: 'African', 
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=120&h=160&fit=crop'
  },
  {
    id: '3', 
    name: 'Beef',
    cuisine: 'African',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=120&h=160&fit=crop'
  },
];

export function TooFreshToWaste() {
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
          Eco Nosh
        </Text>
        <TouchableOpacity>
          <Text style={{ fontSize: 16, color: '#666' }}>→</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {freshItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={{ 
              width: 120,
              backgroundColor: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              marginRight: index < freshItems.length - 1 ? 12 : 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}
          >
            <View style={{ position: 'relative' }}>
              <Image
                source={{ uri: item.image }}
                style={{ width: 120, height: 140 }}
                contentFit="cover"
              />
              
              {/* Fresh Food Container Badge */}
              <View style={{ 
                position: 'absolute', 
                top: 8, 
                left: 8, 
                right: 8 
              }}>
                <View style={{ 
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  padding: 6,
                  alignItems: 'center'
                }}>
                  <Image
                    source={require('../../assets/images/cribnoshpackaging.png')}
                    style={{ width: 16, height: 12, marginBottom: 2 }}
                    contentFit="contain"
                  />
                  <Text style={{ 
                    fontSize: 8, 
                    fontWeight: '600', 
                    color: '#000',
                    textAlign: 'center',
                    lineHeight: 10
                  }}>
                    FRESH FOOD{'\n'}CONTAINER
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={{ padding: 8 }}>
              <Text style={{ 
                fontSize: 14, 
                fontWeight: 'bold', 
                color: '#000',
                marginBottom: 2
              }}>
                {item.name}
              </Text>
              <Text style={{ 
                fontSize: 12, 
                color: '#6b7280' 
              }}>
                {item.cuisine}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
} 