import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface OrderItem {
  id: string;
  name: string;
  price: string;
  image: string;
  hasBussinBadge?: boolean;
}

interface OrderAgainSectionProps {
  isHeaderSticky?: boolean;
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
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&h=120&fit=crop',
  },
  {
    id: '3',
    name: 'Hosomaki roll',
    price: '£19',  
    image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=120&h=120&fit=crop',
    hasBussinBadge: true
  },
];

export function OrderAgainSection({ isHeaderSticky = false }: OrderAgainSectionProps) {
  const horizontalScrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Handle entrance and exit animations based on header state
  useEffect(() => {
    if (!isHeaderSticky) {
      // Header is normal - animate in
      const animateIn = () => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      };

      // Delay the animation slightly to ensure smooth transition
      const timer = setTimeout(animateIn, 150);
      return () => clearTimeout(timer);
    } else {
      // Header is sticky - animate out smoothly
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.3, // Fade to 30% opacity instead of completely hiding
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -10, // Slide up slightly
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isHeaderSticky, fadeAnim, slideAnim]);

  return (
    <Animated.View style={{ 
      marginBottom: 24,
      paddingTop: 28, // 10% of typical screen height (280px) to avoid header
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    }}>
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
          Order again
        </Text>
      </View>
      
      <ScrollView 
        ref={horizontalScrollRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 12, // Changed from paddingHorizontal to paddingLeft only
          gap: 12,
        }}
        scrollEventThrottle={16}
        decelerationRate="fast"
        nestedScrollEnabled={true}
        scrollEnabled={true}
      >
        {mockOrderItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={{ 
              width: 120,
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}
            activeOpacity={0.8}
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
                  backgroundColor: '#ef4444',
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
    </Animated.View>
  );
} 