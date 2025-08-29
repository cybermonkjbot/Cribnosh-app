import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import { AISparkles } from './ui/AISparkles';
import { Avatar } from './ui/Avatar';
import { formatNumberWithCommas } from './ui/utils';

interface GroupTotalSpendCardProps {
  amount: string;
  label?: string;
  avatars: { uri: string }[];
  glow?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.min(362, screenWidth - 32);
const CARD_HEIGHT = CARD_WIDTH * 0.28;
const AVATAR_SIZE = screenWidth < 375 ? 32 : 36;
const AVATAR_OVERLAP = screenWidth < 375 ? 14 : 18;

const GroupTotalSpendCard: React.FC<GroupTotalSpendCardProps> = ({ amount, label = 'Chip in to budget', avatars, glow }) => {
  const mainCardHeight = CARD_HEIGHT * 0.78;

  return (
    <View
      className="relative items-center justify-center"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      {glow && (
        <View
          className="absolute rounded-[32px]"
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            backgroundColor: '#094327',
            opacity: 0.7,
            shadowColor: '#E6FFE8',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 55,
            elevation: 30,
          }}
          pointerEvents="none"
        />
      )}

      <View
        className="absolute left-0 bg-[#094327] rounded-[30px] shadow-xl"
        style={{
          width: CARD_WIDTH,
          height: mainCardHeight,
          top: (CARD_HEIGHT - mainCardHeight) / 2,
          shadowColor: '#E6FFE8',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 55,
          elevation: 10,
        }}
      >
        <Text
          className="absolute"
          style={{
            width: '40%',
            left: '6%',
            top: '1%',
            fontFamily: 'SF Pro',
            fontStyle: 'normal',
            fontWeight: '900',
            fontSize: screenWidth < 375 ? 26 : 30,
            lineHeight: screenWidth < 375 ? 38 : 44,
            letterSpacing: -0.43,
            color: '#E6FFE8',
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatNumberWithCommas(amount)}
        </Text>

        <Text
          className="absolute text-center"
          style={{
            width: '60%',
            left: '20%',
            top: '64%',
            fontFamily: 'Poppins-SemiBold',
            fontWeight: '400',
            fontSize: screenWidth < 375 ? 8 : 12,
            lineHeight: 20,
            color: '#E6FFE8',
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {label}
        </Text>

        <View
          className="absolute"
          style={{
            left: '85%',
            top: '15%',
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AISparkles
            style={{
              width: screenWidth < 375 ? 18 : 22,
              height: screenWidth < 375 ? 18 : 22,
            }}
            color="#E6FFE8"
          />
        </View>

        <View
          className="absolute flex-row"
          style={{
            top: -AVATAR_SIZE / 2,
            left: CARD_WIDTH * 0.69,
            height: AVATAR_SIZE,
            flexDirection: 'row',
          }}
        >
          {avatars.map((avatar, idx) => (
            <View
              key={idx}
              className="absolute border-2 border-white rounded-full overflow-hidden"
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                left: idx * AVATAR_OVERLAP,
                zIndex: avatars.length - idx,
              }}
            >
              <Avatar source={{ uri: avatar.uri }} size="md" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default GroupTotalSpendCard;