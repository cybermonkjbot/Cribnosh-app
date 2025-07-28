import { useAppContext } from '@/utils/AppContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import React, { useRef } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { CustomHomeIcon } from './CustomHomeIcon';
import { CustomOrdersIcon } from './CustomOrdersIcon';
import { CustomProfileIcon } from './CustomProfileIcon';
import { IconSymbol } from './IconSymbol';

const { width } = Dimensions.get('window');

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { scrollToTop } = useAppContext();
  const lastTapRef = useRef<number>(0);
  const doubleTapDelay = 300; // milliseconds

  const handleTabPress = (route: any, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }

    // Handle double-tap for home tab
    if (route.name === 'index' && isFocused) {
      const now = Date.now();
      const timeDiff = now - lastTapRef.current;
      
      if (timeDiff < doubleTapDelay) {
        // Double tap detected - scroll to top
        scrollToTop();
        lastTapRef.current = 0; // Reset to prevent triple tap
      } else {
        lastTapRef.current = now;
      }
    }
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        <View style={styles.tabBarContainer}>
          <View style={styles.tabBarContent}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const label = typeof options.tabBarLabel === 'string' 
                ? options.tabBarLabel 
                : options.title ?? route.name;
              const isFocused = state.index === index;

              const onPress = () => {
                handleTabPress(route, isFocused);
              };

              const getIconName = () => {
                switch (route.name) {
                  case 'index':
                    return 'house.fill';
                  case 'orders':
                    return 'bolt.fill';
                  case 'profile':
                    return 'person.fill';
                  default:
                    return 'house.fill';
                }
              };

              const renderIcon = () => {
                if (route.name === 'index') {
                  return (
                    <CustomHomeIcon 
                      size={48} 
                      color={isFocused ? '#0B9E58' : '#6B7280'} 
                    />
                  );
                }
                if (route.name === 'orders') {
                  return (
                    <CustomOrdersIcon 
                      size={48} 
                      color={isFocused ? '#0B9E58' : '#6B7280'} 
                    />
                  );
                }
                if (route.name === 'profile') {
                  return (
                    <CustomProfileIcon 
                      size={48} 
                      color={isFocused ? '#0B9E58' : '#6B7280'} 
                    />
                  );
                }
                return (
                  <IconSymbol 
                    size={48} 
                    name={getIconName()} 
                    color={isFocused ? '#0B9E58' : '#6B7280'} 
                  />
                );
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
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: width,
    height: 95,
    backgroundColor: 'transparent',
    zIndex: 999999, // Highest z-index to stay above the player
  },
  blurContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
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