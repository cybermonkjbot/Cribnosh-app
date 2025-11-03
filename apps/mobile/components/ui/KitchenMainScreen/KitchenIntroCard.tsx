import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface KitchenIntroCardProps {
  kitchenName: string;
  cuisine: string;
}

export const KitchenIntroCard: React.FC<KitchenIntroCardProps> = ({
  kitchenName,
  cuisine,
}) => {
  return (
    <View style={styles.container}>
      {/* Card background */}
      <View style={styles.cardBackground}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Svg width={44} height={44} viewBox="0 0 44 44" fill="none">
              <Circle cx="22" cy="22" r="22" fill="#EAEAEA" />
              {/* Simple avatar icon */}
              <Circle cx="22" cy="17" r="5" fill="#4C3F59" />
              <Path d="M8 34 C8 25 36 25 36 34" fill="#4C3F59" />
            </Svg>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.kitchenName}>{kitchenName}</Text>
          <Text style={styles.cuisine}>{cuisine}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: Math.min(280, width - 80),
    height: 60,
  },
  cardBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FAFFFA',
    borderRadius: 18,
    shadowColor: '#383838',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
  },
  kitchenName: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#4C3F59',
    marginBottom: 1,
  },
  cuisine: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.03,
    color: '#53465E',
  },
}); 