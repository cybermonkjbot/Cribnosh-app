import { Image } from 'expo-image';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Kitchen {
  id: string;
  name: string;
  description: string;
  distance: string;
  image: string;
  isVerified?: boolean;
}

const kitchens: Kitchen[] = [
  {
    id: '1',
    name: "Clara's Kitchen",
    description: 'Get great burgers, chicken and pastries',
    distance: '0.5km away from you',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
    isVerified: true
  },
  {
    id: '2',
    name: "Chef Mike's", 
    description: 'Fresh local ingredients daily',
    distance: '1.2km away from you',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face'
  }
];

export function KitchensNearMe() {
  return (
    <View style={{ paddingVertical: 20, paddingHorizontal: 20 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
          Kitchens near me
        </Text>
        <TouchableOpacity>
          <Text style={{ fontSize: 16, color: '#666' }}>→</Text>
        </TouchableOpacity>
      </View>
      
      <View>
        {kitchens.map((kitchen, index) => (
          <TouchableOpacity
            key={kitchen.id}
            style={{ 
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              marginBottom: index < kitchens.length - 1 ? 12 : 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}
          >
            <View style={{ flexDirection: 'row' }}>
              <View style={{ 
                width: 56, 
                height: 56, 
                borderRadius: 16, 
                overflow: 'hidden', 
                backgroundColor: '#f3f4f6',
                marginRight: 12
              }}>
                <Image
                  source={{ uri: kitchen.image }}
                  style={{ width: 56, height: 56 }}
                  contentFit="cover"
                />
              </View>
              
              <View style={{ flex: 1 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  marginBottom: 4 
                }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: 'bold', 
                    color: '#000',
                    marginRight: 6
                  }}>
                    {kitchen.name}
                  </Text>
                  {kitchen.isVerified && (
                    <View style={{ 
                      width: 18, 
                      height: 18, 
                      borderRadius: 9, 
                      backgroundColor: '#3b82f6',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text style={{ 
                        color: '#fff', 
                        fontSize: 10, 
                        fontWeight: 'bold' 
                      }}>✓</Text>
                    </View>
                  )}
                </View>
                
                <Text style={{ 
                  fontSize: 12, 
                  color: '#6b7280',
                  marginBottom: 4,
                  lineHeight: 16
                }}>
                  {kitchen.description}
                </Text>
                
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                  {kitchen.distance}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
} 