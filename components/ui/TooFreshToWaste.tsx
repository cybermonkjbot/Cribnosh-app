import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface FreshItem {
  id: string;
  name: string;
  cuisine: string;  
  image: string;
}

interface TooFreshToWasteProps {
  onOpenDrawer?: () => void;
  onOpenSustainability?: () => void;
}

const freshItems: FreshItem[] = [
  {
    id: '1',
    name: 'Salmon Fillet',
    cuisine: 'African',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=120&h=160&fit=crop'
  },
  {
    id: '2',
    name: 'Parsley Bunch',
    cuisine: 'African',
    image: 'https://images.unsplash.com/photo-1565958911770-bed387754dfa?w=120&h=160&fit=crop'
  },
  {
    id: '3',
    name: 'Meat Cut',
    cuisine: 'African',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=120&h=160&fit=crop'
  },
];

export function TooFreshToWaste({ onOpenDrawer, onOpenSustainability }: TooFreshToWasteProps) {
  return (
    <View style={{ paddingVertical: 20 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16, 
        paddingHorizontal: 20 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
            Eco Nosh
          </Text>
          <TouchableOpacity onPress={onOpenSustainability}>
            <Ionicons name="information-circle" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onOpenDrawer}>
          <Text style={{ fontSize: 16, color: '#666' }}>→</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20 }} // Changed from paddingHorizontal to paddingLeft only
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
              
              {/* Exp. in 30 Min Badge */}
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
                    Exp. in 30 Min{'\n'}CONTAINER
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