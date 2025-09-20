import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface TabItem {
  key: string;
  label: string;
}

interface PremiumTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabKey: string) => void;
  style?: ViewStyle;
  activeColor?: string;
  inactiveColor?: string;
  indicatorColor?: string;
}

export const PremiumTabs: React.FC<PremiumTabsProps> = ({
  tabs,
  activeTab,
  onTabPress,
  style,
  activeColor = '#11181C',
  inactiveColor = '#687076',
  indicatorColor = '#DC2626',
}) => {
  const indicatorScale = useSharedValue(0);

  useEffect(() => {
    indicatorScale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  }, [activeTab]);

  const handleTabPress = (tabKey: string) => {
    // Reset animation and restart
    indicatorScale.value = 0;
    onTabPress(tabKey);
  };

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scaleX: indicatorScale.value }],
    };
  });

  return (
    <View style={[styles.tabsContainer, style]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tab}
          onPress={() => handleTabPress(tab.key)}
          activeOpacity={0.7}
        >
          <Text 
            style={[
              styles.tabText,
              { 
                color: activeTab === tab.key ? activeColor : inactiveColor,
                fontWeight: activeTab === tab.key ? '600' : '500',
              }
            ]}
          >
            {tab.label}
          </Text>
          {activeTab === tab.key && (
            <Animated.View 
              style={[
                styles.activeTabIndicator, 
                { 
                  backgroundColor: indicatorColor,
                },
                indicatorStyle,
              ]} 
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    marginRight: 30,
    position: 'relative',
    paddingBottom: 8,
  },
  tabText: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
}); 