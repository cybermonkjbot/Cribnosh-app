import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import HearEmoteIcon from './HearEmoteIcon';

interface LoveThisButtonProps {
  liked?: boolean;
  onLikeChange?: (liked: boolean) => void;
  style?: ViewStyle;
}

const LoveThisButton: React.FC<LoveThisButtonProps> = ({ liked, onLikeChange, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Pressable style={styles.leadingButton} onPress={() => onLikeChange && onLikeChange(!liked)}>
        <View style={styles.stateLayer}>
          <HearEmoteIcon width={24} height={24} liked={liked} />
          <Text style={styles.label}>i love this</Text>
        </View>
      </Pressable>
      <Pressable style={styles.trailingButton}>
        <View style={styles.trailingStateLayer}>
          <Ionicons name="chevron-down" size={22} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 2,
    position: 'absolute',
    width: 161,
    height: 48,
    left: 23,
    top: 483,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  leadingButton: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    width: 111,
    height: 32,
    backgroundColor: '#094327',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  stateLayer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 10,
    gap: 4,
    width: 111,
    height: 32,
    isolation: 'isolate',
  },
  label: {
    width: 61,
    height: 20,
    fontFamily: 'Roboto',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.1,
    color: '#fff',
    marginLeft: 4,
  },
  trailingButton: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    width: 48,
    height: 32,
    backgroundColor: '#094327',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  trailingStateLayer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 12,
    paddingRight: 14,
    gap: 8,
    width: 48,
    height: 32,
    isolation: 'isolate',
  },
});

export default LoveThisButton;
