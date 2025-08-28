import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, TouchableOpacity, View } from 'react-native';

interface OrdersCampaignBannerProps {
  onPress?: () => void;
}

export function OrdersCampaignBanner({ onPress }: OrdersCampaignBannerProps) {
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
      <View style={{ position: 'relative' }}>
        <TouchableOpacity 
          style={{ borderRadius: 20, overflow: 'hidden' }}
          onPress={onPress}
          activeOpacity={0.9}
        >
          <View style={{ position: 'relative', height: 120 }}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=120&fit=crop' }}
              style={{ width: '100%', height: 120 }}
              contentFit="cover"
            />
            
            {/* Gradient overlay for better text readability */}
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.85)', 'rgba(220, 38, 38, 0.95)']}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            
            {/* Main content */}
            <View style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              justifyContent: 'center', 
              paddingHorizontal: 20 
            }}>
              <Text style={{ 
                color: '#fff', 
                fontSize: 20, 
                fontWeight: 'bold',
                marginBottom: 4
              }}>
                Group Orders Special
              </Text>
              <Text style={{ 
                color: '#fff', 
                fontSize: 15,
                opacity: 0.95,
                marginBottom: 8
              }}>
                Save up to 25% when ordering together
              </Text>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                alignSelf: 'flex-start',
              }}>
                <Text style={{
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: '600',
                }}>
                  Start Group Order
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Campaign badge - positioned outside the TouchableOpacity */}
        <View style={{
          position: 'absolute',
          top: -12,
          left: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
          zIndex: 1,
        }}>
          <Text style={{
            color: '#dc2626',
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'uppercase',
          }}>
            Limited Time
          </Text>
        </View>
      </View>
    </View>
  );
}
