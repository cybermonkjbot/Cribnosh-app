import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export const useProfilePreloader = () => {
  const router = useRouter();
  const isPreloaded = useRef(false);

  useEffect(() => {
    if (isPreloaded.current) return;

    const preloadProfile = async () => {
      try {
        // Preload the profile route
        await router.prefetch('/(tabs)/profile');
        
        // Preload heavy components and data - only what's actually used in profile screen
        await Promise.all([
          // Preload images
          Promise.resolve(require('@/assets/images/ForkPrint.png')),
          Promise.resolve(require('@/assets/images/white-greenlogo.png')),
        ]);

        // Preload data structures and components used in profile screen
        await Promise.all([
          import('@/utils/braggingCardsData'),
          import('@/components/ui/CaloriesNoshPointsCards'),
          import('@/components/ui/KPICards'),
          import('@/components/ui/ProfileScreenBackground'),
          import('@/components/Mascot'),
          import('@/components/ui/Avatar'),
        ]);
        
        isPreloaded.current = true;
        // console.log('Profile screen preloaded successfully');
      } catch (error) {
        console.log('Profile preloading failed:', error);
      }
    };

    // Start preloading immediately - no delay to ensure fast navigation
    preloadProfile();
  }, [router]);

  return { isPreloaded: isPreloaded.current };
};
