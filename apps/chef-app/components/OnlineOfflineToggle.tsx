import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface OnlineOfflineToggleProps {
  chefId: Id<'chefs'>;
  isOnline: boolean;
  sessionToken?: string;
  onShowSetup?: () => void;
}

// Brand colors
const COLORS = {
  primary: '#094327',
  secondary: '#0B9E58',
  lightGreen: '#E6FFE8',
  background: '#FAFFFA',
  white: '#FFFFFF',
  text: {
    primary: '#02120A',
    secondary: '#374151',
    muted: '#6B7280',
  },
  border: '#E5E7EB',
  success: '#0B9E58',
  error: '#FF3B30',
  offline: '#9CA3AF',
};

export function OnlineOfflineToggle({ chefId, isOnline, sessionToken, onShowSetup }: OnlineOfflineToggleProps) {
  const { showSuccess, showError } = useToast();
  const { isAuthenticated } = useChefAuth();
  const router = useRouter();
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  const toggleAvailability = useMutation(api.mutations.foodCreators.toggleAvailability);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Check if chef can go online
  const canGoOnlineStatus = useQuery(
    api.queries.chefCourses.canGoOnline,
    chefId && sessionToken
      ? { chefId, sessionToken }
      : 'skip'
  );

  // Simple animation values - only what we need
  const togglePosition = useSharedValue(isOnline ? 1 : 0);
  const backgroundColor = useSharedValue(isOnline ? COLORS.success : COLORS.offline);

  React.useEffect(() => {
    togglePosition.value = withSpring(isOnline ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
    backgroundColor.value = withTiming(isOnline ? COLORS.success : COLORS.offline, {
      duration: 300,
    });
  }, [isOnline]);

  const handleToggle = async () => {
    if (isUpdating) return;

    // Check authentication before allowing toggle
    if (!isAuthenticated) {
      router.push({
        pathname: '/sign-in',
        params: { notDismissable: 'true' }
      });
      return;
    }

    // If trying to go online, check if requirements are met
    if (!isOnline) {
      // Wait for query to resolve if still loading
      if (canGoOnlineStatus === undefined) {
        return; // Still loading, wait
      }

      if (!canGoOnlineStatus?.canGoOnline) {
        // Show setup sheet instead of toggling
        if (onShowSetup) {
          onShowSetup();
        } else {
          showError(
            'Setup Required',
            canGoOnlineStatus.reasons?.join(', ') || 'Please complete your setup to go online'
          );
        }
        return;
      }
    }

    setIsUpdating(true);
    try {
      await toggleAvailability({
        chefId,
        isAvailable: !isOnline,
        sessionToken,
      });
      showSuccess(
        !isOnline ? 'You are now online' : 'You are now offline',
        !isOnline
          ? 'You can now receive orders'
          : 'You will no longer receive new orders'
      );
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update availability');
    } finally {
      setIsUpdating(false);
    }
  };

  // Simplified animated styles
  const toggleSwitchStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: togglePosition.value * 24,
        },
      ],
    };
  });

  const toggleContainerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: backgroundColor.value,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.statusSection}>
          <View style={styles.statusIndicatorContainer}>
            <View
              style={[
                styles.statusCircle,
                { backgroundColor: isOnline ? COLORS.success : COLORS.offline },
              ]}
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={[styles.statusText, isOnline && styles.statusTextOnline]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleToggle}
          disabled={isUpdating}
          activeOpacity={0.8}
          style={styles.toggleButtonContainer}
        >
          {isUpdating ? (
            <View style={[styles.toggleSwitchContainer, { backgroundColor: isOnline ? COLORS.success : COLORS.offline }]}>
              <ActivityIndicator
                size="small"
                color={COLORS.white}
              />
            </View>
          ) : (
            <Animated.View style={[styles.toggleSwitchContainer, toggleContainerStyle]}>
              <Animated.View style={[styles.toggleSwitch, toggleSwitchStyle]}>
                <View style={styles.powerIcon} />
              </Animated.View>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

      {isOnline && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            You're accepting orders. Customers can place orders now.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicatorContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.offline,
  },
  statusTextOnline: {
    color: COLORS.success,
  },
  toggleButtonContainer: {
    marginLeft: 16,
  },
  toggleSwitchContainer: {
    width: 56,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  powerIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  infoBanner: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11, 158, 88, 0.1)',
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
    lineHeight: 18,
  },
});
