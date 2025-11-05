import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AISparkles } from './ui/AISparkles';
import { Avatar } from './ui/Avatar';
import { formatNumberWithCommas } from './ui/utils';

interface GroupTotalSpendCardProps {
  amount: string;
  label?: string;
  avatars: { uri: string; user_id?: string }[];
  glow?: boolean;
  onPress?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.min(362, screenWidth - 32);
const CARD_HEIGHT = CARD_WIDTH * 0.28;
const AVATAR_SIZE = screenWidth < 375 ? 32 : 36;
const AVATAR_OVERLAP = screenWidth < 375 ? 14 : 18;

const GroupTotalSpendCard: React.FC<GroupTotalSpendCardProps> = ({ amount, label = 'Chip in to budget', avatars, glow, onPress }) => {
  const mainCardHeight = CARD_HEIGHT * 0.78;

  const CardWrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.8 } : {};

  return (
    <CardWrapper
      {...wrapperProps}
      style={[
        styles.container,
        { width: CARD_WIDTH, height: CARD_HEIGHT },
      ]}
    >
      {glow && (
        <View
          style={[
            styles.glow,
            {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            },
          ]}
          pointerEvents="none"
        />
      )}

      <View
        style={[
          styles.card,
          {
          width: CARD_WIDTH,
          height: mainCardHeight,
          top: (CARD_HEIGHT - mainCardHeight) / 2,
          },
        ]}
      >
        <Text
          style={[
            styles.amount,
            {
            fontSize: screenWidth < 375 ? 26 : 30,
            lineHeight: screenWidth < 375 ? 38 : 44,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatNumberWithCommas(amount)}
        </Text>

        <Text
          style={[
            styles.label,
            {
            fontSize: screenWidth < 375 ? 8 : 12,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {label}
        </Text>

        <View style={styles.sparklesContainer}>
          <AISparkles
            style={{
              width: screenWidth < 375 ? 18 : 22,
              height: screenWidth < 375 ? 18 : 22,
            }}
            color="#E6FFE8"
          />
        </View>

        <View
          style={[
            styles.avatarsContainer,
            {
            top: -AVATAR_SIZE / 2,
            left: CARD_WIDTH * 0.69,
            height: AVATAR_SIZE,
            },
          ]}
        >
          {avatars.map((avatar, idx) => (
            <View
              key={idx}
              style={[
                styles.avatarWrapper,
                {
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                left: idx * AVATAR_OVERLAP,
                zIndex: avatars.length - idx,
                },
              ]}
            >
              <Avatar source={{ uri: avatar.uri }} size="md" />
            </View>
          ))}
        </View>
      </View>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative', // relative
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
  },
  glow: {
    position: 'absolute', // absolute
    borderRadius: 32, // rounded-[32px]
    backgroundColor: '#094327',
    opacity: 0.7,
    shadowColor: '#E6FFE8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 55,
    elevation: 30,
  },
  card: {
    position: 'absolute', // absolute
    left: 0, // left-0
    backgroundColor: '#094327', // bg-[#094327]
    borderRadius: 30, // rounded-[30px]
    shadowColor: '#E6FFE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 55,
    elevation: 10,
  },
  amount: {
    position: 'absolute', // absolute
    width: '40%',
    left: '6%',
    top: '1%',
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '900',
    letterSpacing: -0.43,
    color: '#E6FFE8',
  },
  label: {
    position: 'absolute', // absolute
    textAlign: 'center', // text-center
    width: '60%',
    left: '20%',
    top: '64%',
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '400',
    lineHeight: 20,
    color: '#E6FFE8',
  },
  sparklesContainer: {
    position: 'absolute', // absolute
    left: '85%',
    top: '15%',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarsContainer: {
    position: 'absolute', // absolute
    flexDirection: 'row', // flex-row
  },
  avatarWrapper: {
    position: 'absolute', // absolute
    borderWidth: 2, // border-2
    borderColor: '#FFFFFF', // border-white
    borderRadius: 9999, // rounded-full
    overflow: 'hidden', // overflow-hidden
  },
});

export default GroupTotalSpendCard;