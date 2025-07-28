import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface KitchenIntroCardProps {
  kitchenName: string;
  cuisine: string;
  onPlayPress?: () => void;
}

export const KitchenIntroCard: React.FC<KitchenIntroCardProps> = ({
  kitchenName,
  cuisine,
  onPlayPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Card background */}
      <View style={styles.cardBackground}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Svg width={52} height={52} viewBox="0 0 52 52" fill="none">
              <Circle cx="26" cy="26" r="26" fill="#EAEAEA" />
              {/* Simple avatar icon */}
              <Circle cx="26" cy="20" r="6" fill="#4C3F59" />
              <Path d="M10 40 C10 30 42 30 42 40" fill="#4C3F59" />
            </Svg>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.kitchenName}>{kitchenName}</Text>
          <Text style={styles.cuisine}>{cuisine}</Text>
        </View>

        {/* Play button */}
        <TouchableOpacity style={styles.playButton} onPress={onPlayPress}>
          <Svg width={15} height={15} viewBox="0 0 15 15" fill="none">
            <Circle cx="7.5" cy="7.5" r="7.5" fill="#4C3F59" />
            <Path d="M6 4 L11 7.5 L6 11 Z" fill="#FAFFFA" />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: Math.min(346, width - 28),
    height: 74,
  },
  cardBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FAFFFA',
    borderRadius: 22,
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
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    fontSize: 18,
    lineHeight: 26,
    color: '#4C3F59',
    marginBottom: 2,
  },
  cuisine: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.03,
    color: '#53465E',
  },
  playButton: {
    width: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 