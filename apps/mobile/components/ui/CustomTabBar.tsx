import { useAppContext } from '@/utils/AppContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRef } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BlurEffect } from '@/utils/blurEffects';
import { CustomHomeIcon } from './CustomHomeIcon';
import { CustomOrdersIcon } from './CustomOrdersIcon';
import { CustomProfileIcon } from './CustomProfileIcon';
import { IconSymbol } from './IconSymbol';

const { width } = Dimensions.get('window');

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { scrollToTop, setActiveHeaderTab } = useAppContext();
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

    // Handle double-tap for home tab - ONLY way to scroll to top
    if (route.name === 'index' && isFocused) {
      const now = Date.now();
      const timeDiff = now - lastTapRef.current;
      
      if (timeDiff < doubleTapDelay) {
        // Double tap detected - switch to 'for-you' tab and scroll to top
        setActiveHeaderTab('for-you');
        scrollToTop();
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
            {state.routes.map((route, index) => {

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
    zIndex: 999999, // Highest z-index to stay above the player
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