import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter, useSegments } from 'expo-router';
import { useRef } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BlurEffect } from '@/utils/blurEffects';
import { CustomChefDashboardIcon } from './CustomChefDashboardIcon';
import { CustomChefOrdersIcon } from './CustomChefOrdersIcon';
import { CustomChefProfileIcon } from './CustomChefProfileIcon';

const { width } = Dimensions.get('window');

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const segments = useSegments();
  const lastTapRef = useRef<number>(0);
  const doubleTapDelay = 300; // milliseconds
  
  // Check if we're on onboarding routes - hide tab bar
  const segmentString = (segments as string[]).join('/');
  const isOnOnboardingRoute = 
    segmentString.includes('onboarding-setup') || 
    segmentString.includes('onboarding/') ||
    segmentString.endsWith('onboarding') ||
    (segments as string[]).some(segment => 
      segment === 'onboarding-setup' || 
      segment === 'onboarding' ||
      (typeof segment === 'string' && segment.includes('onboarding'))
    );

  // Don't render if on onboarding route
  if (isOnOnboardingRoute) {
    return null;
  }

  const handleTabPress = (route: any, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    // Special handling for tabs - always navigate to root regardless of stack
    if (route.name === 'orders') {
      if (!event.defaultPrevented) {
        router.replace('/(tabs)/orders');
      }
      return;
    }

    if (route.name === 'profile/index' || route.name === 'profile') {
      if (!event.defaultPrevented) {
        router.replace('/(tabs)/profile');
      }
      return;
    }

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }

    // Handle double-tap for dashboard tab
    if (route.name === 'index' && isFocused) {
      const now = Date.now();
      const timeDiff = now - lastTapRef.current;
      
      if (timeDiff < doubleTapDelay) {
        // Double tap detected - could scroll to top if needed
        lastTapRef.current = 0; // Reset to prevent triple tap
      } else {
        lastTapRef.current = now;
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundLayer} />
      <BlurEffect intensity={100} tint="light" useGradient={true} style={styles.blurContainer}>
        <View style={styles.tabBarContainer}>
          <View style={styles.tabBarContent}>
            {state.routes
              .filter((route) => {
                // Only show index, orders, and profile routes in tab bar
                return route.name === 'index' || route.name === 'orders' || route.name === 'profile/index' || route.name === 'profile';
              })
              .map((route, filteredIndex) => {
                // Find the actual index in the original routes array
                const actualIndex = state.routes.findIndex(r => r.key === route.key);
                const isFocused = state.index === actualIndex;

                const onPress = () => {
                  handleTabPress(route, isFocused);
                };

                const renderIcon = () => {
                  if (route.name === 'index') {
                    return (
                      <CustomChefDashboardIcon 
                        size={48} 
                        color={isFocused ? '#0B9E58' : '#6B7280'} 
                      />
                    );
                  }
                  if (route.name === 'orders') {
                    return (
                      <CustomChefOrdersIcon 
                        size={48} 
                        color={isFocused ? '#0B9E58' : '#6B7280'} 
                      />
                    );
                  }
                if (route.name === 'profile/index' || route.name === 'profile') {
                  return (
                    <CustomChefProfileIcon 
                      size={48} 
                      color={isFocused ? '#0B9E58' : '#6B7280'} 
                    />
                  );
                }
                return null;
                };

                return (
                  <TouchableOpacity
                    key={route.key}
                    style={styles.tabButton}
                    onPress={onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconContainer}>
                      {renderIcon()}
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        </View>
      </BlurEffect>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: width,
    height: 95,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
    zIndex: 999999,
  },
  backgroundLayer: {
    position: 'absolute',
    width: width,
    height: 95,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  blurContainer: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 0,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  tabBarContainer: {
    position: 'absolute',
    width: (width - 60) * 1.2,
    height: 65,
    left: 30 - ((width - 60) * 0.1),
    top: 15,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

