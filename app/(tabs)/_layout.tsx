import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/ui/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          height: 95,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          zIndex: 999999, // Highest z-index to stay above the player
        },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
