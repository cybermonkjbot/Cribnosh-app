import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { Avatar } from './Avatar';
import CancelButton from './CancelButton';
import { CribnoshLiveIndicator } from './CribnoshLiveIndicator';

interface CribnoshLiveHeaderProps {
  avatarSource: any;
  kitchenTitle: string;
  viewers: number;
  onCancel: () => void;
}

export function CribnoshLiveHeader({
  avatarSource,
  kitchenTitle,
  viewers,
  onCancel,
}: CribnoshLiveHeaderProps) {
  const { width } = useWindowDimensions();
  return (
    <View className="flex-row items-start justify-between rounded-xl overflow-hidden px-2 py-1.5 self-center mt-6 w-[97vw] max-w-[500px] bg-transparent">
      {/* Left side: Avatar, then text column */}
      <View className="flex-row items-start flex-1 min-w-0">
        <Avatar
          source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
          size="md"
          className="w-[64px] h-[64px] rounded-full bg-[#CEC9FF] mt-4"
        />
        <View className="flex-1 flex-col items-start justify-center min-w-0 ml-3 gap-y-0.5">
          <Text className="font-inter font-semibold text-[20px] leading-[24px] text-[#E6FFE8] mb-0 mt-1 text-left w-full">
            {kitchenTitle}
          </Text>
          <View className="flex-row items-center w-full mt-0.5 mb-0.5">
            <View className="bg-gray-400 rounded-2xl px-3 py-0.5 self-start">
              <Text className="text-white font-inter font-normal text-[15px] leading-[18px]">{viewers} viewers</Text>
            </View>
          </View>
          <View className="mt-0.5">
            <CribnoshLiveIndicator />
          </View>
        </View>
      </View>
      {/* Right side: Cancel Button */}
      <View className="flex-col items-end justify-start h-full ml-2 flex-shrink-0 mt-1">
        <CancelButton onPress={onCancel} color="#E6FFE8" size={44} />
      </View>
    </View>
  );
}

