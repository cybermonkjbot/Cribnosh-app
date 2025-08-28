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
        await router.prefetch('/profile');
        
        // Preload heavy components and data
        await Promise.all([
          // Preload images
          require('@/assets/images/ForkPrint.png'),
          // Preload other heavy assets that might be used
          require('@/assets/images/demo/avatar-1.png'),
          require('@/assets/images/demo/avatar-2.png'),
          require('@/assets/images/demo/avatar-3.png'),
        ]);

        // Preload data structures
        await import('@/utils/braggingCardsData');
        await import('@/components/ui/CaloriesNoshPointsCards');
        await import('@/components/ui/KPICards');
        await import('@/components/ui/ProfileScreenBackground');
        
        // Preload heavy SVG components that are computationally expensive
        await import('@/components/ui/ProgressGauge');
        await import('@/components/ui/StackedProgressCards');
        await import('@/components/ui/FoodStatesBarChart');
        
        // Preload other heavy components
        await import('@/components/ui/AISparkles');
        await import('@/components/ParallaxScrollView');
        
        isPreloaded.current = true;
        console.log('Profile screen preloaded successfully');
      } catch (error) {
        console.log('Profile preloading failed:', error);
      }
    };

            // Delay preloading to not block initial render
        const timer = setTimeout(preloadProfile, 1500);
        
        return () => clearTimeout(timer);
  }, [router]);

  return { isPreloaded: isPreloaded.current };
};
