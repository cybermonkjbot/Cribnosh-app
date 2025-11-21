import { Tabs, useSegments } from 'expo-router';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { CustomTabBar } from '@/components/ui/CustomTabBar';

export default function TabLayout() {
  const { isAuthenticated } = useChefAuth();
  const segments = useSegments();

  // Check if we're on onboarding or compliance pages
  // Segments can be like: ['(tabs)', 'chef', 'onboarding-setup'] or ['(tabs)', 'chef', 'onboarding', ...]
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

  // Hide tabs on onboarding/compliance pages
  const shouldShowTabs = isAuthenticated && !isOnOnboardingRoute;

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
      tabBar={(props) => <CustomTabBar {...props} />}
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
        name="chef"
        options={{
          href: null, // Hide from tab bar but keep accessible via navigation
        }}
      />
    </Tabs>
  );
}

