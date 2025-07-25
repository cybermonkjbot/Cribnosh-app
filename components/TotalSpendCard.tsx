import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AISparkles from './ui/AISparkles';
import { Avatar } from './ui/Avatar';

interface TotalSpendCardProps {
  amount: string;
  label?: string;
  avatars: Array<{ uri: string }>; // expects array of avatar image URIs
}

const CARD_WIDTH = 362;
const CARD_HEIGHT = 81;
const AVATAR_SIZE = 36;
const AVATAR_OVERLAP = 18; // overlap amount for avatars

const TotalSpendCard: React.FC<TotalSpendCardProps> = ({
  amount,
  label = 'Squad Spend budget',
  avatars,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.amount}>{amount}</Text>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.sparkleIcon}>
          {/* Adjust props for AISparkles if needed, fallback to default if no width/height */}
          <AISparkles style={{ width: 35, height: 32 }} />
        </View>
        <View style={styles.avatarsContainer}>
          {avatars.map((avatar, idx) => (
            <View
              key={idx}
              style={[
                styles.avatarWrapper,
                { left: idx * AVATAR_OVERLAP, zIndex: avatars.length - idx },
              ]}
            >
              <Avatar source={{ uri: avatar.uri }} size="md" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: CARD_WIDTH,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    left: 0,
    top: 23,
    backgroundColor: '#094327',
    borderRadius: 30,
    shadowColor: '#E6FFE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 55,
    elevation: 10,
  },
  amount: {
    position: 'absolute',
    left: 21,
    top: 20,
    fontFamily: 'SFPro-Bold', // Ensure this font is loaded in your project
    fontWeight: '700',
    fontSize: 50,
    lineHeight: 54,
    letterSpacing: -0.43,
    color: '#E6FFE8',
  },
  label: {
    position: 'absolute',
    width: 207,
    left: (CARD_WIDTH - 207) / 2,
    top: 54,
    fontFamily: 'Poppins-SemiBold', // Ensure this font is loaded in your project
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 27,
    color: '#E6FFE8',
    textAlign: 'center',
  },
  sparkleIcon: {
    position: 'absolute',
    left: 298,
    top: 13,
    width: 35,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarsContainer: {
    position: 'absolute',
    top: -18,
    left: 250,
    flexDirection: 'row',
    width: 85,
    height: 46,
  },
  avatarWrapper: {
    position: 'absolute',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 10000,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
});

export default TotalSpendCard;
