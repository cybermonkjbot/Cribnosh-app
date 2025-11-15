import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import HearEmoteIcon from '../HearEmoteIcon';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';

interface KitchenBottomSheetHeaderProps {
  deliveryTime: string;
  kitchenName?: string;
  currentSnapPoint?: number;
  distance?: string;
  kitchenId?: string;
  onHeartPress?: () => void;
  onSearchPress?: () => void;
}

export const KitchenBottomSheetHeader: React.FC<KitchenBottomSheetHeaderProps> = ({
  deliveryTime,
  kitchenName = "Amara's Kitchen",
  currentSnapPoint = 0,
  distance = "0.8 km",
  kitchenId,
  onHeartPress,
  onSearchPress,
}) => {
  // Determine title text based on snap point
  const titleText = currentSnapPoint === 1 ? kitchenName : "Kitchen Story";
  const isExpanded = currentSnapPoint === 1;

  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  // Fetch favorite status if kitchenId is provided
  useEffect(() => {
    const loadFavoriteStatus = async () => {
      if (!kitchenId) {
        setIsFavorited(false);
        return;
      }

      try {
        setIsLoadingFavorite(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          setIsFavorited(false);
          setIsLoadingFavorite(false);
          return;
        }

        const result = await convex.action(api.actions.users.customerGetKitchenFavoriteStatus, {
          sessionToken,
          kitchenId,
        });

        if (result.success) {
          setIsFavorited(result.isFavorited);
        }
      } catch (error) {
        console.error('Failed to load favorite status:', error);
        setIsFavorited(false);
      } finally {
        setIsLoadingFavorite(false);
      }
    };

    loadFavoriteStatus();
  }, [kitchenId]);

  const handleHeartPress = async () => {
    if (!kitchenId) {
      onHeartPress?.();
      return;
    }

    try {
      setIsLoadingFavorite(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        setIsLoadingFavorite(false);
        return;
      }

      if (isFavorited) {
        const result = await convex.action(api.actions.users.customerRemoveKitchenFavorite, {
          sessionToken,
          kitchenId,
        });
        if (result.success) {
          setIsFavorited(false);
        }
      } else {
        const result = await convex.action(api.actions.users.customerAddKitchenFavorite, {
          sessionToken,
          kitchenId,
        });
        if (result.success) {
          setIsFavorited(true);
        }
      }
      onHeartPress?.();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Drag indicator */}
      <View style={styles.dragIndicator} />
      
      {/* Title and action buttons */}
      <View style={styles.titleRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{titleText}</Text>
          {isExpanded && (
            <Text style={styles.kitchenDetails}>
              Delivers in {deliveryTime} • {distance} away
            </Text>
          )}
        </View>
        <View style={styles.actionButtons}>
          {isLoadingFavorite ? (
            <View style={styles.actionButton}>
              <ActivityIndicator size="small" color="#F3F4F6" />
            </View>
          ) : (
            <TouchableOpacity style={styles.actionButton} onPress={handleHeartPress}>
              <HearEmoteIcon width={32} height={32} liked={isFavorited} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={onSearchPress}>
            <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
              <Circle cx="14.67" cy="14.67" r="10.67" stroke="#F3F4F6" strokeWidth="2.67" />
              <Path d="m28 28-5.8-5.8" stroke="#F3F4F6" strokeWidth="2.67" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 38,
    color: '#F3F4F6',
  },
  kitchenDetails: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#FAFAFA',
    marginTop: 4,
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
}); 