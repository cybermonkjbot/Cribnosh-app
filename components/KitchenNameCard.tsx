
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Avatar } from './ui/Avatar';
import { TiltCard } from './ui/TiltCard';

interface KitchenNameCardProps {
  avatarUri?: string | { uri: string };
  name?: string;
  description?: string;
  tiltEnabled?: boolean;
}

// Helper function to validate URI
const isValidUri = (uri: any): boolean => {
  if (!uri) return false;
  if (typeof uri === 'string') return uri.trim().length > 0;
  if (typeof uri === 'object' && uri.uri) return uri.uri.trim().length > 0;
  return false;
};

export function KitchenNameCard({
  avatarUri,
  name,
  description,
  tiltEnabled = true,
}: KitchenNameCardProps) {
  // Edge case handling
  const fallbackAvatar = { uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face' };
  let avatarSource: { uri: string } = fallbackAvatar;
  if (isValidUri(avatarUri)) {
    if (typeof avatarUri === 'string') {
      avatarSource = { uri: avatarUri };
    } else if (avatarUri && typeof avatarUri.uri === 'string') {
      avatarSource = { uri: avatarUri.uri };
    }
  }
  const displayName = typeof name === 'string' && name.trim() ? name : 'Stans Kitchen';
  const displayDesc = typeof description === 'string' && description.trim() ? description : 'African cuisine (Top Rated)';

  const cardContent = (
    <View className="flex-1 min-h-[74px] bg-[#FAFFFA] rounded-[22px] flex-row items-center shadow shadow-[#383838] shadow-opacity-5 shadow-lg elevation-5 my-2.5 px-4">
      {/* Avatar */}
      <View className="w-[52px] h-[52px] rounded-full bg-[#EAEAEA] justify-center items-center mr-[15px]">
        <Avatar source={avatarSource} size="md" className="w-[52px] h-[52px] rounded-full" />
      </View>
      {/* Texts */}
      <View className="flex-1 justify-center">
        <Text className="font-['Poppins'] font-medium text-[18px] text-[#4C3F59] mb-[2px]">{displayName}</Text>
        <Text className="font-['Lato'] font-normal text-[14px] text-[#53465E] tracking-[0.03em]">{displayDesc}</Text>
      </View>
      {/* Details Button */}
      <TouchableOpacity className="w-8 h-8 justify-center items-center">
        <View className="w-6 h-6 rounded-full bg-[#4C3F59] justify-center items-center">
          <Svg width={16} height={16} viewBox="0 0 4 6" fill="none">
            <Path d="M0 5.5V0.5L4 3L0 5.5Z" fill="#FAFFFA" />
          </Svg>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Wrap with TiltCard if enabled
  if (tiltEnabled) {
    return (
      <TiltCard
        intensity={4}
        enabled={tiltEnabled}
        springConfig={{
          damping: 25,
          stiffness: 180,
          mass: 0.7,
        }}
      >
        {cardContent}
      </TiltCard>
    );
  }

  return cardContent;
}


// Styles removed, replaced with NativeWind classes

export default KitchenNameCard;
