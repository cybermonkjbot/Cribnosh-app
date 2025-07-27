
import React from 'react';
import { Text, View } from 'react-native';
import AISparkles from './ui/AISparkles';
import { Avatar } from './ui/Avatar';

interface GroupTotalSpendCardProps {
  amount: string;
  label?: string;
  avatars: { uri: string }[];
  glow?: boolean;
}

const CARD_WIDTH = 362;
const CARD_HEIGHT = 81;
const AVATAR_SIZE = 36;
const AVATAR_OVERLAP = 18;

const GroupTotalSpendCard: React.FC<GroupTotalSpendCardProps> = ({ amount, label = 'Squad Spend budget', avatars, glow }) => {
  return (
    <View className="relative w-[362px] h-[104px] items-center justify-center">
      {glow && (
        <View
          className="absolute w-[362px] h-[104px] rounded-[32px]"
          style={{
            backgroundColor: '#094327',
            opacity: 0.7,
            shadowColor: '#E6FFE8',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 55,
            elevation: 30,
            filter: 'blur(24px)', // for web, ignored on native
          }}
          pointerEvents="none"
        />
      )}
      <View className="absolute w-[362px] h-[81px] left-0 top-[23px] bg-[#094327] rounded-[30px] shadow-xl" style={{ shadowColor: '#E6FFE8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 55, elevation: 10 }}>
        <Text
          className="absolute"
          style={{
            width: 110,
            height: 32,
            left: 21,
            top: 20,
            fontFamily: 'SF Pro',
            fontStyle: 'normal',
            fontWeight: '900',
            fontSize: 50,
            lineHeight: 22,
            letterSpacing: -0.43,
            color: '#E6FFE8',
          }}
        >
          {amount}
        </Text>
        <Text
          className="absolute text-center flex items-center justify-center"
          style={{
            width: 207,
            left: (CARD_WIDTH - 207) / 2,
            top: 54,
            fontFamily: 'Poppins-SemiBold',
            fontWeight: '600',
            fontSize: 18,
            lineHeight: 27,
            color: '#E6FFE8',
          }}
        >
          {label}
        </Text>
        <View className="absolute" style={{ left: 298, top: 13, width: 35, height: 32, alignItems: 'center', justifyContent: 'center' }}>
          <AISparkles style={{ width: 35, height: 32 }} color="#E6FFE8" />
        </View>
        <View className="absolute flex-row" style={{ top: -18, left: 250, width: 85, height: 46 }}>
          {avatars.map((avatar, idx) => (
            <View
              key={idx}
              className="absolute bg-[#eee] border-2 border-white rounded-full overflow-hidden"
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                left: idx * AVATAR_OVERLAP,
                zIndex: avatars.length - idx,
              }}
            >
              <Avatar source={{ uri: avatar.uri }} size="md" />
// removed erroneous duplicate closing tags
// component ends correctly above
export default GroupTotalSpendCard;
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default GroupTotalSpendCard;
