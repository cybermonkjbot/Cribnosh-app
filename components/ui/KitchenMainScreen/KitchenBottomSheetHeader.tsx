import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import { ChipButton } from '../ChipButton';
import HearEmoteIcon from '../HearEmoteIcon';

interface KitchenBottomSheetHeaderProps {
  deliveryTime: string;
  onHeartPress?: () => void;
  onSearchPress?: () => void;
}

export const KitchenBottomSheetHeader: React.FC<KitchenBottomSheetHeaderProps> = ({
  deliveryTime,
  onHeartPress,
  onSearchPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Drag indicator */}
      <View style={styles.dragIndicator} />
      
      {/* Title and action buttons */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>About This Kitchen</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onHeartPress}>
            <HearEmoteIcon width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onSearchPress}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Circle cx="11" cy="11" r="8" stroke="#F3F4F6" strokeWidth="2" />
              <Path d="m21 21-4.35-4.35" stroke="#F3F4F6" strokeWidth="2" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delivery information */}
      <Text style={styles.deliveryInfo}>
        Delivers within your zone {deliveryTime}
      </Text>

      {/* Feature chips */}
      <View style={styles.chipsContainer}>
        <ChipButton
          text="Keto only"
          backgroundColor="rgba(255, 59, 48, 0.72)"
          textColor="#FAFFFA"
          style={styles.chip}
        />
        <ChipButton
          text="Best for late-night cravings"
          backgroundColor="rgba(255, 59, 48, 0.72)"
          textColor="#FAFFFA"
          style={styles.chip}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 25,
    paddingTop: 15,
  },
  dragIndicator: {
    width: 85,
    height: 5,
    backgroundColor: '#EDEDED',
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 38,
    color: '#F3F4F6',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryInfo: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.03,
    color: '#FAFAFA',
    marginBottom: 20,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  chip: {
    marginRight: 0,
  },
}); 