import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './ui/Avatar';
import MessageIcon from './ui/MessageIcon';

interface GroupOrderMemberProps {
  name: string;
  avatarUri: string | { uri: string };
  showMessageIcon?: boolean;
  isPaying?: boolean;
  payingAmount?: number;
  isChoosingMeal?: boolean;
  isContributing?: boolean;
  contributingAmount?: number;
  isCurrentUser?: boolean;
  textColor?: string;
}

const styles = StyleSheet.create({
  statusText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 70,
  },
  avatarWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  messageIconWrapper: {
    position: 'absolute',
    width: 20,
    height: 20,
    right: 0,
    bottom: 0,
    borderRadius: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});

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
  textColor = '#134E3A',
}) => {
  // Name and status logic for display
  let displayName = isCurrentUser ? 'You' : name;
  let status = '';
  if (isPaying && payingAmount) {
    status = `Paying £${payingAmount}`;
  } else if (isChoosingMeal) {
    status = 'Choosing meal';
  } else if (isContributing && contributingAmount) {
    status = `Contributing £${contributingAmount}`;
  }
  let statusText = status ? `${displayName} (${status})` : displayName;
  let statusColor = textColor;
 const { width } = Dimensions.get('window');
 const isSmall = width < 375;
 const avatarSize = isSmall ? 52 : 62;
  return (
    <View style={styles.container}>
      <View style={{ position: 'relative', width: avatarSize, height: avatarSize, borderRadius:avatarSize / 2 }}>
        <View style={styles.avatarWrapper}>
          <Avatar source={typeof avatarUri === 'string' ? { uri: avatarUri } : avatarUri} style={styles.avatar} size="md" />
        </View>
        {showMessageIcon && (
          <View style={styles.messageIconWrapper}>
            <MessageIcon />
          </View>
        )}
      </View>
      <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
    </View>
  );
};

export default GroupOrderMember;
