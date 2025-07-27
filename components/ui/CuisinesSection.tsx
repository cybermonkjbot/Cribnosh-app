import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Cuisine {
  id: string;
  name: string;
  image: string;
}

const cuisines: Cuisine[] = [
  {
    id: '1',
    name: 'Italian',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=80&h=80&fit=crop'
  },
  {
    id: '2', 
    name: 'Mexican',
    image: 'https://images.unsplash.com/photo-1565958911770-bed387754dfa?w=80&h=80&fit=crop'
  },
  {
    id: '3',
    name: 'French',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&h=80&fit=crop'
  },
];

export function CuisinesSection() {
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
          Cuisine's
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
        {cuisines.map((cuisine, index) => (
          <TouchableOpacity
            key={cuisine.id}
            style={{ 
              alignItems: 'center',
              marginRight: index < cuisines.length - 1 ? 24 : 0 
            }}
          >
            <View style={{ 
              width: 64, 
              height: 64, 
              borderRadius: 32, 
              overflow: 'hidden', 
              backgroundColor: '#f3f4f6',
              marginBottom: 8
            }}>
              <Image
                source={{ uri: cuisine.image }}
                style={{ width: 64, height: 64 }}
                contentFit="cover"
              />
            </View>
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '500', 
              color: '#000',
              textAlign: 'center' 
            }}>
              {cuisine.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
} 