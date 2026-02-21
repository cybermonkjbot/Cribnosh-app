import { CustomTabBar } from '@/components/ui/CustomTabBar';
import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { Tabs, useSegments } from 'expo-router';
import { useCallback } from 'react';

export default function TabLayout() {
  // Always call hooks unconditionally at the top level - never conditionally
  // This ensures consistent hook order across all renders, including during logout
  const { isAuthenticated } = useFoodCreatorAuth();
  const segments = useSegments();

  // Defensive check: ensure segments is always an array to prevent errors during navigation transitions
  const segmentsArray = Array.isArray(segments) ? segments : [];

  // Check if we're on onboarding or compliance pages
  // Segments can be like: ['(tabs)', 'food-creator', 'onboarding-setup'] or ['(tabs)', 'food-creator', 'onboarding', ...]
  const segmentString = segmentsArray.join('/');
  const isOnOnboardingRoute =
    segmentString.includes('onboarding-setup') ||
    segmentString.includes('onboarding/') ||
    segmentString.endsWith('onboarding') ||
    segmentsArray.some(segment =>
      segment === 'onboarding-setup' ||
      segment === 'onboarding' ||
      (typeof segment === 'string' && segment.includes('onboarding'))
    );

  // Hide tabs on onboarding/compliance pages or when not authenticated
  const shouldShowTabs = isAuthenticated && !isOnOnboardingRoute;

  // Memoize the tabBar function to prevent unnecessary re-renders and maintain stability
  const renderTabBar = useCallback((props: any) => {
    return <CustomTabBar {...props} />;
  }, []);

  // Always return the Tabs component to maintain consistent hook order
  // The tab bar visibility is controlled via display: 'none' style
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
          zIndex: 999999,
          display: shouldShowTabs ? 'flex' : 'none',
        },
      }}
      tabBar={renderTabBar}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
        }}
      />
      <Tabs.Screen
        name="earnings/index"
        options={{
          href: null, // Hide from tab bar but keep accessible via navigation
        }}
      />
      <Tabs.Screen
        name="food-creator"
        options={{
          href: null, // Hide from tab bar but keep accessible via navigation
        }}
      />
    </Tabs>
  );
}

