import CompactMealSelection from '@/components/CompactMealSelection';
import KitchenNameCard from '@/components/KitchenNameCard';
import { CategoryFoodItemCard } from '@/components/ui/CategoryFoodItemCard';
import React, { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';

export default function TiltTestPage() {
  const [tiltEnabled, setTiltEnabled] = useState(true);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8e6f0' }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ 
        fontSize: 24, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 20,
        color: '#094327'
      }}>
        3D Tilt Effect Demo
      </Text>
      
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: 30,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <Text style={{ fontSize: 16, marginRight: 10, color: '#094327' }}>
          Tilt Effect: {tiltEnabled ? 'ON' : 'OFF'}
        </Text>
        <Switch
          value={tiltEnabled}
          onValueChange={setTiltEnabled}
          trackColor={{ false: '#767577', true: '#094327' }}
          thumbColor={tiltEnabled ? '#E6FFE8' : '#f4f3f4'}
        />
      </View>

      <Text style={{ 
        fontSize: 18, 
        fontWeight: '600', 
        marginBottom: 15,
        color: '#094327'
      }}>
        Kitchen Name Card
      </Text>
      <KitchenNameCard 
        tiltEnabled={tiltEnabled}
        name="Amara's Kitchen"
        description="Authentic Nigerian Cuisine"
        avatarUri="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face"
      />

      <Text style={{ 
        fontSize: 18, 
        fontWeight: '600', 
        marginTop: 30,
        marginBottom: 15,
        color: '#094327'
      }}>
        Compact Meal Selection
      </Text>
      <CompactMealSelection 
        tiltEnabled={tiltEnabled}
        title="Nigerian Jollof Rice"
        price="£16"
      />

      <Text style={{ 
        fontSize: 18, 
        fontWeight: '600', 
        marginTop: 30,
        marginBottom: 15,
        color: '#094327'
      }}>
        Category Food Item Cards
      </Text>
      <View style={{ flexDirection: 'row', gap: 15 }}>
        <CategoryFoodItemCard
          id="1"
          title="Jollof Rice"
          description="Authentic Nigerian rice dish with rich tomato sauce and spices"
          price={16.99}
          imageUrl="https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop"
          sentiment="bussing"
          prepTime="25 min"
          isPopular={true}
          tiltEnabled={tiltEnabled}
        />
        <CategoryFoodItemCard
          id="2"
          title="Chicken Curry"
          description="Spicy and aromatic curry with tender chicken pieces"
          price={14.99}
          imageUrl="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop"
          sentiment="bussing"
          prepTime="30 min"
          tiltEnabled={tiltEnabled}
        />
      </View>

      <Text style={{ 
        fontSize: 14, 
        textAlign: 'center', 
        marginTop: 40,
        color: '#666',
        lineHeight: 20,
      }}>
        Move your device to see the 3D tilt effect!{'\n'}
        The cards will subtly tilt based on your device's orientation.
      </Text>
    </ScrollView>
  );
} 