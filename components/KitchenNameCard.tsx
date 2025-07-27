import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Avatar } from './ui/Avatar';

export function KitchenNameCard({
  avatarUri = { uri: 'https://randomuser.me/api/portraits/men/32.jpg' },
  name = 'Stans Kitchen',
  description = 'African cuisine (Top Rated)',
}) {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <Avatar source={avatarUri} size="md" style={styles.avatarImg} />
      </View>
      {/* Texts */}
      <View style={styles.textWrapper}>
        <Text style={styles.kitchenName}>{name}</Text>
        <Text style={styles.kitchenDesc}>{description}</Text>
      </View>
      {/* Details Button */}
      <TouchableOpacity style={styles.detailsBtn}>
        <View style={styles.detailsCircle}>
          <Svg width={16} height={16} viewBox="0 0 4 6" fill="none">
            <Path d="M0 5.5V0.5L4 3L0 5.5Z" fill="#FAFFFA" />
          </Svg>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 74,
    backgroundColor: '#FAFFFA',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#383838',
    shadowOffset: { width: 0, height: 51 },
    shadowOpacity: 0.01,
    shadowRadius: 20,
    elevation: 5,
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  kitchenName: {
    fontFamily: 'Poppins',
    fontWeight: '500',
    fontSize: 18,
    color: '#4C3F59',
    marginBottom: 2,
  },
  kitchenDesc: {
    fontFamily: 'Lato',
    fontWeight: '400',
    fontSize: 14,
    color: '#53465E',
    letterSpacing: 0.03,
  },
  detailsBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4C3F59',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // detailsArrow removed, replaced with SVG
});

export default KitchenNameCard;
