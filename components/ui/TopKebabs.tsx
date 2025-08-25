import { Image } from 'expo-image';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Kebab {
  id: string;
  name: string;
  image: string;
}

interface TopKebabsProps {
  onOpenDrawer?: () => void;
}

const kebabs: Kebab[] = [
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

export function TopKebabs({ onOpenDrawer }: TopKebabsProps) {
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
          From Top Kebabs
        </Text>
        <TouchableOpacity onPress={onOpenDrawer}>
          <Text style={{ fontSize: 16, color: '#666' }}>→</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20 }} // Changed from paddingHorizontal to paddingLeft only
      >
        {kebabs.map((kebab, index) => (
          <TouchableOpacity
            key={kebab.id}
            style={{ 
              alignItems: 'center',
              marginRight: index < kebabs.length - 1 ? 24 : 0 
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
                source={{ uri: kebab.image }}
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
              {kebab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
} 