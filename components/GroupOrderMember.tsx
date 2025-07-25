import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface GroupOrderMemberProps {
  name: string;
  avatarUri: string;
  showMessageIcon?: boolean;
  isPaying?: boolean;
  payingAmount?: number;
  isChoosingMeal?: boolean;
  isContributing?: boolean;
  contributingAmount?: number;
  isCurrentUser?: boolean;
}

const GroupOrderMember: React.FC<GroupOrderMemberProps> = ({
  name,
  avatarUri,
  showMessageIcon = false,
  isPaying = false,
  payingAmount,
  isChoosingMeal = false,
  isContributing = false,
  contributingAmount,
  isCurrentUser = false,
}) => {
  let statusText = '';
  let statusColor = '#E6FFE8';

  if (isCurrentUser) {
    statusText = 'You';
  } else if (isPaying && payingAmount) {
    statusText = `Paying £${payingAmount}`;
  } else if (isContributing && contributingAmount) {
    statusText = `Contributing £${contributingAmount}`;
  } else if (isChoosingMeal) {
    statusText = 'Choosing meal...';
    statusColor = '#FFD700';
  } else {
    statusText = name;
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        {showMessageIcon && (
          <View style={styles.messageIconWrapper}>
            <Image source={require('../../assets/images/Messages.png')} style={styles.messageIcon} />
          </View>
        )}
      </View>
      <Text style={[styles.statusText, { color: statusColor }]}> {statusText} </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 62,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  avatarWrapper: {
    position: 'absolute',
    width: 62,
    height: 62,
    top: -1,
    left: 0,
    borderRadius: 10000,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 10000,
  },
  messageIconWrapper: {
    position: 'absolute',
    width: 20,
    height: 20,
    left: 43,
    top: 44,
    borderRadius: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  statusText: {
    position: 'absolute',
    top: 67,
    left: -8,
    right: -8,
    height: 26,
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 13,
    textAlign: 'center',
    letterSpacing: 0.06,
    color: '#E6FFE8',
  },
});

export default GroupOrderMember;
