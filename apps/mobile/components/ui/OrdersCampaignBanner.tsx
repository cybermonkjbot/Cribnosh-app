import { SpecialOffer } from '@/types/customer';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, TouchableOpacity, View } from 'react-native';

interface OrdersCampaignBannerProps {
  offer?: SpecialOffer;
  onPress?: () => void;
}

export function OrdersCampaignBanner({ offer, onPress }: OrdersCampaignBannerProps) {
  // Fallback to default values if no offer provided
  const title = offer?.title || "Group Orders Special";
  const description = offer?.description || "Save up to 25% when ordering together";
  const callToActionText = offer?.call_to_action_text || "Start Group Order";
  const badgeText = offer?.badge_text || offer?.offer_type === "limited_time" ? "LIMITED TIME" : "";
  const backgroundImageUrl = offer?.background_image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=120&fit=crop';
  const backgroundColor = offer?.background_color || '#dc2626';

  // Convert hex color to rgba for gradient
  const hexToRgba = (hex: string, alpha: number = 0.85) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const gradientColors = [
    hexToRgba(backgroundColor, 0.85),
    hexToRgba(backgroundColor, 0.95),
  ] as const;

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
              source={{ uri: backgroundImageUrl }}
              style={{ width: '100%', height: 120 }}
              contentFit="cover"
            />

            {/* Gradient overlay for better text readability */}
            <LinearGradient
              colors={gradientColors}
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
                {title}
              </Text>
              <Text style={{
                color: '#fff',
                fontSize: 15,
                opacity: 0.95,
                marginBottom: 8
              }}>
                {description}
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
                  {callToActionText}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Campaign badge - positioned outside the TouchableOpacity */}
        {badgeText && (
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
              color: backgroundColor,
              fontSize: 10,
              fontWeight: '700',
              textTransform: 'uppercase',
            }}>
              {badgeText}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
